/**
 * GET /api/risk/[id]/pdf
 * 서버 렌더 PDF (공문서 품질) 스트리밍. Content-Type application/pdf, inline.
 */
import { getServiceSupabase } from "@/lib/supabase/server";
import { renderRiskPdf, type RiskPdfData } from "@/lib/pdf/render";
import type { RiskItem } from "@/lib/rules/types";
import { riskLevel } from "@/lib/rules/riskMatrix";

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
    .select("id, process, items, status, source_refs, confirmed_at, created_at")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return new Response("평가서를 찾을 수 없습니다.", { status: 404 });
  }

  const items: RiskItem[] = Array.isArray(data.items)
    ? (data.items as Record<string, unknown>[]).map(normalizeItem)
    : [];

  const source_refs = Array.isArray(data.source_refs)
    ? (data.source_refs as Record<string, unknown>[]).map((r) => ({
        chunk_id: asString(r.chunk_id),
        source: asString(r.source),
        title: asString(r.title),
        label: asString(r.label) || `${asString(r.source)} — ${asString(r.title)}`,
      }))
    : [];

  const pdfData: RiskPdfData = {
    id: asString(data.id),
    process: asString(data.process),
    status: data.status === "confirmed" ? "confirmed" : "draft",
    confirmed_at: data.confirmed_at == null ? null : asString(data.confirmed_at),
    created_at: data.created_at == null ? null : asString(data.created_at),
    items,
    source_refs,
  };

  let buffer: Buffer;
  try {
    buffer = await renderRiskPdf(pdfData);
  } catch (e) {
    return new Response(
      `PDF 생성에 실패했습니다. ${e instanceof Error ? e.message : ""}`,
      { status: 500 }
    );
  }

  const filename = `risk-assessment-${pdfData.id}.pdf`;
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
