import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin";
import { getServiceSupabase } from "@/lib/supabase/server";
import { buildHash, lastHash } from "@/lib/hashchain";

export const runtime = "nodejs";

const Schema = z.object({
  workspace_id: z.string().uuid(),
  period: z.string().trim().min(1, "점검 기간을 입력하세요.").max(40),
  items: z
    .array(z.object({ label: z.string().min(1), checked: z.boolean(), note: z.string().max(300).optional() }))
    .min(1, "점검 항목이 필요합니다."),
  note: z.string().max(1000).optional(),
});

/** 반기 점검 기록 (제4조 '반기 1회 점검' 이행 증빙) — 저장 즉시 불변 체인 */
export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });
  if (admin.role !== "super" && admin.workspaceId !== parsed.data.workspace_id)
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const d = parsed.data;
  const db = getServiceSupabase();
  const created_at = new Date().toISOString();
  const prev = await lastHash(db, "semiannual_reviews", d.workspace_id);
  const hash = buildHash(prev, {
    workspace_id: d.workspace_id,
    period: d.period,
    items: d.items,
    reviewer: admin.email,
    note: d.note ?? null,
    created_at,
  });

  const { error } = await db.from("semiannual_reviews").insert({
    workspace_id: d.workspace_id,
    period: d.period,
    items: d.items,
    reviewer: admin.email,
    note: d.note ?? null,
    prev_hash: prev,
    hash,
    created_at,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
