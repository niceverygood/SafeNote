"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface NoticeRow {
  id: string;
  title: string;
  kind: string;
  created_at: string;
  ackCount: number;
}

const KIND_LABEL: Record<string, string> = { notice: "공지", education: "교육", alert: "긴급" };
const input =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-safe";

/** 안전 공지·수칙 등록 + 주지(확인) 현황 */
export function NoticeManager({
  workspaceId,
  notices,
  workerTotal,
}: {
  workspaceId: string;
  notices: NoticeRow[];
  workerTotal: number;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState("notice");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, title, body, kind }),
    });
    setBusy(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(j.error || "등록 실패");
      return;
    }
    setTitle("");
    setBody("");
    setKind("notice");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="rounded-lg border border-border bg-white p-4">
        <p className="text-sm font-semibold text-ink">공지·안전수칙 등록</p>
        <p className="mt-1 text-xs text-muted">
          등록하면 근로자 앱 홈에 표시되고, 근로자가 확인 서명하면 주지 기록(불변 로그)으로 남습니다.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[110px_1fr]">
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={input}>
            <option value="notice">공지</option>
            <option value="education">교육</option>
            <option value="alert">긴급</option>
          </select>
          <input className={input} placeholder="제목 (예: 지게차 통행로 변경 안내)" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <textarea
          className={`${input} mt-2 min-h-[80px]`}
          placeholder="내용 — 안전수칙·주의사항을 적어주세요."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <button type="submit" disabled={busy} className="mt-3 rounded-md bg-safe px-4 py-2 text-sm font-semibold text-white hover:bg-safe-hover disabled:opacity-60">
          {busy ? "등록 중…" : "등록하고 근로자에게 알리기"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">게시일</th>
              <th className="px-4 py-2.5 font-medium">구분</th>
              <th className="px-4 py-2.5 font-medium">제목</th>
              <th className="px-4 py-2.5 font-medium text-right">확인 서명</th>
            </tr>
          </thead>
          <tbody>
            {notices.map((n) => (
              <tr key={n.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 num text-muted whitespace-nowrap">{n.created_at?.slice(0, 10)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded border px-2 py-0.5 text-xs whitespace-nowrap ${
                      n.kind === "alert"
                        ? "border-danger/40 bg-danger/10 text-danger"
                        : n.kind === "education"
                          ? "border-safe/30 bg-safe/10 text-safe"
                          : "border-border text-muted"
                    }`}
                  >
                    {KIND_LABEL[n.kind] ?? n.kind}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink">{n.title}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`num text-sm font-semibold ${n.ackCount >= workerTotal && workerTotal > 0 ? "text-safe" : "text-ink"}`}>
                    {n.ackCount}
                  </span>
                  <span className="num text-xs text-muted"> / {workerTotal}명</span>
                </td>
              </tr>
            ))}
            {notices.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted">
                  아직 등록된 공지가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
