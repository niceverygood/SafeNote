import { cookies } from "next/headers";
import { createHmac } from "node:crypto";
import { getServerSupabase, getServiceSupabase } from "@/lib/supabase/server";

export type AdminRole = "super" | "admin";
export interface AdminInfo {
  email: string;
  role: AdminRole;
}

export const TEST_COOKIE = "sn_test_admin";

/** 테스트 로그인 활성 여부 (운영 전환 시 false로 끄기) */
export function testLoginEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_TEST_LOGIN === "true";
}

/** 테스트 쿠키 서명 (위조 방지) */
export function signTestEmail(email: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "safenote-dev";
  return createHmac("sha256", secret).update(email.toLowerCase()).digest("hex").slice(0, 32);
}
export function makeTestCookie(email: string): string {
  return `${email.toLowerCase()}|${signTestEmail(email)}`;
}

/** 테스트 쿠키에서 검증된 이메일 추출 (비활성/위조 시 null) */
function readTestEmail(): string | null {
  if (!testLoginEnabled()) return null;
  const raw = cookies().get(TEST_COOKIE)?.value;
  if (!raw) return null;
  const [email, sig] = raw.split("|");
  if (!email || !sig || signTestEmail(email) !== sig) return null;
  return email.toLowerCase();
}

async function currentEmail(): Promise<string | null> {
  const test = readTestEmail();
  if (test) return test;
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}

/** 로그인 이메일이 admins 허용목록에 있으면 그 정보 반환 (테스트 로그인 포함) */
export async function getAdmin(): Promise<AdminInfo | null> {
  const email = await currentEmail();
  if (!email) return null;

  const db = getServiceSupabase();
  const { data } = await db
    .from("admins")
    .select("email, role")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (!data) return null;
  return { email: data.email, role: data.role as AdminRole };
}

export async function getSessionEmail(): Promise<string | null> {
  return currentEmail();
}
