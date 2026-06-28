"use client";

/**
 * 모듈 A — 진단 결과(상태 대장 / 점검표).
 * 상단: 면책 게이지(lg) + 리스크 등급(rule, exposureFromScore).
 * 본문: 상태 대장(GapLedger) — 카드 그리드 아님.
 * 리포트 전문(공백 상세/다음 액션)은 이메일 입력(리드 캡처) 후 잠금 해제.
 * 결과는 ?id= 로 서버 GET, 없으면 sessionStorage fallback.
 */
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LiabilityGauge } from "@/components/ds/LiabilityGauge";
import { RiskChip } from "@/components/ds/StatusChip";
import { Disclaimer } from "@/components/ds/Disclaimer";
import { GapLedger, type LedgerRow } from "@/components/diagnosis/GapLedger";
import { LeadCaptureForm } from "@/components/diagnosis/LeadCaptureForm";
import { ShareInvite } from "@/components/share/ShareInvite";
import type { RiskLevel } from "@/lib/status";

interface ReportResult {
  gap_score: number;
  exposure: RiskLevel;
  applicable_count: number;
  fulfilled_count: number;
  rows: LedgerRow[];
}

function ReportView() {
  const params = useSearchParams();
  const id = params.get("id");

  const [result, setResult] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      // id 있으면 서버 조회
      if (id) {
        try {
          const res = await fetch(`/api/diagnosis?id=${encodeURIComponent(id)}`);
          const data = (await res.json()) as {
            result?: ReportResult;
            unlocked?: boolean;
            error?: string;
          };
          if (!active) return;
          if (!res.ok || !data.result) {
            setError(data.error ?? "진단 결과를 불러오지 못했습니다.");
          } else {
            setResult(data.result);
            if (data.unlocked) setUnlocked(true);
          }
        } catch {
          if (active) setError("결과를 불러오는 중 오류가 발생했습니다.");
        } finally {
          if (active) setLoading(false);
        }
        return;
      }

      // id 없으면 세션 fallback
      try {
        const raw = sessionStorage.getItem("safenote_diagnosis_result");
        if (raw) {
          setResult(JSON.parse(raw) as ReportResult);
        } else {
          setError("진단 결과가 없습니다. 자가진단을 먼저 진행해 주세요.");
        }
      } catch {
        setError("진단 결과를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-sm text-muted">결과를 불러오는 중…</p>
      </main>
    );
  }

  if (error || !result) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-sm text-danger">{error ?? "결과를 표시할 수 없습니다."}</p>
        <a
          href="/diagnosis"
          className="mt-4 inline-block rounded-md bg-safe px-4 py-2.5 text-sm font-semibold text-white hover:bg-safe-hover"
        >
          자가진단 시작
        </a>
      </main>
    );
  }

  const applicable = result.rows.filter((r) => r.applicable);
  const gaps = applicable.filter((r) => r.status !== "fulfilled");
  const gapCount = gaps.length;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
      <header>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          우리 사업장 면책 증빙 점검표
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          중대재해처벌법 안전보건관리체계 9대 의무 기준으로, 지금 사고가 났을 때
          증빙으로 입증 가능한 항목과 비어 있는 항목을 정리했습니다.
        </p>
      </header>

      {/* 요약: 면책 게이지 + 리스크 등급 (rule 산출) */}
      <section className="mt-8 flex flex-col items-center gap-6 rounded-md border border-border bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <LiabilityGauge score={result.gap_score} size="lg" label="증빙 이행률" />
        <div className="flex-1 sm:pl-2">
          <RiskChip level={result.exposure} />
          <p className="mt-3 text-sm leading-relaxed text-ink">
            적용 의무{" "}
            <span className="num font-semibold">{result.applicable_count}</span>개 중{" "}
            <span className="num font-semibold text-safe">
              {result.fulfilled_count}
            </span>
            개의 핵심 증빙이 확인되었습니다.
          </p>
          {gapCount > 0 && (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              이 <span className="num font-semibold text-ink">{gapCount}</span>개를
              채우면 핵심 공백이 닫힙니다.
            </p>
          )}
        </div>
      </section>

      {/* 상태 대장 (점검표) */}
      <section className="mt-8">
        <h2 className="mb-3 text-base font-bold text-ink">의무별 상태 대장</h2>
        <GapLedger rows={applicable} locked={!unlocked} />
      </section>

      {/* 리드 캡처 (잠금 해제) */}
      {!unlocked && (
        <section className="mt-8">
          <LeadCaptureForm
            diagnosisId={id}
            gapCount={gapCount}
            onUnlock={() => setUnlocked(true)}
          />
        </section>
      )}

      {unlocked && gapCount === 0 && (
        <p className="mt-8 rounded-md border border-safe/30 bg-safe/5 px-4 py-3 text-sm text-ink">
          현재 적용 의무의 핵심 증빙이 모두 확인되었습니다. 정기적으로 갱신·점검해
          상태를 유지하세요.
        </p>
      )}

      {/* 구독 전환 CTA (잠금 해제 후) */}
      {unlocked && (
        <section className="mt-8 rounded-lg border border-safe/30 bg-safe/5 p-6">
          <h2 className="text-base font-bold text-ink">공백을 닫고, 증빙을 상시 쌓으세요</h2>
          <p className="mt-1 text-sm text-muted">
            위험성평가를 생성·확정하면 증빙이 사업장에 상시 축적됩니다. 구독 플랜으로
            시작하세요.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/risk-assessment/new"
              className="rounded-md bg-safe px-4 py-2 text-sm font-semibold text-white hover:bg-safe-hover"
            >
              위험성평가 만들기
            </a>
            <a
              href="/pricing"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-surface"
            >
              요금제 보기
            </a>
          </div>
        </section>
      )}

      {/* 추천·공유 그로스 훅 */}
      <section className="mt-8">
        <ShareInvite refCode="report" />
      </section>

      <div className="mt-10 border-t border-border pt-4">
        <Disclaimer />
      </div>
    </main>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl px-5 py-16">
          <p className="text-sm text-muted">결과를 불러오는 중…</p>
        </main>
      }
    >
      <ReportView />
    </Suspense>
  );
}
