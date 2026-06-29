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
  { href: "/admin/subscriptions", label: "구독 문의" },
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

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="text-sm font-bold text-ink">
            세이프노트 <span className="text-safe">Admin</span>
          </Link>
          <nav className="flex items-center gap-1">
            {LINKS.filter((l) => !l.superOnly || role === "super").map((l) => {
              const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    active ? "bg-safe/10 font-semibold text-safe" : "text-muted hover:text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted sm:inline">
            {email}
            <span className="ml-2 rounded border border-border px-1.5 py-0.5 num text-[10px] uppercase">
              {role === "super" ? "총괄관리자" : "관리자"}
            </span>
          </span>
          <button
            onClick={logout}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-ink hover:bg-surface"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
