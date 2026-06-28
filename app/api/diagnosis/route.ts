/**
 * 모듈 A — 면책 자가진단 API.
 * POST: rule로 runDiagnosis 실행(점수/상태/리스크 = rule only), 공백 행만 LLM으로 설명 보강(선택),
 *       diagnoses 행 저장 후 {id, result} 반환.
 * GET ?id=: 저장된 진단 결과 조회 (리포트 페이지에서 사용).
 *
 * LLM은 점수/상태/리스크를 절대 계산하지 않는다 — 공백 설명 문장화만.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/server";
import { runDiagnosis } from "@/lib/rules/obligations";
import type { Obligation, DiagnosisInput, DiagnosisResult } from "@/lib/rules/types";
import { explainGaps, type GapRow } from "@/lib/ai/explain";
import seedObligations from "@/data/seed/obligations.json";

export const runtime = "nodejs";

const StatusEnum = z.enum(["fulfilled", "partial", "missing"]);

const PostBody = z.object({
  industry_code: z.string().min(1),
  size_band: z.enum(["1-9", "10-49"]),
  worker_count: z.number().int().min(0),
  has_subcontract: z.boolean(),
  evidence: z.record(StatusEnum),
});

/** 응답에 담는 의무 행: rule 결과 + (있으면) LLM 설명/다음액션 */
export interface ReportRow {
  code: string;
  title: string;
  status: "fulfilled" | "partial" | "missing";
  applicable: boolean;
  missing: string;
  required_evidence: string;
  /** LLM 보강 (없으면 null → 클라에서 rule 기본 문구 사용) */
  why: string | null;
  next: string | null;
}

export interface DiagnosisReport extends Omit<DiagnosisResult, "rows"> {
  rows: ReportRow[];
}

/** DB obligations 우선, 비어있으면 seed JSON fallback */
async function loadObligations(): Promise<Obligation[]> {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("obligations")
      .select("code, title, description, required_evidence, applies_to, sort_order")
      .order("sort_order", { ascending: true });
    if (!error && data && data.length > 0) {
      return data as unknown as Obligation[];
    }
  } catch {
    // DB 미설정/오류 시 seed로 fallback
  }
  return seedObligations as unknown as Obligation[];
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const parsed = PostBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력값이 올바르지 않습니다.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input: DiagnosisInput = parsed.data;
  const obligations = await loadObligations();

  // ── rule only: 점수/상태/리스크 산출
  const result = runDiagnosis(obligations, input);

  // ── 공백 행만 LLM 설명 보강(선택). 키 없으면 graceful skip.
  const gapRows: GapRow[] = result.rows
    .filter((r) => r.applicable && r.status !== "fulfilled")
    .map((r) => ({
      code: r.code,
      title: r.title,
      status: r.status as "partial" | "missing",
      required_evidence: r.required_evidence,
    }));

  const explanations = await explainGaps(gapRows);

  const rows: ReportRow[] = result.rows.map((r) => {
    const e = explanations[r.code];
    return {
      ...r,
      why: e?.why ?? null,
      next: e?.next ?? null,
    };
  });

  const report: DiagnosisReport = { ...result, rows };

  // ── 저장 (워크스페이스 없이 익명 진단; lead_contact는 추후 /api/lead로 채움)
  let id: string | null = null;
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("diagnoses")
      .insert({
        industry_code: input.industry_code,
        size_band: input.size_band,
        answers: input,
        gap_score: result.gap_score,
        report,
      })
      .select("id")
      .single();
    if (!error && data) id = data.id as string;
  } catch {
    // 저장 실패해도 결과는 반환 (id=null)
  }

  return NextResponse.json({ id, result: report });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("diagnoses")
      .select("id, gap_score, report, lead_contact")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "진단 결과를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      result: data.report as DiagnosisReport,
      unlocked: !!data.lead_contact,
    });
  } catch {
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
