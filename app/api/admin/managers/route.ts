import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin";
import { getServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Schema = z.object({
  workspace_id: z.string().uuid(),
  email: z.string().email("이메일 형식이 올바르지 않습니다."),
  password: z.string().min(6, "비밀번호는 6자 이상."),
});

/** 사업장 관리자 계정 발급 (총괄관리자 전용) — Supabase Auth 계정 생성 + admins 배정 */
export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (admin.role !== "super")
    return NextResponse.json({ error: "총괄관리자만 가능합니다." }, { status: 403 });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const db = getServiceSupabase();

  // Supabase Auth 계정 생성(있으면 비번 갱신)
  const created = await db.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
  });
  if (created.error && /already|exists|registered/i.test(created.error.message)) {
    const list = await db.auth.admin.listUsers();
    const u = list.data.users.find((x) => x.email === email);
    if (u) await db.auth.admin.updateUserById(u.id, { password: parsed.data.password });
  } else if (created.error) {
    return NextResponse.json({ error: created.error.message }, { status: 500 });
  }

  // admins에 관리자(role admin) + 사업장 배정
  const { error } = await db.from("admins").upsert(
    { email, role: "admin", workspace_id: parsed.data.workspace_id, note: "사업장 관리자" },
    { onConflict: "email" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, email });
}
