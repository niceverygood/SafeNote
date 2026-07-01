import Link from "next/link";
import { getServiceSupabase } from "@/lib/supabase/server";
import { STAGES, kstTodayStartISO, kstTime, type StageKey } from "@/lib/stages";
import { requireWorkspaceAccess } from "@/lib/adminGuard";

export const dynamic = "force-dynamic";

interface CheckRow {
  worker_name: string;
  kind: string;
  process: string | null;
  items: { label: string; checked: boolean }[];
  acknowledged: boolean;
  signature_name: string | null;
  hash: string;
  created_at: string;
}
type Cell = { at: string; checked: number; total: number; ack: boolean; hash: string; process: string | null } | null;

export default async function WorkspaceDashboard({ params }: { params: { id: string } }) {
  await requireWorkspaceAccess(params.id);
  const db = getServiceSupabase();
  const start = kstTodayStartISO();

  const [{ data: ws }, { data: workers }, { data: checks }] = await Promise.all([
    db.from("workspaces").select("name, industry_code").eq("id", params.id).maybeSingle(),
    db.from("workers").select("name").eq("workspace_id", params.id),
    db
      .from("safety_checks")
      .select("worker_name, kind, process, items, acknowledged, signature_name, hash, created_at")
      .eq("workspace_id", params.id)
      .gte("created_at", start)
      .order("created_at", { ascending: true }),
  ]);

  const rows = (checks ?? []) as CheckRow[];

  // 작업자별 단계 현황
  const names = new Set<string>();
  (workers ?? []).forEach((w) => names.add(w.name as string));
  rows.forEach((r) => names.add(r.worker_name));

  const matrix = new Map<string, Record<StageKey, Cell>>();
  for (const n of names) matrix.set(n, { pre: null, during: null, post: null });
  for (const r of rows) {
    const k = r.kind as StageKey;
    if (k !== "pre" && k !== "during" && k !== "post") continue;
    const items = Array.isArray(r.items) ? r.items : [];
    matrix.get(r.worker_name)![k] = {
      at: r.created_at,
      checked: items.filter((i) => i.checked).length,
      total: items.length,
      ack: r.acknowledged,
      hash: r.hash,
      process: r.process,
    };
  }

  const workerRows = [...matrix.entries()];
  const fullyDone = workerRows.filter(([, s]) => s.pre && s.during && s.post).length;

  function Cell({ c }: { c: Cell }) {
    if (!c) return <span className="text-muted">—</span>;
    return (
      <span className="inline-flex flex-col">
        <span className="inline-flex items-center gap-1 font-medium text-safe">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-safe text-[10px] text-white">✓</span>
          <span className="num">{kstTime(c.at)}</span>
        </span>
        <span className="num text-[11px] text-muted">
          체크 {c.checked}/{c.total}
        </span>
      </span>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href={`/admin/workspaces/${params.id}`} className="text-sm text-muted hover:text-ink">
            ← {ws?.name ?? "사업장"}
          </Link>
          <h1 className="mt-1 text-xl font-bold text-ink">작업 전·중·후 점검 현황</h1>
          <p className="mt-1 text-sm text-muted">오늘 (KST) 기준 · 작업자별 단계 완료와 진행 시각.</p>
        </div>
        <div className="rounded-lg border border-border bg-white px-4 py-2 text-sm">
          <span className="text-muted">3단계 모두 완료</span>{" "}
          <span className="num font-bold text-ink">{fullyDone}</span>
          <span className="text-muted"> / {workerRows.length}명</span>
        </div>
      </div>

      {/* 매트릭스 */}
      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">작업자</th>
              {STAGES.map((s) => (
                <th key={s.key} className="px-4 py-2.5 font-medium">{s.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workerRows.map(([name, s]) => (
              <tr key={name} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{name}</td>
                <td className="px-4 py-3"><Cell c={s.pre} /></td>
                <td className="px-4 py-3"><Cell c={s.during} /></td>
                <td className="px-4 py-3"><Cell c={s.post} /></td>
              </tr>
            ))}
            {workerRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted">
                  오늘 점검 기록이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 상세 로그 — 몇시몇분에 어떻게 진행했는지 */}
      <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">진행 상세 (시간순)</h2>
      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">시각</th>
              <th className="px-4 py-2.5 font-medium">작업자</th>
              <th className="px-4 py-2.5 font-medium">단계</th>
              <th className="px-4 py-2.5 font-medium">공정</th>
              <th className="px-4 py-2.5 font-medium">점검·고지</th>
              <th className="px-4 py-2.5 font-medium">증빙해시</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const items = Array.isArray(r.items) ? r.items : [];
              const stage = STAGES.find((s) => s.key === r.kind);
              return (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 num text-ink whitespace-nowrap">{kstTime(r.created_at)}</td>
                  <td className="px-4 py-3 text-ink">{r.worker_name}</td>
                  <td className="px-4 py-3 text-muted">{stage?.short ?? r.kind}</td>
                  <td className="px-4 py-3 text-muted">{r.process ?? "—"}</td>
                  <td className="px-4 py-3 num text-muted">
                    체크 {items.filter((it) => it.checked).length}/{items.length}
                    {r.kind === "pre" ? (r.acknowledged ? " · 고지확인" : " · 고지미확인") : ""}
                  </td>
                  <td className="px-4 py-3 num text-[11px] text-muted">{r.hash.slice(0, 12)}…</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">기록 없음</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
