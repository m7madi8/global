import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:41920";
mkdirSync("qa-screenshots/hero-canvas", { recursive: true });

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "msedge", headless: true });
  } catch {
    return chromium.launch({ channel: "chrome", headless: true });
  }
}

const browser = await launchBrowser();
const page = await browser.newPage();
const viewports = [
  [320, 700],
  [375, 812],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1440, 900],
  [1920, 1080],
];
const report = [];

for (const [w, h] of viewports) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForSelector(".hero-canvas", { timeout: 10000 });
  const metrics = await page.evaluate(() => {
    const hero = document.querySelector(".hero-canvas");
    const title = document.querySelector(".hero-canvas__title");
    const cta = document.querySelector(".hero-canvas__cta");
    const hr = hero.getBoundingClientRect();
    const tr = title.getBoundingClientRect();
    const cr = cta.getBoundingClientRect();
    const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    return {
      heroH: Math.round(hr.height),
      titleVisible: tr.bottom > 0 && tr.top < window.innerHeight,
      ctaVisible: cr.bottom > 0 && cr.top < window.innerHeight,
      heroVhPct: Math.round((hr.height / window.innerHeight) * 100),
      overflow,
    };
  });
  await page.locator(".hero-canvas").screenshot({
    path: `qa-screenshots/hero-canvas/${w}x${h}.png`,
  });
  report.push({ width: w, height: h, ...metrics });
}

console.log(JSON.stringify(report, null, 2));
await browser.close();
