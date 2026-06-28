/** 모든 산출물 하단 필수 고지. (절대 원칙 4) */
export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-muted leading-relaxed ${className}`}>
      본 자료는 법률자문을 대체하지 않습니다.
    </p>
  );
}
