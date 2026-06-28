"use client";

/**
 * 위험성평가표 (문서/표 grade). 카드 그리드 아님.
 * 컬럼: [유해위험요인 / 위험도(빈도×강도) / 감소대책 / 담당·기한]
 * 편집 가능 행. 위험도는 RiskMatrixSelect로만 변경 (rule).
 */
import type { RiskItem } from "@/lib/rules/types";
import { RiskMatrixSelect } from "./RiskMatrixSelect";
import { ExpertReviewFlag } from "@/components/ds/SealStamp";

type Level = 1 | 2 | 3;

export interface EditableRiskItem extends RiskItem {}

function SourceCite({ label }: { label: string | null }) {
  if (!label) return null;
  return (
    <p className="mt-1 text-[11px] leading-snug text-muted">
      <span className="font-medium">출처</span> · {label}
    </p>
  );
}

export function RiskTable({
  items,
  readOnly = false,
  onChangeItem,
  onRemoveItem,
}: {
  items: RiskItem[];
  readOnly?: boolean;
  onChangeItem?: (index: number, next: Partial<RiskItem>) => void;
  onRemoveItem?: (index: number) => void;
}) {
  const fieldCls =
    "w-full resize-y rounded border border-border bg-surface px-2 py-1.5 text-sm leading-relaxed text-ink disabled:opacity-70";

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[760px] border-collapse text-left align-top">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="w-[6%] px-3 py-2.5 text-xs font-semibold text-ink font-serif">
              No
            </th>
            <th className="w-[30%] px-3 py-2.5 text-xs font-semibold text-ink font-serif">
              유해위험요인
            </th>
            <th className="w-[18%] px-3 py-2.5 text-xs font-semibold text-ink font-serif">
              위험도
            </th>
            <th className="w-[28%] px-3 py-2.5 text-xs font-semibold text-ink font-serif">
              감소대책
            </th>
            <th className="w-[18%] px-3 py-2.5 text-xs font-semibold text-ink font-serif">
              담당 · 기한
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center text-sm text-muted">
                생성된 항목이 없습니다.
              </td>
            </tr>
          )}

          {items.map((it, i) => (
            <tr key={i} className="border-b border-border align-top last:border-b-0">
              <td className="px-3 py-3 num text-sm text-muted">{i + 1}</td>

              {/* 유해위험요인 */}
              <td className="px-3 py-3">
                {readOnly ? (
                  <p className="text-sm leading-relaxed text-ink">{it.hazard || "—"}</p>
                ) : (
                  <textarea
                    className={fieldCls}
                    rows={2}
                    value={it.hazard}
                    aria-label={`${i + 1}행 유해위험요인`}
                    onChange={(e) => onChangeItem?.(i, { hazard: e.target.value })}
                  />
                )}
                <SourceCite label={it.source_label} />
                {it.needs_expert_review && (
                  <div className="mt-1.5">
                    <ExpertReviewFlag />
                  </div>
                )}
              </td>

              {/* 위험도 (빈도×강도 → 자동 색) */}
              <td className="px-3 py-3">
                {readOnly ? (
                  <RiskMatrixSelect
                    frequency={it.frequency}
                    severity={it.severity}
                    onChange={() => {}}
                    disabled
                  />
                ) : (
                  <RiskMatrixSelect
                    frequency={it.frequency}
                    severity={it.severity}
                    onChange={(next: { frequency: Level; severity: Level }) =>
                      onChangeItem?.(i, {
                        frequency: next.frequency,
                        severity: next.severity,
                      })
                    }
                  />
                )}
              </td>

              {/* 감소대책 */}
              <td className="px-3 py-3">
                {readOnly ? (
                  <p className="text-sm leading-relaxed text-ink">{it.measure || "—"}</p>
                ) : (
                  <textarea
                    className={fieldCls}
                    rows={2}
                    value={it.measure}
                    aria-label={`${i + 1}행 감소대책`}
                    onChange={(e) => onChangeItem?.(i, { measure: e.target.value })}
                  />
                )}
              </td>

              {/* 담당 · 기한 */}
              <td className="px-3 py-3">
                {readOnly ? (
                  <div className="text-sm leading-relaxed text-ink">
                    <p>담당: {it.owner || "—"}</p>
                    <p className="num mt-0.5">기한: {it.due || "—"}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <input
                      className={fieldCls}
                      value={it.owner}
                      placeholder="담당자"
                      aria-label={`${i + 1}행 담당자`}
                      onChange={(e) => onChangeItem?.(i, { owner: e.target.value })}
                    />
                    <input
                      className={fieldCls}
                      value={it.due}
                      placeholder="기한 (예: 2026-07-31)"
                      aria-label={`${i + 1}행 기한`}
                      onChange={(e) => onChangeItem?.(i, { due: e.target.value })}
                    />
                    {onRemoveItem && (
                      <button
                        type="button"
                        className="self-start text-[11px] text-danger underline-offset-2 hover:underline focus-visible:underline"
                        onClick={() => onRemoveItem(i)}
                      >
                        행 삭제
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
