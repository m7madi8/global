import { t } from "./strings.js";

async function tryFetch(url) {
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchCatalog() {
  const fromApi = await tryFetch("/api/products");
  if (fromApi?.products) return fromApi;

  const fromStatic = await tryFetch("/data/catalog.json");
  if (fromStatic?.products) return fromStatic;

  throw new Error(t.catalogLoadFailedMessage);
}

export async function submitOrder(payload) {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.errors?._form || t.orderFailed);
    err.errors = data.errors || {};
    throw err;
  }
  return data;
}
