/**
 * POST /api/risk/[id]/confirm
 * 평가서 확정: status='confirmed', confirmed_at=now().
 * - 항목 중 needs_expert_review 가 남아 있으면 409 (사용자가 먼저 해소/확인해야 함).
 * - {acknowledge:true} 면 전문가 검토 플래그를 일괄 해제하고 확정 진행.
 * - 확정 시에도 위험도(risk_level)는 서버에서 빈도×강도로 재계산한다.
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

interface ConfirmBody {
  acknowledge?: boolean;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  let body: ConfirmBody = {};
  try {
    body = (await req.json()) as ConfirmBody;
  } catch {
    body = {};
  }
  const acknowledge = Boolean(body.acknowledge);

  const db = getServiceSupabase();

  const { data: existing, error: readErr } = await db
    .from("risk_assessments")
    .select("id, status, items")
    .eq("id", params.id)
    .single();

  if (readErr || !existing) {
    return NextResponse.json({ error: "평가서를 찾을 수 없습니다." }, { status: 404 });
  }
  if (existing.status === "confirmed") {
    return NextResponse.json({ error: "이미 확정된 평가서입니다." }, { status: 409 });
  }

  const rawItems = Array.isArray(existing.items)
    ? (existing.items as Record<string, unknown>[])
    : [];

  if (rawItems.length === 0) {
    return NextResponse.json(
      { error: "확정할 항목이 없습니다. 근거가 부족합니다." },
      { status: 409 }
    );
  }

  const hasUnresolved = rawItems.some((r) => Boolean(r.needs_expert_review));
  if (hasUnresolved && !acknowledge) {
    return NextResponse.json(
      {
        error:
          "전문가 검토가 필요한 항목이 남아 있습니다. 검토 후 확인(acknowledge)해야 확정할 수 있습니다.",
        needs_acknowledge: true,
      },
      { status: 409 }
    );
  }

  // 확정 시 위험도 재계산 + (acknowledge 시) needs_expert_review 해제 + is_draft=false
  const finalized: RiskItem[] = rawItems.map((r) => {
    const frequency = clampLevel(r.frequency ?? 2);
    const severity = clampLevel(r.severity ?? 2);
    return {
      hazard: asString(r.hazard),
      frequency,
      severity,
      risk_level: riskLevel(frequency, severity),
      measure: asString(r.measure),
      owner: asString(r.owner),
      due: asString(r.due),
      source_chunk_id: r.source_chunk_id == null ? null : asString(r.source_chunk_id),
      source_label: r.source_label == null ? null : asString(r.source_label),
      needs_expert_review: acknowledge ? false : Boolean(r.needs_expert_review),
      is_draft: false,
    };
  });

  const { data: updated, error: updErr } = await db
    .from("risk_assessments")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      items: finalized as unknown as object,
    })
    .eq("id", params.id)
    .select("id, workspace_id, process, items, status, source_refs, confirmed_at, created_at")
    .single();

  if (updErr || !updated) {
    return NextResponse.json(
      { error: "확정에 실패했습니다.", detail: updErr?.message },
      { status: 500 }
    );
  }

  return NextResponse.json(updated);
}
