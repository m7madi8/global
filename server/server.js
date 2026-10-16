const http = require("http");
const fs = require("fs");
const path = require("path");
const { getCatalog } = require("./catalog");
const { validateOrderBody } = require("./validate-order");
const { saveOrder } = require("./order-store");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = path.join(__dirname, "..", "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => {
      chunks.push(c);
      if (chunks.reduce((n, b) => n + b.length, 0) > 1e6) {
        reject(new Error("Body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8") || "{}";
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function serveStatic(req, res, urlPath) {
  let filePath = path.join(PUBLIC, urlPath === "/" ? "index.html" : urlPath);
  if (!filePath.startsWith(PUBLIC)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const ext = path.extname(filePath);
  const type = MIME[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/products") {
    sendJson(res, 200, getCatalog());
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/orders") {
    try {
      const body = await readBody(req);
      const validation = validateOrderBody(body);

      if (!validation.ok) {
        sendJson(res, 400, {
          ok: false,
          errors: validation.errors,
        });
        return;
      }

      const order = saveOrder({
        status: "received",
        paymentMethod: "cash_on_delivery",
        customer: validation.customer,
        items: validation.lines,
        subtotal: validation.subtotal,
        deliveryCharge: validation.deliveryCharge,
        total: validation.total,
        currency: validation.currency,
      });

      sendJson(res, 201, {
        ok: true,
        orderId: order.id,
        status: order.status,
        total: order.total,
        currency: order.currency,
        message:
          "تم استلام طلبك. الدفع نقداً عند الاستلام. سنتواصل معك لتأكيد التفاصيل.",
      });
    } catch (err) {
      const msg =
        err.message === "Invalid JSON" ? "البيانات المرسلة غير صالحة." : err.message;
      sendJson(res, 400, { ok: false, errors: { _form: msg } });
    }
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    serveStatic(req, res, decodeURIComponent(url.pathname));
    return;
  }

  res.writeHead(405);
  res.end("Method not allowed");
});

server.listen(PORT, () => {
  console.log(`GLOBAL COMPANY storefront → http://localhost:${PORT}`);
  if (process.env.USE_EXAMPLE_CATALOG === "true") {
    console.warn("USE_EXAMPLE_CATALOG=true — using development sample catalog.");
  }
});
