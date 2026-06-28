"use client";

/**
 * 빈도 × 강도 selector. 사용자가 선택 → riskLevel()로 위험도/색 자동 표시.
 * 위험도는 LLM 금지, 오직 이 선택으로 결정 (rule 매트릭스).
 */
import {
  FREQUENCY_OPTIONS,
  SEVERITY_OPTIONS,
  riskLevel,
} from "@/lib/rules/riskMatrix";
import { RiskChip } from "@/components/ds/StatusChip";

type Level = 1 | 2 | 3;

export function RiskMatrixSelect({
  frequency,
  severity,
  onChange,
  disabled = false,
}: {
  frequency: Level;
  severity: Level;
  onChange: (next: { frequency: Level; severity: Level }) => void;
  disabled?: boolean;
}) {
  const level = riskLevel(frequency, severity);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <span className="whitespace-nowrap">빈도</span>
          <select
            className="rounded border border-border bg-surface px-2 py-1 text-xs text-ink disabled:opacity-60"
            value={frequency}
            disabled={disabled}
            onChange={(e) =>
              onChange({ frequency: Number(e.target.value) as Level, severity })
            }
            aria-label="빈도 선택"
          >
            {FREQUENCY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.value} · {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-xs text-muted">
          <span className="whitespace-nowrap">강도</span>
          <select
            className="rounded border border-border bg-surface px-2 py-1 text-xs text-ink disabled:opacity-60"
            value={severity}
            disabled={disabled}
            onChange={(e) =>
              onChange({ frequency, severity: Number(e.target.value) as Level })
            }
            aria-label="강도 선택"
          >
            {SEVERITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.value} · {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <RiskChip level={level} />
        <span className="num text-[11px] text-muted">
          {frequency}×{severity}={frequency * severity}
        </span>
      </div>
    </div>
  );
}
