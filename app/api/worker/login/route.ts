import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/workerauth";

export const runtime = "nodejs";

const Schema = z.object({
  username: z.string().min(1, "아이디를 입력하세요.").max(60),
  password: z.string().min(1, "비밀번호를 입력하세요.").max(100),
});

/** 근로자 아이디/비밀번호 로그인 */
export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값 오류" },
      { status: 400 }
    );
  }
  const db = getServiceSupabase();
  const { data: worker } = await db
    .from("workers")
    .select("id, name, workspace_id, password_hash")
    .eq("username", parsed.data.username.trim().toLowerCase())
    .maybeSingle();

  if (!worker || !verifyPassword(parsed.data.password, worker.password_hash)) {
    return NextResponse.json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const { data: ws } = await db
    .from("workspaces")
    .select("name, industry_code")
    .eq("id", worker.workspace_id)
    .maybeSingle();

  return NextResponse.json({
    workspace_id: worker.workspace_id,
    workspace_name: ws?.name ?? "사업장",
    industry_code: ws?.industry_code ?? null,
    worker_id: worker.id,
    worker_name: worker.name,
  });
}
