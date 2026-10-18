import {

  getCartItems,

  getCartCount,

  setQuantity,

  addToCart,

  subscribeCart,

} from "./cart.js";

import { formatMoney, formatLocale } from "./format.js";

import { showToast, trapFocus } from "./ui.js";

import { t } from "./strings.js";

import { initProductCarousel, refreshProductCarousel } from "./carousel.js";

import { closeMobileNav } from "./nav-ui.js";

import { icon } from "./icons.js";

import { isProductPurchasable, normalizeCatalogState } from "./catalog-product.js";

let catalogState = null;

let releaseFocusTrap = null;

let moneyLocale = "ar-EG";

let cartTrigger = null;
let dialogTrigger = null;



function getProduct(id) {

  return catalogState?.products?.find((p) => p.id === id);

}



function computeTotals(items) {

  const currency = catalogState?.meta?.currency;

  let subtotal = 0;

  const lines = items

    .map(({ id, quantity }) => {

      const product = getProduct(id);

      if (!product || typeof product.price !== "number") return null;

      const lineTotal = product.price * quantity;

      subtotal += lineTotal;

      return { product, quantity, lineTotal };

    })

    .filter(Boolean);



  const delivery =

    typeof catalogState?.meta?.deliveryCharge === "number"

      ? catalogState.meta.deliveryCharge

      : null;

  const total = subtotal + (delivery ?? 0);

  return { lines, subtotal, delivery, total, currency };

}



function updateCartCount() {

  const count = getCartCount();

  document.querySelectorAll("[data-cart-count]").forEach((el) => {

    el.dataset.count = String(count);

    el.textContent = count > 99 ? "99+" : String(count);

    el.toggleAttribute("hidden", count === 0);

  });



  document.querySelectorAll("[data-cart-open]").forEach((btn) => {

    if (btn instanceof HTMLElement) {

      btn.setAttribute("aria-label", count > 0 ? `${t.openCart} (${count})` : t.openCart);

    }

  });



  const live = document.getElementById("cart-live");

  if (live) {

    live.textContent = count === 0 ? t.cartCountEmpty : t.cartCountItems(count);

  }

}



function renderCartDrawer() {

  const body = document.getElementById("cart-drawer-body");

  const footer = document.getElementById("cart-drawer-footer");

  if (!body || !footer) return;



  const items = getCartItems();

  const metaEl = document.querySelector("[data-cart-drawer-meta]");
  if (metaEl) {
    metaEl.textContent = items.length
      ? `${items.length} ${items.length === 1 ? "منتج" : "منتجات"} · الدفع عند الاستلام`
      : "جاهزة لطلبك";
  }

  if (!items.length) {

    body.classList.add("drawer__body--empty");

    body.innerHTML = `<div class="empty-state empty-state--cart">
      <div class="empty-state__icon">${icon("cart", { size: 36 })}</div>
      <p class="empty-state__title">${t.cartEmpty}</p>
      <p class="empty-state__hint">${t.cartEmptyHint}</p>
      <a class="btn btn--primary btn--compact" href="/products.html" data-cart-close>${t.viewProducts}</a>
    </div>`;

    footer.innerHTML = "";

    return;

  }

  body.classList.remove("drawer__body--empty");



  const { lines, subtotal, delivery, total, currency } = computeTotals(items);



  body.innerHTML = lines

    .map(({ product, quantity, lineTotal }) => {

      const unit = product.unitLabel?.trim() || t.unitDefault;

      const spec = product.shortDescription?.trim() || "";

      return `

        <article class="cart-line cart-line--luxury" data-cart-line="${product.id}">

          <div class="cart-line__media">

            <img class="cart-line__thumb" src="${escapeHtml(product.image)}" alt="" width="80" height="80" loading="lazy" decoding="async" />

          </div>

          <div class="cart-line__content">

            <div class="cart-line__head">

              <p class="cart-line__name">${escapeHtml(product.displayName)}</p>

              <button type="button" class="icon-btn cart-line__remove" data-remove="${product.id}" aria-label="${t.remove} ${escapeHtml(product.displayName)}">${icon("trash", { size: 18 })}</button>

            </div>

            ${spec ? `<p class="cart-line__spec">${escapeHtml(spec)}</p>` : ""}

            <p class="cart-line__price tabular-nums"><strong>${formatMoney(lineTotal, currency, moneyLocale)}</strong> · ${formatMoney(product.price, currency, moneyLocale)} / ${escapeHtml(unit)}</p>

            <div class="qty-control qty-control--luxury" aria-label="${t.qtyFor} ${escapeHtml(product.displayName)}">

              <button type="button" class="icon-btn qty-control__btn" data-qty-dec="${product.id}" aria-label="${t.decreaseQty}">${icon("minus", { size: 18 })}</button>

              <span class="tabular-nums">${quantity}</span>

              <button type="button" class="icon-btn qty-control__btn" data-qty-inc="${product.id}" aria-label="${t.increaseQty}">${icon("plus", { size: 18 })}</button>

            </div>

          </div>

        </article>`;

    })

    .join("");



  const deliveryRow =

    delivery === null

      ? ""

      : `<div class="cart-totals__row"><span>${t.delivery}</span><span class="tabular-nums">${formatMoney(delivery, currency, moneyLocale)}</span></div>`;



  footer.innerHTML = `

    <div class="cart-summary-panel">

      <div class="cart-totals cart-totals--luxury">

        <div class="cart-totals__row"><span>${t.subtotal}</span><span class="tabular-nums">${formatMoney(subtotal, currency, moneyLocale)}</span></div>

        ${deliveryRow}

        <div class="cart-totals__row cart-totals__row--total"><span>${t.total}</span><span class="tabular-nums">${formatMoney(total, currency, moneyLocale)}</span></div>

      </div>

      <div class="drawer__actions drawer__actions--luxury">

        <a class="btn btn--primary btn--lg" href="/checkout.html">${t.checkoutCod}</a>

        <button type="button" class="btn btn--ghost btn--ghost-link" data-cart-close data-continue-shop>${t.continueShopping}</button>

      </div>

    </div>`;

}



function escapeHtml(str) {

  return String(str)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;");

}



function openDrawer(trigger) {

  closeMobileNav();

  cartTrigger = trigger?.closest("[data-cart-open]") || cartTrigger;



  const drawer = document.getElementById("cart-drawer");

  const overlay = document.getElementById("overlay");

  drawer?.classList.add("is-open");

  overlay?.classList.add("is-visible");

  drawer?.setAttribute("aria-hidden", "false");

  document.body.classList.add("cart-open");

  releaseFocusTrap?.();

  if (drawer) releaseFocusTrap = trapFocus(drawer);

}



function closeDrawer() {

  const drawer = document.getElementById("cart-drawer");

  const overlay = document.getElementById("overlay");

  drawer?.classList.remove("is-open");

  overlay?.classList.remove("is-visible");

  drawer?.setAttribute("aria-hidden", "true");

  document.body.classList.remove("cart-open");

  releaseFocusTrap?.();

  releaseFocusTrap = null;

  cartTrigger?.focus();

}



function productUnitLabel(product) {
  const parts = [product.unitLabel?.trim() || t.unitPending];
  if (product.priceIndicative) parts.push(t.priceIndicative);
  return parts.join(" · ");
}

const CATEGORY_LABEL = {
  motors: () => t.categoryMotors,
  wpc: () => t.categoryWpc,
  marble: () => t.categoryMarble,
};

function productCardHtml(product, eagerImage, opts = {}) {
  const priceLabel = formatMoney(product.price, catalogState.meta.currency, moneyLocale);
  const canPurchase = isProductPurchasable(product);
  const spec = product.shortDescription?.trim() || "";
  const cat = product.category || "motors";
  const categoryBadge =
    opts.showCategory && CATEGORY_LABEL[cat]
      ? `<span class="product-card__category">${escapeHtml(CATEGORY_LABEL[cat]())}</span>`
      : "";

  return `
        <article class="product-card${opts.home ? " product-card--home" : ""}" id="product-${product.slug}">
          <button type="button" class="product-card__media" data-open-detail="${product.id}" aria-label="${t.details}: ${escapeHtml(product.displayName)}">
            <img src="${product.image}" alt="${escapeHtml(product.imageAlt || product.displayName)}" width="640" height="480" loading="${eagerImage ? "eager" : "lazy"}" decoding="async" />
          </button>
          <div class="product-card__body">
            ${categoryBadge}
            <h3 class="product-card__name" title="${escapeHtml(product.displayName)}">${escapeHtml(product.displayName)}</h3>
            ${spec ? `<p class="product-card__spec">${escapeHtml(spec)}</p>` : `<p class="product-card__spec">${escapeHtml(t.descPending)}</p>`}
            <div class="product-card__meta">
              <span class="product-card__price tabular-nums">${escapeHtml(priceLabel)}</span>
              <span class="product-card__unit">${escapeHtml(productUnitLabel(product))}</span>
            </div>
            <button type="button" class="btn btn--primary btn--compact" data-add-cart="${product.id}" ${canPurchase ? "" : "disabled"}>${canPurchase ? t.addToCart : t.awaitingCatalog}</button>
          </div>
        </article>`;
}

function productsInCategory(category) {
  return (catalogState?.products || []).filter(
    (p) => (p.category || "motors") === category
  );
}

function renderCatalogStrip(rootId, category, carouselSelector, ariaLabel, eagerFirstImage) {
  const root = document.getElementById(rootId);
  if (!root || !catalogState) return;

  root.setAttribute("aria-label", ariaLabel);
  const products = productsInCategory(category);

  if (!products.length) {
    root.innerHTML = t.catalogEmpty;
    return;
  }

  root.innerHTML = products
    .map((product, index) => productCardHtml(product, eagerFirstImage && index === 0))
    .join("");

  const carouselRoot = document.querySelector(carouselSelector);
  if (carouselRoot) initProductCarousel(carouselRoot);
}

function interleaveFeatured(groups) {
  const out = [];
  const lists = groups.map((g) => [...g]);
  let added = true;
  while (added && out.length < 6) {
    added = false;
    for (const list of lists) {
      if (list.length && out.length < 6) {
        out.push(list.shift());
        added = true;
      }
    }
  }
  return out;
}

function groupsByCategory(list) {
  const byCat = { motors: [], wpc: [], marble: [] };
  list.forEach((product) => {
    const cat = product.category || "motors";
    (byCat[cat] || byCat.motors).push(product);
  });
  return [byCat.motors, byCat.wpc, byCat.marble];
}

function pickFeaturedProducts() {
  const products = (catalogState?.products || []).filter((product) => isProductPurchasable(product));
  const ids = catalogState?.meta?.featuredProductIds;
  const byId = new Map(products.map((product) => [product.id, product]));
  const seeded = Array.isArray(ids)
    ? ids.map((id) => byId.get(id)).filter(Boolean)
    : [];

  let picked = seeded.length
    ? interleaveFeatured(groupsByCategory(seeded))
    : interleaveFeatured(groupsByCategory(products).map((list) => list.slice(0, 2)));

  if (picked.length < 6) {
    const seen = new Set(picked.map((product) => product.id));
    const rest = products.filter((product) => !seen.has(product.id));
    picked = picked.concat(interleaveFeatured(groupsByCategory(rest)));
  }

  return picked.slice(0, 6);
}

function renderFeaturedGrid() {
  const root = document.querySelector("[data-featured-grid]");
  if (!root || !catalogState) return;

  const featured = pickFeaturedProducts();
  if (!featured.length) {
    root.innerHTML = `<p class="featured-showcase__empty" role="status">${escapeHtml(t.featuredEmpty)}</p>`;
    return;
  }

  root.innerHTML = featured
    .map((product, index) => productCardHtml(product, index < 2, { home: true, showCategory: true }))
    .join("");
}

function renderCatalog() {
  if (!catalogState) return;

  renderFeaturedGrid();

  renderCatalogStrip("catalog", "motors", '[data-product-carousel="motors"]', t.carouselMotors, true);
  renderCatalogStrip(
    "catalog-wpc",
    "wpc",
    '[data-product-carousel="wpc"]',
    t.carouselWpc,
    false
  );
  renderCatalogStrip(
    "catalog-marble",
    "marble",
    '[data-product-carousel="marble"]',
    t.carouselMarble,
    false
  );

  refreshProductCarousel();
}



function renderBanner() {

  const banner = document.getElementById("site-banner");

  if (!banner || !catalogState || !document.getElementById("catalog")) return;



  if (catalogState.meta.usingExampleCatalog) {

    banner.hidden = false;

    banner.className = "banner banner--warn";

    banner.innerHTML = t.devCatalogBanner;

    return;

  }

  banner.hidden = true;

}



function openProductDialog(productId) {

  const product = getProduct(productId);

  const dialog = document.getElementById("product-dialog");

  if (!product || !dialog) return;



  document.getElementById("dialog-title").textContent = product.displayName;

  document.getElementById("dialog-desc").textContent =

    product.description?.trim() ||

    product.shortDescription?.trim() ||

    t.descFullPending;

  document.getElementById("dialog-price").textContent = formatMoney(

    product.price,

    catalogState.meta.currency,

    moneyLocale

  );

  document.getElementById("dialog-unit").textContent = productUnitLabel(product);

  const img = document.getElementById("dialog-image");

  img.src = product.image;

  img.alt = product.imageAlt || product.displayName;



  const addBtn = document.getElementById("dialog-add");

  const canPurchase = isProductPurchasable(product);

  addBtn.disabled = !canPurchase;

  addBtn.dataset.productId = product.id;



  if (typeof dialog.showModal === "function") dialog.showModal();

}



export function initCartUi(state) {

  catalogState = normalizeCatalogState(state);

  moneyLocale = formatLocale(catalogState.meta);

  renderBanner();

  renderCatalog();

  renderCartDrawer();

  updateCartCount();



  subscribeCart(() => {

    renderCartDrawer();

    updateCartCount();

  });



  document.body.addEventListener("click", (e) => {

    const target = e.target.closest("[data-add-cart]");

    if (target) {

      addToCart(target.dataset.addCart, 1);

      showToast(t.addedToCart);

      return;

    }



    if (e.target.closest("[data-open-detail]")) {
      dialogTrigger = e.target.closest("[data-open-detail]");
      openProductDialog(dialogTrigger.dataset.openDetail);
      return;
    }



    if (e.target.closest("[data-cart-open]")) {

      renderCartDrawer();

      openDrawer(e.target);

      return;

    }



    if (e.target.closest("[data-cart-close]") || e.target.id === "overlay") {

      closeDrawer();

      return;

    }



    if (e.target.closest("[data-dialog-close]")) {

      document.getElementById("product-dialog")?.close();

      return;

    }



    const inc = e.target.closest("[data-qty-inc]");

    if (inc) {

      const id = inc.dataset.qtyInc;

      const item = getCartItems().find((i) => i.id === id);

      setQuantity(id, (item?.quantity || 0) + 1);

      return;

    }



    const dec = e.target.closest("[data-qty-dec]");

    if (dec) {

      const id = dec.dataset.qtyDec;

      const item = getCartItems().find((i) => i.id === id);

      setQuantity(id, (item?.quantity || 1) - 1);

      return;

    }



    const remove = e.target.closest("[data-remove]");

    if (remove) {

      setQuantity(remove.dataset.remove, 0);

      return;

    }

  });



  document.getElementById("dialog-add")?.addEventListener("click", (e) => {

    const id = e.currentTarget.dataset.productId;

    if (!id) return;

    addToCart(id, 1);

    showToast(t.addedToCart);

    document.getElementById("product-dialog")?.close();

  });



  document.getElementById("product-dialog")?.addEventListener("close", () => {
    document.getElementById("dialog-add").dataset.productId = "";
    dialogTrigger?.focus();
    dialogTrigger = null;
  });



  document.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {

      const drawer = document.getElementById("cart-drawer");

      if (drawer?.classList.contains("is-open")) closeDrawer();

    }

  });

}


