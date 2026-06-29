import { createHash } from "node:crypto";

/**
 * 위변조 감지용 해시 체인.
 * 각 기록 hash = sha256(prev_hash + 정규화된 payload). 사후 수정 시 체인이 깨져 탐지 가능.
 */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** payload를 키 정렬해 안정적으로 직렬화 후 prevHash와 연결해 해시 */
export function buildHash(prevHash: string | null, payload: unknown): string {
  const canonical = JSON.stringify(payload, Object.keys(payload as object).sort());
  return sha256Hex((prevHash ?? "GENESIS") + "|" + canonical);
}

import type { SupabaseClient } from "@supabase/supabase-js";

/** 해당 워크스페이스의 마지막 기록 hash를 가져옴(체인 연결용) */
export async function lastHash(
  db: SupabaseClient,
  table: "safety_checks" | "hazard_reports",
  workspaceId: string
): Promise<string | null> {
  const { data } = await db
    .from(table)
    .select("hash")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.hash as string | undefined) ?? null;
}
