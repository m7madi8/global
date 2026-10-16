import { chromium } from "playwright";
import path from "path";

const out = path.join(process.cwd(), "_verify");
const browser = await chromium.launch({ channel: "msedge", headless: true }).catch(() =>
  chromium.launch({ channel: "chrome", headless: true })
);
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto("http://127.0.0.1:3456/#location", { waitUntil: "networkidle" });
await page.waitForFunction(() => document.querySelector("[data-place-map]")?.getAttribute("src"));
await page.waitForTimeout(3500);
const metrics = await page.evaluate(() => {
  const h = document.querySelector(".site-header__bar").getBoundingClientRect();
  const t = document.querySelector("#location-title").getBoundingClientRect();
  return { headerBottom: Math.round(h.bottom), titleTop: Math.round(t.top) };
});
console.log("anchor", metrics);
await page.locator(".place-luxe__frame").screenshot({ path: path.join(out, "map-frame-mobile.png") });
await browser.close();
