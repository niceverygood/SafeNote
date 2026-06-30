import type { Metadata } from "next";
import { Disclaimer } from "@/components/ds/Disclaimer";

export const metadata: Metadata = {
  title: "개인정보 처리방침 — 세이프노트",
  description: "세이프노트(SafeNote) 개인정보 처리방침",
};

const UPDATED = "2026-06-30";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink/90">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <p className="text-xs font-semibold tracking-wider text-safe">PRIVACY POLICY</p>
      <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">개인정보 처리방침</h1>
      <p className="mt-2 text-sm text-muted">
        세이프노트(이하 “서비스”)는 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등
        관련 법령을 준수합니다. 시행일: <span className="num">{UPDATED}</span>
      </p>

      <Section title="1. 수집하는 개인정보 항목">
        <p>서비스는 다음 정보를 수집합니다.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>면책 자가진단·리드</strong>: 이메일, (선택) 이름·연락처, 사업장 업종·규모·진단 응답</li>
          <li><strong>사업장 관리자 계정</strong>: 이메일(로그인 인증)</li>
          <li><strong>근로자 계정</strong>: 이름, 아이디, (선택) 연락처, 비밀번호(암호화 저장)</li>
          <li><strong>현장 점검·신고 기록</strong>: 작업 전·중·후 점검 내역, 위험 신고 내용, (선택) 현장 사진, (선택) 위치(위도·경도), 작성 시각</li>
          <li><strong>자동 수집</strong>: 서비스 이용 과정에서 생성되는 접속·이용 기록(서버 로그)</li>
        </ul>
      </Section>

      <Section title="2. 개인정보의 수집·이용 목적">
        <ul className="list-disc space-y-1 pl-5">
          <li>중대재해처벌법 안전보건관리체계 이행 증빙의 생성·보관·관리</li>
          <li>작업 전·중·후 안전점검 및 위험 신고 기록·통지(관리자 알림)</li>
          <li>회원(관리자·근로자) 식별·인증 및 서비스 제공</li>
          <li>자가진단 결과 안내 및 관련 정보 제공(동의 시)</li>
          <li>서비스 운영·개선 및 문의 응대</li>
        </ul>
      </Section>

      <Section title="3. 보유 및 이용 기간">
        <p>
          수집한 개인정보는 수집·이용 목적이 달성되거나 이용자가 삭제를 요청하면 지체 없이 파기합니다.
          다만 안전보건 증빙의 성격상, 사업장(관리자)이 보존을 요청하거나 관련 법령이 보존을 요구하는
          경우 해당 기간 동안 보관할 수 있습니다.
        </p>
      </Section>

      <Section title="4. 처리위탁 및 국외 이전">
        <p>서비스 제공을 위해 아래 사업자에게 개인정보 처리를 위탁하며, 일부는 국외에서 처리될 수 있습니다.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Supabase</strong> — 데이터베이스·인증·스토리지(파일)</li>
          <li><strong>Vercel</strong> — 애플리케이션 호스팅</li>
          <li><strong>Anthropic</strong> — 문서 초안 생성(AI) <span className="text-muted">(입력 범위 내 텍스트)</span></li>
          <li><strong>Voyage AI</strong> — 검색용 임베딩 처리</li>
          <li><strong>Stibee</strong> — 이메일 발송(동의 시)</li>
          <li><strong>Solapi</strong> — 알림 문자 발송(설정 시)</li>
        </ul>
        <p className="text-muted">위탁 항목·범위는 서비스 변경에 따라 갱신될 수 있으며, 변경 시 본 방침을 통해 고지합니다.</p>
      </Section>

      <Section title="5. 이용자의 권리">
        <p>
          이용자는 자신의 개인정보에 대해 열람·정정·삭제·처리정지를 요청할 수 있습니다. 근로자는 소속
          사업장 관리자 또는 아래 연락처를 통해 요청할 수 있으며, 서비스는 관련 법령에 따라 지체 없이
          조치합니다.
        </p>
      </Section>

      <Section title="6. 개인정보의 안전성 확보 조치">
        <ul className="list-disc space-y-1 pl-5">
          <li>비밀번호 등 인증정보의 암호화 저장</li>
          <li>현장 기록의 위변조 감지(타임스탬프·해시 체인)</li>
          <li>접근 권한 통제 및 전송 구간 암호화(HTTPS)</li>
        </ul>
      </Section>

      <Section title="7. 아동의 개인정보">
        <p>서비스는 만 14세 미만 아동을 대상으로 하지 않으며, 해당 정보를 수집하지 않습니다.</p>
      </Section>

      <Section title="8. 개인정보 보호책임자 및 문의">
        <p>
          개인정보 관련 문의·요청은 아래로 연락해 주세요.<br />
          이메일: <span className="num">dev@bottlecorp.kr</span>
        </p>
      </Section>

      <Section title="9. 고지의 의무">
        <p>본 방침의 내용 추가·삭제·수정이 있을 경우 시행 전 서비스 내 공지를 통해 알립니다.</p>
      </Section>

      <div className="mt-10 border-t border-border pt-4">
        <Disclaimer />
      </div>
    </main>
  );
}
