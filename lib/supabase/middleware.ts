import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** 세션 쿠키 갱신 + /admin 미인증 차단 (인가는 admin layout에서 admins 조회로 판정) */
export async function updateSession(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
          toSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;
  const isProtected = path.startsWith("/admin") && path !== "/admin/login";
  // 테스트 로그인 쿠키가 있으면 통과시키고, 실제 검증은 admin 레이아웃(getAdmin)이 수행
  const hasTestCookie =
    process.env.NEXT_PUBLIC_ENABLE_TEST_LOGIN === "true" && !!req.cookies.get("sn_test_admin");
  if (isProtected && !user && !hasTestCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return res;
}
