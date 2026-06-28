/**
 * 빈도 × 강도 위험성 매트릭스 (rule). LLM 임의 산정 금지.
 * 사용자가 빈도·강도를 선택 → 위험도(등급/색)는 이 매트릭스로 자동 결정.
 */
import type { RiskLevel } from "@/lib/status";

export const FREQUENCY_OPTIONS = [
  { value: 1, label: "낮음", hint: "드물게 발생 / 노출 적음" },
  { value: 2, label: "보통", hint: "가끔 발생 / 주기적 노출" },
  { value: 3, label: "높음", hint: "자주 발생 / 상시 노출" },
] as const;

export const SEVERITY_OPTIONS = [
  { value: 1, label: "경상", hint: "응급처치 수준 부상" },
  { value: 2, label: "중상", hint: "휴업 요하는 부상·질병" },
  { value: 3, label: "사망/중대", hint: "사망 또는 중대재해" },
] as const;

/** 3x3 매트릭스: score = frequency * severity (1~9) */
export function riskScore(frequency: number, severity: number): number {
  return frequency * severity;
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 6) return "high"; // 6,9
  if (score >= 3) return "medium"; // 3,4
  return "low"; // 1,2
}

export function riskLevel(frequency: number, severity: number): RiskLevel {
  return riskLevelFromScore(riskScore(frequency, severity));
}
