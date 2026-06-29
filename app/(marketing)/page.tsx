import Link from "next/link";
import { Disclaimer } from "@/components/ds/Disclaimer";
import { ShareInvite } from "@/components/share/ShareInvite";

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      {/* HERO — 논지(상황·간극). 그라데이션/스탯 hero 아님. */}
      <section className="border-b border-border py-16 sm:py-24">
        <p className="text-sm font-medium text-muted">
          중대재해처벌법 안전보건관리체계 이행 증빙 시스템
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-[1.25] tracking-tight text-ink sm:text-4xl md:text-5xl md:leading-[1.2]">
          지금 사고가 나면, 대표님의 증빙은 충분합니까?
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/80 sm:text-lg">
          중대재해처벌법은 의무를 이행했다는 &lsquo;증빙&rsquo;이 곧 면책입니다.
          전담 안전관리자 없이도, 세이프노트가 그 증빙을 상시 쌓아 대표님을
          지킵니다.
        </p>

        {/* Stakes — 절제 한 줄 */}
        <p className="mt-6 flex max-w-2xl items-start gap-2 border-l-2 border-caution pl-3 text-sm leading-relaxed text-muted">
          <span>
            2024년부터 5인 이상 전 사업장 적용 · 대표{" "}
            <span className="num">1</span>년 이상 징역 또는{" "}
            <span className="num">10</span>억 이하 벌금
          </span>
        </p>

        {/* 주 CTA + 마이크로카피 */}
        <div className="mt-8">
          <Link
            href="/diagnosis"
            className="inline-flex items-center justify-center rounded-md bg-safe px-6 py-3 text-base font-semibold text-surface transition-colors hover:bg-safe-hover"
          >
            내 사업장 면책 상태 진단
          </Link>
          <p className="mt-3 text-sm text-muted">
            가입 없이 <span className="num">5</span>분, 우리 사업장 증빙 갭을 바로
            확인
          </p>
        </div>
      </section>

      {/* 가치 포인트 3개 — 짧게. 카드 그리드 남발 금지(구분선 리스트). */}
      <section className="py-14 sm:py-16" aria-labelledby="value-heading">
        <h2
          id="value-heading"
          className="text-lg font-bold tracking-tight text-ink"
        >
          세이프노트가 증빙을 다루는 방식
        </h2>
        <dl className="mt-6 divide-y divide-border border-y border-border">
          {VALUES.map((v) => (
            <div
              key={v.term}
              className="flex flex-col gap-1 py-5 sm:flex-row sm:gap-8"
            >
              <dt className="shrink-0 text-base font-semibold text-ink sm:w-64">
                {v.term}
              </dt>
              <dd className="text-sm leading-relaxed text-muted sm:text-base">
                {v.desc}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 테스트 체험 안내 */}
      <section className="border-t border-border py-14 sm:py-16" aria-labelledby="try-heading">
        <h2 id="try-heading" className="text-lg font-bold tracking-tight text-ink">
          지금 바로 체험해 보세요
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          사업장 관리자와 현장 근로자 모두 테스트로 사용해 볼 수 있습니다. 별도 가입 없이
          바로 들어가 보세요.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/login"
            className="rounded-md bg-safe px-5 py-2.5 text-sm font-semibold text-white hover:bg-safe-hover"
          >
            관리자(사업장)로 체험
          </Link>
          <Link
            href="/w"
            className="rounded-md border border-safe px-5 py-2.5 text-sm font-semibold text-safe hover:bg-safe/10"
          >
            근로자 앱 체험
          </Link>
        </div>
      </section>

      {/* 추천 — 동료에게 공유 */}
      <section className="border-t border-border py-14 sm:py-16" aria-labelledby="referral-heading">
        <h2 id="referral-heading" className="text-lg font-bold tracking-tight text-ink">
          아는 대표님과 함께 대비하세요
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          5인 이상이면 모든 사업장 대표에게 책임이 적용됩니다. 같은 고민을 하는 대표님께
          무료 진단을 공유해 보세요.
        </p>
        <div className="mt-5 max-w-md">
          <ShareInvite refCode="landing" />
        </div>
      </section>

      {/* 하단 진단 유도 + 고지문 */}
      <section className="border-t border-border py-12">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-base leading-relaxed text-ink">
            먼저 우리 사업장의 증빙 갭부터 확인해 보세요. 부족한 의무 항목과 다음
            액션을 그대로 보여드립니다.
          </p>
          <Link
            href="/diagnosis"
            className="inline-flex shrink-0 items-center justify-center rounded-md border border-safe px-5 py-2.5 text-sm font-semibold text-safe transition-colors hover:bg-safe/10"
          >
            면책 상태 진단 시작
          </Link>
        </div>
        <Disclaimer className="mt-8" />
      </section>
    </div>
  );
}

const VALUES = [
  {
    term: "일회성 서류가 아닌 상시 증빙",
    desc: "한 번 만들고 끝나는 문서가 아니라, 의무 이행 기록이 시간순으로 계속 쌓입니다.",
  },
  {
    term: "전담자 없이도 5분",
    desc: "안전 전문가가 아니어도, 짧은 진단과 안내를 따라 비전문가가 직접 처리할 수 있습니다.",
  },
  {
    term: "사고 시 면책 입증 자료",
    desc: "유사시 의무를 이행했음을 보여줄 객관적 근거 자료로 활용할 수 있습니다.",
  },
] as const;
