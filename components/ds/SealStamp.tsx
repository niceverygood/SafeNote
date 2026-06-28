/**
 * 직인 스탬프 (시그니처). 사용자가 확정하면 미세한 디지털 직인 마크 → "공식 증빙".
 * draft ↔ confirmed 시각 구분. 확정 시각/주체 표기.
 */
export function SealStamp({
  label = "확정 증빙",
  date,
  size = 96,
}: {
  label?: string;
  date?: string;
  size?: number;
}) {
  return (
    <div
      className="relative inline-flex select-none items-center justify-center motion-safe:animate-seal-press"
      style={{ width: size, height: size, transform: "rotate(-6deg)" }}
      aria-label={`${label}${date ? ` ${date}` : ""}`}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r="47" fill="none" stroke="#15643E" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#15643E" strokeWidth="1" opacity="0.5" />
        <text
          x="50"
          y="44"
          textAnchor="middle"
          fontFamily="var(--font-noto-serif-kr), serif"
          fontSize="15"
          fontWeight="700"
          fill="#15643E"
        >
          세이프
        </text>
        <text
          x="50"
          y="62"
          textAnchor="middle"
          fontFamily="var(--font-noto-serif-kr), serif"
          fontSize="15"
          fontWeight="700"
          fill="#15643E"
        >
          노트
        </text>
        <text
          x="50"
          y="80"
          textAnchor="middle"
          fontFamily="var(--font-jetbrains-mono), monospace"
          fontSize="6"
          letterSpacing="0.5"
          fill="#15643E"
        >
          CONFIRMED
        </text>
      </svg>
    </div>
  );
}

/** 초안 배지 (확정 전) */
export function DraftBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-caution/40 bg-caution/10 px-2 py-0.5 text-xs font-medium text-caution">
      초안
    </span>
  );
}

/** 전문가 검토 필요 플래그 (amber) */
export function ExpertReviewFlag() {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-caution/40 bg-caution/10 px-1.5 py-0.5 text-[11px] font-medium text-caution">
      전문가 검토 필요
    </span>
  );
}
