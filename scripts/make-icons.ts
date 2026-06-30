/**
 * PWA 아이콘 생성 (브랜드 마크). 실행: npx tsx scripts/make-icons.ts
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const SAFE = "#15643E";
const OUT = join(process.cwd(), "public", "icons");
mkdirSync(OUT, { recursive: true });

/** 일반 아이콘: 초록 타일 + 흰 라운드 사각 + 안쪽 초록 사각 (브랜드 마크) */
function iconSvg(size: number, pad = 0): string {
  const s = size;
  const m = s * pad; // maskable 안전영역 여백
  const inner = s - m * 2;
  const tile = inner * 0.62;
  const tileX = m + (inner - tile) / 2;
  const r1 = tile * 0.22;
  const sq = tile * 0.42;
  const sqX = tileX + (tile - sq) / 2;
  const r2 = sq * 0.22;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <rect width="${s}" height="${s}" rx="${s * 0.22}" fill="${SAFE}"/>
    <rect x="${tileX}" y="${tileX}" width="${tile}" height="${tile}" rx="${r1}" fill="#FFFFFF"/>
    <rect x="${sqX}" y="${sqX}" width="${sq}" height="${sq}" rx="${r2}" fill="${SAFE}"/>
  </svg>`;
}

async function gen(name: string, size: number, pad = 0) {
  await sharp(Buffer.from(iconSvg(size, pad))).png().toFile(join(OUT, name));
  console.log("✓", name);
}

async function main() {
  await gen("icon-192.png", 192);
  await gen("icon-512.png", 512);
  await gen("icon-maskable-512.png", 512, 0.12);
  await gen("apple-touch-icon.png", 180);
  // 파비콘
  await sharp(Buffer.from(iconSvg(64)))
    .resize(48, 48)
    .png()
    .toFile(join(process.cwd(), "public", "favicon.png"));
  console.log("✓ favicon.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
