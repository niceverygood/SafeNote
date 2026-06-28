"use client";

/**
 * 자가진단 단일 스텝 레이아웃 (한 번에 한 질문).
 * 표제 + 보조설명 + 입력 영역(children)을 차분하게 배치. 카드 그리드 아님.
 */
export function QuestionStep({
  stepLabel,
  question,
  hint,
  children,
}: {
  stepLabel: string;
  question: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-xl" aria-live="polite">
      <p className="num text-xs font-medium tracking-wide text-muted">{stepLabel}</p>
      <h2 className="mt-2 text-xl font-bold leading-snug text-ink sm:text-2xl">
        {question}
      </h2>
      {hint && <p className="mt-2 text-sm leading-relaxed text-muted">{hint}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/**
 * 선택지 버튼 (단일/다중 선택 공용). 상태색은 호출부에서 tone으로 지정 가능.
 * 선택 시 safe 테두리로 표시 — 색+텍스트(체크) 동시.
 */
export function ChoiceButton({
  selected,
  label,
  description,
  onClick,
  tone,
}: {
  selected: boolean;
  label: string;
  description?: string;
  onClick: () => void;
  tone?: "safe" | "caution" | "danger";
}) {
  const toneRing =
    tone === "danger"
      ? "border-danger bg-danger/5"
      : tone === "caution"
        ? "border-caution bg-caution/5"
        : "border-safe bg-safe/5";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-start gap-3 rounded-md border px-4 py-3 text-left transition-colors ${
        selected ? toneRing : "border-border bg-white hover:border-muted"
      }`}
    >
      <span
        aria-hidden
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          selected
            ? tone === "danger"
              ? "border-danger bg-danger text-white"
              : tone === "caution"
                ? "border-caution bg-caution text-white"
                : "border-safe bg-safe text-white"
            : "border-border bg-white"
        }`}
      >
        {selected && (
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
            <path
              d="M3 8.5l3 3 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted">
            {description}
          </span>
        )}
      </span>
    </button>
  );
}
