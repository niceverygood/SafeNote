-- SafeNote Phase 0 — RAG 검색 RPC
-- 업종 필터 + 시맨틱(코사인) 하이브리드. 서버에서 service_role로 호출.

create or replace function match_regulation_chunks(
  query_embedding vector(1024),
  match_count int default 6,
  filter_industry text default null
)
returns table (
  id uuid,
  source text,
  title text,
  content text,
  industry_code text,
  similarity float
)
language sql stable
as $$
  select
    rc.id,
    rc.source,
    rc.title,
    rc.content,
    rc.industry_code,
    1 - (rc.embedding <=> query_embedding) as similarity
  from regulation_chunks rc
  where rc.embedding is not null
    and (filter_industry is null
         or rc.industry_code is null
         or rc.industry_code = filter_industry)
  order by rc.embedding <=> query_embedding
  limit match_count;
$$;
