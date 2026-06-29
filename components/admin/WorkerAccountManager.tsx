"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface WorkerRow {
  id: string;
  name: string;
  username: string | null;
  created_at: string;
}

function genPassword() {
  const a = "abcdefghjkmnpqrstuvwxyz23456789";
  let p = "";
  for (let i = 0; i < 8; i++) p += a[Math.floor(Math.random() * a.length)];
  return p;
}

const inputCls =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-safe";

export function WorkerAccountManager({
  workspaceId,
  workers,
}: {
  workspaceId: string;
  workers: WorkerRow[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ username: string; password: string } | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setIssued(null);
    const res = await fetch("/api/admin/workers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, name, username, password }),
    });
    setBusy(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(j.error || "발급 실패");
      return;
    }
    setIssued({ username: j.username, password: j.password });
    setName("");
    setUsername("");
    setPassword("");
    router.refresh();
  }

  async function resetPw(id: string, name: string) {
    const pw = genPassword();
    if (!confirm(`${name} 님의 비밀번호를 새로 발급할까요?\n새 비밀번호: ${pw}`)) return;
    const res = await fetch("/api/admin/workers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password: pw }),
    });
    if (res.ok) {
      alert(`비밀번호가 재설정되었습니다.\n새 비밀번호: ${pw}\n(이 화면에서만 표시됩니다)`);
      router.refresh();
    } else {
      alert("재설정 실패");
    }
  }

  async function issueCredential(id: string, name: string) {
    const uname = prompt(`${name} 님에게 부여할 아이디(영문/숫자)를 입력하세요.`);
    if (!uname) return;
    const pw = genPassword();
    const res = await fetch("/api/admin/workers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, username: uname, password: pw }),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      alert(`계정이 발급되었습니다.\n아이디: ${uname.toLowerCase()}\n비밀번호: ${pw}`);
      router.refresh();
    } else {
      alert(j.error || "발급 실패");
    }
  }

  return (
    <div className="space-y-5">
      {/* 발급 폼 */}
      <form onSubmit={create} className="rounded-lg border border-border bg-white p-4">
        <p className="text-sm font-semibold text-ink">근로자 계정 발급</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input className={inputCls} placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className={inputCls} placeholder="아이디(영문/숫자)" value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" required />
          <div className="flex gap-2">
            <input className={inputCls} placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setPassword(genPassword())} className="shrink-0 rounded-md border border-border px-2 text-xs text-muted hover:bg-surface">
              자동
            </button>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <button type="submit" disabled={busy} className="mt-3 rounded-md bg-safe px-4 py-2 text-sm font-semibold text-white hover:bg-safe-hover disabled:opacity-60">
          {busy ? "발급 중…" : "계정 발급"}
        </button>

        {issued && (
          <div className="mt-3 rounded-md border border-safe/30 bg-safe/10 p-3 text-sm">
            <p className="font-semibold text-safe">발급 완료 — 근로자에게 전달하세요</p>
            <p className="mt-1 num text-ink">아이디: {issued.username}</p>
            <p className="num text-ink">비밀번호: {issued.password}</p>
            <p className="mt-1 text-xs text-muted">비밀번호는 지금만 표시됩니다. 잊으면 재설정하세요.</p>
          </div>
        )}
      </form>

      {/* 목록 */}
      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">이름</th>
              <th className="px-4 py-2.5 font-medium">아이디</th>
              <th className="px-4 py-2.5 font-medium">등록일</th>
              <th className="px-4 py-2.5 font-medium text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <tr key={w.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-ink">{w.name}</td>
                <td className="px-4 py-3 num text-muted">
                  {w.username || <span className="text-xs">코드등록 · 계정없음</span>}
                </td>
                <td className="px-4 py-3 num text-muted whitespace-nowrap">{w.created_at?.slice(0, 10)}</td>
                <td className="px-4 py-3 text-right">
                  {w.username ? (
                    <button onClick={() => resetPw(w.id, w.name)} className="text-xs font-medium text-safe hover:underline">
                      비번 재설정
                    </button>
                  ) : (
                    <button onClick={() => issueCredential(w.id, w.name)} className="text-xs font-medium text-safe hover:underline">
                      계정 발급
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {workers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted">아직 등록된 근로자가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
