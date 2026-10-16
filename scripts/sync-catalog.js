/**
 * Writes merged catalog JSON to public/ for static fallback when /api/products is unavailable.
 */
const fs = require("fs");
const path = require("path");
const { getCatalog } = require("../server/catalog");

const outDir = path.join(__dirname, "..", "public", "data");
const outFile = path.join(outDir, "catalog.json");

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(getCatalog(), null, 2), "utf8");
console.log(`Catalog synced → ${path.relative(process.cwd(), outFile)}`);
