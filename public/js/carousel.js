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

function edgeState(viewportEl) {
  const cards = getCards(viewportEl);
  if (!cards.length) return { atStart: true, atEnd: true };
  const rtl = document.documentElement.dir === "rtl";
  const vp = viewportEl.getBoundingClientRect();
  const first = cards[0].getBoundingClientRect();
  const last = cards[cards.length - 1].getBoundingClientRect();
  const pad = 6;
  if (rtl) {
    return {
      atStart: first.right <= vp.right + pad,
      atEnd: last.left >= vp.left - pad,
    };
  }
  return {
    atStart: first.left >= vp.left - pad,
    atEnd: last.right <= vp.right + pad,
  };
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
  const edges = edgeState(viewportEl);
  const maxScroll = viewportEl.scrollWidth - viewportEl.clientWidth;
  prevBtn.disabled = edges.atStart || maxScroll <= 2;
  nextBtn.disabled = edges.atEnd || maxScroll <= 2;
}

const motions = new WeakMap();

function cardsPerView(viewportEl) {
  const cards = getCards(viewportEl);
  if (cards.length < 2) return 1;
  const cardWidth = cards[0].getBoundingClientRect().width;
  if (!cardWidth) return 1;
  const gap = Number.parseFloat(getComputedStyle(viewportEl).columnGap) || 0;
  return Math.max(1, Math.round((viewportEl.clientWidth + gap) / (cardWidth + gap)));
}

function scrollToIndex(state, index) {
  const { viewportEl } = state;
  const cards = getCards(viewportEl);
  if (!cards.length || !viewportEl) return;
  const i = Math.max(0, Math.min(index, cards.length - 1));
  const card = cards[i];
  const rtl = document.documentElement.dir === "rtl";
  const vp = viewportEl.getBoundingClientRect();
  const cr = card.getBoundingClientRect();
  const delta = rtl ? cr.right - vp.right : cr.left - vp.left;

  const running = motions.get(viewportEl);
  if (running) cancelAnimationFrame(running);

  if (Math.abs(delta) < 1) {
    updateButtons(state);
    return;
  }

  if (prefersReduced) {
    viewportEl.scrollBy({ left: delta, behavior: "auto" });
    updateButtons(state);
    return;
  }

  const startLeft = viewportEl.scrollLeft;
  viewportEl.scrollBy({ left: delta, behavior: "auto" });
  const endLeft = viewportEl.scrollLeft;
  viewportEl.scrollLeft = startLeft;
  const change = endLeft - startLeft;
  if (!change) {
    updateButtons(state);
    return;
  }

  const duration = 220;
  const started = performance.now();
  const easeOut = (t) => 1 - (1 - t) ** 3;
  const tick = (now) => {
    const t = Math.min(1, (now - started) / duration);
    viewportEl.scrollLeft = startLeft + change * easeOut(t);
    if (t < 1) {
      motions.set(viewportEl, requestAnimationFrame(tick));
      return;
    }
    motions.delete(viewportEl);
    updateButtons(state);
  };
  motions.set(viewportEl, requestAnimationFrame(tick));
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
  const step = cardsPerView(viewportEl);
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    scrollToIndex(state, nearestIndex(viewportEl) + (rtl ? step : -step));
  }
  if (e.key === "ArrowRight") {
    e.preventDefault();
    scrollToIndex(state, nearestIndex(viewportEl) + (rtl ? -step : step));
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
    scrollToIndex(state, nearestIndex(viewportEl) - cardsPerView(viewportEl))
  );
  nextBtn?.addEventListener("click", () =>
    scrollToIndex(state, nearestIndex(viewportEl) + cardsPerView(viewportEl))
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

