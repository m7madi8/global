const prefersReduced =
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

/** @type {Map<HTMLElement, { viewportEl: HTMLElement; prevBtn: HTMLElement | null; nextBtn: HTMLElement | null }>} */
const instances = new Map();

function getCards(viewportEl) {
  return viewportEl ? [...viewportEl.querySelectorAll(".product-card")] : [];
}

function nearestIndex(viewportEl) {
  const cards = getCards(viewportEl);
  if (!cards.length || !viewportEl) return 0;
  const vp = viewportEl.getBoundingClientRect();
  const rtl = document.documentElement.dir === "rtl";
  const anchor = rtl ? vp.right - vp.width * 0.28 : vp.left + vp.width * 0.28;
  let best = 0;
  let bestDist = Infinity;
  cards.forEach((card, i) => {
    const r = card.getBoundingClientRect();
    const cardAnchor = rtl ? r.right : r.left;
    const d = Math.abs(cardAnchor - anchor);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

function updateButtons(state) {
  const { viewportEl, prevBtn, nextBtn } = state;
  if (!prevBtn || !nextBtn || !viewportEl) return;
  const cards = getCards(viewportEl);
  if (cards.length <= 1) {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }
  const idx = nearestIndex(viewportEl);
  prevBtn.disabled = idx <= 0;
  nextBtn.disabled = idx >= cards.length - 1;

  const maxScroll = viewportEl.scrollWidth - viewportEl.clientWidth;
  if (maxScroll <= 2) {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
  }
}

function scrollToIndex(state, index) {
  const { viewportEl } = state;
  const cards = getCards(viewportEl);
  if (!cards.length) return;
  const i = Math.max(0, Math.min(index, cards.length - 1));
  cards[i].scrollIntoView({
    behavior: prefersReduced ? "auto" : "smooth",
    inline: "start",
    block: "nearest",
  });
  requestAnimationFrame(() => updateButtons(state));
}

function onKeyDown(state, e) {
  const { viewportEl } = state;
  if (
    !viewportEl ||
    (!viewportEl.contains(document.activeElement) && document.activeElement !== viewportEl)
  ) {
    return;
  }
  const rtl = document.documentElement.dir === "rtl";
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    scrollToIndex(state, nearestIndex(viewportEl) + (rtl ? 1 : -1));
  }
  if (e.key === "ArrowRight") {
    e.preventDefault();
    scrollToIndex(state, nearestIndex(viewportEl) + (rtl ? -1 : 1));
  }
}

function bindImageLoadRefresh(state) {
  const { viewportEl } = state;
  if (!viewportEl) return;
  viewportEl.querySelectorAll(".product-card img").forEach((img) => {
    if (img.complete) return;
    img.addEventListener("load", () => requestAnimationFrame(() => updateButtons(state)), {
      once: true,
    });
  });
}

function bindControls(root) {
  const viewportEl = root.querySelector(".carousel__viewport");
  const prevBtn = root.querySelector("[data-carousel-prev]");
  const nextBtn = root.querySelector("[data-carousel-next]");
  if (!viewportEl) return null;

  const state = { viewportEl, prevBtn, nextBtn };

  prevBtn?.addEventListener("click", () =>
    scrollToIndex(state, nearestIndex(viewportEl) - 1)
  );
  nextBtn?.addEventListener("click", () =>
    scrollToIndex(state, nearestIndex(viewportEl) + 1)
  );
  viewportEl.addEventListener(
    "scroll",
    () => requestAnimationFrame(() => updateButtons(state)),
    { passive: true }
  );
  viewportEl.addEventListener("keydown", (e) => onKeyDown(state, e));
  updateButtons(state);
  bindImageLoadRefresh(state);

  return state;
}

export function initProductCarousel(root) {
  if (!root) return;
  if (root.dataset.carouselBound === "true") {
    refreshProductCarousel(root);
    return;
  }
  root.dataset.carouselBound = "true";
  const state = bindControls(root);
  if (state) instances.set(root, state);
}

export function refreshProductCarousel(root) {
  const refreshOne = (carouselRoot) => {
    const state = instances.get(carouselRoot);
    if (!state) return;
    requestAnimationFrame(() => updateButtons(state));
    bindImageLoadRefresh(state);
  };

  if (root instanceof HTMLElement) {
    refreshOne(root);
    return;
  }

  instances.forEach((_, carouselRoot) => refreshOne(carouselRoot));
}
