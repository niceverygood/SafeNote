/**
 * 위험성평가표 PDF 렌더링 (공문서 품질). @react-pdf/renderer / renderToBuffer.
 * - 표지(업종/공정/상태/일자) + 위험성평가표 [유해위험요인 / 위험도 / 감소대책 / 담당·기한]
 * - 출처 인용 각주, draft 워터마크, confirmed 직인 영역 + 확정일자
 * - 필수 고지문: "본 자료는 법률자문을 대체하지 않습니다."
 *
 * 서버 전용 (runtime nodejs).
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { RiskItem } from "@/lib/rules/types";
import { RISK_LEVEL_META } from "@/lib/status";

// 한글 가능 폰트 등록 (CDN OTF). 실패해도 throw 하지 않도록 1회만 등록.
let fontsRegistered = false;
function ensureFonts() {
  if (fontsRegistered) return;
  try {
    Font.register({
      family: "Pretendard",
      fonts: [
        {
          src: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/public/static/Pretendard-Regular.otf",
          fontWeight: 400,
        },
        {
          src: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/public/static/Pretendard-Bold.otf",
          fontWeight: 700,
        },
      ],
    });
    // 줄바꿈(한글) 하이픈 방지
    Font.registerHyphenationCallback((word) => [word]);
    fontsRegistered = true;
  } catch {
    // 폰트 등록 실패 시에도 렌더 자체는 진행 (텍스트가 깨질 수 있으나 robust)
    fontsRegistered = true;
  }
}

// 색 토큰 (디자인 시스템과 동일)
const C = {
  ink: "#16201C",
  muted: "#5C6B62",
  border: "#DCE0DA",
  surface: "#F6F7F5",
  safe: "#15643E",
  caution: "#C2841C",
  danger: "#A82B22",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Pretendard",
    fontSize: 9,
    color: C.ink,
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 40,
    position: "relative",
  },
  watermark: {
    position: "absolute",
    top: 320,
    left: 90,
    fontSize: 96,
    color: "#A82B2212",
    fontWeight: 700,
    transform: "rotate(-28deg)",
  },
  docHeader: {
    borderBottomWidth: 2,
    borderBottomColor: C.ink,
    paddingBottom: 10,
    marginBottom: 16,
  },
  docKicker: {
    fontSize: 8,
    color: C.muted,
    letterSpacing: 2,
    marginBottom: 4,
  },
  docTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: C.ink,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  metaCell: {
    width: "50%",
    flexDirection: "row",
    marginBottom: 4,
  },
  metaLabel: {
    width: 64,
    color: C.muted,
    fontSize: 8,
  },
  metaValue: {
    flex: 1,
    fontSize: 9,
    color: C.ink,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 700,
    marginBottom: 14,
  },
  // 표
  table: {
    borderWidth: 1,
    borderColor: C.border,
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  trHead: {
    backgroundColor: C.surface,
  },
  th: {
    fontSize: 8,
    fontWeight: 700,
    color: C.ink,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  td: {
    fontSize: 8.5,
    color: C.ink,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  cNo: { width: "6%", borderRightWidth: 1, borderRightColor: C.border },
  cHazard: { width: "30%", borderRightWidth: 1, borderRightColor: C.border },
  cRisk: { width: "14%", borderRightWidth: 1, borderRightColor: C.border, alignItems: "flex-start" },
  cMeasure: { width: "32%", borderRightWidth: 1, borderRightColor: C.border },
  cOwner: { width: "18%" },
  riskPill: {
    fontSize: 8,
    fontWeight: 700,
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 3,
  },
  freqSev: {
    fontSize: 7,
    color: C.muted,
    marginTop: 2,
  },
  cite: {
    fontSize: 7,
    color: C.muted,
    marginTop: 3,
  },
  flag: {
    fontSize: 7,
    color: C.caution,
    fontWeight: 700,
    marginTop: 2,
  },
  emptyBox: {
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "dashed",
    padding: 18,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 9,
    color: C.muted,
    textAlign: "center",
  },
  // 각주
  footnotes: {
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  footHead: {
    fontSize: 8,
    fontWeight: 700,
    color: C.ink,
    marginBottom: 4,
  },
  footItem: {
    fontSize: 7.5,
    color: C.muted,
    marginBottom: 2,
  },
  // 직인/서명 영역
  signRow: {
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  sealBox: {
    width: 150,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    padding: 10,
    alignItems: "center",
  },
  sealConfirmed: {
    borderColor: C.safe,
  },
  sealLabel: {
    fontSize: 7,
    color: C.muted,
    marginBottom: 6,
  },
  sealMark: {
    fontSize: 14,
    fontWeight: 700,
    color: C.safe,
    borderWidth: 1.5,
    borderColor: C.safe,
    borderRadius: 40,
    width: 56,
    height: 56,
    textAlign: "center",
    paddingTop: 18,
  },
  sealDate: {
    fontSize: 7,
    color: C.muted,
    marginTop: 6,
  },
  sealEmpty: {
    fontSize: 8,
    color: C.muted,
    height: 56,
    paddingTop: 24,
  },
  // 고지
  disclaimer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    fontSize: 7.5,
    color: C.muted,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 6,
  },
  pageNo: {
    position: "absolute",
    bottom: 14,
    right: 40,
    fontSize: 7,
    color: C.muted,
  },
});

function riskColor(level: RiskItem["risk_level"]): string {
  return RISK_LEVEL_META[level].hex;
}

function riskLabel(level: RiskItem["risk_level"]): string {
  return RISK_LEVEL_META[level].label;
}

export interface RiskPdfData {
  id: string;
  process: string;
  industry_name?: string;
  status: "draft" | "confirmed";
  confirmed_at: string | null;
  created_at: string | null;
  items: RiskItem[];
  source_refs: { chunk_id: string; source: string; title: string; label: string }[];
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function RiskDoc({ data }: { data: RiskPdfData }) {
  const isDraft = data.status === "draft";
  const statusStyle = isDraft
    ? { backgroundColor: "#C2841C18", color: C.caution }
    : { backgroundColor: "#15643E18", color: C.safe };

  // 각주에 사용된 출처만 (있으면 전부 표기)
  const refs = data.source_refs ?? [];

  return (
    <Document title={`위험성평가표 ${data.id}`}>
      <Page size="A4" style={styles.page} wrap>
        {isDraft && (
          <Text style={styles.watermark} fixed>
            초안 DRAFT
          </Text>
        )}

        {/* 표지/문서 헤더 */}
        <View style={styles.docHeader}>
          <Text style={styles.docKicker}>SAFENOTE 위험성평가</Text>
          <Text style={styles.docTitle}>위험성평가표</Text>
        </View>

        <Text style={[styles.statusBadge, statusStyle]}>
          {isDraft ? "초안 (미확정)" : "확정 증빙 CONFIRMED"}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>업종</Text>
            <Text style={styles.metaValue}>{data.industry_name || "—"}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>공정/작업</Text>
            <Text style={styles.metaValue}>{data.process || "—"}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>작성일</Text>
            <Text style={styles.metaValue}>{fmtDate(data.created_at)}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>확정일</Text>
            <Text style={styles.metaValue}>{fmtDate(data.confirmed_at)}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>문서 ID</Text>
            <Text style={styles.metaValue}>{data.id}</Text>
          </View>
        </View>

        {/* 위험성평가표 */}
        {data.items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              검색된 근거(규정)가 부족하여 항목을 생성하지 못했습니다.{"\n"}
              근거 자료 보강 후 다시 생성하거나 전문가 검토가 필요합니다.
            </Text>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={[styles.tr, styles.trHead]} fixed>
              <Text style={[styles.th, styles.cNo]}>No</Text>
              <Text style={[styles.th, styles.cHazard]}>유해위험요인</Text>
              <Text style={[styles.th, styles.cRisk]}>위험도</Text>
              <Text style={[styles.th, styles.cMeasure]}>감소대책</Text>
              <Text style={[styles.th, styles.cOwner]}>담당 · 기한</Text>
            </View>

            {data.items.map((it, i) => (
              <View style={styles.tr} key={i} wrap={false}>
                <Text style={[styles.td, styles.cNo]}>{i + 1}</Text>
                <View style={[styles.td, styles.cHazard]}>
                  <Text>{it.hazard || "—"}</Text>
                  {it.source_label ? (
                    <Text style={styles.cite}>출처: {it.source_label}</Text>
                  ) : null}
                  {it.needs_expert_review ? (
                    <Text style={styles.flag}>※ 전문가 검토 필요</Text>
                  ) : null}
                </View>
                <View style={[styles.td, styles.cRisk]}>
                  <Text
                    style={[
                      styles.riskPill,
                      {
                        color: riskColor(it.risk_level),
                        backgroundColor: `${riskColor(it.risk_level)}18`,
                      },
                    ]}
                  >
                    {riskLabel(it.risk_level)}
                  </Text>
                  <Text style={styles.freqSev}>
                    빈도 {it.frequency} · 강도 {it.severity}
                  </Text>
                </View>
                <Text style={[styles.td, styles.cMeasure]}>{it.measure || "—"}</Text>
                <View style={[styles.td, styles.cOwner]}>
                  <Text>{it.owner ? `담당: ${it.owner}` : "담당: —"}</Text>
                  <Text style={{ marginTop: 2 }}>{it.due ? `기한: ${it.due}` : "기한: —"}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 출처 각주 */}
        {refs.length > 0 && (
          <View style={styles.footnotes} wrap={false}>
            <Text style={styles.footHead}>근거 출처</Text>
            {refs.map((r, i) => (
              <Text style={styles.footItem} key={r.chunk_id || i}>
                [{i + 1}] {r.label}
              </Text>
            ))}
          </View>
        )}

        {/* 직인 / 서명 영역 */}
        <View style={styles.signRow} wrap={false}>
          <View style={[styles.sealBox, !isDraft ? styles.sealConfirmed : {}]}>
            <Text style={styles.sealLabel}>
              {isDraft ? "확정 시 직인 표기" : "확정 증빙"}
            </Text>
            {isDraft ? (
              <Text style={styles.sealEmpty}>(미확정)</Text>
            ) : (
              <Text style={styles.sealMark}>인</Text>
            )}
            <Text style={styles.sealDate}>확정일자: {fmtDate(data.confirmed_at)}</Text>
          </View>
        </View>

        {/* 필수 고지 (절대 원칙 4) */}
        <Text style={styles.disclaimer} fixed>
          본 자료는 법률자문을 대체하지 않습니다.
        </Text>
        <Text
          style={styles.pageNo}
          fixed
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </Page>
    </Document>
  );
}

export async function renderRiskPdf(data: RiskPdfData): Promise<Buffer> {
  ensureFonts();
  return renderToBuffer(<RiskDoc data={data} />);
}
