/**
 * 의무 이행 상태 ↔ 색 매핑. 칩·게이지·리포트 전부 동일 규칙.
 * 색은 상태를 인코딩하므로 이 파일 밖에서 임의 색 사용 금지.
 */
export type ComplianceStatus = "fulfilled" | "partial" | "missing";

export const STATUS_META: Record<
  ComplianceStatus,
  { label: string; tone: "safe" | "caution" | "danger"; hex: string }
> = {
  fulfilled: { label: "이행완료", tone: "safe", hex: "#15643E" },
  partial: { label: "준비중·일부 공백", tone: "caution", hex: "#C2841C" },
  missing: { label: "미이행·노출", tone: "danger", hex: "#A82B22" },
};

/** 위험성평가 문서 상태 */
export type DocStatus = "draft" | "confirmed";

/** 리스크 등급 (rule 매트릭스 결과) */
export type RiskLevel = "low" | "medium" | "high";

export const RISK_LEVEL_META: Record<
  RiskLevel,
  { label: string; tone: "safe" | "caution" | "danger"; hex: string }
> = {
  low: { label: "낮음", tone: "safe", hex: "#15643E" },
  medium: { label: "보통", tone: "caution", hex: "#C2841C" },
  high: { label: "높음", tone: "danger", hex: "#A82B22" },
};

/** 전체 이행률(0~100) → 노출 리스크 등급. rule 기반, LLM 아님. */
export function exposureFromScore(scorePct: number): RiskLevel {
  if (scorePct >= 80) return "low";
  if (scorePct >= 50) return "medium";
  return "high";
}
