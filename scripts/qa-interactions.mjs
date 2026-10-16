import { chromium } from "playwright";

const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:41920";

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "msedge", headless: true });
  } catch {
    return chromium.launch({ channel: "chrome", headless: true });
  }
}

async function run() {
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForSelector(".product-card", { timeout: 15000 });

  await page.click("[data-nav-toggle]");
  const navOpen = await page.locator("#mobile-nav-panel.is-open").isVisible();
  await page.keyboard.press("Escape");
  const navClosed = !(await page.locator("#mobile-nav-panel.is-open").isVisible());

  await page.click("[data-cart-open]");
  const cartOpen = await page.locator("#cart-drawer.is-open").isVisible();
  await page.click("[data-nav-toggle]").catch(() => {});
  const navClosedWhenCartWasOpen = !(await page.locator("#mobile-nav-panel.is-open").isVisible());
  await page.keyboard.press("Escape");
  const cartClosed = !(await page.locator("#cart-drawer.is-open").isVisible());

  await page.locator("[data-add-cart]").first().click();
  await page.waitForTimeout(400);
  const cartCount = await page.locator("[data-cart-count]").first().getAttribute("data-count");

  await page.click("[data-cart-open]");
  await page.locator("[data-qty-inc]").first().click();
  await page.locator("[data-qty-dec]").first().click();
  await page.keyboard.press("Escape");

  const viewports = [
    [320, 700],
    [375, 812],
    [430, 932],
    [768, 1024],
    [1024, 768],
    [1440, 900],
    [1920, 1080],
  ];
  const viewportResults = [];
  for (const [w, h] of viewports) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".product-card", { timeout: 15000 });
    const metrics = await page.evaluate(() => {
      const card = document.querySelector(".product-card");
      const vp = document.querySelector(".carousel__viewport");
      const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      const cardW = card?.getBoundingClientRect().width ?? 0;
      const vpW = vp?.getBoundingClientRect().width ?? 1;
      return {
        cards: document.querySelectorAll(".product-card").length,
        overflow,
        visibleCardRatio: cardW / vpW,
      };
    });
    viewportResults.push({ width: w, height: h, ...metrics });
  }

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".product-card");
  await page.locator("[data-carousel-next]").click();
  await page.waitForTimeout(350);
  const carouselMoved = await page.evaluate(() => {
    const vp = document.querySelector(".carousel__viewport");
    return vp ? Math.abs(vp.scrollLeft) > 2 : false;
  });

  await page.goto(`${BASE}/`);
  await page.evaluate(() => {
    localStorage.setItem("gc_cart_v1", JSON.stringify({ items: { "gc-001": 1 } }));
  });
  await page.goto(`${BASE}/checkout.html`, { waitUntil: "networkidle" });
  await page.fill("#fullName", "QA");
  await page.fill("#phone", "0501234567");
  await page.fill("#city", "City");
  await page.fill("#address", "Street 123 enough chars");
  await page.fill("#fullName", "");
  await page.click("#submit-order");
  await page.waitForTimeout(800);
  const nameValue = await page.inputValue("#fullName");
  const fullNameError = await page.locator('[data-error-for="fullName"]').textContent();
  const errorSummaryVisible = await page.locator("#form-error-summary:not([hidden])").count();

  const footerContact = await page.locator("#site-contact").textContent();

  console.log(
    JSON.stringify(
      {
        navOpen,
        navClosed,
        cartOpen,
        cartClosed,
        navClosedWhenCartWasOpen,
        cartCount,
        carouselMoved,
        checkoutValidation: {
          nameValue,
          fullNameError: fullNameError?.trim(),
          errorSummaryVisible,
        },
        footerHasDevJsonHint: /business\.json/i.test(footerContact || ""),
        pageErrors,
        viewportResults,
      },
      null,
      2
    )
  );

  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
