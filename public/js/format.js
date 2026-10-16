import { t } from "./strings.js";

export function formatMoney(amount, currency, locale = "ar-IL") {
  if (typeof amount !== "number" || !currency) {
    return t.pricePending;
  }
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function formatLocale(meta) {
  if (meta?.currency === "ILS") return "ar-IL";
  if (meta?.locale === "ar" || meta?.locale?.startsWith("ar")) return "ar-EG";
  return meta?.locale || "ar-IL";
}

export function productDescription(product) {
  if (product.shortDescription?.trim()) return product.shortDescription.trim();
  if (product.description?.trim()) return product.description.trim();
  return t.descPending;
}
