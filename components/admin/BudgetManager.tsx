"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface BudgetItemRow {
  id: string;
  year: number;
  category: string;
  label: string;
  planned_amount: number;
  executed: number; // 집행 합계
}

export interface BudgetExecRow {
  id: string;
  itemLabel: string;
  amount: number;
  note: string | null;
  receipt_url: string | null;
  hash: string;
  created_at: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  ppe: "보호구",
  education: "교육",
  facility: "시설 개선",
  inspection: "점검·진단",
  health: "건강관리",
  etc: "기타",
};
const input =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-safe";

function won(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

/** 안전보건 예산 편성·집행 대장 — 시행령 4조 4호 증빙 */
export function BudgetManager({
  workspaceId,
  items,
  executions,
}: {
  workspaceId: string;
  items: BudgetItemRow[];
  executions: BudgetExecRow[];
}) {
  const router = useRouter();
  const thisYear = new Date().getFullYear();

  // 편성 폼
  const [year, setYear] = useState(String(thisYear));
  const [category, setCategory] = useState("ppe");
  const [label, setLabel] = useState("");
  const [planned, setPlanned] = useState("");
  const [planBusy, setPlanBusy] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // 집행 폼
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [execBusy, setExecBusy] = useState(false);
  const [execError, setExecError] = useState<string | null>(null);

  async function submitPlan(e: React.FormEvent) {
    e.preventDefault();
    setPlanBusy(true);
    setPlanError(null);
    const res = await fetch("/api/admin/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        year: Number(year),
        category,
        label,
        planned_amount: Number(planned.replace(/[^0-9]/g, "")) || 0,
      }),
    });
    setPlanBusy(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPlanError(j.error || "편성 실패");
      return;
    }
    setLabel("");
    setPlanned("");
    router.refresh();
  }

  function onReceipt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setExecError("사진은 6MB 이하만 가능합니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setReceipt(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function submitExec(e: React.FormEvent) {
    e.preventDefault();
    setExecBusy(true);
    setExecError(null);
    const res = await fetch("/api/admin/budget/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        budget_item_id: itemId,
        amount: Number(amount.replace(/[^0-9]/g, "")) || 0,
        note: note.trim() || undefined,
        receipt_data: receipt ?? undefined,
      }),
    });
    setExecBusy(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setExecError(j.error || "집행 기록 실패");
      return;
    }
    setAmount("");
    setNote("");
    setReceipt(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 편성 */}
        <form onSubmit={submitPlan} className="rounded-lg border border-border bg-white p-4">
          <p className="text-sm font-semibold text-ink">예산 항목 편성</p>
          <p className="mt-1 text-xs text-muted">연 단위로 안전보건 예산 항목과 금액을 편성합니다.</p>
          <div className="mt-3 grid grid-cols-[90px_1fr] gap-2">
            <input
              className={input}
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
              inputMode="numeric"
              required
            />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={input}>
              {Object.entries(CATEGORY_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <input
            className={`${input} mt-2`}
            placeholder="항목명 (예: 안전화·안전모 구매)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
          <input
            className={`${input} mt-2`}
            placeholder="편성 금액 (원)"
            value={planned}
            onChange={(e) => setPlanned(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            required
          />
          {planError && <p className="mt-2 text-sm text-danger">{planError}</p>}
          <button
            type="submit"
            disabled={planBusy}
            className="mt-3 rounded-md bg-safe px-4 py-2 text-sm font-semibold text-white hover:bg-safe-hover disabled:opacity-60"
          >
            {planBusy ? "편성 중…" : "항목 편성"}
          </button>
        </form>

        {/* 집행 */}
        <form onSubmit={submitExec} className="rounded-lg border border-border bg-white p-4">
          <p className="text-sm font-semibold text-ink">집행 기록</p>
          <p className="mt-1 text-xs text-muted">
            집행 즉시 위변조 방지 기록으로 저장됩니다. 영수증 사진을 함께 남기세요.
          </p>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} className={`${input} mt-3`} required>
            {items.length === 0 && <option value="">먼저 예산 항목을 편성하세요</option>}
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.year} · {CATEGORY_LABEL[it.category] ?? it.category} · {it.label}
              </option>
            ))}
          </select>
          <input
            className={`${input} mt-2`}
            placeholder="집행 금액 (원)"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            required
          />
          <input
            className={`${input} mt-2`}
            placeholder="내용 (예: 안전화 5켤레 구매)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <label className="mt-2 flex cursor-pointer items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink hover:bg-white">
            {receipt ? "영수증 변경" : "영수증 사진 첨부 (선택)"}
            <input type="file" accept="image/*" className="hidden" onChange={onReceipt} />
          </label>
          {receipt && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={receipt} alt="영수증 미리보기" className="mt-2 max-h-32 rounded-md border border-border object-cover" />
          )}
          {execError && <p className="mt-2 text-sm text-danger">{execError}</p>}
          <button
            type="submit"
            disabled={execBusy || !itemId}
            className="mt-3 rounded-md bg-safe px-4 py-2 text-sm font-semibold text-white hover:bg-safe-hover disabled:opacity-60"
          >
            {execBusy ? "기록 중…" : "집행 기록 (불변 저장)"}
          </button>
        </form>
      </div>

      {/* 편성·집행 현황 */}
      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">연도</th>
              <th className="px-4 py-2.5 font-medium">분류</th>
              <th className="px-4 py-2.5 font-medium">항목</th>
              <th className="px-4 py-2.5 font-medium text-right">편성</th>
              <th className="px-4 py-2.5 font-medium text-right">집행</th>
              <th className="px-4 py-2.5 font-medium text-right">집행률</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const rate = it.planned_amount > 0 ? Math.round((it.executed / it.planned_amount) * 100) : null;
              return (
                <tr key={it.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 num text-muted">{it.year}</td>
                  <td className="px-4 py-3 text-muted">{CATEGORY_LABEL[it.category] ?? it.category}</td>
                  <td className="px-4 py-3 text-ink">{it.label}</td>
                  <td className="px-4 py-3 num text-right text-ink">{won(it.planned_amount)}</td>
                  <td className="px-4 py-3 num text-right text-ink">{won(it.executed)}</td>
                  <td className="px-4 py-3 num text-right">
                    <span className={rate !== null && rate > 100 ? "text-caution" : "text-safe"}>
                      {rate === null ? "—" : `${rate}%`}
                    </span>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">
                  아직 편성된 예산이 없습니다. 항목을 편성해 주세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 최근 집행 내역 */}
      {executions.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">집행일</th>
                <th className="px-4 py-2.5 font-medium">항목</th>
                <th className="px-4 py-2.5 font-medium text-right">금액</th>
                <th className="px-4 py-2.5 font-medium">내용</th>
                <th className="px-4 py-2.5 font-medium">영수증</th>
                <th className="px-4 py-2.5 font-medium">해시</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((ex) => (
                <tr key={ex.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 num text-muted whitespace-nowrap">{ex.created_at.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-ink">{ex.itemLabel}</td>
                  <td className="px-4 py-3 num text-right text-ink">{won(ex.amount)}</td>
                  <td className="px-4 py-3 text-muted">{ex.note ?? "—"}</td>
                  <td className="px-4 py-3">
                    {ex.receipt_url ? (
                      <a href={ex.receipt_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-safe hover:underline">
                        보기
                      </a>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 num text-xs text-muted">{ex.hash.slice(0, 12)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
