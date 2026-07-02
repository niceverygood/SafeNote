"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TrainingRow {
  id: string;
  title: string;
  training_type: string;
  material_url: string | null;
  created_at: string;
  ackCount: number;
}

const TYPE_LABEL: Record<string, string> = {
  regular: "정기교육",
  onboarding: "채용 시 교육",
  special: "특별교육",
};
const input =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-safe";

/** 안전보건교육 배포 + 이수(확인 서명) 현황 — 제5조·산안법 29조 증빙 */
export function TrainingManager({
  workspaceId,
  trainings,
  workerTotal,
}: {
  workspaceId: string;
  trainings: TrainingRow[];
  workerTotal: number;
}) {
  const router = useRouter();
  const [trainingType, setTrainingType] = useState("regular");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [materialUrl, setMaterialUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/trainings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        training_type: trainingType,
        title,
        body,
        material_url: materialUrl.trim() || undefined,
      }),
    });
    setBusy(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(j.error || "등록 실패");
      return;
    }
    setTitle("");
    setBody("");
    setMaterialUrl("");
    setTrainingType("regular");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="rounded-lg border border-border bg-white p-4">
        <p className="text-sm font-semibold text-ink">교육 배포</p>
        <p className="mt-1 text-xs text-muted">
          배포하면 근로자 앱 홈에 표시되고, 근로자가 이수 서명하면 교육 실시 기록(불변 로그)으로 남습니다.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[130px_1fr]">
          <select value={trainingType} onChange={(e) => setTrainingType(e.target.value)} className={input}>
            <option value="regular">정기교육</option>
            <option value="onboarding">채용 시 교육</option>
            <option value="special">특별교육</option>
          </select>
          <input
            className={input}
            placeholder="제목 (예: 2026 상반기 정기 안전보건교육)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <textarea
          className={`${input} mt-2 min-h-[80px]`}
          placeholder="교육 내용 — 핵심 안전수칙·유의사항을 적어주세요."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
        <input
          className={`${input} mt-2`}
          placeholder="교육 자료 링크 (선택, 예: https://… PDF·영상)"
          value={materialUrl}
          onChange={(e) => setMaterialUrl(e.target.value)}
          inputMode="url"
        />
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-3 rounded-md bg-safe px-4 py-2 text-sm font-semibold text-white hover:bg-safe-hover disabled:opacity-60"
        >
          {busy ? "배포 중…" : "배포하고 이수 서명 받기"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">배포일</th>
              <th className="px-4 py-2.5 font-medium">구분</th>
              <th className="px-4 py-2.5 font-medium">제목</th>
              <th className="px-4 py-2.5 font-medium text-right">이수 서명</th>
            </tr>
          </thead>
          <tbody>
            {trainings.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 num text-muted whitespace-nowrap">{t.created_at?.slice(0, 10)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded border px-2 py-0.5 text-xs whitespace-nowrap ${
                      t.training_type === "special"
                        ? "border-caution/40 bg-caution/10 text-caution"
                        : t.training_type === "onboarding"
                          ? "border-border text-muted"
                          : "border-safe/30 bg-safe/10 text-safe"
                    }`}
                  >
                    {TYPE_LABEL[t.training_type] ?? t.training_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink">
                  {t.title}
                  {t.material_url && (
                    <a
                      href={t.material_url}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 text-xs font-medium text-safe hover:underline"
                    >
                      자료
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`num text-sm font-semibold ${
                      t.ackCount >= workerTotal && workerTotal > 0 ? "text-safe" : "text-ink"
                    }`}
                  >
                    {t.ackCount}
                  </span>
                  <span className="num text-xs text-muted"> / {workerTotal}명</span>
                </td>
              </tr>
            ))}
            {trainings.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted">
                  아직 배포된 교육이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
