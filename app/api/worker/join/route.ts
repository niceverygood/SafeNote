import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Schema = z.object({
  join_code: z.string().min(4).max(12),
  name: z.string().min(1, "이름을 입력하세요.").max(60),
  phone: z.string().max(30).optional(),
});

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값 오류" },
      { status: 400 }
    );
  }
  const { join_code, name, phone } = parsed.data;
  const db = getServiceSupabase();

  const { data: ws } = await db
    .from("workspaces")
    .select("id, name, industry_code")
    .eq("join_code", join_code.toUpperCase())
    .maybeSingle();
  if (!ws) {
    return NextResponse.json({ error: "참여코드를 확인해 주세요." }, { status: 404 });
  }

  // 같은 사업장에 같은 이름이 있으면 재사용, 없으면 생성
  const { data: existing } = await db
    .from("workers")
    .select("id")
    .eq("workspace_id", ws.id)
    .eq("name", name)
    .maybeSingle();

  let workerId = existing?.id as string | undefined;
  if (!workerId) {
    const { data: created, error } = await db
      .from("workers")
      .insert({ workspace_id: ws.id, name, phone: phone ?? null })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: "등록 실패" }, { status: 500 });
    workerId = created.id;
  }

  return NextResponse.json({
    workspace_id: ws.id,
    workspace_name: ws.name,
    industry_code: ws.industry_code,
    worker_id: workerId,
    worker_name: name,
  });
}
