import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/server";
import { buildHash, lastHash } from "@/lib/hashchain";

export const runtime = "nodejs";

const Schema = z.object({
  workspace_id: z.string().uuid(),
  worker_id: z.string().uuid().optional(),
  worker_name: z.string().min(1).max(60),
  kind: z.enum(["pre", "during", "post"]).default("pre"),
  process: z.string().min(1).max(120),
  hazards: z.array(z.string()).default([]),
  items: z.array(z.object({ label: z.string(), checked: z.boolean() })).default([]),
  acknowledged: z.boolean().default(false),
  signature_name: z.string().max(60).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
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

  const prev = await lastHash(db, "safety_checks", d.workspace_id);
  const hash = buildHash(prev, {
    workspace_id: d.workspace_id,
    worker_name: d.worker_name,
    kind: d.kind,
    process: d.process,
    hazards: d.hazards,
    items: d.items,
    acknowledged: d.acknowledged,
    signature_name: d.signature_name ?? null,
    created_at,
  });

  const { data, error } = await db
    .from("safety_checks")
    .insert({
      workspace_id: d.workspace_id,
      worker_id: d.worker_id ?? null,
      worker_name: d.worker_name,
      process: d.process,
      kind: d.kind,
      hazards: d.hazards,
      items: d.items,
      acknowledged: d.acknowledged,
      signature_name: d.signature_name ?? null,
      lat: d.lat ?? null,
      lng: d.lng ?? null,
      prev_hash: prev,
      hash,
      created_at,
    })
    .select("id, created_at, hash")
    .single();

  if (error) return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  return NextResponse.json({ ok: true, ...data });
}
