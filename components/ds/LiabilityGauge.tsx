import { exposureFromScore, RISK_LEVEL_META } from "@/lib/status";

/**
 * 면책 게이지 (시그니처). rule 엔진이 계산한 실제 이행률을 차분·정밀하게 시각화.
 * 색은 노출 리스크 등급(green/amber/red)을 인코딩. 장식 아님.
 * size: sm(nav) / md / lg(대시보드·리포트 표지)
 */
const SIZES = {
  sm: { d: 44, stroke: 4, font: "text-xs" },
  md: { d: 120, stroke: 9, font: "text-2xl" },
  lg: { d: 200, stroke: 12, font: "text-5xl" },
} as const;

export function LiabilityGauge({
  score,
  size = "md",
  label = "이행률",
}: {
  score: number; // 0~100
  size?: keyof typeof SIZES;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const { d, stroke, font } = SIZES[size];
  const r = (d - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  const tone = exposureFromScore(pct);
  const hex = RISK_LEVEL_META[tone].hex;

  return (
    <div className="inline-flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: d, height: d }}>
        <svg
          width={d}
          height={d}
          viewBox={`0 0 ${d} ${d}`}
          role="img"
          aria-label={`${label} ${pct}퍼센트`}
        >
          <circle
            cx={d / 2}
            cy={d / 2}
            r={r}
            fill="none"
            stroke="#DCE0DA"
            strokeWidth={stroke}
          />
          <circle
            cx={d / 2}
            cy={d / 2}
            r={r}
            fill="none"
            stroke={hex}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${d / 2} ${d / 2})`}
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`num font-semibold leading-none ${font}`} style={{ color: hex }}>
            {pct}
            {size !== "sm" && <span className="text-[0.5em] align-top">%</span>}
          </span>
        </div>
      </div>
      {size !== "sm" && (
        <span className="text-xs text-muted">{label}</span>
      )}
    </div>
  );
}
