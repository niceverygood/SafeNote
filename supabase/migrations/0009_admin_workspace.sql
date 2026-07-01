-- 관리자↔사업장 연결. 총괄관리자(super)=바틀 내부(workspace_id null),
-- 관리자(admin)=특정 사업장에 배정되어 그 사업장만 관리.
alter table admins add column if not exists workspace_id uuid references workspaces (id) on delete cascade;

-- 정리: 총괄관리자는 바틀 내부 계정만
update admins set role = 'super', workspace_id = null where email = 'dev@bottlecorp.kr';

-- 테스트/데모 관리자 계정은 베타공장(TEST01)에 배정된 '고객 관리자'로
update admins a
set role = 'admin',
    workspace_id = (select id from workspaces where join_code = 'TEST01')
where a.email in ('test@test.com', 'manager@safenote.test', 'demo@bottlecorp.kr');
