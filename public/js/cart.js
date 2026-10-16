const STORAGE_KEY = "gc_cart_v1";

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { items: {} };
    return { items: parsed.items || {} };
  } catch {
    return { items: {} };
  }
}

function write(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getCartItems() {
  const { items } = readRaw();
  return Object.entries(items).map(([id, quantity]) => ({
    id,
    quantity: Number(quantity),
  }));
}

export function getCartCount() {
  return getCartItems().reduce((sum, item) => sum + item.quantity, 0);
}

export function setQuantity(productId, quantity) {
  const state = readRaw();
  const q = Math.floor(Number(quantity));
  if (!productId) return;
  if (!Number.isFinite(q) || q <= 0) {
    delete state.items[productId];
  } else {
    state.items[productId] = Math.min(q, 999);
  }
  write(state);
  window.dispatchEvent(new CustomEvent("cart:updated"));
}

export function addToCart(productId, delta = 1) {
  const state = readRaw();
  const current = Number(state.items[productId] || 0);
  setQuantity(productId, current + delta);
}

export function clearCart() {
  write({ items: {} });
  window.dispatchEvent(new CustomEvent("cart:updated"));
}

export function subscribeCart(callback) {
  const handler = () => callback();
  window.addEventListener("cart:updated", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("cart:updated", handler);
    window.removeEventListener("storage", handler);
  };
}
