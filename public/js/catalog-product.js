/** يطابق منطق server/catalog.js — للواجهة عندما لا يُرجع API isPurchasable (خادم قديم). */
export function isProductPurchasable(product) {
  if (!product) return false;
  if (typeof product.isPurchasable === "boolean") return product.isPurchasable;

  const image = product.image;
  const hasSellablePrice = typeof product.price === "number" && product.price > 0;

  return (
    product.available !== false &&
    hasSellablePrice &&
    Boolean((product.displayName || product.name)?.trim()) &&
    Boolean(product.shortDescription?.trim()) &&
    Boolean(image) &&
    !String(image).includes("placeholder")
  );
}

export function normalizeCatalogState(state) {
  if (!state?.products) return state;
  return {
    ...state,
    products: state.products.map((product) => ({
      ...product,
      isPurchasable: isProductPurchasable(product),
      priceIndicative: product.priceIndicative === true,
    })),
  };
}
