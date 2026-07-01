"use client";

import { useState } from "react";

function genPassword() {
  const a = "abcdefghjkmnpqrstuvwxyz23456789";
  let p = "";
  for (let i = 0; i < 10; i++) p += a[Math.floor(Math.random() * a.length)];
  return p;
}

const input =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-safe";

/** 총괄관리자용: 이 사업장의 관리자 계정 발급 */
export function ManagerCreator({ workspaceId }: { workspaceId: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setIssued(null);
    const res = await fetch("/api/admin/managers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, email, password }),
    });
    setBusy(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(j.error || "발급 실패");
      return;
    }
    setIssued({ email, password });
    setEmail("");
    setPassword("");
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-white p-4">
      <p className="text-sm font-semibold text-ink">관리자 계정 발급 (이 사업장)</p>
      <p className="mt-1 text-xs text-muted">
        발급하면 해당 이메일로 로그인해 이 사업장의 점검 현황·근로자·위험 신고를 관리할 수 있습니다.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input className={input} type="email" placeholder="관리자 이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <div className="flex gap-2">
          <input className={input} placeholder="비밀번호(6자+)" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="button" onClick={() => setPassword(genPassword())} className="shrink-0 rounded-md border border-border px-2 text-xs text-muted hover:bg-surface">
            자동
          </button>
        </div>
        <button type="submit" disabled={busy} className="rounded-md bg-safe px-4 py-2 text-sm font-semibold text-white hover:bg-safe-hover disabled:opacity-60">
          {busy ? "발급 중…" : "발급"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      {issued && (
        <div className="mt-3 rounded-md border border-safe/30 bg-safe/10 p-3 text-sm">
          <p className="font-semibold text-safe">발급 완료 — 관리자에게 전달하세요</p>
          <p className="mt-1 num text-ink">아이디: {issued.email}</p>
          <p className="num text-ink">비밀번호: {issued.password}</p>
          <p className="mt-1 text-xs text-muted">로그인: /admin/login · 비밀번호는 지금만 표시됩니다.</p>
        </div>
      )}
    </form>
  );
}
