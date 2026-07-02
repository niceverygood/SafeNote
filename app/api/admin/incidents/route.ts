import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin";
import { getServiceSupabase } from "@/lib/supabase/server";
import { buildHash, lastHash } from "@/lib/hashchain";

export const runtime = "nodejs";

const CreateSchema = z.object({
  workspace_id: z.string().uuid(),
  occurred_at: z.string().min(4),
  location: z.string().max(120).optional(),
  description: z.string().trim().min(1, "사고 내용을 입력하세요.").max(2000),
  severity: z.enum(["minor", "serious", "fatal"]).default("serious"),
});

const EventSchema = z.object({
  incident_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  label: z.string().trim().min(1, "조치 내용을 입력하세요.").max(120),
  note: z.string().max(1000).optional(),
});

const CloseSchema = z.object({
  incident_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
});

async function guard(workspaceId: string) {
  const admin = await getAdmin();
  if (!admin) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (admin.role !== "super" && admin.workspaceId !== workspaceId)
    return { error: NextResponse.json({ error: "권한이 없습니다." }, { status: 403 }) };
  return { admin };
}

/** 사고 등록 — 등록과 동시에 '사고 인지' 이벤트가 불변 체인으로 남는다 */
export async function POST(req: Request) {
  const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });
  const g = await guard(parsed.data.workspace_id);
  if ("error" in g) return g.error;

  const d = parsed.data;
  const db = getServiceSupabase();
  const { data: incident, error } = await db
    .from("incidents")
    .insert({
      workspace_id: d.workspace_id,
      occurred_at: new Date(d.occurred_at).toISOString(),
      location: d.location ?? null,
      description: d.description,
      severity: d.severity,
      created_by: g.admin.email,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 첫 이벤트: 사고 인지·기록 시작
  const created_at = new Date().toISOString();
  const prev = await lastHash(db, "incident_events", d.workspace_id);
  const hash = buildHash(prev, {
    incident_id: incident.id,
    workspace_id: d.workspace_id,
    label: "사고 인지·기록 시작",
    note: d.description.slice(0, 200),
    created_at,
  });
  await db.from("incident_events").insert({
    incident_id: incident.id,
    workspace_id: d.workspace_id,
    label: "사고 인지·기록 시작",
    note: d.description.slice(0, 200),
    prev_hash: prev,
    hash,
    created_at,
  });

  return NextResponse.json({ ok: true, id: incident.id });
}

/** 조치 이벤트 추가 (작업중지·구호·보고·재발방지 등) — 불변 체인 */
export async function PUT(req: Request) {
  const parsed = EventSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });
  const g = await guard(parsed.data.workspace_id);
  if ("error" in g) return g.error;

  const d = parsed.data;
  const db = getServiceSupabase();
  const created_at = new Date().toISOString();
  const prev = await lastHash(db, "incident_events", d.workspace_id);
  const hash = buildHash(prev, {
    incident_id: d.incident_id,
    workspace_id: d.workspace_id,
    label: d.label,
    note: d.note ?? null,
    created_at,
  });
  const { error } = await db.from("incident_events").insert({
    incident_id: d.incident_id,
    workspace_id: d.workspace_id,
    label: d.label,
    note: d.note ?? null,
    prev_hash: prev,
    hash,
    created_at,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** 사고 종결 */
export async function PATCH(req: Request) {
  const parsed = CloseSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "입력값 오류" }, { status: 400 });
  const g = await guard(parsed.data.workspace_id);
  if ("error" in g) return g.error;

  const db = getServiceSupabase();
  const { error } = await db
    .from("incidents")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", parsed.data.incident_id)
    .eq("workspace_id", parsed.data.workspace_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
