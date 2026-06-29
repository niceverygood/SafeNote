import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TEST_COOKIE } from "@/lib/admin";

export const runtime = "nodejs";

/** 테스트 로그인 쿠키 제거 */
export async function POST() {
  cookies().delete(TEST_COOKIE);
  return NextResponse.json({ ok: true });
}
