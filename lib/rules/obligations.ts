/**
 * 면책 자가진단 rule 엔진. 규정 매핑·갭 도출·이행률·리스크 등급 = 전부 rule-based.
 * LLM은 여기 관여하지 않는다 (LLM은 각 공백 설명 1~2줄 + 다음 액션 문구만, 별도 레이어).
 */
import type { ComplianceStatus } from "@/lib/status";
import { exposureFromScore } from "@/lib/status";
import type {
  DiagnosisInput,
  DiagnosisResult,
  Obligation,
  ObligationResult,
} from "./types";

/** 의무가 이 사업장에 적용되는가? (규모/업종/도급 조건) */
export function isApplicable(o: Obligation, input: DiagnosisInput): boolean {
  const a = o.applies_to || {};
  if (a.min_worker_count != null && input.worker_count < a.min_worker_count) {
    return false;
  }
  if (a.size_band && !a.size_band.includes(input.size_band)) {
    return false;
  }
  if (a.has_subcontract === true && !input.has_subcontract) {
    return false;
  }
  return true;
}

const MISSING_TEXT: Record<ComplianceStatus, string> = {
  fulfilled: "",
  partial: "증빙이 일부만 갖춰져 있습니다. 누락 항목을 보완하세요.",
  missing: "관련 증빙이 확인되지 않습니다.",
};

export function runDiagnosis(
  obligations: Obligation[],
  input: DiagnosisInput
): DiagnosisResult {
  const sorted = [...obligations].sort((a, b) => a.sort_order - b.sort_order);
  const rows: ObligationResult[] = [];
  let applicable = 0;
  let fulfilledWeighted = 0;

  for (const o of sorted) {
    const applies = isApplicable(o, input);
    const status: ComplianceStatus = applies
      ? input.evidence[o.code] ?? "missing"
      : "fulfilled"; // 비적용은 갭 아님

    if (applies) {
      applicable += 1;
      // 부분 이행은 0.5 가중
      fulfilledWeighted += status === "fulfilled" ? 1 : status === "partial" ? 0.5 : 0;
    }

    rows.push({
      code: o.code,
      title: o.title,
      status,
      applicable: applies,
      missing: applies && status !== "fulfilled" ? MISSING_TEXT[status] : "",
      required_evidence: o.required_evidence,
    });
  }

  const gap_score =
    applicable === 0 ? 100 : Math.round((fulfilledWeighted / applicable) * 100);

  return {
    gap_score,
    exposure: exposureFromScore(gap_score),
    applicable_count: applicable,
    fulfilled_count: rows.filter((r) => r.applicable && r.status === "fulfilled").length,
    rows,
  };
}
