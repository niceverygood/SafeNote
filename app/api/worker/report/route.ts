import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/server";
import { buildHash, lastHash } from "@/lib/hashchain";
import { sendSms } from "@/lib/notify";

export const runtime = "nodejs";

const Schema = z.object({
  workspace_id: z.string().uuid(),
  worker_id: z.string().uuid().optional(),
  worker_name: z.string().min(1).max(60),
  description: z.string().min(1, "내용을 입력하세요.").max(1000),
  report_type: z.enum(["hazard", "near_miss"]).default("hazard"),
  severity: z.enum(["low", "medium", "high"]).default("medium"),
  location: z.string().max(120).optional(),
  photo_url: z.string().url().optional(),
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

  const prev = await lastHash(db, "hazard_reports", d.workspace_id);
  const hash = buildHash(prev, {
    workspace_id: d.workspace_id,
    worker_name: d.worker_name,
    description: d.description,
    report_type: d.report_type,
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
      report_type: d.report_type,
      severity: d.severity,
      location: d.location ?? null,
      photo_url: d.photo_url ?? null,
      lat: d.lat ?? null,
      lng: d.lng ?? null,
      status: "open",
      prev_hash: prev,
      hash,
      created_at,
    })
    .select("id, created_at")
    .single();

  if (error) return NextResponse.json({ error: "저장 실패" }, { status: 500 });

  // 실시간 알림: 위험도 '높음'이면 관리자에게 SMS (키 없으면 스킵)
  if (d.severity === "high") {
    const { data: ws } = await db
      .from("workspaces")
      .select("name, notify_phone")
      .eq("id", d.workspace_id)
      .maybeSingle();
    if (ws?.notify_phone) {
      const loc = d.location ? ` (${d.location})` : "";
      await sendSms(
        ws.notify_phone,
        `[세이프노트] ${ws.name} 위험 신고(높음)${loc}\n${d.worker_name}: ${d.description.slice(0, 60)}`
      );
    }
  }

  return NextResponse.json({ ok: true, ...data });
}
