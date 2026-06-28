/**
 * RAG retrieve: 업종/공정 키워드 + 시맨틱 하이브리드.
 * 서버 전용 (service_role).
 */
import { getServiceSupabase } from "@/lib/supabase/server";
import { embedOne } from "./embed";

export interface RetrievedChunk {
  id: string;
  source: string;
  title: string;
  content: string;
  industry_code: string | null;
  similarity: number;
}

export async function retrieveChunks(params: {
  industry_code: string;
  process: string;
  matchCount?: number;
}): Promise<RetrievedChunk[]> {
  const { industry_code, process, matchCount = 6 } = params;
  const query = `${industry_code} ${process} 유해위험요인 감소대책`;
  const embedding = await embedOne(query, "query");

  const db = getServiceSupabase();
  const { data, error } = await db.rpc("match_regulation_chunks", {
    query_embedding: embedding as unknown as string,
    match_count: matchCount,
    filter_industry: industry_code,
  });
  if (error) throw error;
  return (data ?? []) as RetrievedChunk[];
}
