import { t } from "./strings.js";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderContact(meta) {
  const mount = document.getElementById("site-contact");
  if (!mount) return;

  const parts = [];
  if (meta.contactPhone) {
    parts.push(
      `<a href="tel:${meta.contactPhone.replace(/\s/g, "")}">${escapeHtml(meta.contactPhone)}</a>`
    );
  }
  if (meta.contactWhatsapp) {
    const wa = meta.contactWhatsapp.replace(/\D/g, "");
    parts.push(`<a href="https://wa.me/${wa}" rel="noopener noreferrer">واتساب</a>`);
  }
  if (meta.contactEmail) {
    parts.push(`<a href="mailto:${meta.contactEmail}">${escapeHtml(meta.contactEmail)}</a>`);
  }
  if (meta.serviceAreaNote) {
    parts.push(`<span>${escapeHtml(meta.serviceAreaNote)}</span>`);
  }

  mount.innerHTML =
    parts.length > 0
      ? parts.join('<span class="site-footer__sep" aria-hidden="true">·</span>')
      : "";
}

export function renderFooter(meta) {
  const tagline = document.querySelector("[data-footer-tagline]");
  if (tagline) {
    const inRichFooter = Boolean(tagline.closest(".site-footer__shell--rich"));
    const text =
      meta.tagline?.trim() || meta.heroLead?.trim() || meta.about?.trim() || "";
    tagline.textContent = text;
    tagline.hidden = inRichFooter || !text;
  }

  const payment = document.querySelector("[data-footer-payment]");
  if (payment) {
    const note = meta.paymentNote?.trim();
    payment.textContent = note || "الدفع نقداً عند الاستلام.";
    payment.hidden = !payment.textContent;
  }

  const yearEl = document.querySelector("[data-footer-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  document.querySelectorAll("[data-footer-brand]").forEach((el) => {
    el.textContent = meta.companyName || "GLOBAL COMPANY";
  });

  const placeLabel = [meta.address, meta.city].filter((part) => part && String(part).trim()).join(" — ");
  document.querySelectorAll("[data-footer-place]").forEach((el) => {
    if (placeLabel) el.textContent = placeLabel;
  });
  document.querySelectorAll("[data-place-title]").forEach((el) => {
    if (placeLabel) el.textContent = placeLabel;
  });

  const logo = document.querySelector("[data-footer-logo]");
  if (logo) {
    logo.src = meta.logoOutline || meta.logo || logo.src;
    logo.alt = meta.companyName || "GLOBAL COMPANY";
  }
}

export function applySiteBranding(meta, pageTitleSuffix = t.pageTitleSuffix) {
  document.title = meta.companyName
    ? `${meta.companyName} — ${pageTitleSuffix}`
    : `GLOBAL COMPANY — ${pageTitleSuffix}`;

  document.querySelectorAll("[data-brand-name]").forEach((el) => {
    el.textContent = meta.companyName || "GLOBAL COMPANY";
  });

  const logo = document.querySelector("[data-brand-logo]");
  if (logo && meta.logo) logo.src = meta.logo;
}
