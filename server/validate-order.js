const { getCatalog, getProductById } = require("./catalog");

function productPurchasable(product) {
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

const PHONE_MIN = 8;
const PHONE_MAX = 20;

function trim(str) {
  return typeof str === "string" ? str.trim() : "";
}

function validateCustomer(customer) {
  const errors = {};
  const fullName = trim(customer?.fullName);
  const phone = trim(customer?.phone);
  const city = trim(customer?.city);
  const address = trim(customer?.address);
  const notes = trim(customer?.notes || "");

  if (fullName.length < 2) errors.fullName = "أدخل اسمك الكامل.";
  if (phone.length < PHONE_MIN || phone.length > PHONE_MAX) {
    errors.phone = "أدخل رقم هاتف صالحاً للتواصل عند التوصيل.";
  }
  if (city.length < 2) errors.city = "أدخل المدينة أو المنطقة.";
  if (address.length < 5) errors.address = "أدخل عنوان التوصيل بالتفصيل.";

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: { fullName, phone, city, address, notes },
  };
}

function validateItems(items) {
  const errors = [];
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, errors: { items: "سلة المشتريات فارغة." }, lines: [] };
  }

  const { meta } = getCatalog();

  const lines = [];
  const seen = new Set();

  for (const item of items) {
    const id = item?.id;
    const quantity = Number(item?.quantity);

    if (!id || seen.has(id)) continue;
    seen.add(id);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
      errors.push(`كمية غير صالحة للمنتج ${id}.`);
      continue;
    }

    const product = getProductById(id);
    if (!product || !product.available) {
      errors.push(`المنتج ${id} غير متاح.`);
      continue;
    }
    if (!productPurchasable(product)) {
      errors.push(`المنتج ${id} غير جاهز للبيع بعد (تحقق من السعر والصورة والبيانات).`);
      continue;
    }

    const unitPrice = product.price;
    lines.push({
      productId: product.id,
      slug: product.slug,
      name: product.displayName,
      unitLabel: product.unitLabel || "وحدة",
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    });
  }

  if (lines.length === 0) {
    return { ok: false, errors: { items: "لا توجد عناصر صالحة في السلة." }, lines: [] };
  }

  if (errors.length) {
    return { ok: false, errors: { items: errors.join(" ") }, lines: [] };
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const deliveryCharge =
    typeof meta.deliveryCharge === "number" ? meta.deliveryCharge : 0;
  const total = subtotal + deliveryCharge;

  return {
    ok: true,
    errors: {},
    lines,
    subtotal,
    deliveryCharge: meta.deliveryCharge,
    total,
    currency: meta.currency,
  };
}

function validateOrderBody(body) {
  const customerResult = validateCustomer(body?.customer);
  const itemsResult = validateItems(body?.items);

  const errors = { ...customerResult.errors, ...itemsResult.errors };
  const ok = customerResult.ok && itemsResult.ok;

  const { ok: _itemsOk, errors: _itemErrors, ...itemsRest } = itemsResult;
  return {
    ...itemsRest,
    ok,
    errors,
    customer: customerResult.value,
  };
}

module.exports = { validateOrderBody, validateCustomer, validateItems };
