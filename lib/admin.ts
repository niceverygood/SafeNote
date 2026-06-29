import { getServerSupabase, getServiceSupabase } from "@/lib/supabase/server";

export type AdminRole = "super" | "admin";
export interface AdminInfo {
  email: string;
  role: AdminRole;
}

/** 로그인 사용자(이메일)가 admins 허용목록에 있으면 그 정보 반환 */
export async function getAdmin(): Promise<AdminInfo | null> {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const db = getServiceSupabase();
  const { data } = await db
    .from("admins")
    .select("email, role")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (!data) return null;
  return { email: data.email, role: data.role as AdminRole };
}

export async function getSessionEmail(): Promise<string | null> {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}
