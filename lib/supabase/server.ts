import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** 요청 컨텍스트(쿠키 기반 Auth) — RLS 적용 사용자 클라이언트 */
export function getServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
        try {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component에서 set 호출 시 무시 (미들웨어에서 갱신)
        }
      },
    },
  });
}

/**
 * service_role 클라이언트 — RLS 우회.
 * 익명 자가진단·RAG·임베딩 등 서버 전용 작업에만 사용. 절대 클라이언트로 노출 금지.
 */
export function getServiceSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
