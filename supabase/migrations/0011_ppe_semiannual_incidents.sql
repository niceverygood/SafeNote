-- SafeNote — 보호구 지급 대장 · 반기 점검 기록 · 사고 대응 플레이북
-- 목적: 사업자(지급·점검·대응 의무 이행 입증) / 근로자(보호구 착용·신속 대응)

-- 보호구 지급 (지급 = 불변 체인, 수령 서명은 추가 필드)
create table if not exists ppe_issues (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces (id) on delete cascade,
  worker_id     uuid references workers (id) on delete set null,
  worker_name   text not null,
  item          text not null,
  quantity      int not null default 1 check (quantity > 0),
  issued_by     text,
  ack_at        timestamptz,
  ack_signature text,
  prev_hash     text,
  hash          text not null,
  created_at     timestamptz not null default now()
);
create index if not exists ppe_issues_ws on ppe_issues (workspace_id, created_at desc);
create index if not exists ppe_issues_worker on ppe_issues (worker_id, created_at desc);

-- 반기 점검 (제4조 '반기 1회 점검' 기록 — 저장 즉시 불변)
create table if not exists semiannual_reviews (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  period       text not null,                 -- 예: 2026-상반기
  items        jsonb not null default '[]'::jsonb, -- [{label, checked, note}]
  reviewer     text not null,
  note         text,
  prev_hash    text,
  hash         text not null,
  created_at    timestamptz not null default now()
);
create index if not exists semiannual_ws on semiannual_reviews (workspace_id, created_at desc);

-- 사고 대응 (헤더 + 조치 이벤트 불변 체인)
create table if not exists incidents (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  occurred_at  timestamptz not null,
  location     text,
  description  text not null,
  severity     text not null default 'serious' check (severity in ('minor','serious','fatal')),
  status       text not null default 'open' check (status in ('open','closed')),
  closed_at    timestamptz,
  created_by   text,
  created_at    timestamptz not null default now()
);
create index if not exists incidents_ws on incidents (workspace_id, created_at desc);

create table if not exists incident_events (
  id           uuid primary key default gen_random_uuid(),
  incident_id  uuid not null references incidents (id) on delete cascade,
  workspace_id uuid not null references workspaces (id) on delete cascade,
  label        text not null,
  note         text,
  prev_hash    text,
  hash         text not null,
  created_at    timestamptz not null default now()
);
create index if not exists incident_events_ws on incident_events (workspace_id, created_at asc);

alter table ppe_issues         enable row level security;
alter table semiannual_reviews enable row level security;
alter table incidents          enable row level security;
alter table incident_events    enable row level security;
-- 정책 없음 → 서버(service_role) 전용
