"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { AdminRole } from "@/lib/admin";

const LINKS: { href: string; label: string; superOnly?: boolean }[] = [
  { href: "/admin", label: "개요" },
  { href: "/admin/leads", label: "리드·진단" },
  { href: "/admin/risk", label: "위험성평가" },
  { href: "/admin/workspaces", label: "사업장" },
  { href: "/admin/rules", label: "규정 데이터" },
  { href: "/admin/admins", label: "관리자 관리", superOnly: true },
];

export function AdminNav({ email, role }: { email: string; role: AdminRole }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await getBrowserSupabase().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const visible = LINKS.filter((l) => !l.superOnly || role === "super");

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* 상단: 로고 + 계정/로그아웃 */}
        <div className="flex items-center justify-between gap-2 py-2.5">
          <Link href="/admin" className="text-sm font-bold text-ink">
            세이프노트 <span className="text-safe">Admin</span>
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden min-w-0 items-center gap-1.5 truncate text-xs text-muted sm:flex">
              <span className="num truncate">{email}</span>
              <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px]">
                {role === "super" ? "총괄관리자" : "관리자"}
              </span>
            </span>
            <button
              onClick={logout}
              className="shrink-0 rounded-md border border-border px-3 py-1.5 text-sm text-ink hover:bg-surface"
            >
              로그아웃
            </button>
          </div>
        </div>
        {/* 하단: 가로 스크롤 탭 (모바일 대응) */}
        <nav className="-mx-1 flex gap-1 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visible.map((l) => {
            const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active ? "bg-safe/10 font-semibold text-safe" : "text-muted hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
