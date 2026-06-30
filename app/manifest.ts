import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "세이프노트 — 안전점검",
    short_name: "세이프노트",
    description: "작업 전·중·후 안전점검과 위험 신고를 기록하는 현장 안전 앱.",
    start_url: "/w",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F6F7F5",
    theme_color: "#15643E",
    lang: "ko",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
