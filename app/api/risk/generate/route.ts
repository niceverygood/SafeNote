/**
 * POST /api/risk/generate
 * 위험성평가 초안 생성 파이프라인 (순서 고정):
 *   ① rule  : hazard_seeds 후보 풀 조회 (industry_code + 느슨한 process_keyword 매칭)
 *   ② RAG   : retrieveChunks({industry_code, process})
 *   ③ LLM   : generateRiskDraft(...) — 근거(chunk) 범위 안에서만 초안 작성
 *
 * 위험도(risk_level)는 여기서 결정하지 않는다. 사용자가 빈도×강도로 확정.
 * 근거(chunk)가 없으면 LLM 호출 자체를 막고 "근거 부족" 플래그로 빈 항목 행을 만든다.
 */
import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { retrieveChunks, type RetrievedChunk } from "@/lib/rag/retrieve";
import { generateRiskDraft } from "@/lib/ai/generate";
import type { RiskItem } from "@/lib/rules/types";
import { riskLevel } from "@/lib/rules/riskMatrix";
import industries from "@/data/seed/industries.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GenerateBody {
  workspace_id?: string | null;
  industry_code?: string;
  process?: string;
}

interface HazardSeedRow {
  hazard: string;
  process_keyword: string;
  default_measures: unknown;
}

function industryName(code: string): string {
  const found = (industries as { code: string; name: string }[]).find(
    (i) => i.code === code
  );
  return found?.name ?? code;
}

function asMeasures(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}

export async function POST(req: Request) {
  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const industry_code = (body.industry_code ?? "").trim();
  const process = (body.process ?? "").trim();
  const workspace_id = body.workspace_id ?? null;

  if (!industry_code) {
    return NextResponse.json({ error: "업종(industry_code)이 필요합니다." }, { status: 400 });
  }
  if (!process) {
    return NextResponse.json({ error: "공정/작업(process)이 필요합니다." }, { status: 400 });
  }

  const db = getServiceSupabase();

  // ① rule: hazard_seeds 후보 풀 — 해당 업종 전체를 가져와 process 키워드로 느슨히 우선 정렬
  let seedRows: HazardSeedRow[] = [];
  try {
    const { data, error } = await db
      .from("hazard_seeds")
      .select("hazard, process_keyword, default_measures")
      .eq("industry_code", industry_code);
    if (error) throw error;
    seedRows = (data ?? []) as HazardSeedRow[];
  } catch {
    seedRows = [];
  }

  // 느슨한 process 매칭: process 텍스트에 키워드가 포함되거나 키워드에 process가 포함되면 우선
  const procLower = process.toLowerCase();
  const matched = seedRows.filter((r) => {
    const kw = (r.process_keyword ?? "").toLowerCase();
    return kw.length > 0 && (procLower.includes(kw) || kw.includes(procLower));
  });
  const candidatePool = (matched.length > 0 ? matched : seedRows).map((r) => ({
    hazard: r.hazard,
    default_measures: asMeasures(r.default_measures),
  }));

  // ② RAG
  let chunks: RetrievedChunk[] = [];
  try {
    chunks = await retrieveChunks({ industry_code, process });
  } catch {
    chunks = [];
  }

  // 출처 인용 목록 (UI/PDF footnote 용)
  const source_refs = chunks.map((c) => ({
    chunk_id: c.id,
    source: c.source,
    title: c.title,
    label: `${c.source} — ${c.title}`,
  }));

  // ③ LLM — 근거 없으면 빈 배열 반환 (환각 방지). 빈 경우에도 행은 생성하고 플래그.
  let items: RiskItem[] = [];
  let insufficientEvidence = false;

  if (chunks.length === 0) {
    insufficientEvidence = true;
    items = [];
  } else {
    let draft: Awaited<ReturnType<typeof generateRiskDraft>> = [];
    try {
      draft = await generateRiskDraft({
        industry_name: industryName(industry_code),
        process,
        seedHazards: candidatePool,
        chunks: chunks.map((c) => ({
          id: c.id,
          title: c.title,
          source: c.source,
          content: c.content,
        })),
      });
    } catch {
      draft = [];
    }

    // 초안 → RiskItem[]. 빈도/강도는 placeholder=2, 위험도는 사용자가 결정하도록 비워둔다(매트릭스 기본값).
    items = draft.map((d) => ({
      hazard: d.hazard,
      frequency: 2,
      severity: 2,
      // risk_level 자체는 사용자 미선택 상태이나 타입상 필수 → placeholder(2,2) 매트릭스값.
      // 사용자가 매트릭스로 다시 선택해 확정해야 하며, PATCH/confirm 시 서버가 재계산한다.
      risk_level: riskLevel(2, 2),
      measure: d.measure,
      owner: "",
      due: "",
      source_chunk_id: d.source_chunk_id,
      source_label: d.source_label,
      needs_expert_review: d.needs_expert_review,
      is_draft: true,
    }));

    if (items.length === 0) insufficientEvidence = true;
  }

  // 영속화: risk_assessments 새 행
  const insertRow = {
    workspace_id,
    process,
    items: items as unknown as object,
    status: "draft" as const,
    source_refs: source_refs as unknown as object,
  };

  const { data: inserted, error: insertError } = await db
    .from("risk_assessments")
    .insert(insertRow)
    .select("id, items, source_refs, status")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: "위험성평가 생성에 실패했습니다.", detail: insertError?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: inserted.id,
    items: inserted.items,
    source_refs: inserted.source_refs,
    insufficient_evidence: insufficientEvidence,
  });
}
