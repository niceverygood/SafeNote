import { getServiceSupabase } from "@/lib/supabase/server";
import { RiskChip } from "@/components/ds/StatusChip";
import { exposureFromScore } from "@/lib/status";
import { requireSuper } from "@/lib/adminGuard";

export const dynamic = "force-dynamic";

interface DiagRow {
  id: string;
  industry_code: string | null;
  size_band: string | null;
  gap_score: number;
  lead_contact: { email?: string; name?: string; phone?: string } | null;
  created_at: string;
}

function fmt(d: string) {
  return d?.slice(0, 10) ?? "—";
}

export default async function LeadsPage() {
  await requireSuper();
  const db = getServiceSupabase();
  const { data } = await db
    .from("diagnoses")
    .select("id, industry_code, size_band, gap_score, lead_contact, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as DiagRow[];

  return (
    <div>
      <h1 className="text-xl font-bold text-ink">리드 · 자가진단</h1>
      <p className="mt-1 text-sm text-muted">
        자가진단 제출 내역과 이메일을 남긴 리드. 최근 {rows.length}건.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">일자</th>
              <th className="px-4 py-2.5 font-medium">업종</th>
              <th className="px-4 py-2.5 font-medium">규모</th>
              <th className="px-4 py-2.5 font-medium">이행률</th>
              <th className="px-4 py-2.5 font-medium">리스크</th>
              <th className="px-4 py-2.5 font-medium">리드(이메일)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 num text-muted">{fmt(r.created_at)}</td>
                <td className="px-4 py-3 text-ink">{r.industry_code ?? "—"}</td>
                <td className="px-4 py-3 num text-muted">{r.size_band ?? "—"}</td>
                <td className="px-4 py-3 num font-semibold text-ink">{r.gap_score}%</td>
                <td className="px-4 py-3">
                  <RiskChip level={exposureFromScore(r.gap_score)} />
                </td>
                <td className="px-4 py-3">
                  {r.lead_contact?.email ? (
                    <span className="num text-ink">
                      {r.lead_contact.email}
                      {r.lead_contact.name ? (
                        <span className="ml-2 text-xs text-muted">{r.lead_contact.name}</span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-xs text-muted">미캡처</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                  아직 진단 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
