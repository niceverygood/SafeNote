import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin";
import { getServiceSupabase } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/workerauth";

export const runtime = "nodejs";

const CreateSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().trim().min(1, "이름을 입력하세요.").max(60),
  username: z.string().trim().min(3, "아이디는 3자 이상.").max(40).regex(/^[a-zA-Z0-9_.-]+$/, "아이디는 영문/숫자/._- 만 가능."),
  password: z.string().min(4, "비밀번호는 4자 이상.").max(100),
});

const UpdateSchema = z.object({
  id: z.string().uuid(),
  username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9_.-]+$/).optional(),
  password: z.string().min(4).max(100).optional(),
});

/** 근로자 계정 발급 (관리자) */
export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });

  const db = getServiceSupabase();
  const username = parsed.data.username.toLowerCase();
  const { data: dup } = await db.from("workers").select("id").eq("username", username).maybeSingle();
  if (dup) return NextResponse.json({ error: "이미 사용 중인 아이디입니다." }, { status: 409 });

  const { error } = await db.from("workers").insert({
    workspace_id: parsed.data.workspace_id,
    name: parsed.data.name,
    username,
    password_hash: hashPassword(parsed.data.password),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, username, password: parsed.data.password });
}

/** 근로자 계정 정보 변경/비번 재설정 (관리자) */
export async function PATCH(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = UpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });

  const db = getServiceSupabase();
  const patch: Record<string, string> = {};
  if (parsed.data.username) {
    const username = parsed.data.username.toLowerCase();
    const { data: dup } = await db
      .from("workers")
      .select("id")
      .eq("username", username)
      .neq("id", parsed.data.id)
      .maybeSingle();
    if (dup) return NextResponse.json({ error: "이미 사용 중인 아이디입니다." }, { status: 409 });
    patch.username = username;
  }
  if (parsed.data.password) patch.password_hash = hashPassword(parsed.data.password);
  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: "변경할 내용이 없습니다." }, { status: 400 });

  const { error } = await db.from("workers").update(patch).eq("id", parsed.data.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, ...(parsed.data.password ? { password: parsed.data.password } : {}) });
}
