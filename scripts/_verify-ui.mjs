import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = "http://127.0.0.1:3456";
const out = path.join(process.cwd(), "_verify");
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true }).catch(() =>
  chromium.launch({ channel: "chrome", headless: true })
);
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.locator("#location").scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await page.locator("#location").screenshot({ path: path.join(out, "location-desktop.png") });
await page.locator(".site-footer").screenshot({ path: path.join(out, "footer-desktop.png") });

const homeText = await page.locator("#location").innerText();
const footerPolicies = await page.locator(".site-footer__policies").innerText();
const overflowHome = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.locator("#location").scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await page.locator("#location").screenshot({ path: path.join(out, "location-mobile.png") });
await page.locator(".site-footer").screenshot({ path: path.join(out, "footer-mobile.png") });
const overflowHomeMobile = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}/policies.html`, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(out, "policies-desktop.png"), fullPage: true });
const policyHeads = await page.locator(".policy-card h2").allTextContents();

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/policies.html`, { waitUntil: "domcontentloaded" });
await page.screenshot({ path: path.join(out, "policies-mobile.png"), fullPage: false });
const overflowPolicies = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}/checkout.html`);
await page.evaluate(() => {
  localStorage.setItem("gc_cart_v1", JSON.stringify({ items: { "gc-001": 2, "gc-wpc-001": 1 } }));
});
await page.goto(`${BASE}/checkout.html`, { waitUntil: "networkidle" });
await page.locator(".checkout__summary--desktop .checkout-line").first().waitFor();
await page.screenshot({ path: path.join(out, "checkout-desktop.png"), fullPage: true });

await page.fill("#fullName", "");
await page.fill("#phone", "0599000000");
await page.fill("#city", "الخليل");
await page.fill("#address", "شارع رئيسي، خاراس");
await page.click("#submit-order");
await page.waitForTimeout(400);
const nameError = (await page.locator('[data-error-for="fullName"]').textContent())?.trim();
const summaryVisible = await page.locator("#form-error-summary:not([hidden])").count();

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/checkout.html`, { waitUntil: "networkidle" });
await page.locator(".checkout__summary--mobile .checkout-line").first().waitFor();
await page.screenshot({ path: path.join(out, "checkout-mobile.png"), fullPage: true });
const overflowCheckout = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
const lineCount = await page.locator(".checkout__summary--mobile .checkout-line").count();

console.log(JSON.stringify({
  homeHasKharas: homeText.includes("خاراس") && homeText.includes("الخليل"),
  footerPolicies,
  policyHeads,
  nameError,
  summaryVisible,
  lineCount,
  overflowHome,
  overflowHomeMobile,
  overflowPolicies,
  overflowCheckout,
  errors,
}, null, 2));

await browser.close();
