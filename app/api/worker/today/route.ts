import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { kstTodayStartISO, STAGE_KEYS, type StageKey } from "@/lib/stages";

export const runtime = "nodejs";

/** 특정 작업자의 오늘 작업 전·중·후 점검 완료 현황 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace_id");
  const workerId = searchParams.get("worker_id");
  const workerName = searchParams.get("worker_name");
  if (!workspaceId) return NextResponse.json({ error: "workspace_id 필요" }, { status: 400 });

  const db = getServiceSupabase();
  let q = db
    .from("safety_checks")
    .select("id, kind, process, created_at")
    .eq("workspace_id", workspaceId)
    .gte("created_at", kstTodayStartISO())
    .order("created_at", { ascending: true });
  if (workerId) q = q.eq("worker_id", workerId);
  else if (workerName) q = q.eq("worker_name", workerName);

  const { data } = await q;
  const status: Record<StageKey, { done: boolean; at: string | null; process: string | null }> = {
    pre: { done: false, at: null, process: null },
    during: { done: false, at: null, process: null },
    post: { done: false, at: null, process: null },
  };
  for (const row of data ?? []) {
    const k = row.kind as StageKey;
    if (STAGE_KEYS.includes(k)) {
      status[k] = { done: true, at: row.created_at as string, process: (row.process as string) ?? null };
    }
  }
  return NextResponse.json({ status });
}
