import { t } from "./strings.js";

function setText(sel, text) {
  const el = document.querySelector(sel);
  if (el && text) el.textContent = text;
}

export function renderHomeCopy(meta) {
  const lead = document.querySelector("[data-hero-lead]");
  if (lead) {
    const copy = meta.heroLead?.trim() || meta.tagline?.trim() || "";
    lead.textContent = copy;
    lead.hidden = !copy;
  }

  setText("[data-featured-title]", t.featuredTitle);
  setText("[data-featured-intro]", t.featuredIntro);
  setText("[data-view-all-products]", t.viewAllProducts);
  setText("[data-home-pillar-cod]", t.homePillarCod);
  setText("[data-home-pillar-cod-hint]", t.homePillarCodHint);
  setText("[data-home-pillar-price]", t.homePillarPrice);
  setText("[data-home-pillar-price-hint]", t.homePillarPriceHint);
  setText("[data-home-pillar-range]", t.homePillarRange);
  setText("[data-home-pillar-range-hint]", t.homePillarRangeHint);

  document.querySelectorAll("[data-cat-motors]").forEach((el) => {
    el.textContent = t.categoryMotorsShort;
  });
  document.querySelectorAll("[data-cat-wpc]").forEach((el) => {
    el.textContent = t.categoryWpcShort;
  });
  document.querySelectorAll("[data-cat-marble]").forEach((el) => {
    el.textContent = t.categoryMarbleShort;
  });

  setText("[data-home-step-1]", t.homeStep1);
  setText("[data-home-step-2]", t.homeStep2);
  setText("[data-home-step-3]", t.homeStep3);
}

export function initPlaceMap() {
  const frame = document.querySelector("[data-place-map]");
  if (!frame) return;
  const src = frame.getAttribute("data-src");
  if (!src || frame.getAttribute("src")) return;

  const show = () => frame.setAttribute("src", src);
  if (!("IntersectionObserver" in window)) {
    show();
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      show();
      io.disconnect();
    },
    { rootMargin: "240px" }
  );
  io.observe(frame);
}

export function initHomeMotion() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const sections = document.querySelectorAll("[data-home-section]");
  if (!sections.length) return;

  const reveal = (el) => {
    el.classList.add("is-visible");
  };

  if (!("IntersectionObserver" in window)) {
    sections.forEach(reveal);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -4% 0px" }
  );

  sections.forEach((el) => io.observe(el));
}
