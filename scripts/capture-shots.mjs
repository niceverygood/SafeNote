/**
 * 운영 웹 화면 캡처 (소개서 삽입용). 실행: node scripts/capture-shots.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const SITE = "https://safe-note-roan.vercel.app";
const WID = "bff17bd0-8adf-4506-9635-6eac6c82fa68";
const OUT = "docs/store";
mkdirSync(OUT, { recursive: true });

const shot = async (page, path) => {
  await page.waitForTimeout(1500);
  await page.screenshot({ path, fullPage: false });
  console.log("✓", path);
};

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

  await page.goto(`${SITE}/`, { waitUntil: "networkidle" });
  await shot(page, `${OUT}/web-landing.png`);

  await page.goto(`${SITE}/risk-assessment/new`, { waitUntil: "networkidle" });
  await shot(page, `${OUT}/web-risk.png`);

  // 관리자 로그인 → 대시보드
  await page.goto(`${SITE}/admin/login`, { waitUntil: "networkidle" });
  await page.fill("#email", "manager@safenote.test");
  await page.fill("#pw", "safenote-manager-2026");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin**", { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.goto(`${SITE}/admin/workspaces/${WID}/dashboard`, { waitUntil: "networkidle" });
  await shot(page, `${OUT}/web-dashboard.png`);

  await browser.close();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
