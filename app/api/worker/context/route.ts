import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** 작업 전 점검에 쓸 공정·위험요인·체크항목. 확정 위험성평가 우선, 없으면 업종 표준(hazard_seeds). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace_id");
  if (!workspaceId) return NextResponse.json({ error: "workspace_id 필요" }, { status: 400 });

  const db = getServiceSupabase();

  const { data: ws } = await db
    .from("workspaces")
    .select("industry_code")
    .eq("id", workspaceId)
    .maybeSingle();

  // 1) 확정된 위험성평가 기반
  const { data: ras } = await db
    .from("risk_assessments")
    .select("process, items, status")
    .eq("workspace_id", workspaceId)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });

  type Proc = { process: string; hazards: string[]; items: string[] };
  const procs: Proc[] = [];

  if (ras && ras.length) {
    for (const ra of ras) {
      const items = (ra.items as { hazard?: string; measure?: string }[]) ?? [];
      procs.push({
        process: ra.process,
        hazards: items.map((i) => i.hazard).filter(Boolean) as string[],
        items: items.map((i) => i.measure).filter(Boolean) as string[],
      });
    }
  } else if (ws?.industry_code) {
    // 2) 업종 표준 유해위험요인으로 공정별 묶기
    const { data: seeds } = await db
      .from("hazard_seeds")
      .select("process_keyword, hazard, default_measures")
      .eq("industry_code", ws.industry_code);
    const byProc = new Map<string, Proc>();
    for (const sd of seeds ?? []) {
      const key = sd.process_keyword as string;
      if (!byProc.has(key)) byProc.set(key, { process: key, hazards: [], items: [] });
      const p = byProc.get(key)!;
      p.hazards.push(sd.hazard as string);
      for (const m of (sd.default_measures as string[]) ?? []) p.items.push(m);
    }
    procs.push(...byProc.values());
  }

  // 공통 작업 전 기본 점검 항목
  const baseItems = [
    "오늘 작업 내용과 위험요인을 확인했다",
    "보호구(안전모·안전화 등)를 착용했다",
    "작업 구역의 위험 상태를 점검했다",
    "이상 발견 시 작업을 멈추고 보고하겠다",
  ];

  return NextResponse.json({ processes: procs, baseItems });
}
