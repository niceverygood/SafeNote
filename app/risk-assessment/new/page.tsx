"use client";

/**
 * 위험성평가 새로 만들기 폼.
 * 업종 선택 + 공정/작업 입력 → POST /api/risk/generate → /risk-assessment/[id]
 * 문서 grade 스타일. 카드 그리드 아님.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import industries from "@/data/seed/industries.json";
import { Disclaimer } from "@/components/ds/Disclaimer";

const INDUSTRIES = (industries as { code: string; name: string; sort_order: number }[])
  .slice()
  .sort((a, b) => a.sort_order - b.sort_order);

export default function NewRiskAssessmentPage() {
  const router = useRouter();
  const [industryCode, setIndustryCode] = useState(INDUSTRIES[0]?.code ?? "");
  const [process, setProcess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!industryCode || !process.trim()) {
      setError("업종과 공정/작업을 입력하세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/risk/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry_code: industryCode,
          process: process.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "생성에 실패했습니다.");
      router.push(`/risk-assessment/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성 중 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-16">
      <header className="border-b border-border pb-5">
        <p className="text-xs uppercase tracking-widest text-muted">
          SAFENOTE 위험성평가
        </p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-ink sm:text-3xl">
          위험성평가 생성
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          업종과 공정을 입력하면 규정 근거(KOSHA 가이드·시행령) 범위 안에서 유해·위험요인과
          감소대책 <span className="text-ink">초안</span>을 작성합니다. 위험도는 직접
          빈도×강도를 선택해 확정합니다.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="industry" className="text-sm font-medium text-ink">
            업종
          </label>
          <select
            id="industry"
            value={industryCode}
            onChange={(e) => setIndustryCode(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink"
          >
            {INDUSTRIES.map((ind) => (
              <option key={ind.code} value={ind.code}>
                {ind.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="process" className="text-sm font-medium text-ink">
            공정 / 작업
          </label>
          <input
            id="process"
            type="text"
            value={process}
            onChange={(e) => setProcess(e.target.value)}
            placeholder="예: 프레스 작업, 지게차 운반, 고소작업"
            className="rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink"
          />
          <p className="text-xs text-muted">
            평가 대상 공정·작업명을 구체적으로 적을수록 근거 매칭이 정확해집니다.
          </p>
        </div>

        {error && (
          <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 border-t border-border pt-5">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-safe px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-safe-hover disabled:opacity-60"
          >
            {submitting ? "초안 생성 중…" : "초안 생성"}
          </button>
          {submitting && (
            <span className="text-sm text-muted">근거 검색·문장화에 수십 초 걸릴 수 있습니다.</span>
          )}
        </div>
      </form>

      <Disclaimer className="mt-10 border-t border-border pt-5" />
    </main>
  );
}
