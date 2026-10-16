import { trapFocus } from "./ui.js";
import { t } from "./strings.js";

let releaseNavTrap = null;
let menuTrigger = null;

function isNavOpen() {
  return document.getElementById("mobile-nav-panel")?.classList.contains("is-open");
}

export function closeMobileNav() {
  const panel = document.getElementById("mobile-nav-panel");
  const overlay = document.getElementById("nav-overlay");
  if (!panel?.classList.contains("is-open")) return;

  panel.classList.remove("is-open");
  overlay?.classList.remove("is-visible");
  panel.setAttribute("aria-hidden", "true");
  panel.hidden = true;
  document.querySelectorAll("[data-nav-toggle]").forEach((btn) => {
    btn.setAttribute("aria-expanded", "false");
    if (btn.classList.contains("menu-toggle")) {
      btn.setAttribute("aria-label", t.openMenu);
    }
  });
  document.body.classList.remove("nav-open");

  releaseNavTrap?.();
  releaseNavTrap = null;
  const focusTarget = document.querySelector(".menu-toggle[data-nav-toggle]") || menuTrigger;
  focusTarget?.focus();
}

export function openMobileNav(trigger) {
  const panel = document.getElementById("mobile-nav-panel");
  const overlay = document.getElementById("nav-overlay");
  const menuToggle = document.querySelector(".menu-toggle[data-nav-toggle]");
  if (!panel) return;

  menuTrigger = trigger?.classList?.contains("menu-toggle") ? trigger : menuToggle || trigger;
  panel.hidden = false;
  panel.classList.add("is-open");
  overlay?.classList.add("is-visible");
  panel.setAttribute("aria-hidden", "false");
  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", t.closeMenu);
  }
  document.body.classList.add("nav-open");

  releaseNavTrap?.();
  releaseNavTrap = trapFocus(panel);
}

export function initMobileNav() {
  const overlay = document.getElementById("nav-overlay");
  const panel = document.getElementById("mobile-nav-panel");

  document.querySelectorAll("[data-nav-toggle]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (isNavOpen()) closeMobileNav();
      else openMobileNav(btn);
    });
  });

  overlay?.addEventListener("click", closeMobileNav);

  panel?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeMobileNav());
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isNavOpen()) {
      e.preventDefault();
      closeMobileNav();
    }
  });
}

export function initHeaderCompact() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle("site-header--compact", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}
