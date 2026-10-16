const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CATALOG_PATH = path.join(ROOT, "data", "products.json");
const EXAMPLE_PATH = path.join(ROOT, "data", "products.example.json");
const BUSINESS_PATH = path.join(ROOT, "data", "business.json");

const CATEGORY_RULES = [
  { id: "motors", count: 5, labelAr: "المواتير" },
  { id: "wpc", count: 5, labelAr: "بديل الخشب" },
  { id: "marble", count: 9, labelAr: "بديل الرخام" },
];

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadCatalogRaw() {
  const useExample = process.env.USE_EXAMPLE_CATALOG === "true";
  const file = useExample ? EXAMPLE_PATH : CATALOG_PATH;
  return loadJson(file);
}

function loadBusiness() {
  const raw = loadJson(BUSINESS_PATH);
  if (!raw) return {};
  const { _instructions, ...business } = raw;
  return business;
}

function displayName(product, index) {
  if (product.name && product.name.trim()) return product.name.trim();
  return `منتج ${String(index + 1).padStart(2, "0")} — بانتظار البيانات`;
}

function isPlaceholderImage(image) {
  return !image || String(image).includes("placeholder");
}

function enrichProduct(product, index) {
  const hasVerifiedPrice =
    typeof product.price === "number" &&
    product.price > 0 &&
    product.priceIndicative !== true;
  const hasVerifiedCopy = Boolean(product.shortDescription?.trim());
  const hasSellablePrice = typeof product.price === "number" && product.price > 0;
  const isVerifiedListing =
    product.verified === true &&
    Boolean(product.name?.trim()) &&
    hasVerifiedPrice &&
    hasVerifiedCopy &&
    !isPlaceholderImage(product.image);
  const isPurchasable =
    product.available !== false &&
    hasSellablePrice &&
    Boolean(product.name?.trim()) &&
    hasVerifiedCopy &&
    !isPlaceholderImage(product.image);

  return {
    ...product,
    displayName: displayName(product, index),
    hasVerifiedPrice,
    hasVerifiedCopy,
    isVerifiedListing,
    isPurchasable,
    priceIndicative: product.priceIndicative === true,
  };
}

function getCatalog() {
  const data = loadCatalogRaw() || { meta: {}, products: [] };
  const business = loadBusiness();
  const products = (data.products || []).map(enrichProduct);

  const currency =
    data.meta?.currency ?? business.currency ?? null;

  const categoryComplete = ({ id, count }) => {
    const inCategory = products.filter((p) => (p.category || "motors") === id);
    return (
      inCategory.length === count &&
      inCategory.every((p) => p.isPurchasable && p.available !== false)
    );
  };

  const catalogComplete =
    Boolean(currency) && CATEGORY_RULES.every((rule) => categoryComplete(rule));

  const meta = {
    ...data.meta,
    companyName:
      business.nameAr?.trim() ||
      data.meta?.companyName ||
      business.nameEn ||
      "GLOBAL COMPANY",
    companyNameEn: business.nameEn || data.meta?.companyName,
    heroEyebrow: business.heroEyebrow?.trim() || "",
    heroTitle:
      business.heroTitle?.trim() ||
      business.nameAr?.trim() ||
      business.nameEn ||
      data.meta?.companyName ||
      "GLOBAL COMPANY",
    heroLead:
      business.heroLead?.trim() ||
      business.tagline?.trim() ||
      data.meta?.tagline ||
      "",
    tagline: business.tagline?.trim() || data.meta?.tagline || "",
    about: business.about?.trim() || "",
    contactPhone: business.phone || data.meta?.contactPhone || null,
    contactWhatsapp: business.whatsapp || null,
    contactEmail: business.email || data.meta?.contactEmail || null,
    address: business.address || null,
    city: business.city || null,
    serviceAreaNote: business.serviceArea || data.meta?.serviceAreaNote || null,
    workingHours: business.workingHours || null,
    heroImage: business.heroImage || null,
    logo: business.logo || data.meta?.logo,
    logoFilled: business.logoFilled || data.meta?.logoFilled || null,
    logoOutline: business.logoOutline || data.meta?.logoOutline || null,
    currency,
    deliveryCharge:
      typeof business.deliveryCharge === "number"
        ? business.deliveryCharge
        : data.meta?.deliveryCharge ?? null,
    paymentNote: business.paymentNote || null,
    featuredProductIds: Array.isArray(business.featuredProductIds)
      ? business.featuredProductIds.filter(Boolean)
      : [],
    catalogComplete,
    verifiedProductCount: products.filter((p) => p.isVerifiedListing).length,
    usingExampleCatalog: process.env.USE_EXAMPLE_CATALOG === "true",
  };

  return { meta, products };
}

function getProductById(id) {
  const { products } = getCatalog();
  return products.find((p) => p.id === id) ?? null;
}

module.exports = {
  getCatalog,
  getProductById,
  loadCatalogRaw,
  loadBusiness,
  CATEGORY_RULES,
};
