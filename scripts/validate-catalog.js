#!/usr/bin/env node

const path = require("path");

const {

  getCatalog,

  loadBusiness,

  CATEGORY_RULES,

} = require(path.join(__dirname, "..", "server", "catalog"));



const catalog = getCatalog();

const business = loadBusiness();

const expectedTotal = CATEGORY_RULES.reduce((n, r) => n + r.count, 0);



console.log("=== GLOBAL COMPANY — فحص المحتوى ===\n");

console.log("العملة:", catalog.meta.currency || "(غير محددة)");

console.log("كتalog جاهز للبيع:", catalog.meta.catalogComplete ? "نعم" : "لا");

console.log("منتجات معتمدة:", catalog.meta.verifiedProductCount, "/", expectedTotal);

console.log("");



console.log("— الشركة (business.json) —");

const bizChecks = [

  ["nameAr / tagline", Boolean(business.nameAr?.trim() && business.tagline?.trim())],

  ["phone", Boolean(business.phone)],

  ["serviceArea", Boolean(business.serviceArea?.trim())],

];

bizChecks.forEach(([label, ok]) => console.log(`  ${ok ? "✓" : "○"} ${label}`));



for (const { id, count, labelAr } of CATEGORY_RULES) {

  console.log(`\n— ${labelAr} —`);

  const items = catalog.products.filter((p) => (p.category || "motors") === id);

  items.forEach((p, i) => {

    const ok = p.isPurchasable;
    const tag = p.isVerifiedListing ? "" : p.priceIndicative ? " (استرشادي)" : "";

    console.log(
      `  ${ok ? "✓" : "○"} ${i + 1}. ${p.displayName}${ok ? ` — ${p.price} ${catalog.meta.currency}${tag}` : ""}`
    );

    if (!ok) {
      const missing = [];
      if (!p.name?.trim()) missing.push("name");
      if (typeof p.price !== "number" || p.price <= 0) missing.push("price");
      if (!p.hasVerifiedCopy) missing.push("shortDescription");
      if (p.image?.includes("placeholder")) missing.push("صورة حقيقية");
      console.log(`      ناقص: ${missing.join(", ")}`);
    }

  });

  if (items.length !== count) {

    console.log(`  ○ المتوقع ${count} أصناف — الموجود ${items.length}`);

  }

}



console.log("\nراجع: docs/المحتوى-الحقيقي.md");

process.exit(catalog.meta.catalogComplete ? 0 : 1);

