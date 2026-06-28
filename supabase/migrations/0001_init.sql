-- SafeNote Phase 0 — 초기 스키마
-- 실행: Supabase SQL Editor 또는 `supabase db push`
-- 데이터 모델은 Phase 0 스펙 그대로. RULE DATA(obligations, hazard_seeds)는 사람이 큐레이션해 시드 주입.

create extension if not exists "pgvector";
create extension if not exists "pgcrypto";

-- ───────────────────────── 사업장
create table if not exists workspaces (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references auth.users (id) on delete set null,
  name          text not null,
  industry_code text not null,
  worker_count  int  not null check (worker_count >= 0),
  size_band     text not null check (size_band in ('1-9', '10-49')),
  created_at     timestamptz not null default now()
);

-- ───────────────────────── 의무 마스터 (RULE DATA · 시드)
-- code = 시행령 제4조 항목
create table if not exists obligations (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null,
  title             text not null,
  description       text not null,
  required_evidence text not null,
  applies_to        jsonb not null default '{}'::jsonb, -- 규모/업종 조건
  sort_order        int not null default 0
);

-- ───────────────────────── 업종·공정별 표준 유해위험요인 (RULE DATA · 시드)
create table if not exists hazard_seeds (
  id               uuid primary key default gen_random_uuid(),
  industry_code    text not null,
  process_keyword  text not null,
  hazard           text not null,
  default_measures jsonb not null default '[]'::jsonb
);
create index if not exists hazard_seeds_lookup
  on hazard_seeds (industry_code, process_keyword);

-- ───────────────────────── 업종 마스터 (UI 선택용)
create table if not exists industries (
  code  text primary key,
  name  text not null,
  sort_order int not null default 0
);

-- ───────────────────────── 면책 자가진단 (모듈 A)
create table if not exists diagnoses (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces (id) on delete cascade,
  industry_code text,
  size_band     text,
  answers      jsonb not null default '{}'::jsonb,
  gap_score    int   not null default 0, -- rule 산출 이행률(0~100)
  report       jsonb not null default '{}'::jsonb,
  lead_contact jsonb,                    -- 이메일 캡처(리드)
  created_at    timestamptz not null default now()
);

-- ───────────────────────── 위험성평가 (모듈 B)
create table if not exists risk_assessments (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces (id) on delete cascade,
  process      text not null,
  -- items: {hazard, frequency, severity, risk_level, measure, owner, due, source_chunk_id, needs_expert_review}
  items        jsonb not null default '[]'::jsonb,
  status       text not null default 'draft' check (status in ('draft', 'confirmed')),
  source_refs  jsonb not null default '[]'::jsonb,
  confirmed_at timestamptz,
  confirmed_by uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);

-- ───────────────────────── RAG 코퍼스 (KOSHA 가이드/시행령)
-- voyage-3 임베딩 차원 = 1024
create table if not exists regulation_chunks (
  id         uuid primary key default gen_random_uuid(),
  source     text not null,
  title      text not null,
  content    text not null,
  industry_code text,                 -- 업종 필터(선택)
  embedding  vector(1024),
  created_at  timestamptz not null default now()
);
create index if not exists regulation_chunks_embedding
  on regulation_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
