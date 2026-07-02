import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin";
import { getServiceSupabase } from "@/lib/supabase/server";
import { verifyChain } from "@/lib/verifychain";
import { renderEvidencePdf, type EvidenceData } from "@/lib/pdf/evidence";

export const runtime = "nodejs";

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

/** 기간별 증빙 리포트 PDF (관리자 — 자기 사업장 / 총괄 — 전체) */
export async function GET(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace_id");
  const days = Math.min(365, Math.max(1, Number(searchParams.get("days") ?? 30)));
  if (!workspaceId) return NextResponse.json({ error: "workspace_id 필요" }, { status: 400 });
  if (admin.role !== "super" && admin.workspaceId !== workspaceId)
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const db = getServiceSupabase();
  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 3600 * 1000);
  const fromISO = from.toISOString();

  const { data: ws } = await db
    .from("workspaces")
    .select("name, industry_code, size_band, worker_count")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!ws) return NextResponse.json({ error: "사업장을 찾을 수 없습니다." }, { status: 404 });

  const [checksQ, reportsQ, noticesQ, acksQ, trainingsQ, tacksQ, bItemsQ, bExecsQ, c1, c2, c3, c4, c5] = await Promise.all([
    db
      .from("safety_checks")
      .select("created_at, worker_name, kind, process, items, acknowledged, hash")
      .eq("workspace_id", workspaceId)
      .gte("created_at", fromISO)
      .order("created_at", { ascending: true })
      .limit(400),
    db
      .from("hazard_reports")
      .select("created_at, worker_name, report_type, severity, status, description, location, resolution, resolved_at, hash")
      .eq("workspace_id", workspaceId)
      .gte("created_at", fromISO)
      .order("created_at", { ascending: true })
      .limit(300),
    db
      .from("notices")
      .select("id, created_at, title, kind")
      .eq("workspace_id", workspaceId)
      .gte("created_at", fromISO)
      .order("created_at", { ascending: true })
      .limit(100),
    db
      .from("notice_acks")
      .select("created_at, worker_name, notice_id, hash")
      .eq("workspace_id", workspaceId)
      .gte("created_at", fromISO)
      .order("created_at", { ascending: true })
      .limit(400),
    db
      .from("trainings")
      .select("id, created_at, title, training_type")
      .eq("workspace_id", workspaceId)
      .gte("created_at", fromISO)
      .order("created_at", { ascending: true })
      .limit(100),
    db
      .from("training_acks")
      .select("created_at, worker_name, training_id, hash")
      .eq("workspace_id", workspaceId)
      .gte("created_at", fromISO)
      .order("created_at", { ascending: true })
      .limit(400),
    db
      .from("budget_items")
      .select("id, year, category, label, planned_amount")
      .eq("workspace_id", workspaceId)
      .order("year", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(100),
    db
      .from("budget_executions")
      .select("created_at, budget_item_id, amount, note, receipt_url, hash")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true })
      .limit(500),
    verifyChain(db, "safety_checks", workspaceId),
    verifyChain(db, "hazard_reports", workspaceId),
    verifyChain(db, "notice_acks", workspaceId),
    verifyChain(db, "training_acks", workspaceId),
    verifyChain(db, "budget_executions", workspaceId),
  ]);

  const noticeTitle = new Map((noticesQ.data ?? []).map((n) => [n.id as string, n.title as string]));
  const ackCountByNotice = new Map<string, number>();
  for (const a of acksQ.data ?? []) {
    const k = a.notice_id as string;
    ackCountByNotice.set(k, (ackCountByNotice.get(k) ?? 0) + 1);
  }

  const trainingTitle = new Map((trainingsQ.data ?? []).map((t) => [t.id as string, t.title as string]));
  const ackCountByTraining = new Map<string, number>();
  for (const a of tacksQ.data ?? []) {
    const k = a.training_id as string;
    ackCountByTraining.set(k, (ackCountByTraining.get(k) ?? 0) + 1);
  }

  // 예산: 집행 합계는 전체 누계, 집행 목록은 기간 내로 제한
  const allExecs = bExecsQ.data ?? [];
  const executedByItem = new Map<string, number>();
  for (const ex of allExecs) {
    const k = ex.budget_item_id as string;
    executedByItem.set(k, (executedByItem.get(k) ?? 0) + Number(ex.amount));
  }
  const budgetItemLabel = new Map((bItemsQ.data ?? []).map((b) => [b.id as string, b.label as string]));
  const periodExecs = allExecs.filter((ex) => (ex.created_at as string) >= fromISO);

  const data: EvidenceData = {
    workspaceName: ws.name as string,
    industryLabel: INDUSTRY_LABEL[ws.industry_code as string] ?? (ws.industry_code as string),
    sizeBand: ws.size_band as string,
    workerCount: ws.worker_count as number,
    fromISO,
    toISO: now.toISOString(),
    generatedAtISO: now.toISOString(),
    chains: [c1, c2, c3, c4, c5],
    checks: (checksQ.data ?? []).map((c) => {
      const items = Array.isArray(c.items) ? (c.items as { checked?: boolean }[]) : [];
      return {
        created_at: c.created_at as string,
        worker_name: c.worker_name as string,
        kind: c.kind as string,
        process: (c.process as string) ?? null,
        checked: items.filter((i) => i.checked).length,
        total: items.length,
        acknowledged: !!c.acknowledged,
        hash: c.hash as string,
      };
    }),
    reports: (reportsQ.data ?? []).map((r) => ({
      created_at: r.created_at as string,
      worker_name: r.worker_name as string,
      report_type: (r.report_type as string) ?? "hazard",
      severity: r.severity as string,
      status: r.status as string,
      description: r.description as string,
      location: (r.location as string) ?? null,
      resolution: (r.resolution as string) ?? null,
      resolved_at: (r.resolved_at as string) ?? null,
      hash: r.hash as string,
    })),
    notices: (noticesQ.data ?? []).map((n) => ({
      created_at: n.created_at as string,
      title: n.title as string,
      kind: n.kind as string,
      ackCount: ackCountByNotice.get(n.id as string) ?? 0,
    })),
    acks: (acksQ.data ?? []).map((a) => ({
      created_at: a.created_at as string,
      worker_name: a.worker_name as string,
      noticeTitle: noticeTitle.get(a.notice_id as string) ?? "(삭제된 공지)",
      hash: a.hash as string,
    })),
    trainings: (trainingsQ.data ?? []).map((t) => ({
      created_at: t.created_at as string,
      title: t.title as string,
      training_type: t.training_type as string,
      ackCount: ackCountByTraining.get(t.id as string) ?? 0,
    })),
    trainingAcks: (tacksQ.data ?? []).map((a) => ({
      created_at: a.created_at as string,
      worker_name: a.worker_name as string,
      trainingTitle: trainingTitle.get(a.training_id as string) ?? "(삭제된 교육)",
      hash: a.hash as string,
    })),
    budgetItems: (bItemsQ.data ?? []).map((b) => ({
      year: b.year as number,
      category: b.category as string,
      label: b.label as string,
      planned_amount: Number(b.planned_amount),
      executed: executedByItem.get(b.id as string) ?? 0,
    })),
    budgetExecutions: periodExecs.map((ex) => ({
      created_at: ex.created_at as string,
      itemLabel: budgetItemLabel.get(ex.budget_item_id as string) ?? "(삭제된 항목)",
      amount: Number(ex.amount),
      note: (ex.note as string) ?? null,
      hasReceipt: !!ex.receipt_url,
      hash: ex.hash as string,
    })),
  };

  try {
    const buf = await renderEvidencePdf(data);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="evidence-${workspaceId.slice(0, 8)}-${days}d.pdf"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: `PDF 생성 실패: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 }
    );
  }
}
