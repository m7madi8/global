const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ORDERS_DIR = path.join(__dirname, "..", "data", "orders");

function ensureOrdersDir() {
  if (!fs.existsSync(ORDERS_DIR)) {
    fs.mkdirSync(ORDERS_DIR, { recursive: true });
  }
}

function generateOrderId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `GC-${date}-${suffix}`;
}

function saveOrder(order) {
  ensureOrdersDir();
  const id = order.id || generateOrderId();
  const filePath = path.join(ORDERS_DIR, `${id}.json`);
  const payload = { ...order, id, createdAt: new Date().toISOString() };
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

module.exports = { saveOrder, generateOrderId };
