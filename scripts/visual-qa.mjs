/**
 * Headless visual/functional QA — run: node scripts/visual-qa.mjs
 * Requires: npx playwright (downloads on first run)
 */
import { chromium } from "playwright";

const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:41920";
const viewports = [
  { name: "320x700", width: 320, height: 700 },
  { name: "375x812", width: 375, height: 812 },
  { name: "430x932", width: 430, height: 932 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
];

const outDir = "qa-screenshots";
const results = [];

async function checkOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ locale: "ar" });

  for (const vp of viewports) {
    const page = await context.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e.message)));

    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForSelector(".product-card", { timeout: 15000 }).catch(() => {
      errors.push("product-card missing");
    });

    const cardCount = await page.locator(".product-card").count();
    const overflow = await checkOverflow(page);
    await page.screenshot({ path: `${outDir}/home-${vp.name}.png`, fullPage: false });

    results.push({
      viewport: vp.name,
      cards: cardCount,
      overflow,
      consoleErrors: errors,
    });
    await page.close();
  }

  // Interaction smoke at 375
  const page = await context.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const interactions = {};

  await page.click("[data-nav-toggle]");
  interactions.navOpen = await page.locator("#mobile-nav-panel.is-open").isVisible();
  await page.keyboard.press("Escape");
  interactions.navClosedAfterEscape = !(await page.locator("#mobile-nav-panel.is-open").isVisible());

  await page.click("[data-cart-open]");
  interactions.cartOpen = await page.locator("#cart-drawer.is-open").isVisible();
  await page.keyboard.press("Escape");
  interactions.cartClosedAfterEscape = !(await page.locator("#cart-drawer.is-open").isVisible());

  await page.click("[data-add-cart]").first().catch(() => {});
  await page.waitForTimeout(300);
  interactions.cartCount = await page.locator("[data-cart-count]").first().getAttribute("data-count");

  await page.goto(`${BASE}/checkout.html`, { waitUntil: "networkidle" });
  interactions.checkoutLoaded = (await page.locator("#checkout-form").count()) > 0;

  await page.close();
  await browser.close();

  console.log(JSON.stringify({ results, interactions }, null, 2));
}

run().catch((e) => {
  console.error("QA failed:", e.message);
  process.exit(1);
});
