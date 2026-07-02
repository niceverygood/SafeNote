import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin";
import { getServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Schema = z.object({
  workspace_id: z.string().uuid(),
  training_type: z.enum(["regular", "onboarding", "special"]).default("regular"),
  title: z.string().trim().min(1, "교육 제목을 입력하세요.").max(120),
  body: z.string().trim().min(1, "교육 내용을 입력하세요.").max(4000),
  material_url: z.string().trim().url("자료 링크가 올바르지 않습니다.").max(500).optional().or(z.literal("")),
});

/** 안전보건교육 배포 (관리자 — 제5조·산안법 29조) */
export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });
  if (admin.role !== "super" && admin.workspaceId !== parsed.data.workspace_id)
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const db = getServiceSupabase();
  const { error } = await db.from("trainings").insert({
    workspace_id: parsed.data.workspace_id,
    training_type: parsed.data.training_type,
    title: parsed.data.title,
    body: parsed.data.body,
    material_url: parsed.data.material_url || null,
    created_by: admin.email,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
