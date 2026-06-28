import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin";
import { getServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const AddSchema = z.object({
  email: z.string().email(),
  role: z.enum(["super", "admin"]).default("admin"),
  note: z.string().max(200).optional(),
});

/** 관리자 추가 (총괄관리자 전용) */
export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (admin.role !== "super")
    return NextResponse.json({ error: "총괄관리자만 가능합니다." }, { status: 403 });

  const parsed = AddSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "이메일/권한이 올바르지 않습니다." }, { status: 400 });

  const db = getServiceSupabase();
  const { error } = await db.from("admins").upsert(
    {
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      note: parsed.data.note ?? null,
    },
    { onConflict: "email" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** 관리자 제거 (총괄관리자 전용, 본인 계정은 제거 불가) */
export async function DELETE(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (admin.role !== "super")
    return NextResponse.json({ error: "총괄관리자만 가능합니다." }, { status: 403 });

  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (!email) return NextResponse.json({ error: "email 필요" }, { status: 400 });
  if (email.toLowerCase() === admin.email.toLowerCase())
    return NextResponse.json({ error: "본인 계정은 제거할 수 없습니다." }, { status: 400 });

  const db = getServiceSupabase();
  const { error } = await db.from("admins").delete().eq("email", email.toLowerCase());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
