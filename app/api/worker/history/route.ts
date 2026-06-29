import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** 노동자 본인의 최근 점검·신고 기록 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace_id");
  const workerId = searchParams.get("worker_id");
  const workerName = searchParams.get("worker_name");
  if (!workspaceId) return NextResponse.json({ error: "workspace_id 필요" }, { status: 400 });

  const db = getServiceSupabase();

  let cq = db
    .from("safety_checks")
    .select("id, kind, process, items, acknowledged, hash, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(30);
  let rq = db
    .from("hazard_reports")
    .select("id, description, severity, status, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (workerId) {
    cq = cq.eq("worker_id", workerId);
    rq = rq.eq("worker_id", workerId);
  } else if (workerName) {
    cq = cq.eq("worker_name", workerName);
    rq = rq.eq("worker_name", workerName);
  }

  const [{ data: checks }, { data: reports }] = await Promise.all([cq, rq]);
  return NextResponse.json({ checks: checks ?? [], reports: reports ?? [] });
}
