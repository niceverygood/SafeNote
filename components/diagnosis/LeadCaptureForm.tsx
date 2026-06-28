"use client";

/**
 * 리드 캡처 폼. 이메일 입력 → POST /api/lead → 성공 시 onUnlock() 호출(리포트 전문 해제).
 * 톤: 정직하되 비관 금지. "면책 보장" 류 카피 금지.
 */
import { useState } from "react";

export function LeadCaptureForm({
  diagnosisId,
  gapCount,
  onUnlock,
}: {
  diagnosisId: string | null;
  gapCount: number;
  onUnlock: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!diagnosisId) {
      // 저장 실패(DB 미설정 등)로 id가 없으면 로컬에서 바로 해제
      onUnlock();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosis_id: diagnosisId,
          email,
          name: name || undefined,
          phone: phone || undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "전송에 실패했습니다. 다시 시도해 주세요.");
        return;
      }
      onUnlock();
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-md border border-border bg-white p-5 sm:p-6">
      <h3 className="text-base font-bold text-ink">
        리포트 전문과 항목별 다음 액션 받기
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        {gapCount > 0
          ? `이 ${gapCount}개를 채우면 핵심 공백이 닫힙니다. 이메일을 남기면 각 항목의 상세 설명과 다음 액션 전문을 바로 확인할 수 있습니다.`
          : "이메일을 남기면 점검표 전문과 유지·관리 가이드를 받아볼 수 있습니다."}
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3" noValidate>
        <div>
          <label
            htmlFor="lead-email"
            className="block text-xs font-semibold text-ink"
          >
            이메일 <span className="text-danger">*</span>
          </label>
          <input
            id="lead-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="lead-name"
              className="block text-xs font-semibold text-ink"
            >
              담당자명 <span className="font-normal text-muted">(선택)</span>
            </label>
            <input
              id="lead-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink"
            />
          </div>
          <div>
            <label
              htmlFor="lead-phone"
              className="block text-xs font-semibold text-ink"
            >
              연락처 <span className="font-normal text-muted">(선택)</span>
            </label>
            <input
              id="lead-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-safe px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-safe-hover disabled:opacity-60"
        >
          {submitting ? "전송 중…" : "리포트 전문 확인하기"}
        </button>
      </form>
    </div>
  );
}
