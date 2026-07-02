import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** 근로자용: 내 보호구 지급 내역 (수령 서명 여부 포함) */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace_id");
  const workerId = searchParams.get("worker_id");
  if (!workspaceId || !workerId)
    return NextResponse.json({ error: "workspace_id·worker_id 필요" }, { status: 400 });

  const db = getServiceSupabase();
  const { data } = await db
    .from("ppe_issues")
    .select("id, item, quantity, created_at, ack_at")
    .eq("workspace_id", workspaceId)
    .eq("worker_id", workerId)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ issues: data ?? [] });
}
