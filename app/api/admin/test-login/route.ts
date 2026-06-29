import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServiceSupabase } from "@/lib/supabase/server";
import { TEST_COOKIE, makeTestCookie, testLoginEnabled } from "@/lib/admin";

export const runtime = "nodejs";

const DEMO_EMAIL = "demo@bottlecorp.kr";

/** 테스트 로그인 — 데모 관리자 세션 쿠키 발급 (env-gated) */
export async function POST() {
  if (!testLoginEnabled()) {
    return NextResponse.json({ error: "테스트 로그인이 비활성화되어 있습니다." }, { status: 403 });
  }
  // 데모 계정이 admins에 있는지 보장
  const db = getServiceSupabase();
  await db.from("admins").upsert(
    { email: DEMO_EMAIL, role: "admin", note: "테스트 로그인(사업장 이용자)" },
    { onConflict: "email" }
  );

  cookies().set(TEST_COOKIE, makeTestCookie(DEMO_EMAIL), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24시간
  });
  return NextResponse.json({ ok: true, email: DEMO_EMAIL });
}
