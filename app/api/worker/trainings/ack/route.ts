import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/server";
import { buildHash, lastHash } from "@/lib/hashchain";

export const runtime = "nodejs";

const Schema = z.object({
  training_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  worker_id: z.string().uuid().optional(),
  worker_name: z.string().min(1).max(60),
  signature_name: z.string().max(60).optional(),
});

/** 교육 이수 확인 서명 (불변 로그 — 교육 실시·이수 증빙) */
export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });

  const d = parsed.data;
  const db = getServiceSupabase();
  const created_at = new Date().toISOString();

  const prev = await lastHash(db, "training_acks", d.workspace_id);
  const hash = buildHash(prev, {
    training_id: d.training_id,
    workspace_id: d.workspace_id,
    worker_name: d.worker_name,
    signature_name: d.signature_name ?? null,
    created_at,
  });

  const { error } = await db.from("training_acks").insert({
    training_id: d.training_id,
    workspace_id: d.workspace_id,
    worker_id: d.worker_id ?? null,
    worker_name: d.worker_name,
    signature_name: d.signature_name ?? d.worker_name,
    prev_hash: prev,
    hash,
    created_at,
  });
  if (error) {
    // 중복 이수 확인은 정상 처리
    if (/duplicate|unique/i.test(error.message)) return NextResponse.json({ ok: true, dup: true });
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, hash });
}
