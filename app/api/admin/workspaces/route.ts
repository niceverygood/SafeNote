import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin";
import { getServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  industry_code: z.string().trim().min(1).max(60),
  size_band: z.enum(["1-9", "10-49"]),
  worker_count: z.number().int().min(0).max(100000),
});

/** 6자리 대문자/숫자 참여코드 생성 (혼동 문자 제외) */
function genJoinCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

/** 사업장 생성 (관리자 전용) */
export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });

  const db = getServiceSupabase();

  // 고유 참여코드 생성 — 중복이면 재시도
  let joinCode = "";
  let id: string | null = null;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 8; attempt++) {
    joinCode = genJoinCode();
    const { data, error } = await db
      .from("workspaces")
      .insert({
        owner_id: null,
        name: parsed.data.name,
        industry_code: parsed.data.industry_code,
        size_band: parsed.data.size_band,
        worker_count: parsed.data.worker_count,
        join_code: joinCode,
      })
      .select("id")
      .single();

    if (!error && data) {
      id = data.id as string;
      break;
    }

    // 23505 = unique_violation → 참여코드 재생성
    if (error?.code === "23505") {
      lastError = error.message;
      continue;
    }

    return NextResponse.json({ error: error?.message ?? "생성 실패" }, { status: 500 });
  }

  if (!id)
    return NextResponse.json(
      { error: lastError ?? "참여코드 생성에 실패했습니다. 다시 시도해 주세요." },
      { status: 500 }
    );

  return NextResponse.json({ ok: true, id, join_code: joinCode });
}
