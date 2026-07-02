-- SafeNote — 안전보건 예산 대장(시행령 제4조 4호) · 안전보건교육 이수 기록(제5조·산안법 29조)
-- 목적: 사업자(예산 편성·집행 입증, 교육 실시·이수 입증) / 근로자(교육 내용 확인)

-- 예산 편성 항목 (연 단위 계획 — 헤더)
create table if not exists budget_items (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references workspaces (id) on delete cascade,
  year           int  not null check (year between 2020 and 2100),
  category       text not null default 'etc'
    check (category in ('ppe','education','facility','inspection','health','etc')),
  label          text not null,
  planned_amount bigint not null default 0 check (planned_amount >= 0),
  created_by     text,
  created_at     timestamptz not null default now()
);
create index if not exists budget_items_ws on budget_items (workspace_id, year desc, created_at desc);

-- 예산 집행 (불변 해시 체인 + 영수증 사진)
create table if not exists budget_executions (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references workspaces (id) on delete cascade,
  budget_item_id uuid not null references budget_items (id) on delete cascade,
  amount         bigint not null check (amount > 0),
  note           text,
  receipt_url    text,
  executed_by    text,
  prev_hash      text,
  hash           text not null,
  created_at     timestamptz not null default now()
);
create index if not exists budget_exec_ws on budget_executions (workspace_id, created_at desc);
create index if not exists budget_exec_item on budget_executions (budget_item_id, created_at desc);

-- 안전보건교육 (정기·채용 시·특별 — 관리자 → 근로자 배포)
create table if not exists trainings (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces (id) on delete cascade,
  training_type text not null default 'regular'
    check (training_type in ('regular','onboarding','special')),
  title         text not null,
  body          text not null,
  material_url  text,
  created_by    text,
  created_at    timestamptz not null default now()
);
create index if not exists trainings_ws on trainings (workspace_id, created_at desc);

-- 교육 이수 확인 서명 — 불변 해시 체인
create table if not exists training_acks (
  id             uuid primary key default gen_random_uuid(),
  training_id    uuid not null references trainings (id) on delete cascade,
  workspace_id   uuid not null references workspaces (id) on delete cascade,
  worker_id      uuid references workers (id) on delete set null,
  worker_name    text not null,
  signature_name text,
  prev_hash      text,
  hash           text not null,
  created_at     timestamptz not null default now(),
  unique (training_id, worker_id)
);
create index if not exists training_acks_ws on training_acks (workspace_id, created_at desc);

-- 영수증 사진 버킷
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

alter table budget_items      enable row level security;
alter table budget_executions enable row level security;
alter table trainings         enable row level security;
alter table training_acks     enable row level security;
-- 정책 없음 → 서버(service_role) 전용
