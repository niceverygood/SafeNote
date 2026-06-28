import { redirect } from "next/navigation";
import { getAdmin, getSessionEmail } from "@/lib/admin";
import { AdminNav } from "@/components/admin/AdminNav";
import { Disclaimer } from "@/components/ds/Disclaimer";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdmin();

  if (!admin) {
    const email = await getSessionEmail();
    // 로그인했지만 관리자 아님 → 접근 거부
    if (email) {
      return (
        <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
          <h1 className="text-xl font-bold text-ink">접근 권한이 없습니다</h1>
          <p className="mt-2 text-sm text-muted">
            <span className="num">{email}</span> 계정은 관리자 허용목록에 없습니다.
            총괄관리자에게 권한 부여를 요청하세요.
          </p>
          <a href="/admin/login" className="mt-6 text-sm font-medium text-safe hover:underline">
            다른 계정으로 로그인
          </a>
        </main>
      );
    }
    // 미로그인 → 로그인 페이지 (미들웨어에서도 차단하지만 이중 안전장치)
    redirect("/admin/login");
  }

  return (
    <div className="min-h-dvh bg-surface">
      <AdminNav email={admin.email} role={admin.role} />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-6 pb-10">
        <Disclaimer />
      </footer>
    </div>
  );
}
