import { getServiceSupabase } from "@/lib/supabase/server";
import { LiabilityGauge } from "@/components/ds/LiabilityGauge";

export const dynamic = "force-dynamic";

async function counts() {
  const db = getServiceSupabase();
  const head = { count: "exact" as const, head: true };
  const [ws, diag, leads, ra, raConfirmed, chunks] = await Promise.all([
    db.from("workspaces").select("id", head),
    db.from("diagnoses").select("id", head),
    db.from("diagnoses").select("id", head).not("lead_contact", "is", null),
    db.from("risk_assessments").select("id", head),
    db.from("risk_assessments").select("id", head).eq("status", "confirmed"),
    db.from("regulation_chunks").select("id", head),
  ]);
  // 평균 이행률
  const { data: gaps } = await db.from("diagnoses").select("gap_score");
  const avg =
    gaps && gaps.length
      ? Math.round(gaps.reduce((s, r) => s + (r.gap_score ?? 0), 0) / gaps.length)
      : 0;
  return {
    workspaces: ws.count ?? 0,
    diagnoses: diag.count ?? 0,
    leads: leads.count ?? 0,
    risk: ra.count ?? 0,
    riskConfirmed: raConfirmed.count ?? 0,
    chunks: chunks.count ?? 0,
    avgGap: avg,
  };
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 num text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export default async function AdminOverviewPage() {
  const c = await counts();
  return (
    <div>
      <h1 className="text-xl font-bold text-ink">운영 개요</h1>
      <p className="mt-1 text-sm text-muted">플랫폼 전체 현황 한눈에 보기.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="자가진단" value={c.diagnoses} sub={`리드 ${c.leads}건 확보`} />
        <Stat label="위험성평가" value={c.risk} sub={`확정 ${c.riskConfirmed}건`} />
        <Stat label="사업장" value={c.workspaces} />
        <Stat label="RAG 코퍼스" value={c.chunks} sub="임베딩 청크" />
      </div>

      <div className="mt-6 flex flex-col items-start gap-6 rounded-lg border border-border bg-white p-6 sm:flex-row sm:items-center">
        <LiabilityGauge score={c.avgGap} size="md" label="평균 면책 이행률" />
        <div className="text-sm text-muted">
          <p className="text-ink">
            진단을 완료한 사업장들의 평균 이행률입니다. 리드 전환·후속 위험성평가
            생성으로 이어지는지 모니터링하세요.
          </p>
          <p className="mt-2">
            리드 전환율{" "}
            <span className="num font-semibold text-ink">
              {c.diagnoses ? Math.round((c.leads / c.diagnoses) * 100) : 0}%
            </span>{" "}
            · 위험성평가 확정률{" "}
            <span className="num font-semibold text-ink">
              {c.risk ? Math.round((c.riskConfirmed / c.risk) * 100) : 0}%
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
