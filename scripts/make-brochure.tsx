/**
 * SafeNote 서비스 소개서 (PDF 브로셔) 생성.
 * SafeNote 디자인 시스템(색·폰트·게이지·직인) 적용. 실행: npx tsx scripts/make-brochure.tsx
 * 원칙 준수: "면책 보장" 류 표현 없음, 모든 페이지 하단 법적 고지.
 */
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Svg,
  Circle,
  Image,
  renderToFile,
} from "@react-pdf/renderer";
import { join } from "node:path";

// 색 토큰
const C = {
  surface: "#F6F7F5",
  ink: "#16201C",
  safe: "#15643E",
  safeHover: "#0F4D30",
  caution: "#C2841C",
  danger: "#A82B22",
  border: "#DCE0DA",
  muted: "#5C6B62",
  white: "#FFFFFF",
};

const P = "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static";
Font.register({
  family: "Pretendard",
  fonts: [
    { src: `${P}/Pretendard-Regular.otf`, fontWeight: 400 },
    { src: `${P}/Pretendard-Medium.otf`, fontWeight: 500 },
    { src: `${P}/Pretendard-SemiBold.otf`, fontWeight: 600 },
    { src: `${P}/Pretendard-Bold.otf`, fontWeight: 700 },
    { src: `${P}/Pretendard-ExtraBold.otf`, fontWeight: 800 },
  ],
});
Font.registerHyphenationCallback((w) => [w]);

const s = StyleSheet.create({
  page: {
    fontFamily: "Pretendard",
    color: C.ink,
    backgroundColor: C.surface,
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10.5,
    lineHeight: 1.5,
  },
  wordmark: { fontSize: 9, letterSpacing: 4, color: C.safe, fontWeight: 700 },
  eyebrow: { fontSize: 9.5, letterSpacing: 1, color: C.muted, fontWeight: 600, marginBottom: 8 },
  h1: { fontSize: 30, fontWeight: 800, lineHeight: 1.2, marginBottom: 14 },
  h2: { fontSize: 19, fontWeight: 800, lineHeight: 1.25, marginBottom: 12 },
  h3: { fontSize: 12.5, fontWeight: 700, marginBottom: 4 },
  body: { fontSize: 10.5, color: C.ink, lineHeight: 1.55 },
  muted: { color: C.muted },
  footer: {
    position: "absolute",
    bottom: 26,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: C.muted,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  rule: { height: 3, width: 48, backgroundColor: C.safe, marginBottom: 16 },
  card: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    backgroundColor: C.white,
    padding: 16,
  },
  chip: {
    alignSelf: "flex-start",
    fontSize: 8.5,
    fontWeight: 700,
    color: C.safe,
    backgroundColor: "#15643E14",
    borderWidth: 1,
    borderColor: "#15643E40",
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
});

function Footer({ page }: { page: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>본 자료는 법률자문을 대체하지 않습니다.</Text>
      <Text>세이프노트 · {page}</Text>
    </View>
  );
}

// 면책 게이지 (SVG 링 + 텍스트 오버레이 · 캡션은 링 아래로 분리)
function Gauge({ pct, size = 130, caption = "면책 이행률" }: { pct: number; size?: number; caption?: string }) {
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: size, height: size, position: "relative" }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.border} strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={C.safe}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            {...({ strokeDashoffset: off } as Record<string, number>)}
          />
        </Svg>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size,
            height: size,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
          }}
        >
          <Text style={{ fontSize: size * 0.28, fontWeight: 800, color: C.safe }}>{pct}</Text>
          <Text style={{ fontSize: size * 0.13, fontWeight: 700, color: C.safe, marginTop: size * 0.04 }}>%</Text>
        </View>
      </View>
      <Text style={{ fontSize: 8.5, color: C.muted, marginTop: 6 }}>{caption}</Text>
    </View>
  );
}

function Bullet({ children, tone = C.safe }: { children: React.ReactNode; tone?: string }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 7 }}>
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: tone, marginTop: 5, marginRight: 8 }} />
      <Text style={{ flex: 1, fontSize: 10.5, lineHeight: 1.5 }}>{children}</Text>
    </View>
  );
}

// 직인: 원은 SVG, 한글은 일반 Text 오버레이(SVG Text는 한글 OTF 미렌더)
function Seal({ size = 78 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="47" fill="none" stroke={C.safe} strokeWidth="2.5" />
        <Circle cx="50" cy="50" r="40" fill="none" stroke={C.safe} strokeWidth="1" />
      </Svg>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: size * 0.2, fontWeight: 800, color: C.safe, lineHeight: 1.1 }}>세이프</Text>
        <Text style={{ fontSize: size * 0.2, fontWeight: 800, color: C.safe, lineHeight: 1.1 }}>노트</Text>
      </View>
    </View>
  );
}

const Doc = (
  <Document title="세이프노트 서비스 소개서" author="SafeNote">
    {/* 1. 표지 */}
    <Page size="A4" style={s.page}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={s.wordmark}>S A F E N O T E</Text>
        <Text style={[s.muted, { fontSize: 8.5 }]}>중대재해처벌법 대응 SaaS</Text>
      </View>

      <View style={{ marginTop: 120 }}>
        <Text style={s.eyebrow}>중대재해처벌법 면책 증빙 시스템</Text>
        <Text style={s.h1}>
          지금 사고가 나면,{"\n"}대표님의 증빙은 충분합니까?
        </Text>
        <Text style={[s.body, { maxWidth: 360, color: C.muted }]}>
          중대재해처벌법은 의무를 이행했다는 ‘증빙’이 곧 면책입니다. 전담 안전관리자
          없이도, 세이프노트가 그 증빙을 상시 쌓아 대표님을 지킵니다.
        </Text>
      </View>

      <View style={{ position: "absolute", right: 48, top: 220 }}>
        <Gauge pct={78} size={150} />
      </View>

      <View
        style={{
          position: "absolute",
          left: 48,
          right: 48,
          bottom: 90,
          borderLeftWidth: 3,
          borderLeftColor: C.caution,
          paddingLeft: 12,
        }}
      >
        <Text style={{ fontSize: 10, color: C.ink }}>
          2024년부터 5인 이상 전 사업장 적용 · 대표 1년 이상 징역 또는 10억 이하 벌금
        </Text>
      </View>
      <Footer page="서비스 소개서" />
    </Page>

    {/* 2. 문제 */}
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>THE PROBLEM</Text>
      <View style={s.rule} />
      <Text style={s.h2}>의무는 무겁고, 증빙은 비어 있습니다</Text>
      <Text style={[s.body, { marginBottom: 18, maxWidth: 430 }]}>
        법은 ‘안전보건관리체계를 구축·이행했다는 객관적 증빙’이 있을 때 경영책임자의
        책임을 면합니다. 그러나 5~49인 사업장 대부분은 전담 안전관리자가 없어, 무엇을
        해야 하고 무엇이 비었는지조차 보이지 않습니다.
      </Text>

      <View style={{ flexDirection: "row", gap: 12, marginBottom: 18 }}>
        {[
          { n: "5인+", t: "전 사업장 적용", d: "2024년부터 상시근로자 5인 이상 전면 적용" },
          { n: "1년+", t: "대표 형사처벌", d: "1년 이상 징역 또는 10억 이하 벌금" },
          { n: "9대", t: "확보 의무", d: "시행령 제4조 안전·보건 확보의무 항목" },
        ].map((x) => (
          <View key={x.t} style={[s.card, { flex: 1 }]}>
            <Text style={{ fontSize: 22, fontWeight: 800, color: C.danger }}>{x.n}</Text>
            <Text style={[s.h3, { marginTop: 6 }]}>{x.t}</Text>
            <Text style={[s.body, s.muted, { fontSize: 9 }]}>{x.d}</Text>
          </View>
        ))}
      </View>

      <Bullet tone={C.danger}>일회성 컨설팅 서류는 사고 시점의 ‘상시 이행’을 입증하지 못합니다.</Bullet>
      <Bullet tone={C.danger}>의무 항목·점검 주기를 비전문가 대표가 직접 챙기기 어렵습니다.</Bullet>
      <Bullet tone={C.danger}>증빙이 흩어져 있어, 정작 필요한 순간에 꺼낼 수 없습니다.</Bullet>
      <Footer page="01 · 문제" />
    </Page>

    {/* 3. 솔루션 */}
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>THE SOLUTION</Text>
      <View style={s.rule} />
      <Text style={s.h2}>증빙을 ‘상시 자동’으로 쌓습니다</Text>
      <Text style={[s.body, { marginBottom: 16, maxWidth: 440 }]}>
        세이프노트는 위험성평가 한 건을 만드는 도구가 아니라, 대표가 의무를 이행하고
        있다는 <Text style={{ fontWeight: 700 }}>객관적 증빙을 지속적으로 축적</Text>하는
        시스템입니다. 비전문가도 5분 안에 시작합니다.
      </Text>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={[s.card, { flex: 1 }]}>
          <Text style={s.chip}>신뢰 구조</Text>
          <Text style={[s.h3, { marginTop: 8 }]}>법적 판단은 규칙 엔진 + 근거(RAG)</Text>
          <Text style={[s.body, s.muted, { fontSize: 9.5 }]}>
            규정 매핑·위험도 산정은 규칙 기반 엔진과 검증된 근거(KOSHA 가이드·시행령)로
            처리합니다. AI 단독 판단·계산은 쓰지 않습니다.
          </Text>
        </View>
        <View style={[s.card, { flex: 1 }]}>
          <Text style={s.chip}>안전장치</Text>
          <Text style={[s.h3, { marginTop: 8 }]}>AI는 ‘초안’만, 확정은 사람이</Text>
          <Text style={[s.body, s.muted, { fontSize: 9.5 }]}>
            AI는 근거 범위 안에서 문장 초안만 작성하고, 불확실하면 전문가 검토를
            표시합니다. 사용자가 확정해야 비로소 ‘증빙’이 됩니다.
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 18, flexDirection: "row", alignItems: "center", gap: 16 }}>
        <Gauge pct={86} size={104} />
        <View style={{ flex: 1 }}>
          <Text style={s.h3}>면책 게이지로 ‘나는 covered’를 한눈에</Text>
          <Text style={[s.body, s.muted]}>
            9대 의무의 실제 이행률과 ‘지금 사고 시’ 리스크 등급을 규칙 엔진이 계산해
            보여줍니다. 무엇을 더 채우면 핵심 공백이 닫히는지 알려줍니다.
          </Text>
        </View>
      </View>
      <Footer page="02 · 솔루션" />
    </Page>

    {/* 4. 핵심 기능 */}
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>CORE FEATURES</Text>
      <View style={s.rule} />
      <Text style={s.h2}>세 개의 핵심 축</Text>

      <View style={[s.card, { marginBottom: 10 }]}>
        <Text style={s.chip}>모듈 A</Text>
        <Text style={[s.h3, { marginTop: 8 }]}>면책 자가진단</Text>
        <Text style={[s.body, s.muted, { marginBottom: 8 }]}>
          업종·규모·보유 서류를 5분간 체크하면, 규칙 엔진이 9대 의무별 이행 상태와 공백,
          이행률, 리스크 등급을 즉시 산출합니다.
        </Text>
        <Bullet>의무별 상태 대장 — 무엇이 비었고 다음에 무엇을 할지 한 줄로</Bullet>
        <Bullet>면책 게이지 + ‘지금 사고 시’ 리스크 등급</Bullet>
        <Bullet>갭 리포트 — 핵심 공백을 닫는 우선순위</Bullet>
      </View>

      <View style={[s.card, { marginBottom: 10 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={s.chip}>모듈 B</Text>
            <Text style={[s.h3, { marginTop: 8 }]}>위험성평가 생성기</Text>
            <Text style={[s.body, s.muted, { marginBottom: 8 }]}>
              업종·공정을 입력하면 규칙 후보 → 근거 검색 → AI 초안 순으로 위험성평가표를
              만듭니다. 위험도는 사용자가 빈도×강도로 직접 확정합니다.
            </Text>
          </View>
          <Seal size={70} />
        </View>
        <Bullet>출처가 인용된 위험성평가표 — 근거 밖 창작 차단</Bullet>
        <Bullet>확정 시 디지털 직인 → ‘초안’이 ‘공식 증빙’으로</Bullet>
        <Bullet>감독관 제출 가능한 공문서 품질 PDF 내보내기</Bullet>
      </View>

      <View style={s.card}>
        <Text style={s.chip}>모듈 C</Text>
        <Text style={[s.h3, { marginTop: 8 }]}>노동자 앱 · 현장 증빙</Text>
        <Text style={[s.body, s.muted, { marginBottom: 8 }]}>
          근로자가 아이디·비밀번호로 로그인해 작업 전·중·후 안전점검과 위험 신고(사진·위치)를
          기록합니다. 모든 기록은 시각과 함께 위변조 방지(해시 체인)로 저장됩니다.
        </Text>
        <Bullet>작업 전·중·후 점검 — 노동자 보호 활동이 곧 면책 증빙</Bullet>
        <Bullet>위험 신고 → 관리자 실시간 통지·조치완료 기록</Bullet>
      </View>
      <Footer page="03 · 핵심 기능" />
    </Page>

    {/* 5. 작동 방식 */}
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>HOW IT WORKS</Text>
      <View style={s.rule} />
      <Text style={s.h2}>5분이면, 증빙이 쌓이기 시작합니다</Text>

      <View style={{ marginTop: 6 }}>
        {[
          ["진단", "업종·규모·서류를 체크하면 면책 상태와 공백이 보입니다."],
          ["생성·확정", "공정별 위험성평가표를 근거 인용과 함께 받고, 위험도를 정해 직인으로 확정합니다."],
          ["현장 점검", "근로자가 작업 전·중·후 점검·위험 신고를 기록합니다(시각·불변 로그)."],
          ["축적·관제", "확정 증빙이 상시 쌓이고, 관리자는 점검 현황을 대시보드로 한눈에 봅니다."],
        ].map(([t, d], i) => (
          <View key={t} style={{ flexDirection: "row", marginBottom: 12, alignItems: "flex-start" }}>
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: C.safe,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text style={{ color: C.white, fontWeight: 800, fontSize: 11 }}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.h3}>{t}</Text>
              <Text style={[s.body, s.muted]}>{d}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[s.card, { marginTop: 8, backgroundColor: "#15643E0A", borderColor: "#15643E33" }]}>
        <Text style={[s.h3, { color: C.safe }]}>왜 신뢰할 수 있나</Text>
        <Text style={[s.body, { color: C.ink }]}>
          규정 매핑과 위험도는 규칙 엔진·검증된 근거로만 결정하고, AI는 근거 안에서
          문장만 다듬습니다. 모든 산출물은 ‘초안 → 사람 확정’ 절차를 거치며, 하단에
          법적 고지를 명시합니다.
        </Text>
      </View>
      <Footer page="04 · 작동 방식" />
    </Page>

    {/* 6. 현장 증빙 · 관제 */}
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>FIELD EVIDENCE · 관제</Text>
      <View style={s.rule} />
      <Text style={s.h2}>현장 증빙과 관리자 대시보드</Text>
      <Text style={[s.body, s.muted, { marginBottom: 14 }]}>
        노동자의 안전 행동이 실시간으로 기록되고, 관리자는 그 이행 현황을 한눈에 봅니다.
        노동자에게 책임을 전가하지 않고, ‘경영책임자의 의무 이행’을 입증하도록 설계했습니다.
      </Text>

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
        <View style={[s.card, { flex: 1 }]}>
          <Text style={s.h3}>작업 전·중·후 점검 현황</Text>
          <Text style={[s.body, s.muted]}>작업자 × 단계 매트릭스로 누가 언제 점검했는지 시각까지 한눈에. 미점검자도 즉시 식별.</Text>
        </View>
        <View style={[s.card, { flex: 1 }]}>
          <Text style={s.h3}>위험 신고 → 조치완료</Text>
          <Text style={[s.body, s.muted]}>현장 위험 신고를 실시간 통지받고, 관리자가 ‘조치완료’로 종결해 발견-개선 루프를 남깁니다.</Text>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.h3}>신뢰의 핵심 — 불변 증빙 · 본인성</Text>
        <Bullet>모든 현장 기록에 타임스탬프 + 해시 체인 → 사후 위변조 감지</Bullet>
        <Bullet>근로자는 관리자가 발급한 아이디·비밀번호로 본인 명의 점검·서명</Bullet>
        <Bullet>관리자 화면에서 근로자 계정 직접 발급·비번 재설정</Bullet>
      </View>
      <Footer page="05 · 현장 증빙" />
    </Page>

    {/* 6.5 웹 화면 */}
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>PRODUCT · 웹 (관리자)</Text>
      <View style={s.rule} />
      <Text style={s.h2}>웹 — 진단·관제 화면</Text>
      <Text style={[s.body, s.muted, { marginBottom: 14 }]}>
        대표·관리자는 브라우저에서 면책 진단, 위험성평가, 작업 전·중·후 점검 현황을 관리합니다.
      </Text>

      <View style={{ alignItems: "center" }}>
        <View style={{ width: 450, borderWidth: 1, borderColor: C.border, borderRadius: 8, overflow: "hidden" }}>
          <Image src={join(process.cwd(), "docs/store/web-landing.png")} style={{ width: 450 }} />
        </View>
        <Text style={[s.muted, { fontSize: 8.5, marginTop: 5, marginBottom: 14 }]}>랜딩 — 중대재해처벌법 면책 증빙 시스템</Text>

        <View style={{ width: 450, borderWidth: 1, borderColor: C.border, borderRadius: 8, overflow: "hidden" }}>
          <Image src={join(process.cwd(), "docs/store/web-dashboard.png")} style={{ width: 450 }} />
        </View>
        <Text style={[s.muted, { fontSize: 8.5, marginTop: 5 }]}>작업 전·중·후 점검 현황 대시보드 (시각·증빙해시)</Text>
      </View>
      <Footer page="06 · 웹 화면" />
    </Page>

    {/* 6.6 앱 화면 */}
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>PRODUCT · 앱 (근로자)</Text>
      <View style={s.rule} />
      <Text style={s.h2}>앱 — 현장 근로자 화면</Text>
      <Text style={[s.body, s.muted, { marginBottom: 16 }]}>
        근로자는 모바일에서 작업 전·중·후 점검과 위험 신고(사진·위치)를 간단히 기록합니다.
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "center", gap: 12 }}>
        {[
          ["screenshot-1.png", "작업 전·중·후 점검"],
          ["screenshot-2.png", "위험 신고(사진·위치)"],
          ["screenshot-3.png", "점검 현황 한눈에"],
        ].map(([f, cap]) => (
          <View key={f} style={{ width: 150, alignItems: "center" }}>
            <View style={{ width: 150, borderWidth: 1, borderColor: C.border, borderRadius: 10, overflow: "hidden" }}>
              <Image src={join(process.cwd(), "docs/store", f as string)} style={{ width: 150 }} />
            </View>
            <Text style={[s.muted, { fontSize: 8.5, marginTop: 6 }]}>{cap}</Text>
          </View>
        ))}
      </View>
      <Footer page="07 · 앱 화면" />
    </Page>

    {/* 7. CTA */}
    <Page size="A4" style={s.page}>
      <View style={{ marginTop: 150, alignItems: "center" }}>
        <Seal size={92} />
        <Text style={[s.h1, { textAlign: "center", marginTop: 24 }]}>
          무서운 의무를,{"\n"}관리 가능한 증빙으로.
        </Text>
        <Text style={[s.body, s.muted, { textAlign: "center", maxWidth: 360, marginBottom: 28 }]}>
          가입 없이 5분, 우리 사업장의 증빙 갭을 먼저 확인해 보세요. 그리고 현장에서
          증빙을 상시 쌓아갑니다.
        </Text>
        <View
          style={{
            backgroundColor: C.safe,
            borderRadius: 8,
            paddingVertical: 12,
            paddingHorizontal: 28,
          }}
        >
          <Text style={{ color: C.white, fontWeight: 700, fontSize: 12 }}>
            내 사업장 면책 상태 진단 →
          </Text>
        </View>
        <Text style={[s.muted, { fontSize: 9, marginTop: 18 }]}>
          세이프노트 · safe-note-roan.vercel.app
        </Text>
      </View>
      <Footer page="08 · 시작하기" />
    </Page>
  </Document>
);

const out = join(process.cwd(), "docs", "SafeNote-소개서.pdf");
renderToFile(Doc, out).then(() => {
  console.log("✓ 생성:", out);
});
