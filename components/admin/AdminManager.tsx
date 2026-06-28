"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminRole } from "@/lib/admin";

interface Row {
  email: string;
  role: AdminRole;
  note: string | null;
  created_at: string;
}

export function AdminManager({ rows, selfEmail }: { rows: Row[]; selfEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("admin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "추가 실패");
      return;
    }
    setEmail("");
    setRole("admin");
    router.refresh();
  }

  async function remove(target: string) {
    if (!confirm(`${target} 관리자를 제거할까요?`)) return;
    const res = await fetch("/api/admin/admins", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: target }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "제거 실패");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-white p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-ink" htmlFor="ae">관리자 이메일</label>
          <input
            id="ae"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.kr"
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-safe"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink" htmlFor="ar">권한</label>
          <select
            id="ar"
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-safe"
          >
            <option value="admin">관리자</option>
            <option value="super">총괄관리자</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-safe px-4 py-2 text-sm font-semibold text-white hover:bg-safe-hover disabled:opacity-60"
        >
          {busy ? "추가 중…" : "관리자 추가"}
        </button>
        {error && <p className="w-full text-sm text-danger">{error}</p>}
      </form>

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">이메일</th>
              <th className="px-4 py-2.5 font-medium">권한</th>
              <th className="px-4 py-2.5 font-medium">메모</th>
              <th className="px-4 py-2.5 font-medium text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.email} className="border-b border-border last:border-0">
                <td className="px-4 py-3 num text-ink">{r.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded border px-2 py-0.5 text-xs font-medium ${
                      r.role === "super"
                        ? "border-safe/30 bg-safe/10 text-safe"
                        : "border-border text-muted"
                    }`}
                  >
                    {r.role === "super" ? "총괄관리자" : "관리자"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{r.note || "—"}</td>
                <td className="px-4 py-3 text-right">
                  {r.email.toLowerCase() === selfEmail.toLowerCase() ? (
                    <span className="text-xs text-muted">본인</span>
                  ) : (
                    <button
                      onClick={() => remove(r.email)}
                      className="text-xs font-medium text-danger hover:underline"
                    >
                      제거
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
