import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/server";
import { buildHash, lastHash } from "@/lib/hashchain";

export const runtime = "nodejs";

const Schema = z.object({
  workspace_id: z.string().uuid(),
  worker_id: z.string().uuid().optional(),
  worker_name: z.string().min(1).max(60),
  description: z.string().min(1, "내용을 입력하세요.").max(1000),
  severity: z.enum(["low", "medium", "high"]).default("medium"),
  location: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값 오류" },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const db = getServiceSupabase();
  const created_at = new Date().toISOString();

  const prev = await lastHash(db, "hazard_reports", d.workspace_id);
  const hash = buildHash(prev, {
    workspace_id: d.workspace_id,
    worker_name: d.worker_name,
    description: d.description,
    severity: d.severity,
    location: d.location ?? null,
    created_at,
  });

  const { data, error } = await db
    .from("hazard_reports")
    .insert({
      workspace_id: d.workspace_id,
      worker_id: d.worker_id ?? null,
      worker_name: d.worker_name,
      description: d.description,
      severity: d.severity,
      location: d.location ?? null,
      status: "open",
      prev_hash: prev,
      hash,
      created_at,
    })
    .select("id, created_at")
    .single();

  if (error) return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  return NextResponse.json({ ok: true, ...data });
}
