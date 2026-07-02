import { NextResponse } from "next/server";
import { getServerSupabase, getServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

// 데모·영업 소개용 임시 테스트 로그인 — NEXT_PUBLIC_ENABLE_TEST_LOGIN=true 일 때만 동작.
// 운영 전환 시 환경변수를 false로 바꾸면 버튼·엔드포인트가 함께 비활성화된다.
const enabled = () => process.env.NEXT_PUBLIC_ENABLE_TEST_LOGIN === "true";

/** 관리자 테스트 로그인 — 세션 쿠키 설정 후 /admin 으로 리다이렉트 */
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  if (!enabled()) return NextResponse.redirect(`${origin}/admin/login`);

  const email = process.env.DEMO_ADMIN_EMAIL;
  const password = process.env.DEMO_ADMIN_PASSWORD;
  if (!email || !password)
    return NextResponse.redirect(`${origin}/admin/login?error=demo_config`);

  const supabase = getServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return NextResponse.redirect(`${origin}/admin/login?error=demo_login`);
  return NextResponse.redirect(`${origin}/admin`);
}

/** 근로자 테스트 로그인 — 데모 계정 세션 반환 (근로자 앱은 localStorage 세션) */
export async function POST() {
  if (!enabled()) return NextResponse.json({ error: "disabled" }, { status: 404 });

  const username = process.env.DEMO_WORKER_USERNAME;
  if (!username)
    return NextResponse.json({ error: "DEMO_WORKER_USERNAME 환경변수를 설정하세요." }, { status: 500 });

  const db = getServiceSupabase();
  const { data: worker } = await db
    .from("workers")
    .select("id, name, workspace_id")
    .eq("username", username.trim().toLowerCase())
    .maybeSingle();
  if (!worker)
    return NextResponse.json({ error: "데모 근로자 계정을 찾을 수 없습니다." }, { status: 404 });

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
