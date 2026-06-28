/**
 * 위험성평가 상세 (server component).
 * 평가서를 조회해 클라이언트 편집기(RiskEditor)에 전달.
 */
import { notFound } from "next/navigation";
import { getServiceSupabase } from "@/lib/supabase/server";
import { riskLevel } from "@/lib/rules/riskMatrix";
import type { RiskItem } from "@/lib/rules/types";
import { RiskEditor } from "@/components/risk/RiskEditor";

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

export default async function RiskAssessmentPage({
  params,
}: {
  params: { id: string };
}) {
  const db = getServiceSupabase();
  const { data, error } = await db
    .from("risk_assessments")
    .select("id, process, items, status, source_refs, confirmed_at, created_at")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    notFound();
  }

  const items: RiskItem[] = Array.isArray(data.items)
    ? (data.items as Record<string, unknown>[]).map(normalizeItem)
    : [];

  const sourceRefs = Array.isArray(data.source_refs)
    ? (data.source_refs as Record<string, unknown>[]).map((r) => ({
        chunk_id: asString(r.chunk_id),
        source: asString(r.source),
        title: asString(r.title),
        label: asString(r.label) || `${asString(r.source)} — ${asString(r.title)}`,
      }))
    : [];

  const status: "draft" | "confirmed" =
    data.status === "confirmed" ? "confirmed" : "draft";

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:py-14">
      <RiskEditor
        id={asString(data.id)}
        process={asString(data.process)}
        initialItems={items}
        initialStatus={status}
        initialConfirmedAt={data.confirmed_at == null ? null : asString(data.confirmed_at)}
        sourceRefs={sourceRefs}
      />
    </main>
  );
}
