import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** 근로자용: 안전보건교육 목록 + 본인 이수 여부 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace_id");
  const workerId = searchParams.get("worker_id");
  if (!workspaceId) return NextResponse.json({ error: "workspace_id 필요" }, { status: 400 });

  const db = getServiceSupabase();
  const [{ data: trainings }, { data: acks }] = await Promise.all([
    db
      .from("trainings")
      .select("id, title, body, training_type, material_url, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(10),
    workerId
      ? db.from("training_acks").select("training_id, created_at").eq("worker_id", workerId)
      : Promise.resolve({ data: [] as { training_id: string; created_at: string }[] }),
  ]);

  const ackMap = new Map((acks ?? []).map((a) => [a.training_id as string, a.created_at as string]));
  const rows = (trainings ?? []).map((t) => ({
    ...t,
    acked_at: ackMap.get(t.id as string) ?? null,
  }));
  return NextResponse.json({ trainings: rows });
}
