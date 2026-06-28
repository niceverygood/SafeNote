import { STATUS_META, RISK_LEVEL_META, type ComplianceStatus, type RiskLevel } from "@/lib/status";

const TONE_CLASS: Record<"safe" | "caution" | "danger", string> = {
  safe: "bg-safe/10 text-safe border-safe/25",
  caution: "bg-caution/10 text-caution border-caution/30",
  danger: "bg-danger/10 text-danger border-danger/30",
};

const DOT_CLASS: Record<"safe" | "caution" | "danger", string> = {
  safe: "bg-safe",
  caution: "bg-caution",
  danger: "bg-danger",
};

function Chip({
  tone,
  label,
}: {
  tone: "safe" | "caution" | "danger";
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE_CLASS[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASS[tone]}`} aria-hidden />
      {label}
    </span>
  );
}

/** 의무 이행 상태 칩. 색+텍스트 동시 표기(대비). */
export function StatusChip({ status }: { status: ComplianceStatus }) {
  const m = STATUS_META[status];
  return <Chip tone={m.tone} label={m.label} />;
}

/** 리스크 등급 칩. */
export function RiskChip({ level }: { level: RiskLevel }) {
  const m = RISK_LEVEL_META[level];
  return <Chip tone={m.tone} label={`리스크 ${m.label}`} />;
}
