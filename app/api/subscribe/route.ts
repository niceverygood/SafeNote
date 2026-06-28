import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/server";
import { addStibeeSubscriber } from "@/lib/stibee";

export const runtime = "nodejs";

const Schema = z.object({
  email: z.string().email("이메일 형식이 올바르지 않습니다."),
  name: z.string().max(60).optional(),
  phone: z.string().max(30).optional(),
  company: z.string().max(120).optional(),
  plan: z.enum(["standard", "pro", "enterprise", "unknown"]).default("unknown"),
  message: z.string().max(1000).optional(),
  source: z.string().max(40).optional(),
  ref: z.string().max(60).optional(),
});

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값 오류" },
      { status: 400 }
    );
  }
  const db = getServiceSupabase();
  const { error } = await db.from("subscription_inquiries").insert({
    ...parsed.data,
    source: parsed.data.source ?? "pricing",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // 너처링 리스트 자동 등록(키 없으면 스킵)
  await addStibeeSubscriber({
    email: parsed.data.email,
    name: parsed.data.name,
    phone: parsed.data.phone,
    fields: {
      company: parsed.data.company ?? "",
      plan: parsed.data.plan,
      source: parsed.data.source ?? "pricing",
    },
  });
  return NextResponse.json({ ok: true });
}
