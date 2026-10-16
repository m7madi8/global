import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:3456/", { waitUntil: "domcontentloaded", timeout: 15000 });
await page.locator("#location").scrollIntoViewIfNeeded();
await page.waitForTimeout(1800);

const info = await page.evaluate(() => {
  const iframe = document.querySelector(".place-luxe__map iframe");
  const cs = getComputedStyle(iframe);
  return {
    pointerEvents: cs.pointerEvents,
    scrolling: iframe.getAttribute("scrolling"),
  };
});
console.log(JSON.stringify(info));

await page.evaluate(() => {
  const frame = document.querySelector(".place-luxe__frame");
  const top = frame.getBoundingClientRect().top + window.scrollY - 180;
  window.scrollTo(0, top);
});
await page.waitForTimeout(200);
const metrics = await page.evaluate(() => ({
  y: window.scrollY,
  max: document.documentElement.scrollHeight - window.innerHeight,
}));
const box = await page.locator(".place-luxe__frame").boundingBox();
await page.evaluate(() => {
  window.__wheel = [];
  document.addEventListener(
    "wheel",
    (event) => {
      window.__wheel.push({
        target: event.target.className || event.target.tagName,
        defaultPrevented: event.defaultPrevented,
        deltaY: event.deltaY,
      });
    },
    { capture: true }
  );
});
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.wheel(0, 360);
await page.waitForTimeout(400);
const after = await page.evaluate(() => ({
  y: window.scrollY,
  wheel: window.__wheel,
}));
console.log("scroll", Math.round(metrics.y), Math.round(after.y), "max", Math.round(metrics.max));
console.log(JSON.stringify(after.wheel));

await page.locator("#location").screenshot({ path: "d:/projects/global company/_map-desktop.png" });

await page.setViewportSize({ width: 390, height: 844 });
await page.locator("#location").scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
await page.locator("#location").screenshot({ path: "d:/projects/global company/_map-mobile.png" });

await browser.close();
