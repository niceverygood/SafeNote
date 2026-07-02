-- SafeNote — 공지·주지 기록(면책: 주지의무 증빙 / 근로자: 위험 인지) + 아차사고
-- 공지 (관리자 → 근로자)
create table if not exists notices (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  title        text not null,
  body         text not null,
  kind         text not null default 'notice' check (kind in ('notice','education','alert')),
  created_by   text,
  created_at    timestamptz not null default now()
);
create index if not exists notices_ws on notices (workspace_id, created_at desc);

-- 근로자 확인(주지) 서명 — 불변 해시 체인
create table if not exists notice_acks (
  id            uuid primary key default gen_random_uuid(),
  notice_id     uuid not null references notices (id) on delete cascade,
  workspace_id  uuid not null references workspaces (id) on delete cascade,
  worker_id     uuid references workers (id) on delete set null,
  worker_name   text not null,
  signature_name text,
  prev_hash     text,
  hash          text not null,
  created_at     timestamptz not null default now(),
  unique (notice_id, worker_id)
);
create index if not exists notice_acks_ws on notice_acks (workspace_id, created_at desc);

-- 아차사고 구분
alter table hazard_reports add column if not exists report_type text not null default 'hazard'
  check (report_type in ('hazard','near_miss'));

alter table notices     enable row level security;
alter table notice_acks enable row level security;
-- 정책 없음 → 서버(service_role) 전용
