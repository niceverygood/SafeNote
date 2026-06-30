/**
 * App Store용 iPhone 6.7" 스크린샷(1290×2796) 캡처. 실행: node scripts/capture-ios-shots.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const SITE = "https://safe-note-roan.vercel.app";
const OUT = "docs/store";
mkdirSync(OUT, { recursive: true });

const run = async () => {
  const browser = await chromium.launch();
  // 430x932 @ 3x = 1290x2796 (iPhone 6.7")
  const ctx = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();

  // 1) 랜딩
  await page.goto(`${SITE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/ios-1-landing.png` });
  console.log("✓ ios-1-landing");

  // 2) 자가진단
  await page.goto(`${SITE}/diagnosis`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/ios-2-diagnosis.png` });
  console.log("✓ ios-2-diagnosis");

  // 3) 근로자 앱 홈 (로그인 세션 주입)
  const res = await page.request.post(`${SITE}/api/worker/login`, {
    data: { username: "test", password: "test1234" },
  });
  const session = await res.json();
  await page.addInitScript((s) => {
    localStorage.setItem("safenote_worker", JSON.stringify(s));
  }, session);
  await page.goto(`${SITE}/w`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/ios-3-worker.png` });
  console.log("✓ ios-3-worker");

  await browser.close();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
