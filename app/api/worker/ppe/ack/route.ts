import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Schema = z.object({
  issue_id: z.string().uuid(),
  worker_id: z.string().uuid(),
  signature_name: z.string().trim().min(1, "이름을 입력하세요.").max(60),
});

/** 근로자 보호구 수령 확인(서명). 지급 기록 자체는 불변 — 수령 서명만 1회 추가. */
export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });

  const db = getServiceSupabase();
  const { data: issue } = await db
    .from("ppe_issues")
    .select("id, worker_id, ack_at")
    .eq("id", parsed.data.issue_id)
    .maybeSingle();

  if (!issue) return NextResponse.json({ error: "지급 내역이 없습니다." }, { status: 404 });
  if (issue.worker_id !== parsed.data.worker_id)
    return NextResponse.json({ error: "본인 지급 내역만 확인할 수 있습니다." }, { status: 403 });
  if (issue.ack_at)
    return NextResponse.json({ error: "이미 수령 확인된 내역입니다." }, { status: 409 });

  const { error } = await db
    .from("ppe_issues")
    .update({ ack_at: new Date().toISOString(), ack_signature: parsed.data.signature_name })
    .eq("id", parsed.data.issue_id)
    .is("ack_at", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
