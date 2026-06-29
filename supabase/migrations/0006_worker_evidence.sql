-- SafeNote Phase 1 — 노동자 현장 증빙 (작업 전 점검 · 위험 신고)
-- 노동자 보호 활동이 곧 면책 증빙이 되도록. 모든 기록은 해시 체인으로 위변조 감지.

-- 사업장 참여코드 (노동자 입장용)
alter table workspaces add column if not exists join_code text unique;

-- 노동자 (경량 식별 — 이름/연락처 자기기재, TBM 서명 수준)
create table if not exists workers (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  name         text not null,
  phone        text,
  created_at    timestamptz not null default now()
);
create index if not exists workers_ws on workers (workspace_id);

-- 작업 전 안전점검 (불변 — 위험 고지 + 체크 + 서명)
create table if not exists safety_checks (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces (id) on delete cascade,
  worker_id     uuid references workers (id) on delete set null,
  worker_name   text not null,
  process       text not null,
  kind          text not null default 'pre_work',
  hazards       jsonb not null default '[]'::jsonb,   -- 고지된 위험요인
  items         jsonb not null default '[]'::jsonb,   -- [{label, checked}]
  acknowledged  boolean not null default false,        -- 위험 고지 확인
  signature_name text,                                  -- 서명(이름 입력)
  lat           double precision,
  lng           double precision,
  prev_hash     text,
  hash          text not null,                          -- 위변조 감지 체인
  created_at     timestamptz not null default now()
);
create index if not exists safety_checks_ws on safety_checks (workspace_id, created_at desc);

-- 위험 신고 (노동자 → 사업장)
create table if not exists hazard_reports (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces (id) on delete cascade,
  worker_id     uuid references workers (id) on delete set null,
  worker_name   text not null,
  location      text,
  description   text not null,
  severity      text not null default 'medium' check (severity in ('low','medium','high')),
  status        text not null default 'open' check (status in ('open','resolved')),
  resolution    text,
  resolved_at   timestamptz,
  prev_hash     text,
  hash          text not null,
  created_at     timestamptz not null default now()
);
create index if not exists hazard_reports_ws on hazard_reports (workspace_id, created_at desc);

alter table workers        enable row level security;
alter table safety_checks  enable row level security;
alter table hazard_reports enable row level security;
-- 정책 없음 → 서버(service_role) 전용. 노동자 접근은 참여코드 검증 API로만.

-- 기존 워크스페이스에 참여코드 백필 (6자리)
update workspaces set join_code = upper(substr(replace(gen_random_uuid()::text,'-',''),1,6))
where join_code is null;
