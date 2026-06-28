-- SafeNote Phase 0 — RLS 정책
-- 서버 API 라우트는 service_role 키로 RLS를 우회한다(익명 자가진단·RAG·임베딩).
-- 클라이언트(anon/authenticated) 직접 접근은 아래 정책으로만 허용.

-- 참조 테이블: 누구나 읽기 가능, 쓰기는 서버(service_role)만
alter table industries     enable row level security;
alter table obligations    enable row level security;
alter table hazard_seeds   enable row level security;

drop policy if exists "ref read industries" on industries;
create policy "ref read industries" on industries for select using (true);

drop policy if exists "ref read obligations" on obligations;
create policy "ref read obligations" on obligations for select using (true);

drop policy if exists "ref read hazard_seeds" on hazard_seeds;
create policy "ref read hazard_seeds" on hazard_seeds for select using (true);

-- RAG 코퍼스: 클라이언트 직접 접근 차단 (서버 service_role 전용)
alter table regulation_chunks enable row level security;

-- 사용자 소유 데이터: 본인 워크스페이스만
alter table workspaces       enable row level security;
alter table diagnoses        enable row level security;
alter table risk_assessments enable row level security;

drop policy if exists "own workspaces" on workspaces;
create policy "own workspaces" on workspaces
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "own diagnoses" on diagnoses;
create policy "own diagnoses" on diagnoses
  for all using (
    workspace_id in (select id from workspaces where owner_id = auth.uid())
  ) with check (
    workspace_id in (select id from workspaces where owner_id = auth.uid())
  );

drop policy if exists "own risk_assessments" on risk_assessments;
create policy "own risk_assessments" on risk_assessments
  for all using (
    workspace_id in (select id from workspaces where owner_id = auth.uid())
  ) with check (
    workspace_id in (select id from workspaces where owner_id = auth.uid())
  );
