import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin";
import { getServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Schema = z.object({
  workspace_id: z.string().uuid(),
  year: z.number().int().min(2020).max(2100),
  category: z.enum(["ppe", "education", "facility", "inspection", "health", "etc"]).default("etc"),
  label: z.string().trim().min(1, "예산 항목명을 입력하세요.").max(80),
  planned_amount: z.number().int().min(0).max(1_000_000_000_000),
});

/** 안전보건 예산 항목 편성 (관리자 — 시행령 4조 4호) */
export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값 오류" }, { status: 400 });
  if (admin.role !== "super" && admin.workspaceId !== parsed.data.workspace_id)
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const db = getServiceSupabase();
  const { error } = await db.from("budget_items").insert({
    workspace_id: parsed.data.workspace_id,
    year: parsed.data.year,
    category: parsed.data.category,
    label: parsed.data.label,
    planned_amount: parsed.data.planned_amount,
    created_by: admin.email,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
