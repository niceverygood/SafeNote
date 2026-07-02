import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin";
import { getServiceSupabase } from "@/lib/supabase/server";
import { buildHash, lastHash } from "@/lib/hashchain";

export const runtime = "nodejs";

const Schema = z.object({
  workspace_id: z.string().uuid(),
  worker_id: z.string().uuid().optional(),
  worker_name: z.string().trim().min(1, "근로자 이름을 입력하세요.").max(60),
  item: z.string().trim().min(1, "품목을 입력하세요.").max(80),
  quantity: z.number().int().min(1).max(999).default(1),
});

/** 보호구 지급 기록 (관리자) — 지급 즉시 불변 체인 */
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
  const prev = await lastHash(db, "ppe_issues", d.workspace_id);
  const hash = buildHash(prev, {
    workspace_id: d.workspace_id,
    worker_name: d.worker_name,
    item: d.item,
    quantity: d.quantity,
    issued_by: admin.email,
    created_at,
  });

  const { error } = await db.from("ppe_issues").insert({
    workspace_id: d.workspace_id,
    worker_id: d.worker_id ?? null,
    worker_name: d.worker_name,
    item: d.item,
    quantity: d.quantity,
    issued_by: admin.email,
    prev_hash: prev,
    hash,
    created_at,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
