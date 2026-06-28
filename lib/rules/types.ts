import type { ComplianceStatus, RiskLevel } from "@/lib/status";

export type SizeBand = "1-9" | "10-49";

export interface Obligation {
  id?: string;
  code: string;
  title: string;
  description: string;
  required_evidence: string;
  applies_to: {
    size_band?: SizeBand[];
    min_worker_count?: number;
    has_subcontract?: boolean;
  };
  sort_order: number;
}

/** 자가진단 입력 */
export interface DiagnosisInput {
  industry_code: string;
  size_band: SizeBand;
  worker_count: number;
  has_subcontract: boolean;
  /** 의무 code → 보유 서류 상태 (사용자 체크) */
  evidence: Record<string, ComplianceStatus>;
}

/** 의무별 진단 결과 행 */
export interface ObligationResult {
  code: string;
  title: string;
  status: ComplianceStatus;
  applicable: boolean;
  missing: string; // 무엇이 비었나
  required_evidence: string;
}

export interface DiagnosisResult {
  gap_score: number; // 이행률 0~100 (rule 산출)
  exposure: RiskLevel; // 지금 사고 시 리스크 등급
  applicable_count: number;
  fulfilled_count: number;
  rows: ObligationResult[];
}

/** 위험성평가 항목 */
export interface RiskItem {
  hazard: string;
  frequency: 1 | 2 | 3; // 빈도 (낮음/보통/높음)
  severity: 1 | 2 | 3; // 강도 (경상/중상/사망)
  risk_level: RiskLevel; // 매트릭스 산출 (자동)
  measure: string;
  owner: string;
  due: string;
  source_chunk_id: string | null;
  source_label: string | null;
  needs_expert_review: boolean;
  is_draft: boolean; // LLM 초안 여부
}
