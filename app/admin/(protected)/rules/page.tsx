import { getServiceSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const db = getServiceSupabase();
  const [{ data: obligations }, { data: hazards }, { data: industries }] = await Promise.all([
    db.from("obligations").select("code, title, required_evidence, sort_order").order("sort_order"),
    db.from("hazard_seeds").select("industry_code, process_keyword, hazard").order("industry_code"),
    db.from("industries").select("code, name").order("sort_order"),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-ink">규정 데이터 (RULE DATA)</h1>
        <p className="mt-1 text-sm text-muted">
          규칙 엔진이 사용하는 큐레이션 데이터. (열람 전용 — 수정은 시드/마이그레이션으로 관리)
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink">
          9대 의무 <span className="num text-muted">({obligations?.length ?? 0})</span>
        </h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">코드</th>
                <th className="px-4 py-2.5 font-medium">의무</th>
                <th className="px-4 py-2.5 font-medium">필요 증빙</th>
              </tr>
            </thead>
            <tbody>
              {(obligations ?? []).map((o) => (
                <tr key={o.code} className="border-b border-border last:border-0 align-top">
                  <td className="px-4 py-3 num text-muted whitespace-nowrap">{o.code}</td>
                  <td className="px-4 py-3 font-medium text-ink">{o.title}</td>
                  <td className="px-4 py-3 text-muted">{o.required_evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink">
          업종별 표준 유해위험요인 <span className="num text-muted">({hazards?.length ?? 0})</span>
          <span className="ml-2 text-xs font-normal text-muted">· 업종 {industries?.length ?? 0}종</span>
        </h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">업종</th>
                <th className="px-4 py-2.5 font-medium">공정 키워드</th>
                <th className="px-4 py-2.5 font-medium">유해위험요인</th>
              </tr>
            </thead>
            <tbody>
              {(hazards ?? []).map((h, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 num text-muted whitespace-nowrap">{h.industry_code}</td>
                  <td className="px-4 py-3 text-ink whitespace-nowrap">{h.process_keyword}</td>
                  <td className="px-4 py-3 text-muted">{h.hazard}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
