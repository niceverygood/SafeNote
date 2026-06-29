"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** 위험 신고 조치 처리 (관리자). open → 조치완료(메모) / resolved → 표시·재개방 */
export function HazardResolver({
  id,
  status,
  resolution,
}: {
  id: string;
  status: string;
  resolution: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function patch(next: "resolved" | "open", res?: string) {
    setBusy(true);
    const r = await fetch("/api/admin/hazard", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next, resolution: res }),
    });
    setBusy(false);
    if (r.ok) {
      setOpen(false);
      router.refresh();
    } else {
      alert("처리 실패");
    }
  }

  if (status === "resolved") {
    return (
      <div className="text-xs">
        <span className="rounded border border-safe/30 bg-safe/10 px-2 py-0.5 font-medium text-safe">조치완료</span>
        {resolution && <p className="mt-1 text-muted">{resolution}</p>}
        <button onClick={() => patch("open")} disabled={busy} className="mt-1 text-muted hover:text-ink">
          재개방
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-safe px-2.5 py-1 text-xs font-medium text-safe hover:bg-safe/10"
      >
        조치완료 처리
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="조치 내용(예: 적재물 제거·통로 확보)"
        className="rounded-md border border-border bg-surface px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-safe"
      />
      <div className="flex gap-1">
        <button
          onClick={() => patch("resolved", note.trim() || undefined)}
          disabled={busy}
          className="rounded-md bg-safe px-2.5 py-1 text-xs font-semibold text-white hover:bg-safe-hover disabled:opacity-60"
        >
          {busy ? "처리 중…" : "완료"}
        </button>
        <button onClick={() => setOpen(false)} className="rounded-md border border-border px-2.5 py-1 text-xs text-muted">
          취소
        </button>
      </div>
    </div>
  );
}
