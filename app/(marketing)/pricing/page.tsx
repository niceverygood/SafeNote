import Link from "next/link";
import type { Metadata } from "next";
import { SubscribeForm } from "@/components/marketing/SubscribeForm";
import { Disclaimer } from "@/components/ds/Disclaimer";

export const metadata: Metadata = {
  title: "요금제 — 세이프노트",
  description:
    "무료 진단으로 시작하고, 증빙을 상시 쌓는 단계부터 구독하세요. 스탠다드 월 49,000원.",
};

const TIERS = [
  {
    name: "무료 진단",
    price: "0원",
    unit: "",
    desc: "가입 없이 5분, 면책 갭을 확인",
    feats: ["면책 자가진단", "갭 리포트 요약", "리스크 등급 확인"],
    cta: { label: "무료로 진단하기", href: "/diagnosis" },
    highlight: false,
  },
  {
    name: "스탠다드",
    price: "49,000원",
    unit: "/ 월",
    desc: "증빙을 상시 쌓는 핵심 플랜",
    feats: ["위험성평가 생성·확정", "공정 5개", "증빙 보관·PDF", "반기 점검 알림"],
    cta: { label: "구독 문의", href: "#inquiry" },
    highlight: true,
  },
  {
    name: "프로",
    price: "99,000원",
    unit: "/ 월",
    desc: "공정이 많은 사업장",
    feats: ["공정 무제한", "전 모듈 이용", "증빙 대장 관리", "우선 지원"],
    cta: { label: "구독 문의", href: "#inquiry" },
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold tracking-wider text-safe">PRICING</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">사업장 규모에 맞는 구독 플랜</h1>
        <p className="mt-3 text-muted">
          진단은 무료로 시작하고, 증빙을 상시 쌓는 단계부터 구독합니다. 결제 연동 전이라,
          현재는 구독 문의로 안내해 드립니다.
        </p>
      </header>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`flex flex-col rounded-lg border bg-white p-6 ${
              t.highlight ? "border-safe ring-1 ring-safe" : "border-border"
            }`}
          >
            {t.highlight && (
              <span className="mb-2 self-start rounded-full border border-safe/30 bg-safe/10 px-2.5 py-0.5 text-xs font-semibold text-safe">
                추천
              </span>
            )}
            <h2 className="text-base font-bold text-ink">{t.name}</h2>
            <div className="mt-2 flex items-end gap-1">
              <span className={`num text-2xl font-bold ${t.highlight ? "text-safe" : "text-ink"}`}>
                {t.price}
              </span>
              <span className="mb-1 text-xs text-muted">{t.unit}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{t.desc}</p>
            <ul className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              {t.feats.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-safe">✓</span>
                  <span className="text-ink">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={t.cta.href}
              className={`mt-6 rounded-md px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
                t.highlight
                  ? "bg-safe text-white hover:bg-safe-hover"
                  : "border border-border text-ink hover:bg-surface"
              }`}
            >
              {t.cta.label}
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-white p-5 text-sm">
        <p className="font-semibold text-ink">대행 · 다중 사업장 (엔터프라이즈)</p>
        <p className="mt-1 text-muted">
          노무·안전 대행, 다중 사업장 관리가 필요하면 아래 문의에서 “엔터프라이즈”를 선택해
          주세요.
        </p>
      </div>

      <section id="inquiry" className="mt-14 scroll-mt-24">
        <h2 className="text-xl font-bold text-ink">구독 문의</h2>
        <p className="mt-1 text-sm text-muted">
          남겨주시면 사업장에 맞는 플랜과 시작 방법을 안내해 드립니다.
        </p>
        <div className="mt-5 max-w-xl">
          <SubscribeForm defaultPlan="standard" />
        </div>
      </section>

      <Disclaimer className="mt-12" />
    </main>
  );
}
