-- SafeNote Phase 1 풀세트: 알림·사진·위치
alter table workspaces      add column if not exists notify_phone text;   -- 관리자 알림 수신 번호
alter table hazard_reports  add column if not exists photo_url text;       -- 위험 신고 사진
alter table hazard_reports  add column if not exists lat double precision;
alter table hazard_reports  add column if not exists lng double precision;

-- 위험 신고 사진 저장용 공개 버킷 (서버 service_role로 업로드)
insert into storage.buckets (id, name, public)
values ('hazard-photos', 'hazard-photos', true)
on conflict (id) do nothing;
