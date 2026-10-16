import { fetchCatalog, submitOrder } from "./api.js";

import { getCartItems, clearCart, subscribeCart } from "./cart.js";

import { formatMoney, formatLocale } from "./format.js";

import { renderContact, renderFooter, applySiteBranding } from "./site-chrome.js";

import { hydrateIcons } from "./icons-init.js";

import { t } from "./strings.js";

import { normalizeCatalogState } from "./catalog-product.js";



let catalogState = null;

let moneyLocale = "ar-EG";

let isSubmitting = false;



function escapeHtml(str) {

  return String(str)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;");

}



function buildSummaryParts() {

  const items = getCartItems();

  if (!items.length || !catalogState) {

    return { linesHtml: `<p class="checkout__empty-lines">${t.emptyCartCheckout}</p>`, totalsHtml: "" };

  }



  let subtotal = 0;

  const linesHtml = items

    .map(({ id, quantity }) => {

      const product = catalogState.products.find((p) => p.id === id);

      if (!product || typeof product.price !== "number") return "";

      const lineTotal = product.price * quantity;

      subtotal += lineTotal;

      return `<article class="checkout-line"><div class="checkout-line__copy"><p class="checkout-line__name">${escapeHtml(product.displayName)}</p><p class="checkout-line__qty">الكمية ${quantity}</p></div><p class="checkout-line__price tabular-nums">${formatMoney(lineTotal, catalogState.meta.currency, moneyLocale)}</p></article>`;

    })

    .join("");



  const delivery = catalogState.meta.deliveryCharge;

  const deliveryRow =

    typeof delivery === "number"

      ? `<div class="cart-totals__row"><span>${t.delivery}</span><span class="tabular-nums">${formatMoney(delivery, catalogState.meta.currency, moneyLocale)}</span></div>`

      : "";

  const total = subtotal + (typeof delivery === "number" ? delivery : 0);



  const totalsHtml = `

    <div class="cart-totals">

      <div class="cart-totals__row"><span>${t.subtotal}</span><span class="tabular-nums">${formatMoney(subtotal, catalogState.meta.currency, moneyLocale)}</span></div>

      ${deliveryRow}

      <div class="cart-totals__row cart-totals__row--total"><span>${t.totalDueOnDelivery}</span><span class="tabular-nums">${formatMoney(total, catalogState.meta.currency, moneyLocale)}</span></div>

    </div>`;



  return { linesHtml, totalsHtml };

}



function renderSummary() {

  const { linesHtml, totalsHtml } = buildSummaryParts();

  document.querySelectorAll("[data-order-summary-lines]").forEach((el) => {

    el.innerHTML = linesHtml;

  });

  document.querySelectorAll("[data-order-summary-totals]").forEach((el) => {

    el.innerHTML = totalsHtml;

  });

}



function setFieldError(id, message) {

  const input = document.getElementById(id);

  const err = document.querySelector(`[data-error-for="${id}"]`);

  if (input) input.setAttribute("aria-invalid", message ? "true" : "false");

  if (err) err.textContent = message || "";

}



function clearErrors() {

  ["fullName", "phone", "city", "address"].forEach((id) => setFieldError(id, ""));

  const summary = document.getElementById("form-error-summary");

  if (summary) {

    summary.hidden = true;

    summary.innerHTML = "";

  }

}



function showErrorSummary(errors) {

  const summary = document.getElementById("form-error-summary");

  if (!summary) return;

  const entries = Object.entries(errors);

  if (!entries.length) {

    summary.hidden = true;

    return;

  }

  summary.hidden = false;

  summary.innerHTML = `<strong>${t.fixErrors}</strong><ul>${entries

    .map(([key, msg]) => `<li><a href="#${key === "items" || key === "catalog" ? "checkout-form" : key}">${escapeHtml(msg)}</a></li>`)

    .join("")}</ul>`;

  summary.focus();

}



async function handleSubmit(e) {

  e.preventDefault();

  if (isSubmitting) return;

  clearErrors();



  const submitBtn = document.getElementById("submit-order");

  isSubmitting = true;

  submitBtn.disabled = true;

  submitBtn.textContent = t.placingOrder;



  const customer = {

    fullName: document.getElementById("fullName").value,

    phone: document.getElementById("phone").value,

    city: document.getElementById("city").value,

    address: document.getElementById("address").value,

    notes: document.getElementById("notes").value,

  };



  const items = getCartItems();



  try {

    const result = await submitOrder({ customer, items });

    clearCart();

    document.getElementById("checkout-main").hidden = true;

    const success = document.getElementById("checkout-success");

    success.hidden = false;

    document.getElementById("success-order-id").textContent = result.orderId;

    document.getElementById("success-total").textContent = formatMoney(

      result.total,

      result.currency,

      moneyLocale

    );

    success.querySelector("h1")?.focus();

  } catch (err) {

    const errors = err.errors || { _form: err.message };

    Object.entries(errors).forEach(([key, msg]) => {

      if (["fullName", "phone", "city", "address"].includes(key)) setFieldError(key, msg);

    });

    showErrorSummary(errors);

    const firstInvalid = ["fullName", "phone", "city", "address"].find((k) => errors[k]);

    if (firstInvalid) document.getElementById(firstInvalid)?.focus();

    isSubmitting = false;

    submitBtn.disabled = getCartItems().length === 0;

    submitBtn.textContent = t.placeOrder;

  }

}



async function boot() {

  hydrateIcons();

  catalogState = normalizeCatalogState(await fetchCatalog());

  moneyLocale = formatLocale(catalogState.meta);

  applySiteBranding(catalogState.meta, "إتمام الطلب");

  renderContact(catalogState.meta);

  renderFooter(catalogState.meta);

  renderSummary();

  subscribeCart(renderSummary);



  const form = document.getElementById("checkout-form");

  form?.addEventListener("submit", handleSubmit);



  if (!getCartItems().length) {

    document.getElementById("empty-cart-notice").hidden = false;

    form.querySelector("fieldset")?.setAttribute("disabled", "true");

    document.getElementById("submit-order").disabled = true;

  }

}



boot().catch(() => {

  document.getElementById("checkout-main").innerHTML = t.catalogLoadCheckoutError;

});

