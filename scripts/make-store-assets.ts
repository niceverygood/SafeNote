/**
 * Play 스토어 등록 그래픽 생성: 아이콘 512, 피처 그래픽 1024×500, 폰 스크린샷.
 * 실행: npx tsx scripts/make-store-assets.ts
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

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
const FONT = "Apple SD Gothic Neo, Pretendard, AppleGothic, sans-serif";
const OUT = join(process.cwd(), "docs", "store");
mkdirSync(OUT, { recursive: true });

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
async function png(svg: string, name: string) {
  await sharp(Buffer.from(svg)).png().toFile(join(OUT, name));
  console.log("✓", name);
}

function brandMark(x: number, y: number, size: number, onGreen = false) {
  const r1 = size * 0.22;
  const sq = size * 0.42;
  const off = (size - sq) / 2;
  const r2 = sq * 0.22;
  const tile = onGreen ? C.white : C.safe;
  const inner = onGreen ? C.safe : C.white;
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r1}" fill="${tile}"/>
    <rect x="${x + off}" y="${y + off}" width="${sq}" height="${sq}" rx="${r2}" fill="${inner}"/>`;
}

// ── 아이콘 512 (풀블리드 초록 + 흰 마크)
function iconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="${C.safe}"/>
    ${brandMark(140, 140, 232, true)}
  </svg>`;
}

// ── 피처 그래픽 1024×500
function featureSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
    <rect width="1024" height="500" fill="${C.surface}"/>
    <rect width="14" height="500" fill="${C.safe}"/>
    <g font-family="${FONT}">
      <text x="72" y="150" font-size="26" letter-spacing="6" fill="${C.safe}" font-weight="700">S A F E N O T E</text>
      <text x="70" y="240" font-size="62" fill="${C.ink}" font-weight="800">현장 안전점검,</text>
      <text x="70" y="312" font-size="62" fill="${C.ink}" font-weight="800">증빙까지 자동으로.</text>
      <text x="72" y="372" font-size="26" fill="${C.muted}">작업 전·중·후 점검 · 위험 신고 · 위변조 방지 기록</text>
    </g>
    <g transform="translate(792,150)">
      <rect x="-24" y="-24" width="248" height="248" rx="36" fill="${C.safe}"/>
      ${brandMark(40, 40, 120, true)}
    </g>
  </svg>`;
}

// ── 폰 스크린샷 프레임 (1080×1920): 상단 캡션 + 흰 화면 카드
function frame(caption: string, sub: string, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
    <rect width="1080" height="1920" fill="${C.safe}"/>
    <g font-family="${FONT}">
      <text x="80" y="170" font-size="56" fill="${C.white}" font-weight="800">${esc(caption)}</text>
      <text x="80" y="240" font-size="34" fill="#FFFFFFCC">${esc(sub)}</text>
    </g>
    <g transform="translate(80,330)">
      <rect width="920" height="1480" rx="40" fill="${C.surface}"/>
      ${body}
    </g>
  </svg>`;
}

function chip(x: number, y: number, text: string, tone: string) {
  return `<rect x="${x}" y="${y}" width="${36 + text.length * 22}" height="46" rx="23" fill="${tone}22" stroke="${tone}55"/>
    <text x="${x + 18}" y="${y + 31}" font-size="26" fill="${tone}" font-family="${FONT}" font-weight="600">${esc(text)}</text>`;
}

// SS1: 작업 전·중·후 홈
function ss1() {
  const card = (i: number, label: string, done: boolean, time: string) => {
    const y = 230 + i * 150;
    return `<rect x="48" y="${y}" width="824" height="120" rx="20" fill="${C.white}" stroke="${done ? C.safe + "55" : C.border}"/>
      <circle cx="100" cy="${y + 60}" r="22" fill="${done ? C.safe : "none"}" stroke="${done ? C.safe : C.border}" stroke-width="3"/>
      ${done ? `<text x="100" y="${y + 70}" font-size="26" fill="#fff" text-anchor="middle" font-family="${FONT}">✓</text>` : ""}
      <text x="150" y="${y + 52}" font-size="34" fill="${C.ink}" font-family="${FONT}" font-weight="700">${label}</text>
      <text x="150" y="${y + 92}" font-size="26" fill="${C.muted}" font-family="${FONT}">${done ? time + " 완료" : "미완료 — 지금 점검하기"}</text>`;
  };
  const body = `
    <text x="48" y="80" font-size="30" fill="${C.muted}" font-family="${FONT}">베타공장</text>
    <text x="48" y="140" font-size="46" fill="${C.ink}" font-weight="800" font-family="${FONT}">오늘도 안전하게.</text>
    <text x="48" y="200" font-size="28" fill="${C.muted}" font-family="${FONT}">오늘 점검 2/3 완료</text>
    ${card(0, "작업 전 점검", true, "08:12")}
    ${card(1, "작업 중 점검", true, "13:40")}
    ${card(2, "작업 후 점검", false, "")}
    <rect x="48" y="690" width="824" height="110" rx="20" fill="${C.caution}1A" stroke="${C.caution}55"/>
    <text x="80" y="752" font-size="34" fill="${C.caution}" font-family="${FONT}" font-weight="700">위험 신고</text>`;
  return frame("작업 전·중·후를 한 번에", "단계별 점검을 빠뜨리지 않게", body);
}

// SS2: 위험 신고(사진·위치)
function ss2() {
  const body = `
    <text x="48" y="90" font-size="46" fill="${C.ink}" font-weight="800" font-family="${FONT}">위험 신고</text>
    <text x="48" y="146" font-size="28" fill="${C.muted}" font-family="${FONT}">발견한 위험을 바로 알리세요</text>
    <rect x="48" y="190" width="824" height="240" rx="20" fill="${C.white}" stroke="${C.border}"/>
    <text x="78" y="250" font-size="30" fill="${C.muted}" font-family="${FONT}">통로에 적재물이 쌓여 있습니다</text>
    <text x="48" y="500" font-size="30" fill="${C.ink}" font-family="${FONT}" font-weight="600">위험 정도</text>
    ${chip(48, 530, "낮음", C.muted)}${chip(230, 530, "보통", C.muted)}${chip(412, 530, "높음", C.danger)}
    <rect x="48" y="620" width="400" height="110" rx="20" fill="${C.white}" stroke="${C.border}"/>
    <text x="248" y="685" font-size="30" fill="${C.ink}" text-anchor="middle" font-family="${FONT}">사진 첨부</text>
    <rect x="472" y="620" width="400" height="110" rx="20" fill="${C.safe}1A" stroke="${C.safe}55"/>
    <text x="672" y="685" font-size="30" fill="${C.safe}" text-anchor="middle" font-family="${FONT}">위치 첨부됨</text>
    <rect x="48" y="780" width="824" height="116" rx="20" fill="${C.safe}"/>
    <text x="460" y="850" font-size="34" fill="#fff" text-anchor="middle" font-family="${FONT}" font-weight="700">신고 보내기</text>`;
  return frame("위험은 즉시 신고", "사진·위치와 함께, 관리자에 실시간 통지", body);
}

// SS3: 관리자 대시보드 매트릭스
function ss3() {
  const head = `<text x="40" y="60" font-size="28" fill="${C.muted}" font-family="${FONT}">작업자</text>
    <text x="380" y="60" font-size="28" fill="${C.muted}" font-family="${FONT}">작업 전</text>
    <text x="560" y="60" font-size="28" fill="${C.muted}" font-family="${FONT}">작업 중</text>
    <text x="740" y="60" font-size="28" fill="${C.muted}" font-family="${FONT}">작업 후</text>`;
  const cell = (x: number, y: number, ok: boolean, t: string) =>
    ok
      ? `<text x="${x}" y="${y}" font-size="26" fill="${C.safe}" font-family="${FONT}" font-weight="600">✓ ${t}</text>`
      : `<text x="${x}" y="${y}" font-size="26" fill="${C.muted}" font-family="${FONT}">—</text>`;
  const row = (i: number, name: string, a: boolean, b: boolean, c: boolean) => {
    const y = 130 + i * 90;
    return `<text x="40" y="${y}" font-size="30" fill="${C.ink}" font-family="${FONT}" font-weight="600">${name}</text>
      ${cell(380, y, a, "08:1")}${cell(560, y, b, "13:4")}${cell(740, y, c, "17:0")}
      <line x1="40" y1="${y + 30}" x2="880" y2="${y + 30}" stroke="${C.border}"/>`;
  };
  const body = `
    <text x="48" y="90" font-size="46" fill="${C.ink}" font-weight="800" font-family="${FONT}">작업 전·중·후 점검 현황</text>
    <text x="48" y="146" font-size="28" fill="${C.muted}" font-family="${FONT}">오늘 · 시각별 진행</text>
    <g transform="translate(48,210)">
      <rect x="0" y="0" width="824" height="560" rx="20" fill="${C.white}" stroke="${C.border}"/>
      <g transform="translate(20,40)">
        ${head}
        ${row(0, "김작업", true, true, true)}
        ${row(1, "이작업", true, true, false)}
        ${row(2, "박작업", true, false, false)}
        ${row(3, "최작업", false, false, false)}
      </g>
    </g>`;
  return frame("관리자는 한눈에", "누가 언제 점검했는지 시각까지", body);
}

async function main() {
  await png(iconSvg(), "play-icon-512.png");
  await png(featureSvg(), "feature-graphic-1024x500.png");
  await png(ss1(), "screenshot-1.png");
  await png(ss2(), "screenshot-2.png");
  await png(ss3(), "screenshot-3.png");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
