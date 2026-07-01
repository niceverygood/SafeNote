import Link from "next/link";
import QRCode from "qrcode";
import { getServiceSupabase } from "@/lib/supabase/server";
import { HazardResolver } from "@/components/admin/HazardResolver";
import { WorkerAccountManager } from "@/components/admin/WorkerAccountManager";
import { ManagerCreator } from "@/components/admin/ManagerCreator";
import { requireWorkspaceAccess } from "@/lib/adminGuard";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://safe-note-roan.vercel.app";

interface Workspace {
  id: string;
  name: string;
  industry_code: string;
  size_band: string;
  worker_count: number;
  join_code: string | null;
  created_at: string;
}

interface CheckItem {
  label?: string;
  checked?: boolean;
}

interface SafetyCheck {
  id: string;
  worker_name: string;
  process: string;
  acknowledged: boolean;
  items: CheckItem[] | null;
  hash: string;
  created_at: string;
}

interface HazardReport {
  id: string;
  worker_name: string;
  location: string | null;
  description: string;
  severity: string;
  status: string;
  resolution: string | null;
  photo_url: string | null;
  hash: string;
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

const SEVERITY_LABEL: Record<string, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
};

const SEVERITY_CLS: Record<string, string> = {
  low: "border-border text-muted",
  medium: "border-caution/40 bg-caution/10 text-caution",
  high: "border-danger/40 bg-danger/10 text-danger",
};

function fmt(ts: string): string {
  return ts.slice(0, 16).replace("T", " ");
}

function shortHash(hash: string | null | undefined): string {
  return hash ? hash.slice(0, 12) : "—";
}

function checkSummary(items: CheckItem[] | null): string {
  const list = Array.isArray(items) ? items : [];
  const total = list.length;
  const done = list.filter((i) => i?.checked).length;
  return `${done}/${total}`;
}

export default async function WorkspaceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = await requireWorkspaceAccess(params.id);
  const db = getServiceSupabase();

  const { data: ws } = await db
    .from("workspaces")
    .select("id, name, industry_code, size_band, worker_count, join_code, created_at")
    .eq("id", params.id)
    .maybeSingle();
  const workspace = ws as Workspace | null;

  if (!workspace) {
    return (
      <div>
        <Link href="/admin/workspaces" className="text-sm text-safe hover:underline">
          ← 사업장 목록
        </Link>
        <p className="mt-8 text-center text-sm text-muted">사업장을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const [{ data: checkData }, { data: hazardData }, { data: workerData }] = await Promise.all([
    db
      .from("safety_checks")
      .select("id, worker_name, process, acknowledged, items, hash, created_at")
      .eq("workspace_id", params.id)
      .order("created_at", { ascending: false })
      .limit(20),
    db
      .from("hazard_reports")
      .select("id, worker_name, location, description, severity, status, resolution, photo_url, hash, created_at")
      .eq("workspace_id", params.id)
      .order("created_at", { ascending: false })
      .limit(50),
    db
      .from("workers")
      .select("id, name, username, created_at")
      .eq("workspace_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  const checks = (checkData ?? []) as SafetyCheck[];
  const hazards = (hazardData ?? []) as HazardReport[];
  const workers = (workerData ?? []) as { id: string; name: string; username: string | null; created_at: string }[];

  const joinUrl = `${SITE}/w?code=${workspace.join_code ?? ""}`;
  const qrSvg = workspace.join_code
    ? await QRCode.toString(joinUrl, { type: "svg", margin: 1, width: 132 })
    : null;

  return (
    <div>
      {admin.role === "super" && (
        <Link href="/admin/workspaces" className="text-sm text-safe hover:underline">
          ← 사업장 목록
        </Link>
      )}

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink">{workspace.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {INDUSTRY_LABEL[workspace.industry_code] ?? workspace.industry_code} ·{" "}
            {workspace.size_band} · 상시근로자 {workspace.worker_count}명
          </p>
        </div>
        <Link
          href={`/admin/workspaces/${params.id}/dashboard`}
          className="shrink-0 rounded-md bg-safe px-4 py-2 text-sm font-semibold text-white hover:bg-safe-hover"
        >
          작업 전·중·후 점검 대시보드 →
        </Link>
      </div>

      {/* 참여코드 + QR — 노동자 입장 안내 */}
      <div className="mt-6 flex flex-col gap-4 rounded-lg border border-safe/30 bg-safe/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs text-muted">참여코드</div>
          <div className="mt-1 num text-3xl font-bold tracking-[0.2em] text-ink">
            {workspace.join_code ?? "—"}
          </div>
          <p className="mt-2 text-sm text-muted">
            노동자는 세이프노트 <span className="num font-medium text-ink">/w</span> 에서 이 코드로
            입장하거나, 아래 QR을 스캔하면 코드가 자동 입력됩니다.
          </p>
        </div>
        {qrSvg && (
          <div className="shrink-0 rounded-md border border-border bg-white p-2">
            <div
              className="h-[132px] w-[132px] [&>svg]:h-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          </div>
        )}
      </div>

      {/* 관리자 계정 발급 (총괄관리자 전용) */}
      {admin.role === "super" && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-ink">관리자 계정 (총괄관리자 전용)</h2>
          <p className="mt-1 text-xs text-muted">이 사업장을 관리할 고객 관리자 계정을 발급합니다.</p>
          <div className="mt-3">
            <ManagerCreator workspaceId={workspace.id} />
          </div>
        </section>
      )}

      {/* 근로자 계정 발급 */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-ink">근로자 계정</h2>
        <p className="mt-1 text-xs text-muted">
          근로자에게 아이디·비밀번호를 발급하면 세이프노트 <span className="num">/w</span> 에서 로그인해 점검·신고할 수 있습니다.
        </p>
        <div className="mt-3">
          <WorkerAccountManager workspaceId={workspace.id} workers={workers} />
        </div>
      </section>

      {/* 최근 안전점검 */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-ink">최근 작업 전 안전점검</h2>
        <p className="mt-1 text-xs text-muted">최근 {checks.length}건. 해시는 위변조 감지용입니다.</p>

        <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">일시</th>
                <th className="px-4 py-2.5 font-medium">이름</th>
                <th className="px-4 py-2.5 font-medium">공정</th>
                <th className="px-4 py-2.5 font-medium">고지확인</th>
                <th className="px-4 py-2.5 font-medium">체크</th>
                <th className="px-4 py-2.5 font-medium">해시</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 align-top">
                  <td className="px-4 py-3 num text-muted whitespace-nowrap">{fmt(c.created_at)}</td>
                  <td className="px-4 py-3 text-ink">{c.worker_name}</td>
                  <td className="px-4 py-3 text-ink">{c.process}</td>
                  <td className="px-4 py-3">
                    {c.acknowledged ? (
                      <span className="rounded border border-safe/40 bg-safe/10 px-2 py-0.5 text-xs text-safe">
                        확인
                      </span>
                    ) : (
                      <span className="rounded border border-border px-2 py-0.5 text-xs text-muted">
                        미확인
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 num text-ink">{checkSummary(c.items)}</td>
                  <td className="px-4 py-3 num text-xs text-muted">{shortHash(c.hash)}</td>
                </tr>
              ))}
              {checks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                    아직 안전점검 기록이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 위험 신고 */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-ink">위험 신고</h2>
        <p className="mt-1 text-xs text-muted">총 {hazards.length}건. 해시는 위변조 감지용입니다.</p>

        <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">일시</th>
                <th className="px-4 py-2.5 font-medium">이름</th>
                <th className="px-4 py-2.5 font-medium">위험도</th>
                <th className="px-4 py-2.5 font-medium">상태</th>
                <th className="px-4 py-2.5 font-medium">내용</th>
                <th className="px-4 py-2.5 font-medium">해시</th>
              </tr>
            </thead>
            <tbody>
              {hazards.map((h) => (
                <tr key={h.id} className="border-b border-border last:border-0 align-top">
                  <td className="px-4 py-3 num text-muted whitespace-nowrap">{fmt(h.created_at)}</td>
                  <td className="px-4 py-3 text-ink">{h.worker_name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded border px-2 py-0.5 text-xs ${
                        SEVERITY_CLS[h.severity] ?? "border-border text-muted"
                      }`}
                    >
                      {SEVERITY_LABEL[h.severity] ?? h.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <HazardResolver id={h.id} status={h.status} resolution={h.resolution} />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {h.description}
                    {h.location && (
                      <div className="text-xs text-muted">위치: {h.location}</div>
                    )}
                    {h.photo_url && (
                      <a
                        href={h.photo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs font-medium text-safe hover:underline"
                      >
                        사진 보기
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 num text-xs text-muted">{shortHash(h.hash)}</td>
                </tr>
              ))}
              {hazards.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                    아직 위험 신고가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
