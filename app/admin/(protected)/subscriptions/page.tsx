import { getServiceSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  company: string | null;
  plan: string | null;
  message: string | null;
  source: string | null;
  created_at: string;
}

const PLAN_LABEL: Record<string, string> = {
  standard: "스탠다드",
  pro: "프로",
  enterprise: "엔터프라이즈",
  unknown: "미정",
};

export default async function SubscriptionsPage() {
  const db = getServiceSupabase();
  const { data } = await db
    .from("subscription_inquiries")
    .select("id, email, name, phone, company, plan, message, source, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];

  return (
    <div>
      <h1 className="text-xl font-bold text-ink">구독 문의</h1>
      <p className="mt-1 text-sm text-muted">요금제 페이지에서 들어온 구독 문의. 최근 {rows.length}건.</p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">일자</th>
              <th className="px-4 py-2.5 font-medium">회사</th>
              <th className="px-4 py-2.5 font-medium">담당자</th>
              <th className="px-4 py-2.5 font-medium">연락처</th>
              <th className="px-4 py-2.5 font-medium">플랜</th>
              <th className="px-4 py-2.5 font-medium">문의</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 align-top">
                <td className="px-4 py-3 num text-muted whitespace-nowrap">{r.created_at?.slice(0, 10)}</td>
                <td className="px-4 py-3 text-ink">{r.company || "—"}</td>
                <td className="px-4 py-3 text-ink">
                  {r.name || "—"}
                  <div className="num text-xs text-muted">{r.email}</div>
                </td>
                <td className="px-4 py-3 num text-muted whitespace-nowrap">{r.phone || "—"}</td>
                <td className="px-4 py-3">
                  <span className="rounded border border-border px-2 py-0.5 text-xs text-ink">
                    {PLAN_LABEL[r.plan || "unknown"] ?? r.plan}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{r.message || "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                  아직 구독 문의가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
