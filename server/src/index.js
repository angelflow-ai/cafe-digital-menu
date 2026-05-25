import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import session from "express-session";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Twilio from "twilio";
import nodemailer from "nodemailer";
import { connectDatabase, store } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const uploadsDir = path.join(__dirname, "../uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({ dest: uploadsDir });
const port = Number(process.env.PORT || 5000);
const clientDist = path.join(__dirname, "../../client/dist");

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN ? Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;
const twilioFrom = process.env.TWILIO_FROM || process.env.TWILIO_PHONE_NUMBER || null;

function normalizePhone(phone) {
  if (!phone) return null;
  let value = String(phone).trim();
  if (value.startsWith("+")) return value;
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

function buildSmsBody(order) {
  const items = (order.items || []).map((item) => `${item.name || item.itemId}${item.sizeName ? ` (${item.sizeName})` : ""}`).join(", ");
  return `Your order is ready! Items: ${items}. Thank you for ordering from The Infusion Saga.`;
}

async function sendSms(to, body) {
  if (!twilioClient || !twilioFrom) return null;
  const toPhone = normalizePhone(to);
  if (!toPhone) return null;
  return twilioClient.messages.create({ from: twilioFrom, to: toPhone, body });
}

function scheduleOrderReadySms(order) {
  if (!order || !order.phone || !twilioClient || !twilioFrom) return;
  const delayMinutes = 15 + Math.floor(Math.random() * 6); // 15-20 mins range
  const delayMs = delayMinutes * 60 * 1000;
  const body = buildSmsBody(order);
  setTimeout(async () => {
    try {
      await sendSms(order.phone, body);
      console.log(`Sent ready SMS for order ${order.id} to ${order.phone}`);
    } catch (err) {
      console.error(`Failed to send ready SMS for order ${order.id}:`, err);
    }
  }, delayMs);
}

// Simple SSE clients list for order broadcasts
const sseClients = new Set();

function sendSseEvent(name, data) {
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  for (const res of sseClients) {
    try {
      res.write(`event: ${name}\n`);
      res.write(`data: ${payload}\n\n`);
    } catch (err) {
      // ignore
    }
  }
}

const allowedOrigins = [process.env.CLIENT_ORIGIN || "http://localhost:5173"].filter(Boolean);

function isLocalhostOrigin(origin) {
  return /^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || isLocalhostOrigin(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadsDir));
app.use(
  session({
    name: "infusion.sid",
    secret: process.env.SESSION_SECRET || "dev-infusion-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

const users = {
  admin: {
    role: "admin",
    email: String(process.env.ADMIN_EMAIL || "owner@theinfusionsaga.com").trim().toLowerCase(),
    password: String(process.env.ADMIN_PASSWORD || "infusion-owner"),
    verified: true
  },
  biller: {
    role: "biller",
    email: String(process.env.BILLER_EMAIL || "biller@theinfusionsaga.com").trim().toLowerCase(),
    password: String(process.env.BILLER_PASSWORD || "infusion-biller"),
    verified: true
  }
};

const emailTransporter = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
}) : null;

const emailFrom = process.env.EMAIL_FROM || process.env.SMTP_USER || users.admin.email;
const passwordResetOtps = new Map();

function findUserByEmail(email) {
  if (!email) return null;
  const normalized = String(email).trim().toLowerCase();
  return Object.values(users).find((user) => user.email === normalized) || null;
}

async function sendEmail({ to, subject, text, html }) {
  if (!emailTransporter) {
    console.log("Email transporter not configured. OTP details:", { to, subject, text });
    return null;
  }
  return emailTransporter.sendMail({ from: emailFrom, to, subject, text, html });
}

function requireAdmin(req, res, next) {
  if (req.session?.user?.role === "admin") return next();
  return res.status(401).json({ message: "Admin login required." });
}

function requireStaff(req, res, next) {
  if (req.session?.user?.role === "admin" || req.session?.user?.role === "biller") return next();
  return res.status(401).json({ message: "Staff login required." });
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

function createLoginResponse(user, req, res) {
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  if (!user.verified) {
    return res.status(403).json({ message: "Please verify your email." });
  }
  const token = crypto.randomUUID();
  req.session.user = { role: user.role, email: user.email, token };
  return res.json({ success: true, token, user: { role: user.role, email: user.email } });
}

function loginHandler(req, res, roleOverride = null) {
  const { email, password, role } = req.body;
  const requestRole = roleOverride || role;
  const user = requestRole ? users[requestRole] : findUserByEmail(email);
  console.log("Login request", { email, role: requestRole });
  if (!user || String(email).trim().toLowerCase() !== user.email || user.password !== password) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  return createLoginResponse(user, req, res);
}

app.post("/api/auth/login", (req, res) => loginHandler(req, res));
app.post("/api/auth/owner/login", (req, res) => loginHandler(req, res, "admin"));
app.post("/api/auth/biller/login", (req, res) => loginHandler(req, res, "biller"));

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/auth/me", (req, res) => {
  res.json({ user: req.session?.user || null });
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email, role } = req.body;
  const user = role ? users[role] : findUserByEmail(email);
  if (!user || String(email).trim().toLowerCase() !== user.email) {
    return res.status(404).json({ message: "Email not found for this role." });
  }
  if (!emailTransporter) {
    return res.status(500).json({ message: "Email service not configured." });
  }

  const otp = String(crypto.randomInt(100000, 999999)).padStart(6, "0");
  const expiresAt = Date.now() + 15 * 60 * 1000;
  passwordResetOtps.set(user.email, { otp, role: user.role, expiresAt });

  await sendEmail({
    to: user.email,
    subject: "Your password reset OTP",
    text: `Your password reset OTP is ${otp}. It expires in 15 minutes.`
  });

  return res.json({ success: true, message: "OTP sent to your registered email." });
});

app.post("/api/auth/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const user = findUserByEmail(email);
  const record = passwordResetOtps.get(user?.email);
  if (!user || !record || record.otp !== String(otp) || record.expiresAt < Date.now()) {
    return res.status(400).json({ message: "OTP is invalid or expired." });
  }
  return res.json({ success: true, message: "OTP verified." });
});

app.post("/api/auth/reset-password", (req, res) => {
  const { email, otp, password } = req.body;
  const user = findUserByEmail(email);
  const record = passwordResetOtps.get(user?.email);
  if (!user || !record || record.otp !== String(otp) || record.expiresAt < Date.now()) {
    return res.status(400).json({ message: "OTP is invalid or expired." });
  }
  user.password = String(password || "");
  passwordResetOtps.delete(user.email);
  return res.json({ ok: true, message: "Password updated successfully." });
});

app.get("/api/_debug/orders", async (_req, res, next) => { try { res.json(await store.orders()); } catch (err) { next(err); } });

app.get("/api/categories", async (_req, res, next) => {
  try {
    res.json(await store.categories());
  } catch (error) {
    next(error);
  }
});

app.post("/api/categories", requireAdmin, async (req, res, next) => {
  try {
    const payload = {
      id: slugify(req.body.id || req.body.name),
      name: req.body.name,
      icon: req.body.icon || "Utensils",
      sortOrder: Number(req.body.sortOrder || 0)
    };
    res.json(await store.upsertCategory(payload));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/categories/:id", requireAdmin, async (req, res, next) => {
  try {
    res.json(await store.deleteCategory(req.params.id));
  } catch (error) {
    next(error);
  }
});

app.get("/api/menu", async (req, res, next) => {
  try {
    res.json(
      await store.menuItems({
        categoryId: req.query.categoryId,
        search: req.query.search,
        includeInactive: req.query.includeInactive === "true"
      })
    );
  } catch (error) {
    next(error);
  }
});

app.get("/api/menu/:id", async (req, res, next) => {
  try {
    const item = await store.menuItem(req.params.id);
    if (!item) return res.status(404).json({ message: "Menu item not found." });
    return res.json(item);
  } catch (error) {
    next(error);
  }
});

app.post("/api/menu", requireAdmin, async (req, res, next) => {
  try {
    res.json(await store.upsertMenuItem(req.body));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/menu/:id", requireAdmin, async (req, res, next) => {
  try {
    res.json(await store.deleteMenuItem(req.params.id));
  } catch (error) {
    next(error);
  }
});

app.post("/api/uploads", requireAdmin, upload.single("photo"), (req, res) => {
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.get("/api/orders", requireStaff, async (_req, res, next) => {
  try {
    res.json(await store.orders());
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", async (req, res, next) => {
  try {
    const order = await store.createOrder(req.body);
    res.status(201).json(order);
    scheduleOrderReadySms(order);
    try {
      sendSseEvent("order:created", { id: order._id || order.id, orderId: order.orderId, createdAt: order.createdAt || new Date().toISOString() });
    } catch (e) {
      // ignore
    }
  } catch (error) {
    next(error);
  }
});

// Public endpoint to fetch order by orderId (no auth) for customer tracking
app.get("/api/orders/public/:id", async (req, res, next) => {
  try {
    const order = await store.orderById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });
    return res.json(order);
  } catch (error) {
    next(error);
  }
});

// Public endpoint for customers to retry payment verification for their order.
// This allows customers to mark their order as awaiting verification again
// (e.g. after a rejection or payment failure) without requiring staff auth.
app.post("/api/orders/public/:id/retry", async (req, res, next) => {
  try {
    const order = await store.orderById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });

    // Do not allow retry if order is already confirmed/completed/paid
    if (order.paymentStatus === 'pending_verification' || order.paymentStatus === 'paid' || order.status === 'confirmed' || order.status === 'completed') {
      return res.status(400).json({ message: 'Order cannot be retried in its current state.' });
    }

    // Prepare update: set payment back to pending verification, clear rejection metadata
    const payload = {
      paymentStatus: 'pending_verification',
      status: 'pending',
      rejectedAt: null,
      notes: '',
      warnings: []
    };

    const updated = await store.updateOrder(order._id || order.id || order.orderId, payload);
    if (!updated) return res.status(404).json({ message: 'Order not found.' });

    try {
      sendSseEvent('order:updated', { id: updated._id || updated.id, orderId: updated.orderId, status: updated.status, paymentStatus: updated.paymentStatus });
    } catch (e) {}

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

app.get("/api/orders/:id", requireStaff, async (req, res, next) => {
  try {
    const order = await store.orderById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json(order);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/orders/:id/status", requireStaff, async (req, res, next) => {
  try {
    const order = await store.updateOrder(req.params.id, { status: req.body.status });
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json(order);
    try {
      sendSseEvent("order:updated", { id: order._id || order.id, status: order.status });
    } catch (e) {
      // ignore
    }
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders/:id/deduct-inventory", requireAdmin, async (req, res, next) => {
  try {
    const order = await store.deductOrderInventory(req.params.id);
    res.json(order);
  } catch (error) {
    next(error);
  }
});

// Create a Cash-On-Counter request (requires admin approval)
app.post("/api/coc-requests", async (req, res, next) => {
  try {
    const request = await store.createCocRequest(req.body);
    res.status(201).json(request);
    try {
      sendSseEvent("coc:created", { id: request.id, createdAt: request.createdAt });
    } catch (e) {}
  } catch (error) {
    next(error);
  }
});

app.get("/api/coc-requests", requireStaff, async (_req, res, next) => {
  try {
    res.json(await store.cocRequests());
  } catch (error) {
    next(error);
  }
});

// Admin: approve a COC request (creates real order)
app.patch("/api/coc-requests/:id", requireStaff, async (req, res, next) => {
  try {
    const order = await store.approveCocRequest(req.params.id);
    if (!order) return res.status(404).json({ message: "COC request not found" });
    res.json(order);
    scheduleOrderReadySms(order);
    try {
      sendSseEvent("order:created", { id: order.id, createdAt: order.createdAt || new Date().toISOString() });
    } catch (e) {}
  } catch (error) {
    next(error);
  }
});

app.get("/api/inventory", requireAdmin, async (_req, res, next) => {
  try {
    res.json(await store.rawMaterials());
  } catch (error) {
    next(error);
  }
});

app.post("/api/inventory", requireAdmin, async (req, res, next) => {
  try {
    const payload = { ...req.body, unit: String(req.body.unit || "pcs").toLowerCase() };
    res.json(await store.upsertRawMaterial(payload));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/inventory/:id", requireAdmin, async (req, res, next) => {
  try {
    const payload = { ...req.body, id: req.params.id, unit: String(req.body.unit || "pcs").toLowerCase() };
    res.json(await store.upsertRawMaterial(payload));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/inventory/:id", requireAdmin, async (req, res, next) => {
  try {
    res.json(await store.deleteRawMaterial(req.params.id));
  } catch (error) {
    next(error);
  }
});

app.post("/api/inventory/:id/purchase", requireAdmin, async (req, res, next) => {
  try {
    const { quantity, unit, note } = req.body;
    const material = await store.rawMaterial(req.params.id);
    if (!material) return res.status(404).json({ message: "Inventory item not found." });
    const amount = Number(quantity || 0);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: "Invalid purchase quantity." });
    const actualUnit = String(unit || material.unit).trim().toLowerCase();
    await store.adjustRawMaterialStock(req.params.id, amount, note || "Stock purchase", req.params.id);
    res.json(await store.rawMaterial(req.params.id));
  } catch (error) {
    next(error);
  }
});

app.get("/api/recipes", requireAdmin, async (_req, res, next) => {
  try {
    res.json(await store.recipes());
  } catch (error) {
    next(error);
  }
});

app.post("/api/recipes", requireAdmin, async (req, res, next) => {
  try {
    res.json(await store.upsertRecipe(req.body));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/recipes/:id", requireAdmin, async (req, res, next) => {
  try {
    const payload = { ...req.body, id: req.params.id };
    res.json(await store.upsertRecipe(payload));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/recipes/:id", requireAdmin, async (req, res, next) => {
  try {
    res.json(await store.deleteRecipe(req.params.id));
  } catch (error) {
    next(error);
  }
});

app.get("/api/reports", requireAdmin, async (_req, res, next) => {
  try {
    const [orders, rawMaterials] = await Promise.all([store.orders(), store.rawMaterials()]);
    const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const totalOrders = orders.length;
    const lowStockItems = rawMaterials.filter((item) => Number(item.stock || 0) <= Number(item.minStock || 0));
    const inventoryValue = rawMaterials.reduce((sum, item) => sum + Number(item.stock || 0) * Number(item.costPerUnit || 0), 0);
    const itemCount = {};
    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        itemCount[item.itemId] = (itemCount[item.itemId] || 0) + Number(item.quantity || 0);
      });
    });
    const topItems = Object.entries(itemCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([itemId, quantity]) => ({ itemId, quantity }));
    res.json({ totalSales, totalOrders, inventoryValue, lowStockCount: lowStockItems.length, lowStockItems, topItems });
  } catch (error) {
    next(error);
  }
});

app.get("/api/reports/daily", requireAdmin, async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const report = await store.reportsDaily(date);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

app.get("/api/reports/monthly", requireAdmin, async (req, res, next) => {
  try {
    const yearMonth = req.query.date || new Date().toISOString().slice(0, 7);
    const report = await store.reportsMonthly(`${yearMonth}-01`);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

app.get("/api/orders/history", requireAdmin, async (_req, res, next) => {
  try {
    res.json(await store.orders());
  } catch (error) {
    next(error);
  }
});

// Server-Sent Events endpoint for orders
app.get("/api/orders/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream;charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  // Allow event stream for cross-origin when CORS is configured
  res.flushHeaders?.();

  sseClients.add(res);

  // send initial ping
  res.write(`event: hello\n`);
  res.write(`data: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);

  req.on("close", () => {
    sseClients.delete(res);
  });
});

app.patch("/api/orders/:id", requireStaff, async (req, res, next) => {
  try {
    const order = await store.updateOrder(req.params.id, req.body);
    if (!order) return res.status(404).json({ message: "Order not found." });

    // If order moved to confirmed (by biller), ensure inventory is deducted
    if (req.body && req.body.status === "confirmed") {
      try {
        await store.deductOrderInventory(order._id || order.id);
      } catch (err) {
        // log but don't fail the request — caller should see the updated order
        console.error("Failed to deduct inventory on confirm:", err);
      }
    }

    const updated = await store.orderById(order._id || order.id);
    res.json(updated);
    try {
      sendSseEvent("order:updated", { id: updated._id || updated.id, orderId: updated.orderId, status: updated.status, paymentStatus: updated.paymentStatus });
    } catch (e) {
      // ignore
    }
  } catch (error) {
    next(error);
  }
});

app.delete("/api/orders/:id", requireAdmin, async (req, res, next) => {
  try {
    res.json(await store.deleteOrder(req.params.id));
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(400).json({ message: error.message || "Something went wrong." });
});

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

await connectDatabase();
const server = app.listen(port, () => {
  console.log(`The Infusion Saga API listening on http://localhost:${port}`);
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Please stop the process using that port or set PORT to a different value and restart.`);
    process.exit(1);
  }
  console.error("Server error:", err);
  process.exit(1);
});
