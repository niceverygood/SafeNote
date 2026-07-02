import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** 근로자용: 사업장 공지 목록 + 본인 확인 여부 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace_id");
  const workerId = searchParams.get("worker_id");
  if (!workspaceId) return NextResponse.json({ error: "workspace_id 필요" }, { status: 400 });

  const db = getServiceSupabase();
  const [{ data: notices }, { data: acks }] = await Promise.all([
    db
      .from("notices")
      .select("id, title, body, kind, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(10),
    workerId
      ? db.from("notice_acks").select("notice_id, created_at").eq("worker_id", workerId)
      : Promise.resolve({ data: [] as { notice_id: string; created_at: string }[] }),
  ]);

  const ackMap = new Map((acks ?? []).map((a) => [a.notice_id as string, a.created_at as string]));
  const rows = (notices ?? []).map((n) => ({
    ...n,
    acked_at: ackMap.get(n.id as string) ?? null,
  }));
  return NextResponse.json({ notices: rows });
}
