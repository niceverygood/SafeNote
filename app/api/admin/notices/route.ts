import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin";
import { getServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Schema = z.object({
  workspace_id: z.string().uuid(),
  title: z.string().trim().min(1, "제목을 입력하세요.").max(120),
  body: z.string().trim().min(1, "내용을 입력하세요.").max(2000),
  kind: z.enum(["notice", "education", "alert"]).default("notice"),
});

/** 공지·안전수칙 등록 (관리자 — 자기 사업장만, 총괄은 전체) */
export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });

  if (admin.role !== "super" && admin.workspaceId !== parsed.data.workspace_id)
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const db = getServiceSupabase();
  const { error } = await db.from("notices").insert({
    workspace_id: parsed.data.workspace_id,
    title: parsed.data.title,
    body: parsed.data.body,
    kind: parsed.data.kind,
    created_by: admin.email,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
