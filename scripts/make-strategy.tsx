/**
 * 세이프노트 — 차별화 전략 + 경쟁사 배틀카드 (내부용 PDF).
 * 실행: npx tsx scripts/make-strategy.tsx
 */
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Svg, Rect, renderToFile } from "@react-pdf/renderer";
import { join } from "node:path";

const C = { surface: "#F6F7F5", ink: "#16201C", safe: "#15643E", caution: "#C2841C", danger: "#A82B22", border: "#DCE0DA", muted: "#5C6B62", white: "#FFFFFF" };
const P = "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static";
Font.register({ family: "Pretendard", fonts: [
  { src: `${P}/Pretendard-Regular.otf`, fontWeight: 400 },
  { src: `${P}/Pretendard-Medium.otf`, fontWeight: 500 },
  { src: `${P}/Pretendard-SemiBold.otf`, fontWeight: 600 },
  { src: `${P}/Pretendard-Bold.otf`, fontWeight: 700 },
  { src: `${P}/Pretendard-ExtraBold.otf`, fontWeight: 800 },
]});
Font.registerHyphenationCallback((w) => [w]);

const s = StyleSheet.create({
  page: { fontFamily: "Pretendard", color: C.ink, backgroundColor: C.surface, paddingTop: 44, paddingBottom: 50, paddingHorizontal: 44, fontSize: 10, lineHeight: 1.5 },
  eyebrow: { fontSize: 9, letterSpacing: 1, color: C.muted, fontWeight: 600, marginBottom: 7 },
  h1: { fontSize: 22, fontWeight: 800, marginBottom: 10 },
  h2: { fontSize: 14, fontWeight: 800, marginTop: 12, marginBottom: 7 },
  h3: { fontSize: 11, fontWeight: 700, marginBottom: 2 },
  body: { fontSize: 10, lineHeight: 1.5 },
  muted: { color: C.muted },
  rule: { height: 3, width: 40, backgroundColor: C.safe, marginBottom: 12 },
  card: { borderWidth: 1, borderColor: C.border, borderRadius: 7, backgroundColor: C.white, padding: 11, marginBottom: 8 },
  footer: { position: "absolute", bottom: 22, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: C.muted, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 7 },
  th: { fontSize: 8.5, fontWeight: 700, color: C.muted },
  td: { fontSize: 9, lineHeight: 1.4 },
});

function Logo({ size = 18 }: { size?: number }) {
  return (<Svg width={size} height={size} viewBox="0 0 24 24"><Rect x="1" y="1" width="22" height="22" rx="5" fill="#15643E1A" stroke="#15643E66" strokeWidth="1.2" /><Rect x="8" y="8" width="8" height="8" rx="2" fill="#15643E" /></Svg>);
}
function Footer({ p }: { p: string }) {
  return (<View style={s.footer} fixed><Text>세이프노트 내부 전략 자료 · 대외비</Text><Text>{p}</Text></View>);
}
function Bullet({ children, tone = C.safe }: { children: React.ReactNode; tone?: string }) {
  return (<View style={{ flexDirection: "row", marginBottom: 5 }}><View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: tone, marginTop: 5, marginRight: 7 }} /><Text style={{ flex: 1, fontSize: 10, lineHeight: 1.45 }}>{children}</Text></View>);
}
function Cell({ w, bold, children }: { w: number | string; bold?: boolean; children: React.ReactNode }) {
  return <Text style={[s.td, { width: w as number, fontWeight: bold ? 700 : 400, paddingRight: 6 }]}>{children}</Text>;
}

const battle: [string, string, string][] = [
  ["스마플 (대한산업안전협회)", "협회 브랜드·통합 플랫폼", "협회 표준은 준수. 우리는 위변조 불가 증빙 + 전담자 없이 5분. 무겁지 않음."],
  ["세이프로·SCSC (변호사)", "변호사 신뢰·상시 점검(월 50만원)", "변호사 증거능력 검토 반영 + 대표가 직접 쌓는 저비용 상시 증빙."],
  ["KOSHA 안전지키미 (무료)", "무료·근로자 앱·위험성평가", "무료는 ‘점검’을 도움. 우리는 사고 시 다툴 수 있는 ‘무결성·연속성 증빙’."],
  ["카스웍스 (건설)", "건설 특화·모바일 TBM·QR", "건설 강세 회피. 비건설 제조·물류·폐기물 5~49인 + 면책 프레임."],
];

const objections: [string, string][] = [
  ["“KOSHA 무료로 하면 되잖아?”", "위험성평가 문서는 KOSHA로 충분합니다. 문제는 사고 시 ‘그걸 상시 이행했고 기록이 위변조되지 않았다’를 증명하는 것. 세이프노트가 그 증거를 자동으로 남깁니다."],
  ["“협회·변호사 솔루션이 더 믿음직한데?”", "그 신뢰, 저희도 변호사 증거능력 검토로 확보했고 노무사 제휴로 연결됩니다. 차이는 전담자 없이 대표가 5분에 한다는 것."],
  ["“이거 쓰면 면책되나요?”", "면책을 보장하는 제품은 없습니다(그렇게 말하면 허위광고). 세이프노트는 면책을 다툴 객관적 근거를 남기는 도구입니다 — 이 정직함이 오히려 신뢰의 차별점."],
];

const Doc = (
  <Document title="세이프노트 차별화 전략·배틀카드" author="SafeNote">
    {/* 1. 차별화 전략 */}
    <Page size="A4" style={s.page}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 4 }}>
        <Logo size={18} /><Text style={s.eyebrow}>STRATEGY · 대외비</Text>
      </View>
      <View style={s.rule} />
      <Text style={s.h1}>차별화 전략</Text>

      <View style={[s.card, { borderColor: C.safe, borderWidth: 2, backgroundColor: "#15643E0A" }]}>
        <Text style={[s.h3, { color: C.safe }]}>포지셔닝 쐐기</Text>
        <Text style={s.body}>
          경쟁사는 “안전관리를 돕는다”. 세이프노트는 “사고 났을 때 대표가 의무를 이행했다는
          <Text style={{ fontWeight: 700 }}> 증거</Text>를 남긴다.” 카테고리를 *안전관리 도구*(협회·KOSHA 소유)에서
          <Text style={{ fontWeight: 700 }}> ‘면책 증빙 인프라’</Text>로 옮긴다 — 여기가 경쟁 공백.
        </Text>
      </View>

      <Text style={s.h2}>못 베끼는 차별화 축 4</Text>
      <Bullet><Text style={{ fontWeight: 700 }}>① 증거 무결성(불변 해시체인)</Text> — “했다”가 아니라 “그 시각에, 위변조 없이 했다”. 수사·재판이 다투는 건 기록의 신뢰성. 기술 해자.</Bullet>
      <Bullet><Text style={{ fontWeight: 700 }}>② 작업 전·중·후 상시 원장</Text> — 문서 1건 스냅샷이 아니라 현장 행동이 연속으로 쌓이는 ledger. ‘연속 이행’ 입증.</Bullet>
      <Bullet><Text style={{ fontWeight: 700 }}>③ 안전이 아니라 법적 리스크를 관리</Text> — 9대 의무 매핑·면책 게이지·‘지금 사고 시 리스크’. 대표의 구매 동기(형사처벌 공포)를 정면으로.</Bullet>
      <Bullet><Text style={{ fontWeight: 700 }}>④ 비전문가·전담자 없는 5~49인 UX</Text> — 5분·아이디/비번·모바일. 협회 플랫폼·EHS는 무겁고 전문가용.</Bullet>

      <Text style={s.h2}>하지 말 것 (지는 싸움)</Text>
      <Bullet tone={C.danger}>위험성평가 단품 후킹 → KOSHA·안전지키미 무료와 정면충돌. 위험성평가는 증빙 파이프라인의 ‘입력’으로만.</Bullet>
      <Bullet tone={C.danger}>협회·변호사 ‘신뢰’ 정면 대결 → 이기려 말고 제휴로 빌려온다.</Bullet>
      <Bullet tone={C.danger}>건설 대형현장 → 카스웍스·대형 EHS 강세. 비건설 소규모로 우회.</Bullet>
      <Footer p="01 · 차별화 전략" />
    </Page>

    {/* 2. 배틀카드 */}
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>BATTLECARD · 경쟁 대응</Text>
      <View style={s.rule} />
      <Text style={s.h1}>경쟁사 배틀카드</Text>
      <Text style={[s.body, s.muted, { marginBottom: 8 }]}>영업 중 “○○랑 뭐가 달라?”에 바로 쓰는 대응.</Text>

      <View style={[s.card, { padding: 0 }]}>
        <View style={{ flexDirection: "row", backgroundColor: C.surface, borderBottomWidth: 1, borderColor: C.border, paddingVertical: 6, paddingHorizontal: 10 }}>
          <Text style={[s.th, { width: 135 }]}>경쟁사</Text><Text style={[s.th, { width: 120 }]}>그들의 강점</Text><Text style={[s.th, { flex: 1 }]}>세이프노트 대응</Text>
        </View>
        {battle.map(([a, b, c], i) => (
          <View key={i} style={{ flexDirection: "row", borderBottomWidth: i < battle.length - 1 ? 1 : 0, borderColor: C.border, paddingVertical: 7, paddingHorizontal: 10, alignItems: "flex-start" }}>
            <Cell w={135} bold>{a}</Cell><Cell w={120}>{b}</Cell><Text style={[s.td, { flex: 1 }]}>{c}</Text>
          </View>
        ))}
      </View>

      <Text style={s.h2}>고객 반론 대응 스크립트</Text>
      {objections.map(([q, ans], i) => (
        <View key={i} style={s.card}>
          <Text style={[s.h3, { color: C.caution }]}>{q}</Text>
          <Text style={s.body}>{ans}</Text>
        </View>
      ))}
      <Footer p="02 · 배틀카드" />
    </Page>

    {/* 3. 진입 쐐기 & 해자 */}
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>GO-TO-MARKET · MOAT</Text>
      <View style={s.rule} />
      <Text style={s.h1}>진입 쐐기 & 해자</Text>

      <Text style={s.h2}>진입 쐐기 (GTM)</Text>
      <Bullet><Text style={{ fontWeight: 700 }}>세그먼트</Text>: 5~49인 비건설(제조·물류·폐기물·정비) — 경쟁 공백.</Bullet>
      <Bullet><Text style={{ fontWeight: 700 }}>채널</Text>: 노무사·세무사 제휴(고객 접점) + 검색(면책·처벌 공포 키워드).</Bullet>
      <Bullet><Text style={{ fontWeight: 700 }}>깔때기</Text>: 무료 자가진단 → 리드 → 현장 증빙 구독.</Bullet>
      <Bullet><Text style={{ fontWeight: 700 }}>메시지</Text>: “위험성평가 자동화”(무료와 충돌) 대신 “상시 쌓이는 면책 증빙”.</Bullet>

      <Text style={s.h2}>신뢰 약점 보완 — 빌려오기</Text>
      <Bullet>변호사 ‘증거능력 검토 의견’ 확보 → “법적으로 다툴 수 있는 기록”을 제3자 검증으로 마케팅.</Bullet>
      <Bullet>노무사·세무사·협회 제휴 → 신뢰 + 유통 동시 확보.</Bullet>
      <Bullet>실제 사고 대응 레퍼런스 1건 = 최고 자산.</Bullet>

      <Text style={s.h2}>시간이 갈수록 강해지는 해자</Text>
      <Bullet>사업장별 축적 증빙 데이터(전환비용↑) · 업종별 hazard 코퍼스.</Bullet>
      <Bullet>제휴망 · 레퍼런스. 초기 승부처 = 제휴·레퍼런스 확보 ‘속도’.</Bullet>

      <View style={[s.card, { marginTop: 12, borderColor: C.safe, backgroundColor: "#15643E0A" }]}>
        <Text style={[s.h3, { color: C.safe }]}>한 줄 요약</Text>
        <Text style={s.body}>위험성평가를 팔지 말고(무료와 경쟁), “위변조 불가능한 면책 증빙 인프라”를 팔아라. 신뢰는 변호사·노무사 제휴로 빌리고, 비건설 5~49인으로 쐐기를 박아라.</Text>
      </View>
      <Footer p="03 · GTM·해자" />
    </Page>
  </Document>
);

renderToFile(Doc, join(process.cwd(), "docs", "marketing", "SafeNote-차별화전략-배틀카드.pdf")).then(() => console.log("✓ 생성: docs/marketing/SafeNote-차별화전략-배틀카드.pdf"));
