"use client";

import { useEffect } from "react";

/** 서비스워커 등록 (PWA 설치 가능 조건 충족) — dev에서는 청크 URL이 고정이라 SW 캐시가 옛 코드를 계속 서빙하므로 프로덕션에서만 등록 */
export function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // dev: 기존 등록된 SW·캐시가 남아 있으면 제거
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
      }
      return;
    }
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
