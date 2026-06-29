"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LiabilityGauge } from "@/components/ds/LiabilityGauge";
import { RiskChip } from "@/components/ds/StatusChip";
import { exposureFromScore } from "@/lib/status";

/**
 * 상시 면책 상태 바. 페이지 상단에 얇게 상주.
 * 진단 완료(localStorage "safenote:lastGapScore") → 이행률 게이지 + 리스크 등급.
 * 미완료 → 중립 안내 + "진단하기" CTA. 절제된 톤.
 */
export function LiabilityStatusBar() {
  const pathname = usePathname();
  const [score, setScore] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("safenote:lastGapScore");
      if (raw !== null) {
        const n = Number(raw);
        if (!Number.isNaN(n)) setScore(Math.max(0, Math.min(100, Math.round(n))));
      }
    } catch {
      /* 무시 */
    } finally {
      setReady(true);
    }
  }, []);

  // 관리자 콘솔·노동자 앱에서는 공개 상태 바 숨김
  if (pathname.startsWith("/admin") || pathname.startsWith("/w")) return null;

  // 하이드레이션 불일치 방지: 클라이언트 측정 전에는 중립 상태로 렌더.
  const hasScore = ready && score !== null;

  return (
    <div className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2 sm:px-6">
        {hasScore ? (
          <>
            <LiabilityGauge score={score as number} size="sm" />
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-medium text-ink">현재 면책 이행률</span>
              <span className="num text-sm font-semibold text-ink">{score}%</span>
              <RiskChip level={exposureFromScore(score as number)} />
            </div>
            <Link
              href="/diagnosis"
              className="ml-auto shrink-0 rounded px-2.5 py-1 text-sm font-medium text-safe hover:underline"
            >
              다시 진단
            </Link>
          </>
        ) : (
          <>
            <span
              className="inline-flex h-2 w-2 shrink-0 rounded-full bg-caution"
              aria-hidden
            />
            <p className="min-w-0 truncate text-sm text-muted">
              <span className="font-medium text-ink">진단 미완료</span>
              <span className="hidden sm:inline">
                {" "}— 5분 진단으로 증빙 갭 확인
              </span>
            </p>
            <Link
              href="/diagnosis"
              className="ml-auto shrink-0 rounded border border-safe bg-safe px-3 py-1 text-sm font-medium text-surface transition-colors hover:bg-safe-hover"
            >
              진단하기
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
