-- 근로자 아이디/비밀번호 로그인
alter table workers add column if not exists username text unique;
alter table workers add column if not exists password_hash text;  -- scrypt: salt:hash
