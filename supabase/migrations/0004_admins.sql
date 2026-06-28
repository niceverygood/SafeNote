-- SafeNote — 관리자 허용목록
-- role: super(총괄관리자, 관리자 관리 가능) / admin(콘솔 열람·운영)
-- 클라이언트 직접 접근 차단(서버 service_role 전용). 권한 판정은 서버에서만.

create table if not exists admins (
  email      text primary key,
  role       text not null default 'admin' check (role in ('super', 'admin')),
  note       text,
  created_at  timestamptz not null default now()
);

alter table admins enable row level security;
-- 정책 없음 → anon/authenticated 직접 접근 불가. 서버(service_role)만 접근.

-- 총괄관리자 시드
insert into admins (email, role, note)
values ('dev@bottlecorp.kr', 'super', '총괄관리자 (초기 시드)')
on conflict (email) do update set role = excluded.role;
