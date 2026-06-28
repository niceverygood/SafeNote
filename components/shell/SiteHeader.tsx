"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LiabilityGauge } from "@/components/ds/LiabilityGauge";

const NAV = [
  { href: "/diagnosis", label: "자가진단" },
  { href: "/risk-assessment/new", label: "위험성평가" },
] as const;

/**
 * 상단 내비. 세이프노트 워드마크 + 모듈 링크 + 상시 면책 상태(작은 게이지).
 * 차분·테두리 기반, 화려함 금지. 게이지는 진단 완료 시에만 노출.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("safenote:lastGapScore");
      if (raw !== null) {
        const n = Number(raw);
        if (!Number.isNaN(n)) setScore(Math.max(0, Math.min(100, n)));
      }
    } catch {
      /* localStorage 접근 불가 환경 무시 */
    }
  }, [pathname]);

  // 관리자 콘솔은 자체 내비(AdminNav)를 쓰므로 공개 헤더 숨김
  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded text-ink"
          aria-label="세이프노트 홈"
        >
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-sm border border-safe/40 bg-safe/10"
            aria-hidden
          >
            <span className="h-2.5 w-2.5 rounded-[2px] bg-safe" />
          </span>
          <span className="text-base font-bold tracking-tight">세이프노트</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 sm:flex" aria-label="주 메뉴">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href.split("/").slice(0, 2).join("/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-safe/10 text-safe"
                    : "text-muted hover:bg-ink/[0.04] hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {score !== null ? (
            <div className="flex items-center gap-2" title="현재 면책 이행률">
              <span className="hidden text-xs text-muted sm:inline">면책 상태</span>
              <LiabilityGauge score={score} size="sm" />
            </div>
          ) : (
            <Link
              href="/diagnosis"
              className="rounded border border-safe bg-safe px-3 py-1.5 text-sm font-medium text-surface transition-colors hover:bg-safe-hover"
            >
              진단 시작
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
