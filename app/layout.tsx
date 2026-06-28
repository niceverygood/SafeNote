import type { Metadata } from "next";
import { Noto_Serif_KR, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/shell/SiteHeader";
import { LiabilityStatusBar } from "@/components/shell/LiabilityStatusBar";

const notoSerifKr = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-noto-serif-kr",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "세이프노트 — 중대재해처벌법 면책 증빙 시스템",
  description:
    "전담 안전관리자 없이도, 중대재해처벌법 안전보건관리체계 이행 증빙을 상시 쌓아 대표를 지키는 SaaS.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${notoSerifKr.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-dvh antialiased">
        <SiteHeader />
        <LiabilityStatusBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
