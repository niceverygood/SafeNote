import Link from "next/link";
import { getServiceSupabase } from "@/lib/supabase/server";
import { WorkspaceCreator } from "@/components/admin/WorkspaceCreator";

export const dynamic = "force-dynamic";

interface Workspace {
  id: string;
  name: string;
  industry_code: string;
  size_band: string;
  worker_count: number;
  join_code: string | null;
  created_at: string;
}

const INDUSTRY_LABEL: Record<string, string> = {
  manufacturing: "제조업",
  construction: "건설업",
  logistics: "운수·창고·물류업",
  wholesale_retail: "도·소매업",
  food_service: "음식·숙박업",
  waste: "폐기물 수집·처리·재활용업",
  facility_mgmt: "시설관리·청소·경비업",
  auto_repair: "자동차 정비·수리업",
  etc: "기타",
};

async function countFor(
  db: ReturnType<typeof getServiceSupabase>,
  table: string,
  workspaceId: string,
  extra?: (q: any) => any
): Promise<number> {
  let q = db
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (extra) q = extra(q);
  const { count } = await q;
  return count ?? 0;
}

export default async function WorkspacesPage() {
  const db = getServiceSupabase();
  const { data } = await db
    .from("workspaces")
    .select("id, name, industry_code, size_band, worker_count, join_code, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const workspaces = (data ?? []) as Workspace[];

  const stats = await Promise.all(
    workspaces.map(async (w) => {
      const [workers, checks, openHazards] = await Promise.all([
        countFor(db, "workers", w.id),
        countFor(db, "safety_checks", w.id),
        countFor(db, "hazard_reports", w.id, (q) => q.eq("status", "open")),
      ]);
      return { id: w.id, workers, checks, openHazards };
    })
  );
  const statMap = new Map(stats.map((s) => [s.id, s]));

  return (
    <div>
      <h1 className="text-xl font-bold text-ink">사업장 관리</h1>
      <p className="mt-1 text-sm text-muted">
        사업장을 등록하고 참여코드로 노동자 현장 기록을 모읍니다. 총 {workspaces.length}곳.
      </p>

      <div className="mt-6">
        <WorkspaceCreator />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">사업장</th>
              <th className="px-4 py-2.5 font-medium">업종</th>
              <th className="px-4 py-2.5 font-medium">규모</th>
              <th className="px-4 py-2.5 font-medium">참여코드</th>
              <th className="px-4 py-2.5 font-medium">노동자</th>
              <th className="px-4 py-2.5 font-medium">안전점검</th>
              <th className="px-4 py-2.5 font-medium">미해결 위험</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {workspaces.map((w) => {
              const s = statMap.get(w.id);
              return (
                <tr key={w.id} className="border-b border-border last:border-0 align-top">
                  <td className="px-4 py-3 font-medium text-ink">{w.name}</td>
                  <td className="px-4 py-3 text-muted">
                    {INDUSTRY_LABEL[w.industry_code] ?? w.industry_code}
                  </td>
                  <td className="px-4 py-3 num text-muted whitespace-nowrap">
                    {w.size_band} · {w.worker_count}명
                  </td>
                  <td className="px-4 py-3">
                    <span className="num font-bold tracking-wider text-ink">
                      {w.join_code ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 num text-ink">{s?.workers ?? 0}</td>
                  <td className="px-4 py-3 num text-ink">{s?.checks ?? 0}</td>
                  <td className="px-4 py-3 num">
                    {s && s.openHazards > 0 ? (
                      <span className="rounded border border-caution/40 bg-caution/10 px-2 py-0.5 text-xs font-medium text-caution">
                        {s.openHazards}
                      </span>
                    ) : (
                      <span className="text-muted">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`/admin/workspaces/${w.id}`}
                      className="rounded-md border border-border px-3 py-1.5 text-xs text-ink hover:bg-surface focus:outline-none focus:ring-2 focus:ring-safe"
                    >
                      상세
                    </Link>
                  </td>
                </tr>
              );
            })}
            {workspaces.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted">
                  아직 등록된 사업장이 없습니다. 위에서 첫 사업장을 추가해 보세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
