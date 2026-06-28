-- SafeNote — 구독 문의 / 추천 캡처
create table if not exists subscription_inquiries (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  name        text,
  phone       text,
  company     text,
  plan        text,           -- standard / pro / enterprise / unknown
  message     text,
  source      text,           -- pricing / diagnosis / referral
  ref         text,           -- 추천 코드(있으면)
  created_at   timestamptz not null default now()
);

alter table subscription_inquiries enable row level security;
-- 정책 없음 → 서버(service_role) 전용. 공개 폼 제출은 API 라우트가 처리.
