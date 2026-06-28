"use client";

import { useState } from "react";

/**
 * 추천·공유 그로스 훅. 동료 대표에게 무료 자가진단을 추천.
 * Web Share API 지원 시 네이티브 공유, 아니면 링크 복사.
 */
export function ShareInvite({
  refCode = "share",
  className = "",
}: {
  refCode?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  function url() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/diagnosis?ref=${encodeURIComponent(refCode)}`;
  }

  async function share() {
    const link = url();
    const text =
      "5인 이상 사업장이면 대표 책임이 적용됩니다. 가입 없이 5분, 우리 사업장 면책 갭을 확인해 보세요.";
    try {
      if (navigator.share) {
        await navigator.share({ title: "세이프노트 면책 자가진단", text, url: link });
        return;
      }
    } catch {
      /* 사용자가 취소하면 무시 */
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard 불가 환경 무시 */
    }
  }

  return (
    <div className={`rounded-lg border border-border bg-white p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-ink">아는 대표님께 추천하기</h3>
      <p className="mt-1 text-sm text-muted">
        같은 고민을 하는 사업장 대표에게 무료 진단을 공유하세요. 가입 없이 5분이면 됩니다.
      </p>
      <button
        onClick={share}
        className="mt-3 rounded-md border border-safe bg-safe px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-safe-hover"
      >
        {copied ? "링크가 복사되었습니다" : "진단 링크 공유하기"}
      </button>
    </div>
  );
}
