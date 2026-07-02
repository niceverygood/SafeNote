/**
 * 기간별 증빙 리포트 PDF — 사고 시 제출용 증빙 패키지.
 * 점검·신고(아차사고 포함)·조치·공지 주지 기록 + 해시체인 무결성 검증 결과.
 */
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { ChainResult } from "@/lib/verifychain";

const C = {
  surface: "#F6F7F5",
  ink: "#16201C",
  safe: "#15643E",
  caution: "#C2841C",
  danger: "#A82B22",
  border: "#DCE0DA",
  muted: "#5C6B62",
  white: "#FFFFFF",
};

let fontsRegistered = false;
function registerFonts() {
  if (fontsRegistered) return;
  try {
    const P = "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static";
    Font.register({
      family: "Pretendard",
      fonts: [
        { src: `${P}/Pretendard-Regular.otf`, fontWeight: 400 },
        { src: `${P}/Pretendard-SemiBold.otf`, fontWeight: 600 },
        { src: `${P}/Pretendard-Bold.otf`, fontWeight: 700 },
        { src: `${P}/Pretendard-ExtraBold.otf`, fontWeight: 800 },
      ],
    });
    Font.registerHyphenationCallback((w) => [w]);
    fontsRegistered = true;
  } catch {
    /* 등록 실패 시에도 렌더 진행 */
  }
}

const s = StyleSheet.create({
  page: { fontFamily: "Pretendard", color: C.ink, backgroundColor: C.white, paddingTop: 40, paddingBottom: 52, paddingHorizontal: 40, fontSize: 8.5, lineHeight: 1.4 },
  eyebrow: { fontSize: 8.5, letterSpacing: 2, color: C.safe, fontWeight: 700, marginBottom: 5 },
  h1: { fontSize: 19, fontWeight: 800, marginBottom: 8 },
  h2: { fontSize: 12, fontWeight: 800, marginTop: 14, marginBottom: 6 },
  meta: { fontSize: 9, color: C.muted },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: C.muted, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6 },
  th: { fontSize: 7.5, fontWeight: 700, color: C.muted },
  td: { fontSize: 8, lineHeight: 1.35 },
  headRow: { flexDirection: "row", backgroundColor: C.surface, borderBottomWidth: 1, borderColor: C.border, paddingVertical: 4, paddingHorizontal: 6 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: C.border, paddingVertical: 4, paddingHorizontal: 6 },
  box: { borderWidth: 1, borderColor: C.border, borderRadius: 6 },
});

export interface EvidenceData {
  workspaceName: string;
  industryLabel: string;
  sizeBand: string;
  workerCount: number;
  fromISO: string;
  toISO: string;
  generatedAtISO: string;
  chains: ChainResult[];
  checks: { created_at: string; worker_name: string; kind: string; process: string | null; checked: number; total: number; acknowledged: boolean; hash: string }[];
  reports: { created_at: string; worker_name: string; report_type: string; severity: string; status: string; description: string; location: string | null; resolution: string | null; resolved_at: string | null; hash: string }[];
  notices: { created_at: string; title: string; kind: string; ackCount: number }[];
  acks: { created_at: string; worker_name: string; noticeTitle: string; hash: string }[];
  trainings: { created_at: string; title: string; training_type: string; ackCount: number }[];
  trainingAcks: { created_at: string; worker_name: string; trainingTitle: string; hash: string }[];
  budgetItems: { year: number; category: string; label: string; planned_amount: number; executed: number }[];
  budgetExecutions: { created_at: string; itemLabel: string; amount: number; note: string | null; hasReceipt: boolean; hash: string }[];
}

const KIND: Record<string, string> = { pre: "작업 전", during: "작업 중", post: "작업 후", pre_work: "작업 전" };
const SEV: Record<string, string> = { low: "낮음", medium: "보통", high: "높음" };
const RTYPE: Record<string, string> = { hazard: "위험 신고", near_miss: "아차사고" };
const NKIND: Record<string, string> = { notice: "공지", education: "교육", alert: "긴급" };
const CHAIN_LABEL: Record<string, string> = {
  safety_checks: "안전점검",
  hazard_reports: "위험 신고",
  notice_acks: "공지 확인",
  training_acks: "교육 이수",
  budget_executions: "예산 집행",
};
const TTYPE: Record<string, string> = { regular: "정기", onboarding: "채용 시", special: "특별" };
const BCAT: Record<string, string> = { ppe: "보호구", education: "교육", facility: "시설 개선", inspection: "점검·진단", health: "건강관리", etc: "기타" };

function won(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

function kst(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
}
function kstDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text>본 자료는 법률자문을 대체하지 않습니다. 세이프노트 증빙 리포트.</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

export async function renderEvidencePdf(d: EvidenceData): Promise<Buffer> {
  registerFonts();
  const allOk = d.chains.every((c) => c.ok);

  const doc = (
    <Document title={`증빙 리포트 — ${d.workspaceName}`} author="SafeNote">
      <Page size="A4" style={s.page}>
        <Text style={s.eyebrow}>SAFENOTE EVIDENCE REPORT</Text>
        <Text style={s.h1}>안전보건 이행 증빙 리포트</Text>
        <Text style={s.meta}>
          {d.workspaceName} · {d.industryLabel} · {d.sizeBand} · 상시근로자 {d.workerCount}명
        </Text>
        <Text style={[s.meta, { marginTop: 2 }]}>
          대상 기간 {kstDate(d.fromISO)} ~ {kstDate(d.toISO)} · 생성 {kst(d.generatedAtISO)}
        </Text>

        {/* 무결성 검증 */}
        <View style={[s.box, { marginTop: 12, padding: 10, backgroundColor: allOk ? "#EEF4F0" : "#F8EEED", borderColor: allOk ? C.safe : C.danger }]}>
          <Text style={{ fontSize: 10, fontWeight: 800, color: allOk ? C.safe : C.danger, marginBottom: 4 }}>
            해시 체인 무결성 검증: {allOk ? "전체 통과 (위변조·삭제 흔적 없음)" : "이상 감지"}
          </Text>
          {d.chains.map((c) => (
            <Text key={c.table} style={{ fontSize: 8.5, color: C.ink }}>
              · {CHAIN_LABEL[c.table] ?? c.table} 체인 — 기록 {c.total}건 · {c.ok ? "연결 무결 확인" : `${c.brokenAt}번째 기록에서 연결 끊김`}
            </Text>
          ))}
          <Text style={{ fontSize: 7.5, color: C.muted, marginTop: 4 }}>
            각 기록은 직전 기록의 해시와 연결된 체인으로 저장되어, 사후 삽입·삭제·순서 변경 시 연결이 끊겨 탐지됩니다.
          </Text>
        </View>

        {/* 요약 */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          {[
            ["안전점검", `${d.checks.length}건`],
            ["위험 신고·아차사고", `${d.reports.length}건`],
            ["조치완료", `${d.reports.filter((r) => r.status === "resolved").length}건`],
            ["공지·주지 확인", `${d.acks.length}건`],
          ].map(([k, v]) => (
            <View key={k} style={[s.box, { flex: 1, padding: 8 }]}>
              <Text style={{ fontSize: 7.5, color: C.muted }}>{k}</Text>
              <Text style={{ fontSize: 13, fontWeight: 800 }}>{v}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          {[
            ["교육 실시", `${d.trainings.length}건`],
            ["교육 이수 서명", `${d.trainingAcks.length}건`],
            ["예산 집행", `${won(d.budgetExecutions.reduce((sum, ex) => sum + ex.amount, 0))}`],
          ].map(([k, v]) => (
            <View key={k} style={[s.box, { flex: 1, padding: 8 }]}>
              <Text style={{ fontSize: 7.5, color: C.muted }}>{k}</Text>
              <Text style={{ fontSize: 13, fontWeight: 800 }}>{v}</Text>
            </View>
          ))}
        </View>

        {/* 1. 작업 전·중·후 점검 */}
        <Text style={s.h2}>1. 작업 전·중·후 안전점검 기록</Text>
        <View style={s.box}>
          <View style={s.headRow}>
            <Text style={[s.th, { width: 72 }]}>일시(KST)</Text>
            <Text style={[s.th, { width: 55 }]}>작업자</Text>
            <Text style={[s.th, { width: 45 }]}>단계</Text>
            <Text style={[s.th, { flex: 1 }]}>공정</Text>
            <Text style={[s.th, { width: 60 }]}>점검·고지</Text>
            <Text style={[s.th, { width: 62 }]}>증빙해시</Text>
          </View>
          {d.checks.map((c, i) => (
            <View key={i} style={s.row} wrap={false}>
              <Text style={[s.td, { width: 72 }]}>{kst(c.created_at)}</Text>
              <Text style={[s.td, { width: 55 }]}>{c.worker_name}</Text>
              <Text style={[s.td, { width: 45 }]}>{KIND[c.kind] ?? c.kind}</Text>
              <Text style={[s.td, { flex: 1 }]}>{c.process ?? "—"}</Text>
              <Text style={[s.td, { width: 60 }]}>{c.checked}/{c.total}{c.kind === "pre" || c.kind === "pre_work" ? (c.acknowledged ? " ·고지" : "") : ""}</Text>
              <Text style={[s.td, { width: 62, color: C.muted }]}>{c.hash.slice(0, 10)}…</Text>
            </View>
          ))}
          {d.checks.length === 0 && (
            <View style={s.row}><Text style={s.td}>기간 내 기록 없음</Text></View>
          )}
        </View>

        {/* 2. 위험 신고·아차사고 */}
        <Text style={s.h2}>2. 위험 신고·아차사고 및 조치 기록</Text>
        <View style={s.box}>
          <View style={s.headRow}>
            <Text style={[s.th, { width: 72 }]}>일시(KST)</Text>
            <Text style={[s.th, { width: 50 }]}>신고자</Text>
            <Text style={[s.th, { width: 48 }]}>유형</Text>
            <Text style={[s.th, { width: 30 }]}>위험</Text>
            <Text style={[s.th, { flex: 1 }]}>내용 / 조치</Text>
            <Text style={[s.th, { width: 42 }]}>상태</Text>
          </View>
          {d.reports.map((r, i) => (
            <View key={i} style={s.row} wrap={false}>
              <Text style={[s.td, { width: 72 }]}>{kst(r.created_at)}</Text>
              <Text style={[s.td, { width: 50 }]}>{r.worker_name}</Text>
              <Text style={[s.td, { width: 48 }]}>{RTYPE[r.report_type] ?? r.report_type}</Text>
              <Text style={[s.td, { width: 30 }]}>{SEV[r.severity] ?? r.severity}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.td}>{r.description}{r.location ? ` (${r.location})` : ""}</Text>
                {r.resolution ? (
                  <Text style={[s.td, { color: C.safe }]}>→ 조치: {r.resolution} ({kst(r.resolved_at)})</Text>
                ) : null}
              </View>
              <Text style={[s.td, { width: 42, color: r.status === "resolved" ? C.safe : C.caution }]}>
                {r.status === "resolved" ? "조치완료" : "접수"}
              </Text>
            </View>
          ))}
          {d.reports.length === 0 && (
            <View style={s.row}><Text style={s.td}>기간 내 기록 없음</Text></View>
          )}
        </View>

        {/* 3. 공지·주지 */}
        <Text style={s.h2}>3. 안전 공지·수칙 주지 기록</Text>
        <View style={s.box}>
          <View style={s.headRow}>
            <Text style={[s.th, { width: 72 }]}>게시일</Text>
            <Text style={[s.th, { width: 40 }]}>구분</Text>
            <Text style={[s.th, { flex: 1 }]}>제목</Text>
            <Text style={[s.th, { width: 55 }]}>확인 서명</Text>
          </View>
          {d.notices.map((n, i) => (
            <View key={i} style={s.row} wrap={false}>
              <Text style={[s.td, { width: 72 }]}>{kst(n.created_at)}</Text>
              <Text style={[s.td, { width: 40 }]}>{NKIND[n.kind] ?? n.kind}</Text>
              <Text style={[s.td, { flex: 1 }]}>{n.title}</Text>
              <Text style={[s.td, { width: 55 }]}>{n.ackCount}명</Text>
            </View>
          ))}
          {d.notices.length === 0 && (
            <View style={s.row}><Text style={s.td}>기간 내 공지 없음</Text></View>
          )}
        </View>

        {d.acks.length > 0 && (
          <>
            <Text style={s.h2}>3-1. 근로자 확인 서명 상세</Text>
            <View style={s.box}>
              <View style={s.headRow}>
                <Text style={[s.th, { width: 72 }]}>확인일시</Text>
                <Text style={[s.th, { width: 55 }]}>근로자</Text>
                <Text style={[s.th, { flex: 1 }]}>공지</Text>
                <Text style={[s.th, { width: 62 }]}>증빙해시</Text>
              </View>
              {d.acks.map((a, i) => (
                <View key={i} style={s.row} wrap={false}>
                  <Text style={[s.td, { width: 72 }]}>{kst(a.created_at)}</Text>
                  <Text style={[s.td, { width: 55 }]}>{a.worker_name}</Text>
                  <Text style={[s.td, { flex: 1 }]}>{a.noticeTitle}</Text>
                  <Text style={[s.td, { width: 62, color: C.muted }]}>{a.hash.slice(0, 10)}…</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* 4. 안전보건교육 */}
        <Text style={s.h2}>4. 안전보건교육 실시·이수 기록</Text>
        <View style={s.box}>
          <View style={s.headRow}>
            <Text style={[s.th, { width: 72 }]}>배포일</Text>
            <Text style={[s.th, { width: 45 }]}>구분</Text>
            <Text style={[s.th, { flex: 1 }]}>교육명</Text>
            <Text style={[s.th, { width: 55 }]}>이수 서명</Text>
          </View>
          {d.trainings.map((t, i) => (
            <View key={i} style={s.row} wrap={false}>
              <Text style={[s.td, { width: 72 }]}>{kst(t.created_at)}</Text>
              <Text style={[s.td, { width: 45 }]}>{TTYPE[t.training_type] ?? t.training_type}</Text>
              <Text style={[s.td, { flex: 1 }]}>{t.title}</Text>
              <Text style={[s.td, { width: 55 }]}>{t.ackCount}명</Text>
            </View>
          ))}
          {d.trainings.length === 0 && (
            <View style={s.row}><Text style={s.td}>기간 내 교육 없음</Text></View>
          )}
        </View>

        {d.trainingAcks.length > 0 && (
          <>
            <Text style={s.h2}>4-1. 근로자 이수 서명 상세</Text>
            <View style={s.box}>
              <View style={s.headRow}>
                <Text style={[s.th, { width: 72 }]}>이수일시</Text>
                <Text style={[s.th, { width: 55 }]}>근로자</Text>
                <Text style={[s.th, { flex: 1 }]}>교육</Text>
                <Text style={[s.th, { width: 62 }]}>증빙해시</Text>
              </View>
              {d.trainingAcks.map((a, i) => (
                <View key={i} style={s.row} wrap={false}>
                  <Text style={[s.td, { width: 72 }]}>{kst(a.created_at)}</Text>
                  <Text style={[s.td, { width: 55 }]}>{a.worker_name}</Text>
                  <Text style={[s.td, { flex: 1 }]}>{a.trainingTitle}</Text>
                  <Text style={[s.td, { width: 62, color: C.muted }]}>{a.hash.slice(0, 10)}…</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* 5. 예산 편성·집행 */}
        <Text style={s.h2}>5. 안전보건 예산 편성·집행 대장</Text>
        <View style={s.box}>
          <View style={s.headRow}>
            <Text style={[s.th, { width: 34 }]}>연도</Text>
            <Text style={[s.th, { width: 55 }]}>분류</Text>
            <Text style={[s.th, { flex: 1 }]}>항목</Text>
            <Text style={[s.th, { width: 76, textAlign: "right" }]}>편성</Text>
            <Text style={[s.th, { width: 76, textAlign: "right" }]}>집행(누계)</Text>
          </View>
          {d.budgetItems.map((b, i) => (
            <View key={i} style={s.row} wrap={false}>
              <Text style={[s.td, { width: 34 }]}>{b.year}</Text>
              <Text style={[s.td, { width: 55 }]}>{BCAT[b.category] ?? b.category}</Text>
              <Text style={[s.td, { flex: 1 }]}>{b.label}</Text>
              <Text style={[s.td, { width: 76, textAlign: "right" }]}>{won(b.planned_amount)}</Text>
              <Text style={[s.td, { width: 76, textAlign: "right" }]}>{won(b.executed)}</Text>
            </View>
          ))}
          {d.budgetItems.length === 0 && (
            <View style={s.row}><Text style={s.td}>편성된 예산 없음</Text></View>
          )}
        </View>

        {d.budgetExecutions.length > 0 && (
          <>
            <Text style={s.h2}>5-1. 기간 내 집행 상세</Text>
            <View style={s.box}>
              <View style={s.headRow}>
                <Text style={[s.th, { width: 72 }]}>집행일시</Text>
                <Text style={[s.th, { flex: 1 }]}>항목 / 내용</Text>
                <Text style={[s.th, { width: 70, textAlign: "right" }]}>금액</Text>
                <Text style={[s.th, { width: 38 }]}>영수증</Text>
                <Text style={[s.th, { width: 62 }]}>증빙해시</Text>
              </View>
              {d.budgetExecutions.map((ex, i) => (
                <View key={i} style={s.row} wrap={false}>
                  <Text style={[s.td, { width: 72 }]}>{kst(ex.created_at)}</Text>
                  <Text style={[s.td, { flex: 1 }]}>{ex.itemLabel}{ex.note ? ` — ${ex.note}` : ""}</Text>
                  <Text style={[s.td, { width: 70, textAlign: "right" }]}>{won(ex.amount)}</Text>
                  <Text style={[s.td, { width: 38 }]}>{ex.hasReceipt ? "첨부" : "—"}</Text>
                  <Text style={[s.td, { width: 62, color: C.muted }]}>{ex.hash.slice(0, 10)}…</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Footer />
      </Page>
    </Document>
  );

  return Buffer.from(await renderToBuffer(doc));
}
