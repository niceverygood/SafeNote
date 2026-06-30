/**
 * 세이프노트 — 변호사 법률 검토 요청 자료 (PDF).
 * 목적: 제품 소개 + "면책 기여도 및 법적 리스크" 검토 요청. 자료 자체는 면책을 단정하지 않는다.
 * 실행: npx tsx scripts/make-lawyer-brief.tsx
 */
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Svg, Rect, renderToFile } from "@react-pdf/renderer";
import { join } from "node:path";

const C = { surface: "#F6F7F5", ink: "#16201C", safe: "#15643E", caution: "#C2841C", danger: "#A82B22", border: "#DCE0DA", muted: "#5C6B62", white: "#FFFFFF" };
const CONTACT = { company: "Bottle Corp.", email: "dev@bottlecorp.kr", phone: "", web: "safe-note-roan.vercel.app" };

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
  page: { fontFamily: "Pretendard", color: C.ink, backgroundColor: C.surface, paddingTop: 46, paddingBottom: 54, paddingHorizontal: 46, fontSize: 10, lineHeight: 1.55 },
  wordmark: { fontSize: 9, letterSpacing: 4, color: C.safe, fontWeight: 700 },
  eyebrow: { fontSize: 9, letterSpacing: 1, color: C.muted, fontWeight: 600, marginBottom: 8 },
  h1: { fontSize: 24, fontWeight: 800, lineHeight: 1.22, marginBottom: 12 },
  h2: { fontSize: 15, fontWeight: 800, marginBottom: 8, marginTop: 2 },
  h3: { fontSize: 11, fontWeight: 700, marginBottom: 3 },
  body: { fontSize: 10, lineHeight: 1.55 },
  muted: { color: C.muted },
  rule: { height: 3, width: 42, backgroundColor: C.safe, marginBottom: 13 },
  card: { borderWidth: 1, borderColor: C.border, borderRadius: 8, backgroundColor: C.white, padding: 13, marginBottom: 9 },
  footer: { position: "absolute", bottom: 24, left: 46, right: 46, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: C.muted, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 7 },
  th: { fontSize: 8.5, fontWeight: 700, color: C.muted },
  td: { fontSize: 9 },
});

function LogoMark({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="1" y="1" width="22" height="22" rx="5" fill="#15643E1A" stroke="#15643E66" strokeWidth="1.2" />
      <Rect x="8" y="8" width="8" height="8" rx="2" fill="#15643E" />
    </Svg>
  );
}
function Footer({ p }: { p: string }) {
  return (<View style={s.footer} fixed><Text>본 자료는 법률자문을 대체하지 않습니다. 검토 요청용 내부 자료.</Text><Text>세이프노트 법률 검토 요청 · {p}</Text></View>);
}
function Num({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 9 }}>
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: C.safe, alignItems: "center", justifyContent: "center", marginRight: 9 }}>
        <Text style={{ color: C.white, fontWeight: 800, fontSize: 9 }}>{n}</Text>
      </View>
      <Text style={{ flex: 1, fontSize: 10, lineHeight: 1.5 }}>{children}</Text>
    </View>
  );
}
function Row({ a, b }: { a: string; b: string }) {
  return (
    <View style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: C.border, paddingVertical: 5, paddingHorizontal: 9 }}>
      <Text style={[s.td, { width: 150, fontWeight: 600 }]}>{a}</Text>
      <Text style={[s.td, { flex: 1, color: C.muted }]}>{b}</Text>
    </View>
  );
}

const Doc = (
  <Document title="세이프노트 법률 검토 요청 자료" author="SafeNote">
    {/* 표지 */}
    <Page size="A4" style={s.page}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <LogoMark size={18} /><Text style={s.wordmark}>S A F E N O T E</Text>
        </View>
        <Text style={[s.muted, { fontSize: 8.5 }]}>Legal Review Request</Text>
      </View>
      <View style={{ marginTop: 140 }}>
        <Text style={s.eyebrow}>중대재해처벌법 면책 증빙 시스템 · 법률 검토 요청</Text>
        <Text style={s.h1}>세이프노트의 증빙 구조가{"\n"}면책에 어느 정도 기여하는지{"\n"}검토를 요청드립니다.</Text>
        <Text style={[s.body, s.muted, { maxWidth: 400 }]}>
          본 자료는 세이프노트(SaaS)의 기능과 법적 설계를 변호사님께 소개하고, 중대재해처벌법
          대응에서의 증빙 기여도와 법적 리스크에 대한 검토 의견을 구하기 위한 자료입니다.
          세이프노트는 면책을 단정·보장하지 않으며, 검토 결과를 제품·문구에 반영하고자 합니다.
        </Text>
      </View>
      <View style={{ position: "absolute", left: 46, right: 46, bottom: 86, borderLeftWidth: 3, borderLeftColor: C.caution, paddingLeft: 12 }}>
        <Text style={{ fontSize: 9.5 }}>검토 핵심: (1) 의무 이행·증빙으로서의 기여도 (2) 형식적 이행·책임전가·표시광고·개인정보·증거능력 리스크</Text>
      </View>
      <Footer p="표지" />
    </Page>

    {/* 1. 제품 개요 + 법적 설계 원칙 */}
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>OVERVIEW & LEGAL-BY-DESIGN</Text>
      <View style={s.rule} />
      <Text style={s.h2}>무엇인가</Text>
      <Text style={[s.body, { marginBottom: 10 }]}>
        세이프노트는 전담 안전관리자가 없는 5~49인 사업장이 중대재해처벌법 안전보건관리체계의
        구축·이행을 <Text style={{ fontWeight: 700 }}>증빙까지 자동으로</Text> 갖추도록 돕는 SaaS입니다.
        ① 면책 자가진단(의무 이행 갭 점검) ② 위험성평가 생성·확정 ③ 노동자용 현장 증빙
        (작업 전·중·후 점검, 위험 신고)으로 구성되며, 관리자는 사업장별로 근로자 계정(아이디/
        비밀번호)을 발급하고 작업 전·중·후 점검 현황을 시각별 대시보드로 확인합니다.
      </Text>

      <Text style={s.h2}>법적 설계 원칙 (검토의 전제)</Text>
      <View style={s.card}>
        <Text style={s.h3}>1. 법적 판단·위험도 산정은 규칙 기반 + 근거(RAG)</Text>
        <Text style={[s.body, s.muted]}>규정 매핑·위험도는 규칙 엔진과 검증된 근거(KOSHA 가이드·시행령)로 처리하며, AI 단독 판단·계산은 사용하지 않습니다.</Text>
      </View>
      <View style={s.card}>
        <Text style={s.h3}>2. AI는 초안만, 확정은 사람</Text>
        <Text style={[s.body, s.muted]}>AI는 근거 범위 안에서 문장 초안만 작성하고 불확실 시 전문가 검토를 표시합니다. 위험도는 사용자가 빈도×강도로 직접 확정합니다.</Text>
      </View>
      <View style={s.card}>
        <Text style={s.h3}>3. 결과 단정 금지 · 고지 일관</Text>
        <Text style={[s.body, s.muted]}>“면책 보장 / 처벌 면제 확정” 류 표현을 코드·UI·자료 어디에도 사용하지 않으며, 모든 산출물 하단에 “본 자료는 법률자문을 대체하지 않습니다”를 표기합니다.</Text>
      </View>
      <View style={s.card}>
        <Text style={s.h3}>4. 증빙 무결성 · 본인성</Text>
        <Text style={[s.body, s.muted]}>현장 기록(작업 전·중·후 점검, 위험 신고)은 타임스탬프와 해시 체인(append-only)으로 저장해 사후 변경을 감지합니다. 근로자는 관리자가 발급한 아이디·비밀번호로 로그인해 본인 명의로 점검·서명합니다.</Text>
      </View>
      <Footer p="01 · 개요와 원칙" />
    </Page>

    {/* 2. 의무 매핑 + 증빙 */}
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>OBLIGATION MAPPING</Text>
      <View style={s.rule} />
      <Text style={s.h2}>시행령 제4조 의무 ↔ 기능·증빙</Text>
      <View style={[s.card, { padding: 0 }]}>
        <View style={{ flexDirection: "row", backgroundColor: C.surface, borderBottomWidth: 1, borderColor: C.border, paddingVertical: 6, paddingHorizontal: 9 }}>
          <Text style={[s.th, { width: 150 }]}>의무(요지)</Text><Text style={[s.th, { flex: 1 }]}>세이프노트가 남기는 증빙</Text>
        </View>
        <Row a="제3호 유해·위험요인 확인·개선 절차" b="위험성평가 생성·확정, 작업 전·중·후 점검 기록, 위험 신고 → 관리자 ‘조치완료’(발견-개선 종결) 이력" />
        <Row a="제4호 안전보건 예산" b="(범위 밖) 별도 관리 — 진단 항목으로 점검" />
        <Row a="제5호 책임자 업무수행 점검" b="작업 전·중·후 점검 현황 대시보드(시각별), 반기 점검·갱신 이력" />
        <Row a="제7호 종사자 의견 청취" b="근로자 위험 신고(사진·위치)·현장 점검 기록(실시간, 본인 명의)" />
        <Row a="제8호 비상대응 매뉴얼" b="(로드맵) 매뉴얼·점검 기록화 예정" />
        <Row a="교육·주지 의무" b="작업 시점 위험요인 고지·확인 타임스탬프 기록" />
      </View>
      <Text style={[s.body, s.muted, { marginTop: 8, fontSize: 9 }]}>
        ※ 위 매핑은 제품이 ‘증빙을 남기는 지점’을 정리한 것이며, 각 증빙이 실제 의무 이행으로
        평가되는지는 사실관계와 운영 실태에 따라 달라진다는 점을 전제로 검토를 요청드립니다.
      </Text>

      <Text style={[s.h2, { marginTop: 12 }]}>노동자용 현장 증빙 (핵심)</Text>
      <Text style={[s.body]}>
        근로자가 발급받은 아이디·비밀번호로 로그인해 작업 전·중·후 단계별로 위험을 고지받고
        점검·서명하거나, 사진·위치와 함께 위험을 신고하면 그 행위가 즉시 불변 로그(타임스탬프+
        해시 체인)로 기록됩니다. 위험 신고는 관리자에게 실시간 통지되고, 관리자가 ‘조치완료’로
        종결하면 발견-개선 루프가 기록으로 남습니다. 노동자 보호 활동이 곧 사업장의 이행 증빙이
        되는 구조이며, 책임을 노동자에게 전가하지 않도록 ‘경영책임자의 의무 이행 입증’ 관점으로
        설계했습니다.
      </Text>
      <Footer p="02 · 의무 매핑" />
    </Page>

    {/* 3. 검토 요청 항목 */}
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>REVIEW REQUEST · 핵심</Text>
      <View style={s.rule} />
      <Text style={s.h2}>변호사님께 검토를 요청드리는 사항</Text>

      <Text style={[s.h3, { marginTop: 4 }]}>A. 면책 기여도</Text>
      <Num n={1}>위 증빙 구조가 중대재해처벌법상 ‘안전보건 확보의무를 이행했다’는 점을 입증하는 데 어느 정도 기여할 수 있는지, 한계는 무엇인지.</Num>
      <Num n={2}>작업 전·중·후 점검과 위험 신고→조치완료 기록 중 실무상 증거가치가 높은 항목과 보완이 필요한 항목.</Num>
      <Num n={3}>‘상시·연속적 기록’이 일회성 서류 대비 갖는 의미와, 어느 수준(빈도·내용)까지 갖춰야 유의미한지.</Num>

      <Text style={[s.h3, { marginTop: 8 }]}>B. 법적 리스크</Text>
      <Num n={4}>형식적 이행 리스크: 체크가 형식에 그칠 경우 오히려 불리하게 작용할 가능성과 이를 줄일 설계.</Num>
      <Num n={5}>책임전가 우려: 근로자 본인 명의(아이디/비번 로그인) 점검·서명 기록이 책임을 근로자에게 전가하는 것으로 해석될 여지와 방지책.</Num>
      <Num n={6}>증거능력·무결성: 타임스탬프+해시 체인 기록과 근로자 본인성(아이디/비번 인증)이 분쟁 시 증거로 활용되기 위한 요건과 보완점.</Num>
      <Num n={7}>개인정보·근로감시: 위치·사진·작업행동 수집의 적법 요건(동의·목적제한·최소수집)과 근로감시 관련 유의점.</Num>
      <Num n={8}>표시·광고 리스크: 마케팅 문구(예: “증빙이 곧 면책”, 제휴 자료)가 표시광고법상 부당광고에 해당하지 않도록 하는 표현 가이드.</Num>
      <Num n={9}>산출물 고지문(“법률자문 대체 아님”)의 위치·문구가 책임 한정 측면에서 충분한지.</Num>
      <Footer p="03 · 검토 요청" />
    </Page>

    {/* 4. 한계 + 제공 자료 + 회신 */}
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>SCOPE · MATERIALS</Text>
      <View style={s.rule} />
      <Text style={s.h2}>세이프노트가 단정하지 않는 것</Text>
      <View style={[s.card, { borderColor: "#A82B2233", backgroundColor: "#A82B220A" }]}>
        <Text style={[s.body]}>
          세이프노트는 면책·처벌 면제를 보장하지 않습니다. 특정 사건의 면책 여부는 구체적
          사실관계·인과관계·운영 실태에 따라 결정되며, 본 제품은 그 판단의 근거가 될 ‘증빙의
          축적과 정리’를 돕는 도구입니다. 법적 판단·자문을 대체하지 않습니다.
        </Text>
      </View>

      <Text style={[s.h2, { marginTop: 8 }]}>함께 제공하는 검토 자료</Text>
      <Num n={1}>라이브 데모: {CONTACT.web} — 자가진단(/diagnosis), 위험성평가(/risk-assessment/new), 근로자 앱(/w), 관리자 콘솔(/admin) · 점검 현황 대시보드. 데모 계정(관리자·근로자)은 별도 전달.</Num>
      <Num n={2}>샘플 산출물: 위험성평가표 PDF(출처 인용·직인·고지문 포함), 자가진단 갭 리포트.</Num>
      <Num n={3}>현장 증빙 구조 설명: 작업 전·중·후 점검·위험 신고의 데이터 스키마·해시 체인·근로자 인증 방식.</Num>

      <Text style={[s.h2, { marginTop: 8 }]}>요청</Text>
      <Text style={[s.body]}>
        위 A·B 항목에 대한 검토 의견과, 마케팅·UI 문구에 대한 표현 가이드를 주시면 제품과
        자료 전반에 반영하겠습니다. 자문 범위·일정은 협의 가능합니다.
      </Text>

      <View style={{ marginTop: 16, borderTopWidth: 1, borderColor: C.border, paddingTop: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <LogoMark size={22} />
        <View>
          <Text style={s.h3}>{CONTACT.company} · 세이프노트</Text>
          <Text style={[s.body, s.muted]}>이메일 {CONTACT.email}{CONTACT.phone ? ` · 전화 ${CONTACT.phone}` : ""} · {CONTACT.web}</Text>
        </View>
      </View>
      <Footer p="04 · 한계와 요청" />
    </Page>
  </Document>
);

renderToFile(Doc, join(process.cwd(), "docs", "legal", "SafeNote-변호사검토요청.pdf")).then(() => console.log("✓ 생성: docs/legal/SafeNote-변호사검토요청.pdf"));
