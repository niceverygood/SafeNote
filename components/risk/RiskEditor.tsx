"use client";

/**
 * 위험성평가 편집기 (client).
 * - 행 편집 → "저장"(PATCH, 서버가 위험도 재계산)
 * - "확정" → confirm. needs_expert_review 남으면 409 → acknowledge 재시도 안내
 * - 확정 시 SealStamp, 미확정 시 DraftBadge
 * - "PDF 내보내기" 링크, 출처 인용(SourceCite는 RiskTable 내)
 * 결과는 문서/표 grade. 카드 그리드 아님.
 */
import { useMemo, useState } from "react";
import type { RiskItem } from "@/lib/rules/types";
import { RiskTable } from "./RiskTable";
import { SealStamp, DraftBadge } from "@/components/ds/SealStamp";
import { Disclaimer } from "@/components/ds/Disclaimer";

interface SourceRef {
  chunk_id: string;
  source: string;
  title: string;
  label: string;
}

interface Props {
  id: string;
  process: string;
  initialItems: RiskItem[];
  initialStatus: "draft" | "confirmed";
  initialConfirmedAt: string | null;
  sourceRefs: SourceRef[];
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export function RiskEditor({
  id,
  process,
  initialItems,
  initialStatus,
  initialConfirmedAt,
  sourceRefs,
}: Props) {
  const [items, setItems] = useState<RiskItem[]>(initialItems);
  const [status, setStatus] = useState<"draft" | "confirmed">(initialStatus);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(initialConfirmedAt);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAck, setNeedsAck] = useState(false);

  const isConfirmed = status === "confirmed";
  const unresolvedCount = useMemo(
    () => items.filter((it) => it.needs_expert_review).length,
    [items]
  );

  function updateItem(index: number, next: Partial<RiskItem>) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, ...next } : it))
    );
    setMessage(null);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setMessage(null);
  }

  async function handleSave() {
    if (isConfirmed) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/risk/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "저장에 실패했습니다.");
      setItems(Array.isArray(data.items) ? (data.items as RiskItem[]) : items);
      setMessage("저장되었습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm(acknowledge: boolean) {
    if (isConfirmed) return;
    setConfirming(true);
    setError(null);
    setMessage(null);
    try {
      // 확정 전 현재 편집 내용을 먼저 저장 (위험도 서버 재계산)
      const patchRes = await fetch(`/api/risk/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!patchRes.ok) {
        const pd = await patchRes.json();
        throw new Error(pd?.error || "저장에 실패했습니다.");
      }

      const res = await fetch(`/api/risk/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledge }),
      });
      const data = await res.json();
      if (res.status === 409 && data?.needs_acknowledge) {
        setNeedsAck(true);
        setError(data.error);
        return;
      }
      if (!res.ok) throw new Error(data?.error || "확정에 실패했습니다.");

      setItems(Array.isArray(data.items) ? (data.items as RiskItem[]) : items);
      setStatus("confirmed");
      setConfirmedAt(data.confirmed_at ?? new Date().toISOString());
      setNeedsAck(false);
      setMessage("확정되었습니다. 직인이 표기되었습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "확정 중 오류가 발생했습니다.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 문서 헤더 */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">
            SAFENOTE 위험성평가
          </p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-ink">
            위험성평가표
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            공정/작업: <span className="text-ink">{process}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isConfirmed ? (
            <SealStamp date={fmtDate(confirmedAt)} size={84} />
          ) : (
            <DraftBadge />
          )}
        </div>
      </header>

      {/* 상태 안내 */}
      {!isConfirmed && unresolvedCount > 0 && (
        <p className="rounded-md border border-caution/40 bg-caution/10 px-3 py-2 text-sm text-caution">
          전문가 검토가 필요한 항목 {unresolvedCount}건이 있습니다. 검토 후
          확정하세요.
        </p>
      )}
      {items.length === 0 && (
        <p className="rounded-md border border-caution/40 bg-caution/10 px-3 py-2 text-sm text-caution">
          근거 부족: 검색된 규정 근거가 충분하지 않아 자동 생성된 항목이 없습니다.
          근거 보강 또는 전문가 작성이 필요합니다.
        </p>
      )}

      {/* 평가표 */}
      <RiskTable
        items={items}
        readOnly={isConfirmed}
        onChangeItem={updateItem}
        onRemoveItem={removeItem}
      />

      {/* 출처 인용 목록 */}
      {sourceRefs.length > 0 && (
        <section className="rounded-md border border-border bg-surface px-4 py-3">
          <h2 className="font-serif text-sm font-semibold text-ink">근거 출처</h2>
          <ol className="mt-2 flex flex-col gap-1">
            {sourceRefs.map((r, i) => (
              <li key={r.chunk_id || i} className="text-xs leading-snug text-muted">
                <span className="num">[{i + 1}]</span> {r.label}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 액션 */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        {!isConfirmed && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/30 disabled:opacity-60"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        )}

        {!isConfirmed && !needsAck && (
          <button
            type="button"
            onClick={() => handleConfirm(false)}
            disabled={confirming || items.length === 0}
            className="rounded-md bg-safe px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-safe-hover disabled:opacity-60"
          >
            {confirming ? "확정 중…" : "확정"}
          </button>
        )}

        {!isConfirmed && needsAck && (
          <button
            type="button"
            onClick={() => handleConfirm(true)}
            disabled={confirming}
            className="rounded-md bg-safe px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-safe-hover disabled:opacity-60"
          >
            {confirming ? "확정 중…" : "검토 확인 후 확정"}
          </button>
        )}

        <a
          href={`/api/risk/${id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-safe px-4 py-2 text-sm font-medium text-safe transition-colors hover:bg-safe/10"
        >
          PDF 내보내기
        </a>

        {message && <span className="text-sm text-safe">{message}</span>}
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>

      <Disclaimer className="border-t border-border pt-4" />
    </div>
  );
}
