import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 해시 체인 연결 무결성 검증.
 * 각 기록의 prev_hash가 직전 기록의 hash와 일치하는지(삽입·삭제·순서변경 탐지) 확인한다.
 */
export interface ChainResult {
  table: string;
  total: number;
  ok: boolean;
  brokenAt: number | null; // 끊긴 기록의 순번(1-base)
}

export async function verifyChain(
  db: SupabaseClient,
  table:
    | "safety_checks"
    | "hazard_reports"
    | "notice_acks"
    | "ppe_issues"
    | "semiannual_reviews"
    | "incident_events"
    | "budget_executions"
    | "training_acks",
  workspaceId: string
): Promise<ChainResult> {
  const { data } = await db
    .from(table)
    .select("hash, prev_hash, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as { hash: string; prev_hash: string | null }[];
  let prev: string | null = null;
  for (let i = 0; i < rows.length; i++) {
    // 첫 기록은 prev_hash가 null(GENESIS)이어야 하고, 이후는 직전 hash와 연결되어야 함
    if ((rows[i].prev_hash ?? null) !== prev) {
      return { table, total: rows.length, ok: false, brokenAt: i + 1 };
    }
    prev = rows[i].hash;
  }
  return { table, total: rows.length, ok: true, brokenAt: null };
}
