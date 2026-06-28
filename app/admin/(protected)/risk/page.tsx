import Link from "next/link";
import { getServiceSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface RaRow {
  id: string;
  process: string;
  status: "draft" | "confirmed";
  items: unknown[];
  created_at: string;
  confirmed_at: string | null;
}

function fmt(d: string | null) {
  return d ? d.slice(0, 10) : "—";
}

export default async function RiskPage() {
  const db = getServiceSupabase();
  const { data } = await db
    .from("risk_assessments")
    .select("id, process, status, items, created_at, confirmed_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as RaRow[];

  return (
    <div>
      <h1 className="text-xl font-bold text-ink">위험성평가</h1>
      <p className="mt-1 text-sm text-muted">생성된 위험성평가 전체. 최근 {rows.length}건.</p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">생성일</th>
              <th className="px-4 py-2.5 font-medium">공정/작업</th>
              <th className="px-4 py-2.5 font-medium">항목</th>
              <th className="px-4 py-2.5 font-medium">상태</th>
              <th className="px-4 py-2.5 font-medium">확정일</th>
              <th className="px-4 py-2.5 font-medium text-right">PDF</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 num text-muted">{fmt(r.created_at)}</td>
                <td className="px-4 py-3 text-ink">{r.process}</td>
                <td className="px-4 py-3 num text-muted">{r.items?.length ?? 0}</td>
                <td className="px-4 py-3">
                  {r.status === "confirmed" ? (
                    <span className="rounded border border-safe/30 bg-safe/10 px-2 py-0.5 text-xs font-medium text-safe">
                      확정
                    </span>
                  ) : (
                    <span className="rounded border border-caution/40 bg-caution/10 px-2 py-0.5 text-xs font-medium text-caution">
                      초안
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 num text-muted">{fmt(r.confirmed_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/api/risk/${r.id}/pdf`}
                    className="text-xs font-medium text-safe hover:underline"
                    target="_blank"
                  >
                    내려받기
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                  아직 생성된 위험성평가가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
