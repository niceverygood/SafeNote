import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin";
import { getServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Schema = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "resolved"]),
  resolution: z.string().max(1000).optional(),
});

/** 위험 신고 상태 처리 (관리자 전용) — 발견→개선 루프 종결 기록 */
export async function PATCH(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "입력값 오류" }, { status: 400 });

  const db = getServiceSupabase();
  const { error } = await db
    .from("hazard_reports")
    .update({
      status: parsed.data.status,
      resolution: parsed.data.resolution ?? null,
      resolved_at: parsed.data.status === "resolved" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
