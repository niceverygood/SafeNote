/**
 * GET    /api/risk/[id]  — 평가서 조회
 * PATCH  /api/risk/[id]  — items 수정 (hazard/measure/frequency/severity/owner/due)
 *
 * 위험도(risk_level)는 클라이언트를 신뢰하지 않고 항상 서버에서 riskLevel(f,s)로 재계산한다.
 * status === 'confirmed' 이면 수정 거부.
 */
import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { riskLevel } from "@/lib/rules/riskMatrix";
import type { RiskItem } from "@/lib/rules/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clampLevel(n: unknown): 1 | 2 | 3 {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return 2;
  if (v <= 1) return 1;
  if (v >= 3) return 3;
  return 2;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** 입력 행 → 위험도 재계산된 RiskItem */
function normalizeItem(raw: Record<string, unknown>): RiskItem {
  const frequency = clampLevel(raw.frequency ?? 2);
  const severity = clampLevel(raw.severity ?? 2);
  return {
    hazard: asString(raw.hazard),
    frequency,
    severity,
    risk_level: riskLevel(frequency, severity),
    measure: asString(raw.measure),
    owner: asString(raw.owner),
    due: asString(raw.due),
    source_chunk_id: raw.source_chunk_id == null ? null : asString(raw.source_chunk_id),
    source_label: raw.source_label == null ? null : asString(raw.source_label),
    needs_expert_review: Boolean(raw.needs_expert_review),
    is_draft: raw.is_draft === undefined ? true : Boolean(raw.is_draft),
  };
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const db = getServiceSupabase();
  const { data, error } = await db
    .from("risk_assessments")
    .select("id, workspace_id, process, items, status, source_refs, confirmed_at, created_at")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "평가서를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json(data);
}

interface PatchBody {
  items?: unknown;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "items 배열이 필요합니다." }, { status: 400 });
  }

  const db = getServiceSupabase();

  // 현재 상태 확인 — confirmed 면 수정 금지
  const { data: existing, error: readErr } = await db
    .from("risk_assessments")
    .select("id, status")
    .eq("id", params.id)
    .single();

  if (readErr || !existing) {
    return NextResponse.json({ error: "평가서를 찾을 수 없습니다." }, { status: 404 });
  }
  if (existing.status === "confirmed") {
    return NextResponse.json(
      { error: "확정된 평가서는 수정할 수 없습니다." },
      { status: 409 }
    );
  }

  // 위험도 서버 재계산
  const normalized: RiskItem[] = body.items.map((r) =>
    normalizeItem((r ?? {}) as Record<string, unknown>)
  );

  const { data: updated, error: updErr } = await db
    .from("risk_assessments")
    .update({ items: normalized as unknown as object })
    .eq("id", params.id)
    .select("id, workspace_id, process, items, status, source_refs, confirmed_at, created_at")
    .single();

  if (updErr || !updated) {
    return NextResponse.json(
      { error: "수정에 실패했습니다.", detail: updErr?.message },
      { status: 500 }
    );
  }

  return NextResponse.json(updated);
}
