/**
 * 세이프노트 소개서 (차별화 강조 + 가격표). 실행: npx tsx scripts/make-sales-intro.tsx
 * 원칙: "면책 보장" 류 표현 없음, 하단 법적 고지.
 */
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Svg, Rect, Image, Link, renderToFile } from "@react-pdf/renderer";
import { join } from "node:path";
import QRCode from "qrcode";

const SITE = "https://safe-note-roan.vercel.app";

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
  page: { fontFamily: "Pretendard", color: C.ink, backgroundColor: C.surface, paddingTop: 46, paddingBottom: 52, paddingHorizontal: 46, fontSize: 10.5, lineHeight: 1.5 },
  wordmark: { fontSize: 9, letterSpacing: 4, color: C.safe, fontWeight: 700 },
  eyebrow: { fontSize: 9.5, letterSpacing: 1, color: C.muted, fontWeight: 600, marginBottom: 8 },
  h1: { fontSize: 28, fontWeight: 800, lineHeight: 1.22, marginBottom: 12 },
  h2: { fontSize: 18, fontWeight: 800, marginBottom: 10 },
  h3: { fontSize: 12, fontWeight: 700, marginBottom: 3 },
  body: { fontSize: 10.5, lineHeight: 1.55 },
  muted: { color: C.muted },
  rule: { height: 3, width: 44, backgroundColor: C.safe, marginBottom: 14 },
  card: { borderWidth: 1, borderColor: C.border, borderRadius: 8, backgroundColor: C.white, padding: 14 },
  chip: { alignSelf: "flex-start", fontSize: 8.5, fontWeight: 700, color: C.safe, backgroundColor: "#15643E14", borderWidth: 1, borderColor: "#15643E40", borderRadius: 20, paddingVertical: 2, paddingHorizontal: 8 },
  hot: { alignSelf: "flex-start", fontSize: 8.5, fontWeight: 800, color: C.white, backgroundColor: C.safe, borderRadius: 20, paddingVertical: 2, paddingHorizontal: 8 },
  footer: { position: "absolute", bottom: 26, left: 46, right: 46, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: C.muted, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8 },
});

function Logo({ size = 18 }: { size?: number }) {
  // react-pdf SVG는 8자리 알파 hex를 잘못 해석 → 불투명 근사색 사용
  return (<Svg width={size} height={size} viewBox="0 0 24 24"><Rect x="1" y="1" width="22" height="22" rx="5" fill="#E8F0EB" stroke="#8FB5A3" strokeWidth="1.2" /><Rect x="8" y="8" width="8" height="8" rx="2" fill="#15643E" /></Svg>);
}
function Footer({ p }: { p: string }) {
  return (<View style={s.footer} fixed><Text>본 자료는 법률자문을 대체하지 않습니다.</Text><Text>세이프노트 · {p}</Text></View>);
}
const img = (f: string) => join(process.cwd(), "docs/store", f);

// QR은 main()에서 생성해 buildDoc으로 주입 (인쇄물용 — 폰으로 열람 시엔 링크 탭)
const buildDoc = (QR: string) => (
  <Document title="세이프노트 소개서" author="SafeNote">
    {/* 1. 표지 */}
    <Page size="A4" style={s.page}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}><Logo size={18} /><Text style={s.wordmark}>S A F E N O T E</Text></View>
        <Text style={[s.muted, { fontSize: 8.5 }]}>중대재해처벌법 면책 증빙 시스템</Text>
      </View>
      <View style={{ marginTop: 130 }}>
        <Text style={s.eyebrow}>위변조 불가능한 면책 증빙 인프라</Text>
        <Text style={s.h1}>지금 사고가 나면,{"\n"}그 증빙은 위변조 없이{"\n"}남아 있습니까?</Text>
        <Text style={[s.body, s.muted, { maxWidth: 380 }]}>
          중대재해처벌법에서 다투는 것은 ‘기록이 있느냐’를 넘어 ‘그 기록을 상시 이행했고,
          위변조되지 않았느냐’입니다. 세이프노트는 전담 안전관리자 없이도 그 증거를 상시 쌓습니다.
        </Text>
      </View>
      <View style={{ position: "absolute", left: 46, right: 46, bottom: 90, borderLeftWidth: 3, borderLeftColor: C.caution, paddingLeft: 12 }}>
        <Text style={{ fontSize: 10 }}>2024년부터 5인 이상 전 사업장 적용 · 대표 1년 이상 징역 또는 10억 이하 벌금</Text>
      </View>
      <Footer p="소개서" />
    </Page>

    {/* 2. 4가지 차별화 */}
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>WHY SAFENOTE</Text>
      <View style={s.rule} />
      <Text style={s.h2}>왜 세이프노트인가 — 4가지 차별화</Text>

      <View style={[s.card, { marginBottom: 9, borderColor: C.safe, borderWidth: 2, backgroundColor: "#15643E0A" }]}>
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 4 }}>
          <Text style={s.hot}>최강 해자</Text>
          <Text style={s.h3}>① 증거 무결성 — 불변 해시체인</Text>
        </View>
        <Text style={[s.body, s.muted]}>
          경쟁사 기록은 “했다”지만, 세이프노트는 <Text style={{ fontWeight: 700, color: C.ink }}>“그 시각에, 위변조 없이 했다”</Text>를
          증명합니다. 수사·재판에서 실제로 다투는 건 기록의 신뢰성. → “사후 조작이 불가능한 증빙”.
        </Text>
      </View>

      <View style={[s.card, { marginBottom: 9 }]}>
        <Text style={s.h3}>② 작업 전·중·후 전주기 · 상시 원장</Text>
        <Text style={[s.body, s.muted]}>문서 1건 스냅샷이 아니라, 현장 행동이 실시간·연속으로 쌓이는 원장(ledger). 일회성 서류 대비 ‘연속 이행’ 입증력이 핵심.</Text>
      </View>

      <View style={[s.card, { marginBottom: 9 }]}>
        <Text style={s.h3}>③ ‘안전’이 아니라 ‘법적 리스크’를 관리</Text>
        <Text style={[s.body, s.muted]}>9대 의무 매핑 + 면책 게이지 + ‘지금 사고 시 리스크 등급’. 대표의 구매 동기(형사처벌 공포)를 정면으로 다룹니다.</Text>
      </View>

      <View style={s.card}>
        <Text style={s.h3}>④ 비전문가·전담자 없는 5~49인 UX</Text>
        <Text style={[s.body, s.muted]}>5분·아이디/비번·모바일. 협회 플랫폼·EHS는 무겁고 전문가용. “전담자 없이 대표 혼자 5분”이 진입장벽을 깹니다.</Text>
      </View>
      <Footer p="01 · 차별화" />
    </Page>

    {/* 3. 웹 화면 */}
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>PRODUCT · 웹 (관리자)</Text>
      <View style={s.rule} />
      <Text style={s.h2}>웹 — 진단·관제</Text>
      <View style={{ alignItems: "center" }}>
        <View style={{ width: 450, borderWidth: 1, borderColor: C.border, borderRadius: 8, overflow: "hidden" }}>
          <Image src={img("web-landing.png")} style={{ width: 450 }} />
        </View>
        <Text style={[s.muted, { fontSize: 8.5, marginTop: 5, marginBottom: 12 }]}>랜딩 — 면책 증빙 시스템</Text>
        <View style={{ width: 450, borderWidth: 1, borderColor: C.border, borderRadius: 8, overflow: "hidden" }}>
          <Image src={img("web-dashboard.png")} style={{ width: 450 }} />
        </View>
        <Text style={[s.muted, { fontSize: 8.5, marginTop: 5 }]}>작업 전·중·후 점검 현황 대시보드 (시각·증빙해시)</Text>
      </View>
      <Footer p="02 · 웹 화면" />
    </Page>

    {/* 4. 앱 화면 */}
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>PRODUCT · 앱 (근로자)</Text>
      <View style={s.rule} />
      <Text style={s.h2}>앱 — 현장 근로자</Text>
      <Text style={[s.body, s.muted, { marginBottom: 16 }]}>작업 전·중·후 점검과 위험 신고(사진·위치)를 모바일에서 간단히. 모든 기록은 불변 로그로 저장됩니다.</Text>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 12 }}>
        {[["screenshot-1.png", "작업 전·중·후 점검"], ["screenshot-2.png", "위험 신고(사진·위치)"], ["screenshot-3.png", "점검 현황 한눈에"]].map(([f, cap]) => (
          <View key={f} style={{ width: 150, alignItems: "center" }}>
            <View style={{ width: 150, borderWidth: 1, borderColor: C.border, borderRadius: 10, overflow: "hidden" }}><Image src={img(f)} style={{ width: 150 }} /></View>
            <Text style={[s.muted, { fontSize: 8.5, marginTop: 6 }]}>{cap}</Text>
          </View>
        ))}
      </View>
      <Footer p="03 · 앱 화면" />
    </Page>

    {/* 5. 가격표 */}
    <Page size="A4" style={s.page}>
      <Text style={s.eyebrow}>PRICING</Text>
      <View style={s.rule} />
      <Text style={s.h2}>요금제</Text>
      <Text style={[s.body, s.muted, { marginBottom: 16 }]}>진단은 무료로 시작하고, 증빙을 상시 쌓는 단계부터 구독합니다. (아래 금액은 제안 예시이며 정책에 따라 조정될 수 있습니다.)</Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        {[
          { name: "무료 진단", price: "0원", unit: "", feats: ["면책 자가진단", "갭 리포트·리스크 등급"], hi: false },
          { name: "스탠다드", price: "49,000원", unit: "/ 월", feats: ["위험성평가 생성·확정", "근로자 앱(작업 전·중·후·신고)", "점검 현황 대시보드", "근로자 계정 10명·공정 5개", "증빙 보관·PDF·불변 로그"], hi: true },
          { name: "프로", price: "99,000원", unit: "/ 월", feats: ["공정·근로자 무제한", "위험 신고 실시간 알림(SMS)", "증빙 대장·감사 로그", "우선 지원"], hi: false },
        ].map((p) => (
          <View key={p.name} style={[s.card, { flex: 1, paddingVertical: 16 }, p.hi ? { borderColor: C.safe, borderWidth: 2, backgroundColor: "#15643E0A" } : {}]}>
            {p.hi ? <Text style={[s.chip, { marginBottom: 6 }]}>추천</Text> : <View style={{ height: 0 }} />}
            <Text style={s.h3}>{p.name}</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end", marginVertical: 6 }}>
              <Text style={{ fontSize: 19, fontWeight: 800, color: p.hi ? C.safe : C.ink }}>{p.price}</Text>
              <Text style={[s.muted, { fontSize: 9, marginLeft: 3, marginBottom: 2 }]}>{p.unit}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: C.border, marginVertical: 8 }} />
            {p.feats.map((f) => (
              <View key={f} style={{ flexDirection: "row", marginBottom: 5 }}>
                <Text style={{ color: C.safe, fontSize: 9.5, marginRight: 5 }}>✓</Text>
                <Text style={{ fontSize: 9, flex: 1, lineHeight: 1.35 }}>{f}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={[s.card, { marginTop: 14 }]}>
        <Text style={s.h3}>엔터프라이즈 · 대행 (별도 문의)</Text>
        <Text style={[s.body, s.muted]}>다중 사업장 관리, 노무·안전 대행, 화이트라벨이 필요하면 별도 협의합니다.</Text>
      </View>
      <Footer p="04 · 요금제" />
    </Page>

    {/* 6. CTA */}
    <Page size="A4" style={s.page}>
      <View style={{ marginTop: 96, alignItems: "center" }}>
        <Logo size={40} />
        <Text style={[s.h1, { textAlign: "center", marginTop: 22 }]}>위변조 불가능한{"\n"}면책 증빙, 지금 시작.</Text>
        <Text style={[s.body, s.muted, { textAlign: "center", maxWidth: 360, marginBottom: 26 }]}>가입 없이 5분, 우리 사업장의 증빙 갭을 먼저 확인하고 현장에서 증빙을 상시 쌓으세요.</Text>
        <Link src={SITE} style={{ textDecoration: "none" }}>
          <View style={{ backgroundColor: C.safe, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 28 }}>
            <Text style={{ color: C.white, fontWeight: 700, fontSize: 12 }}>내 사업장 면책 상태 진단 →</Text>
          </View>
        </Link>

        {/* QR(인쇄물·화면 공유용) + 탭 링크(폰 열람용) */}
        <View style={{ marginTop: 30, alignItems: "center" }}>
          <View style={{ padding: 8, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 10 }}>
            <Image src={QR} style={{ width: 108, height: 108 }} />
          </View>
          <Text style={[s.muted, { fontSize: 9, marginTop: 10 }]}>QR을 찍거나, 휴대폰으로 보고 계시다면 아래 주소를 누르세요.</Text>
          <Link src={SITE} style={{ color: C.safe, fontSize: 11.5, fontWeight: 700, marginTop: 5, textDecoration: "underline" }}>
            safe-note-roan.vercel.app
          </Link>
        </View>
      </View>
      <Footer p="05 · 시작하기" />
    </Page>
  </Document>
);

async function main() {
  const qr = await QRCode.toDataURL(SITE, { margin: 1, width: 480, color: { dark: C.ink, light: C.white } });
  await renderToFile(buildDoc(qr), join(process.cwd(), "docs", "SafeNote-소개서-차별화.pdf"));
  console.log("✓ 생성: docs/SafeNote-소개서-차별화.pdf");
}
main();
