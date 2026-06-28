"use client";

/**
 * 모듈 A — 5분 면책 자가진단 (멀티스텝, 한 번에 한 질문).
 * step1 업종 → step2 규모/인원/도급 → step3+ 적용되는 9대 의무별 보유 서류 체크.
 * 점수/상태/리스크는 서버 rule(runDiagnosis)이 산출. 이 화면은 입력만 수집.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QuestionStep, ChoiceButton } from "@/components/diagnosis/QuestionStep";
import { Disclaimer } from "@/components/ds/Disclaimer";
import { isApplicable } from "@/lib/rules/obligations";
import type {
  Obligation,
  SizeBand,
  DiagnosisInput,
} from "@/lib/rules/types";
import type { ComplianceStatus } from "@/lib/status";
import industriesData from "@/data/seed/industries.json";
import obligationsData from "@/data/seed/obligations.json";

const industries = industriesData as { code: string; name: string; sort_order: number }[];
const obligations = (obligationsData as unknown as Obligation[])
  .slice()
  .sort((a, b) => a.sort_order - b.sort_order);

const EVIDENCE_OPTIONS: {
  value: ComplianceStatus;
  label: string;
  description: string;
  tone: "safe" | "caution" | "danger";
}[] = [
  {
    value: "fulfilled",
    label: "보유",
    description: "관련 서류·증빙을 갖추고 있습니다.",
    tone: "safe",
  },
  {
    value: "partial",
    label: "일부",
    description: "일부만 있거나 최신 상태가 아닙니다.",
    tone: "caution",
  },
  {
    value: "missing",
    label: "없음",
    description: "해당 증빙이 없거나 확인되지 않습니다.",
    tone: "danger",
  },
];

interface Profile {
  industry_code: string;
  size_band: SizeBand | null;
  worker_count: number | null;
  has_subcontract: boolean | null;
}

export default function DiagnosisPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>({
    industry_code: "",
    size_band: null,
    worker_count: null,
    has_subcontract: null,
  });
  const [evidence, setEvidence] = useState<Record<string, ComplianceStatus>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 프로필이 충족되면(규모/인원/도급) 적용 의무를 rule로 산정해 증빙 스텝 구성
  const applicableObligations = useMemo<Obligation[]>(() => {
    if (
      !profile.size_band ||
      profile.worker_count == null ||
      profile.has_subcontract == null
    ) {
      return [];
    }
    const probe: DiagnosisInput = {
      industry_code: profile.industry_code || "etc",
      size_band: profile.size_band,
      worker_count: profile.worker_count,
      has_subcontract: profile.has_subcontract,
      evidence: {},
    };
    return obligations.filter((o) => isApplicable(o, probe));
  }, [profile]);

  // 스텝 구성: [업종, 규모] + 적용 의무별 증빙 스텝
  const FIXED_STEPS = 2;
  const totalSteps = FIXED_STEPS + applicableObligations.length;
  const progress = totalSteps > 0 ? Math.round((step / totalSteps) * 100) : 0;

  const profileComplete =
    !!profile.industry_code &&
    !!profile.size_band &&
    profile.worker_count != null &&
    profile.has_subcontract != null;

  function goNext() {
    setSubmitError(null);
    setStep((s) => Math.min(s + 1, totalSteps));
  }
  function goBack() {
    setSubmitError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    if (!profileComplete) return;
    setSubmitting(true);
    setSubmitError(null);

    // 적용 의무 중 미응답은 'missing'으로 보수적 처리
    const fullEvidence: Record<string, ComplianceStatus> = {};
    for (const o of applicableObligations) {
      fullEvidence[o.code] = evidence[o.code] ?? "missing";
    }

    const body = {
      industry_code: profile.industry_code,
      size_band: profile.size_band,
      worker_count: profile.worker_count,
      has_subcontract: profile.has_subcontract,
      evidence: fullEvidence,
    };

    try {
      const res = await fetch("/api/diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        id: string | null;
        result?: unknown;
        error?: string;
      };
      if (!res.ok) {
        setSubmitError(data.error ?? "진단 처리에 실패했습니다.");
        return;
      }
      if (data.id) {
        router.push(`/diagnosis/report?id=${data.id}`);
      } else {
        // 저장 없이도 결과를 보여주기 위해 세션에 저장 후 이동
        try {
          sessionStorage.setItem(
            "safenote_diagnosis_result",
            JSON.stringify(data.result)
          );
        } catch {
          // sessionStorage 불가 시 무시
        }
        router.push("/diagnosis/report");
      }
    } catch {
      setSubmitError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 py-8 sm:py-12">
      {/* 진행 표시 */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="font-medium">면책 자가진단</span>
          <span className="num">{progress}%</span>
        </div>
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="진단 진행률"
        >
          <div
            className="h-full rounded-full bg-safe transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1">
        {step === 0 && (
          <QuestionStep
            stepLabel="STEP 1"
            question="어떤 업종의 사업장입니까?"
            hint="업종에 따라 적용되는 의무가 달라집니다."
          >
            <div className="space-y-2">
              {industries.map((ind) => (
                <ChoiceButton
                  key={ind.code}
                  selected={profile.industry_code === ind.code}
                  label={ind.name}
                  onClick={() =>
                    setProfile((p) => ({ ...p, industry_code: ind.code }))
                  }
                />
              ))}
            </div>
          </QuestionStep>
        )}

        {step === 1 && (
          <QuestionStep
            stepLabel="STEP 2"
            question="사업장 규모와 도급 여부를 알려주세요."
            hint="상시근로자 수와 도급·용역·위탁 여부로 적용 의무가 결정됩니다."
          >
            <div className="space-y-6">
              <fieldset>
                <legend className="text-sm font-semibold text-ink">
                  상시근로자 규모
                </legend>
                <div className="mt-2 space-y-2">
                  <ChoiceButton
                    selected={profile.size_band === "1-9"}
                    label="1~9인"
                    onClick={() =>
                      setProfile((p) => ({ ...p, size_band: "1-9" }))
                    }
                  />
                  <ChoiceButton
                    selected={profile.size_band === "10-49"}
                    label="10~49인"
                    onClick={() =>
                      setProfile((p) => ({ ...p, size_band: "10-49" }))
                    }
                  />
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="worker-count"
                  className="text-sm font-semibold text-ink"
                >
                  상시근로자 수 (명)
                </label>
                <input
                  id="worker-count"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={profile.worker_count ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      worker_count:
                        e.target.value === ""
                          ? null
                          : Math.max(0, Number(e.target.value)),
                    }))
                  }
                  placeholder="예: 24"
                  className="num mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70"
                />
              </div>

              <fieldset>
                <legend className="text-sm font-semibold text-ink">
                  도급·용역·위탁을 주는 작업이 있습니까?
                </legend>
                <div className="mt-2 space-y-2">
                  <ChoiceButton
                    selected={profile.has_subcontract === true}
                    label="있음"
                    description="다른 사업자에게 작업의 일부를 맡깁니다."
                    onClick={() =>
                      setProfile((p) => ({ ...p, has_subcontract: true }))
                    }
                  />
                  <ChoiceButton
                    selected={profile.has_subcontract === false}
                    label="없음"
                    onClick={() =>
                      setProfile((p) => ({ ...p, has_subcontract: false }))
                    }
                  />
                </div>
              </fieldset>
            </div>
          </QuestionStep>
        )}

        {step >= FIXED_STEPS && step < totalSteps && (
          (() => {
            const idx = step - FIXED_STEPS;
            const o = applicableObligations[idx];
            if (!o) return null;
            return (
              <QuestionStep
                key={o.code}
                stepLabel={`의무 ${idx + 1} / ${applicableObligations.length} · ${o.code}`}
                question={o.title}
                hint={`필요 증빙: ${o.required_evidence}`}
              >
                <p className="mb-4 rounded-md border border-border bg-white px-4 py-3 text-sm leading-relaxed text-muted">
                  {o.description}
                </p>
                <p className="mb-2 text-sm font-semibold text-ink">
                  관련 증빙을 보유하고 있습니까?
                </p>
                <div className="space-y-2">
                  {EVIDENCE_OPTIONS.map((opt) => (
                    <ChoiceButton
                      key={opt.value}
                      selected={evidence[o.code] === opt.value}
                      label={opt.label}
                      description={opt.description}
                      tone={opt.tone}
                      onClick={() =>
                        setEvidence((prev) => ({ ...prev, [o.code]: opt.value }))
                      }
                    />
                  ))}
                </div>
              </QuestionStep>
            );
          })()
        )}
      </div>

      {/* 내비게이션 */}
      <div className="mt-10">
        {submitError && (
          <p role="alert" className="mb-3 text-sm text-danger">
            {submitError}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-muted disabled:opacity-40"
          >
            이전
          </button>

          {step < totalSteps - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canAdvance(step, FIXED_STEPS, profile, profileComplete)}
              className="rounded-md bg-safe px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-safe-hover disabled:opacity-50"
            >
              다음
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !profileComplete}
              className="rounded-md bg-safe px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-safe-hover disabled:opacity-50"
            >
              {submitting ? "진단 중…" : "진단 결과 보기"}
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 border-t border-border pt-4">
        <Disclaimer />
      </div>
    </main>
  );
}

/** 현재 스텝에서 '다음'으로 진행 가능한지 (입력 충족 검사) */
function canAdvance(
  step: number,
  fixedSteps: number,
  profile: Profile,
  profileComplete: boolean
): boolean {
  if (step === 0) return !!profile.industry_code;
  if (step === 1) return profileComplete;
  // 증빙 스텝은 미선택이어도 진행 허용(미응답 = missing 보수 처리)
  if (step >= fixedSteps) return true;
  return true;
}
