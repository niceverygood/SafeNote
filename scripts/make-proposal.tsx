/**
 * SafeNote 제휴 제안서 (PDF). 디자인 시스템 적용. 실행: npx tsx scripts/make-proposal.tsx
 * 원칙: "면책 보장" 류 표현 없음, 하단 법적 고지.
 */
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Svg, Circle, renderToFile } from "@react-pdf/renderer";
import { join } from "node:path";

const C = { surface: "#F6F7F5", ink: "#16201C", safe: "#15643E", caution: "#C2841C", border: "#DCE0DA", muted: "#5C6B62", white: "#FFFFFF" };
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
  page: { fontFamily: "Pretendard", color: C.ink, backgroundColor: C.surface, paddingTop: 48, paddingBottom: 56, paddingHorizontal: 48, fontSize: 10.5, lineHeight: 1.55 },
  wordmark: { fontSize: 9, letterSpacing: 4, color: C.safe, fontWeight: 700 },
  eyebrow: { fontSize: 9.5, letterSpacing: 1, color: C.muted, fontWeight: 600, marginBottom: 8 },
  h1: { fontSize: 26, fontWeight: 800, lineHeight: 1.2, marginBottom: 12 },
  h2: { fontSize: 16, fontWeight: 800, marginBottom: 8, marginTop: 4 },
  h3: { fontSize: 11.5, fontWeight: 700, marginBottom: 3 },
  body: { fontSize: 10.5, lineHeight: 1.55 },
  muted: { color: C.muted },
  rule: { height: 3, width: 44, backgroundColor: C.safe, marginBottom: 14 },
  card: { borderWidth: 1, borderColor: C.border, borderRadius: 8, backgroundColor: C.white, padding: 14, marginBottom: 10 },
  footer: { position: "absolute", bottom: 26, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: C.muted, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8 },
  th: { fontSize: 9, fontWeight: 700, color: C.muted },
  td: { fontSize: 9.5 },
});

function Footer({ p }: { p: string }) {
  return (<View style={s.footer} fixed><Text>본 자료는 법률자문을 대체하지 않습니다.</Text><Text>세이프노트 제휴 제안 · {p}</Text></View>);
}
function Bullet({ children }: { children: React.ReactNode }) {
  return (<View style={{ flexDirection: "row", marginBottom: 6 }}><View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.safe, marginTop: 5, marginRight: 8 }} /><Text style={{ flex: 1, fontSize: 10.5, lineHeight: 1.5 }}>{children}</Text></View>);
}

const Doc = (
  <Document title="세이프노트 제휴 제안서" author="SafeNote">
    {/* 표지 */}
    <Page size="A4" style={s.page}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={s.wordmark}>S A F E N O T E</Text>
        <Text style={[s.muted, { fontSize: 8.5 }]}>Partnership Proposal</Text>
      </View>
      <View style={{ marginTop: 150 }}>
        <Text style={s.eyebrow}>중대재해처벌법 면책 증빙 SaaS · 제휴 제안</Text>
        <Text style={s.h1}>전문가의 자문은 그대로,{"\n"}반복 실무는 도구로.</Text>
        <Text style={[s.body, s.muted, { maxWidth: 380 }]}>
          노무사·세무사·협회·보험 파트너가 고객의 중대재해처벌법 증빙 관리를 부담 없이
          지원하고, 부가 수익과 고객 리텐션을 함께 얻는 제휴 모델을 제안합니다.
        </Text>
      </View>
      <View style={{ position: "absolute", left: 48, right: 48, bottom: 90, borderLeftWidth: 3, borderLeftColor: C.caution, paddingLeft: 12 }}>
        <Text style={{ fontSize: 10 }}>2024년부터 5인 이상 전 사업장 적용 — 의무 대상은 급증, 도달 경로(파트너)는 이미 존재합니다.</Text>
      </View>
      <Footer p="표지" />
    </Page>

    {/* 문제 + 기회 */}
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>PROBLEM & OPPORTUNITY</Text>
      <View style={s.rule} />
      <Text style={s.h2}>5~49인 사업장의 구조적 공백</Text>
      <Text style={[s.body, { marginBottom: 8 }]}>
        중대재해처벌법은 2024년부터 5인 이상 전 사업장에 적용됩니다. 그러나 5~49인
        사업장 상당수는 전담 안전 인력이 없어, 대표가 직접 체계 구축·이행을 챙겨야 합니다.
        수사·재판에서 다투어지는 것은 “위험성평가를 했는가, 기록이 있는가, 정기적으로
        갱신되었는가” — 즉 <Text style={{ fontWeight: 700 }}>증빙의 존재와 연속성</Text>입니다.
      </Text>
      <Text style={[s.body, s.muted, { marginBottom: 14 }]}>
        전문직 입장에서도 고객사마다 평가·점검 기록을 수기로 관리·갱신하는 것은 시간 대비
        수익성이 낮고, 누락·지연 시 부담만 남습니다.
      </Text>

      <Text style={s.h2}>시장 기회</Text>
      <Bullet>적용 범위가 5인 이상 전 사업장으로 확대 — 의무 대상 사업장 수 급증</Bullet>
      <Bullet>대부분 전담자가 없어 외부 전문가 의존 또는 방치 상태</Bullet>
      <Bullet>노무사·세무사·협회는 이미 이 사업장들과 정기 거래 — 가장 자연스러운 전달 채널</Bullet>
      <Text style={[s.body, { marginTop: 8 }]}>
        수요는 이미 발생했고 도달 경로는 존재합니다. 비어 있는 것은 비전문가가 스스로
        증빙을 쌓을 수 있는 실무 도구입니다.
      </Text>
      <Footer p="01 · 문제와 기회" />
    </Page>

    {/* SafeNote + 파트너 이점 */}
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>SOLUTION & PARTNER VALUE</Text>
      <View style={s.rule} />
      <Text style={s.h2}>SafeNote는 무엇인가</Text>
      <View style={s.card}>
        <Text style={s.h3}>무료 면책 자가진단</Text>
        <Text style={[s.body, s.muted]}>5분 입력으로 9대 의무 이행 상태·이행률·리스크 등급을 점검표로 제시. 가입 없이 상담 진입점으로 활용.</Text>
      </View>
      <View style={s.card}>
        <Text style={s.h3}>위험성평가 생성기</Text>
        <Text style={[s.body, s.muted]}>업종별 위험요인을 규칙 기반으로 도출하고 규정 근거로 초안 작성. 위험도는 자동 산정이 아니라 사용자가 빈도×강도로 직접 확정 — 판단 주체는 사용자.</Text>
      </View>
      <View style={s.card}>
        <Text style={s.h3}>상시 증빙 축적</Text>
        <Text style={[s.body, s.muted]}>일회성 서류가 아니라 점검·갱신 이력이 누적. 모든 산출물에 법적 고지를 포함하며, 전문가의 자문을 대체하지 않고 번거로운 실무·문서화·갱신을 자동화합니다.</Text>
      </View>

      <Text style={s.h2}>파트너 이점</Text>
      <Bullet><Text style={{ fontWeight: 700 }}>고객 리텐션</Text> — 실질적 불안을 다루는 도구로 관계 확장, 이탈 감소</Bullet>
      <Bullet><Text style={{ fontWeight: 700 }}>부가 수익</Text> — 추천 수수료 또는 화이트라벨 마진, 업무 부담 없이 추가 매출</Bullet>
      <Bullet><Text style={{ fontWeight: 700 }}>차별화</Text> — “중대재해처벌법 증빙 관리까지 지원” 포지셔닝</Bullet>
      <Bullet><Text style={{ fontWeight: 700 }}>업무 경감</Text> — 수기 관리 부담을 검증된 도구로 위임</Bullet>
      <Footer p="02 · 솔루션과 이점" />
    </Page>

    {/* 협업 모델 + 수수료 + 절차 + 문의 */}
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>MODEL · TERMS · NEXT STEPS</Text>
      <View style={s.rule} />
      <Text style={s.h2}>협업 모델</Text>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 6 }}>
        <View style={[s.card, { flex: 1 }]}>
          <Text style={s.h3}>(A) 추천(Referral)</Text>
          <Text style={[s.body, s.muted]}>전용 링크/코드로 고객에게 안내. 유료 전환 시 수수료 지급. 도입이 가장 가벼움.</Text>
        </View>
        <View style={[s.card, { flex: 1 }]}>
          <Text style={s.h3}>(B) 화이트라벨</Text>
          <Text style={[s.body, s.muted]}>파트너 브랜드로 제공. 공급가와 판매가의 차액을 마진으로. 다수 고객 보유처에 적합.</Text>
        </View>
      </View>

      <Text style={s.h2}>수수료 구조 예시 (조정 가능)</Text>
      <View style={[s.card, { padding: 0 }]}>
        <View style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: C.border, backgroundColor: C.surface, paddingVertical: 6, paddingHorizontal: 10 }}>
          <Text style={[s.th, { width: 90 }]}>모델</Text><Text style={[s.th, { width: 80 }]}>기준</Text><Text style={[s.th, { flex: 1 }]}>예시 조건</Text>
        </View>
        <View style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: C.border, paddingVertical: 6, paddingHorizontal: 10 }}>
          <Text style={[s.td, { width: 90 }]}>추천</Text><Text style={[s.td, { width: 80 }]}>유료 전환 시</Text><Text style={[s.td, { flex: 1 }]}>첫 결제액 20~30% 또는 유지 기간 매월 15%</Text>
        </View>
        <View style={{ flexDirection: "row", paddingVertical: 6, paddingHorizontal: 10 }}>
          <Text style={[s.td, { width: 90 }]}>화이트라벨</Text><Text style={[s.td, { width: 80 }]}>공급가 기준</Text><Text style={[s.td, { flex: 1 }]}>파트너 마진 자유 설정(권장 30~50%)</Text>
        </View>
      </View>
      <Text style={[s.body, s.muted, { fontSize: 9, marginTop: 6 }]}>참고 요금(일반가): 무료 진단 / 스탠다드 4.9만원·월 / 프로 9.9만원·월. 화이트라벨 공급가는 별도 협의. 정산 주기·추적 방식·최소 기준은 계약 시 확정.</Text>

      <Text style={[s.h2, { marginTop: 10 }]}>시작 절차</Text>
      <Bullet>소개 미팅(30분) — 고객 구성과 적합 모델 점검</Bullet>
      <Bullet>파일럿 — 전용 링크/화이트라벨 발급, 무료 자가진단부터 안내</Bullet>
      <Bullet>정산 합의 — 수수료율·주기·추적 방식 문서화 → 본격 운영</Bullet>

      <View style={{ marginTop: 14, borderTopWidth: 1, borderColor: C.border, paddingTop: 10 }}>
        <Text style={s.h3}>문의</Text>
        <Text style={[s.body, s.muted]}>SafeNote 제휴팀 · 이메일/연락처 기입 · 데모: safe-note-roan.vercel.app/diagnosis</Text>
      </View>
      <Footer p="03 · 모델과 시작" />
    </Page>
  </Document>
);

renderToFile(Doc, join(process.cwd(), "docs", "marketing", "SafeNote-제휴제안서.pdf")).then(() => console.log("✓ 생성: docs/marketing/SafeNote-제휴제안서.pdf"));
