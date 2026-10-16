import { fetchCatalog } from "./api.js";
import { initCartUi } from "./cart-ui.js";
import { renderContact, renderFooter, applySiteBranding } from "./site-chrome.js";
import { initMobileNav, initHeaderCompact } from "./nav-ui.js";
import { hydrateIcons } from "./icons-init.js";
import { renderHomeCopy, initHomeMotion, initPlaceMap } from "./home-ui.js";

function renderHero(meta) {
  const eyebrow = document.querySelector("[data-hero-eyebrow]");
  const title = document.querySelector("[data-hero-title]");
  const wordmark = document.querySelector("[data-hero-wordmark]");

  if (wordmark) {
    wordmark.textContent = meta.companyName || "GLOBAL COMPANY";
  }

  if (eyebrow) {
    eyebrow.textContent = meta.heroEyebrow || meta.companyName || "GLOBAL COMPANY";
  }
  if (title) {
    title.textContent = meta.heroTitle || meta.companyName || "GLOBAL COMPANY";
  }

  const logo = document.querySelector("[data-hero-logo]");
  if (logo) {
    logo.src = meta.logoOutline || meta.logo || logo.src;
  }

  const heroRoot = document.querySelector("[data-hero-root]");
  const heroMedia = document.querySelector("[data-hero-media]");
  const heroImg = document.querySelector("[data-hero-image]");
  const hasImage = meta.heroImage && !meta.heroImage.includes("placeholder");

  if (heroImg && hasImage) {
    heroImg.src = meta.heroImage;
    heroImg.alt = "";
    heroRoot?.classList.remove("hero-luxe--ambient");
    heroMedia?.removeAttribute("hidden");

    const markReady = () => {
      if (heroImg.naturalWidth > 0) {
        heroImg.classList.add("is-ready");
        heroRoot?.classList.add("hero-luxe--ready");
      }
    };

    if (heroImg.complete) markReady();
    else heroImg.addEventListener("load", markReady, { once: true });

    heroImg.addEventListener(
      "error",
      () => {
        heroImg.classList.remove("is-ready");
        heroRoot?.classList.remove("hero-luxe--ready");
        heroRoot?.classList.add("hero-luxe--ambient");
        heroMedia?.setAttribute("hidden", "");
      },
      { once: true }
    );
  } else {
    heroRoot?.classList.add("hero-luxe--ambient");
    heroRoot?.classList.remove("hero-luxe--ready");
    heroMedia?.setAttribute("hidden", "");
    heroImg?.classList.remove("is-ready");
  }
}

async function boot() {
  try {
    const catalog = await fetchCatalog();
    const { meta } = catalog;

    applySiteBranding(meta);

    const aboutSection = document.querySelector("[data-about]");
    if (aboutSection && meta.about) aboutSection.textContent = meta.about;

    renderHero(meta);
    renderHomeCopy(meta);
    initPlaceMap();
    renderContact(meta);
    renderFooter(meta);
    initCartUi(catalog);
  } catch (err) {
    console.error(err);
  }
}

hydrateIcons();
initMobileNav();
initHeaderCompact();
initHomeMotion();
boot();
