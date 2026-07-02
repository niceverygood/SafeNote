import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin";
import { getServiceSupabase } from "@/lib/supabase/server";
import { buildHash, lastHash } from "@/lib/hashchain";

export const runtime = "nodejs";

const Schema = z.object({
  workspace_id: z.string().uuid(),
  budget_item_id: z.string().uuid(),
  amount: z.number().int().min(1).max(1_000_000_000_000),
  note: z.string().trim().max(300).optional(),
  receipt_data: z.string().min(10).optional(), // data URL (data:image/...;base64,....)
});

/** 예산 집행 기록 (관리자) — 집행 즉시 불변 체인 + 영수증 사진 */
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

  // 집행 대상 항목이 이 사업장 예산인지 확인
  const { data: item } = await db
    .from("budget_items")
    .select("id")
    .eq("id", d.budget_item_id)
    .eq("workspace_id", d.workspace_id)
    .maybeSingle();
  if (!item) return NextResponse.json({ error: "예산 항목을 찾을 수 없습니다." }, { status: 404 });

  // 영수증 업로드 (선택)
  let receipt_url: string | null = null;
  if (d.receipt_data) {
    const m = d.receipt_data.match(/^data:(image\/(png|jpe?g|webp));base64,(.+)$/);
    if (!m) return NextResponse.json({ error: "이미지 형식(JPG/PNG/WEBP)만 허용됩니다." }, { status: 400 });
    const contentType = m[1];
    const ext = contentType.split("/")[1].replace("jpeg", "jpg");
    const buffer = Buffer.from(m[3], "base64");
    if (buffer.length > 6 * 1024 * 1024)
      return NextResponse.json({ error: "사진은 6MB 이하만 가능합니다." }, { status: 400 });
    const path = `${d.workspace_id}/${Date.now()}-${buffer.length}.${ext}`;
    const { error: upErr } = await db.storage.from("receipts").upload(path, buffer, {
      contentType,
      upsert: false,
    });
    if (upErr) return NextResponse.json({ error: "영수증 업로드 실패" }, { status: 500 });
    receipt_url = db.storage.from("receipts").getPublicUrl(path).data.publicUrl;
  }

  const created_at = new Date().toISOString();
  const prev = await lastHash(db, "budget_executions", d.workspace_id);
  const hash = buildHash(prev, {
    workspace_id: d.workspace_id,
    budget_item_id: d.budget_item_id,
    amount: d.amount,
    note: d.note ?? null,
    receipt_url,
    executed_by: admin.email,
    created_at,
  });

  const { error } = await db.from("budget_executions").insert({
    workspace_id: d.workspace_id,
    budget_item_id: d.budget_item_id,
    amount: d.amount,
    note: d.note ?? null,
    receipt_url,
    executed_by: admin.email,
    prev_hash: prev,
    hash,
    created_at,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, hash });
}
