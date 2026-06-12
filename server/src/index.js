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
import bcrypt from "bcryptjs";
import { connectDatabase, findStaffAccountByEmail, getConfiguredStaffEmails, isCompletedSale, setStaffPassword, store } from "./db.js";
import { defaultRecipes } from "./seed.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.set("trust proxy", 1);
const uploadsDir = path.join(__dirname, "../uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
const allowedUploadMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"]);
const uploadStorage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadsDir),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    callback(null, `${crypto.randomUUID()}${extension}`);
  }
});
const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!allowedUploadMimeTypes.has(file.mimetype)) {
      callback(new Error("Please upload a JPG, PNG, WEBP, or GIF image."));
      return;
    }
    callback(null, true);
  }
});
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
const publicOrderCache = new Map();

function cacheOrder(order) {
  if (!order) return;
  const keys = [order._id, order.id, order.orderId].filter(Boolean).map((value) => String(value));
  for (const key of keys) {
    publicOrderCache.set(key, order);
  }
}

async function findPublicOrder(identifier) {
  const key = String(identifier || "").trim();
  if (!key) return null;

  const cached = publicOrderCache.get(key);
  if (cached) return cached;

  const direct = await store.orderById(key);
  if (direct) {
    cacheOrder(direct);
    return direct;
  }

  const allOrders = await store.orders();
  const match = allOrders.find((order) => String(order._id || "") === key || String(order.id || "") === key || String(order.orderId || "") === key);
  if (match) {
    cacheOrder(match);
    return match;
  }

  return null;
}

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

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const PRODUCTION_CLIENT_ORIGIN = "https://cafe-digital-menu.vercel.app";
const allowedOrigins = [...new Set([CLIENT_ORIGIN, PRODUCTION_CLIENT_ORIGIN])].filter(Boolean);
const isProductionRuntime =
  process.env.NODE_ENV === "production" ||
  process.env.RENDER === "true" ||
  Boolean(process.env.RENDER_EXTERNAL_URL) ||
  CLIENT_ORIGIN === PRODUCTION_CLIENT_ORIGIN;
const useSecureSessionCookie = isProductionRuntime || CLIENT_ORIGIN.startsWith("https://");
const AUTH_TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 8;

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
      sameSite: useSecureSessionCookie ? "none" : "lax",
      secure: useSecureSessionCookie,
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

function hashPassword(password) {
  return bcrypt.hashSync(String(password || ""), 10);
}

function verifyPassword(password, storedPassword) {
  if (!storedPassword) return false;
  if (storedPassword.startsWith("$2")) return bcrypt.compareSync(String(password || ""), storedPassword);
  return String(password || "") === String(storedPassword);
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlJson(value) {
  return base64UrlEncode(JSON.stringify(value));
}

function getAuthTokenSecret() {
  return process.env.AUTH_TOKEN_SECRET || process.env.SESSION_SECRET || "dev-infusion-secret";
}

function signAuthPayload(payload) {
  return crypto.createHmac("sha256", getAuthTokenSecret()).update(payload).digest("base64url");
}

function createAuthToken(user) {
  const payload = base64UrlJson({
    role: user.role,
    email: user.email,
    exp: Date.now() + AUTH_TOKEN_MAX_AGE_MS
  });
  return `${payload}.${signAuthPayload(payload)}`;
}

function getBearerToken(req) {
  const header = req.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function verifyAuthToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = signAuthPayload(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data?.email || !data?.role || !data?.exp || Number(data.exp) < Date.now()) return null;
    if (data.role !== "admin" && data.role !== "biller") return null;
    return { role: data.role, email: normalizeEmail(data.email) };
  } catch (error) {
    return null;
  }
}

async function getAuthenticatedUser(req) {
  if (req.session?.user?.role === "admin" || req.session?.user?.role === "biller") return req.session.user;

  const tokenUser = verifyAuthToken(getBearerToken(req));
  if (!tokenUser) return null;

  const user = await findStaffAccountByEmail(tokenUser.email);
  if (!user || user.role !== tokenUser.role || !user.verified || !isAllowedEmailForRole(tokenUser.email, tokenUser.role)) return null;
  req.authUser = tokenUser;
  return tokenUser;
}


const emailTransporter = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  : null;

const emailFrom = process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || "theinfusionsaga@theinfusionsaga.com";
const passwordResetOtps = new Map();

async function findUserByEmail(email) {
  return findStaffAccountByEmail(email);
}

async function sendEmail({ to, subject, text, html }) {
  if (!emailTransporter) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, and EMAIL_FROM before sending auth emails.");
  }

  await emailTransporter.sendMail({ from: emailFrom, to, subject, text, html });
  return { sent: true };
}

async function requireAdmin(req, res, next) {
  try {
    const user = await getAuthenticatedUser(req);
    if (user?.role === "admin") return next();
    return res.status(401).json({ message: "Admin login required." });
  } catch (error) {
    return next(error);
  }
}

async function requireStaff(req, res, next) {
  try {
    const user = await getAuthenticatedUser(req);
    if (user?.role === "admin" || user?.role === "biller") return next();
    return res.status(401).json({ message: "Staff login required." });
  } catch (error) {
    return next(error);
  }
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getRoleLabel(role) {
  return role === "biller" ? "biller" : "admin";
}

function isAllowedEmailForRole(email, role) {
  const allowed = getConfiguredStaffEmails(role);
  return allowed.length === 0 || allowed.includes(normalizeEmail(email));
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

function createLoginResponse(user, req, res) {
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  if (!user.verified) {
    return res.status(403).json({ message: "Please verify your email." });
  }
  const token = createAuthToken(user);
  req.session.user = { role: user.role, email: user.email, token };
  return res.json({ success: true, token, user: { role: user.role, email: user.email } });
}

async function loginHandler(req, res, roleOverride = null) {
  const { email, password, role } = req.body;
  const requestRole = getRoleLabel(roleOverride || role);
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return res.status(400).json({ message: "Email is required." });
  }

  const user = await findStaffAccountByEmail(normalizedEmail);
  if (!user || user.role !== requestRole || !isAllowedEmailForRole(normalizedEmail, requestRole)) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  if (!user.verified) {
    return res.status(403).json({ message: "Please verify your email before signing in." });
  }
  return createLoginResponse({ ...user, password: user.passwordHash, role: user.role }, req, res);
}

app.post("/api/auth/login", async (req, res) => loginHandler(req, res));
app.post("/api/auth/owner/login", async (req, res) => loginHandler(req, res, "admin"));
app.post("/api/auth/biller/login", async (req, res) => loginHandler(req, res, "biller"));

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/auth/me", async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req);
    res.json({ user: user ? { role: user.role, email: user.email } : null });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/check-email", async (req, res) => {
  const email = normalizeEmail(req.query.email);
  const user = await findStaffAccountByEmail(email);
  if (!user) {
    return res.status(404).json({ allowed: false, message: "This email is not registered for Owner or Biller access." });
  }
  return res.json({ allowed: true, role: user.role, email: user.email });
});

app.post("/api/auth/set-password", async (req, res) => {
  const { email, password, confirmPassword, role } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const requestRole = getRoleLabel(role);
  const user = await findStaffAccountByEmail(normalizedEmail);

  if (!user || user.role !== requestRole || !isAllowedEmailForRole(normalizedEmail, requestRole)) {
    return res.status(404).json({ message: "This email is not registered for this access." });
  }
  if (String(password || "").length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long." });
  }
  if (String(password || "") !== String(confirmPassword || "")) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  const verificationToken = String(crypto.randomInt(100000, 999999)).padStart(6, "0");
  const verificationExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
  await setStaffPassword(user.email, hashPassword(password), {
    verified: false,
    verificationToken,
    verificationExpiresAt,
    mustChangePassword: false
  });

  try {
    await sendEmail({
      to: user.email,
      subject: "Your The Infusion Saga login password is set",
      text: `Your login password has been set successfully.\nEmail: ${user.email}\nVerification code: ${verificationToken}\nUse /api/auth/verify-email?email=${encodeURIComponent(user.email)}&token=${verificationToken} to activate your account.\nDo not share this code with anyone.`
    });
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return res.status(500).json({ success: false, message: "Failed to send verification email." });
  }

  return res.json({
    success: true,
    message: "Password set successfully. Login details sent to your email."
  });
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email, role } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const requestRole = getRoleLabel(role);
  const user = await findStaffAccountByEmail(normalizedEmail);

  if (!user || user.role !== requestRole || !isAllowedEmailForRole(normalizedEmail, requestRole)) {
    return res.status(404).json({ message: "This email is not registered for this access." });
  }

  const temporaryPassword = `Infusion-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const resetOtp = String(crypto.randomInt(100000, 999999)).padStart(6, "0");
  const resetExpiresAt = Date.now() + 15 * 60 * 1000;
  passwordResetOtps.set(user.email, { otp: resetOtp, role: user.role, expiresAt: resetExpiresAt });
  await setStaffPassword(user.email, hashPassword(temporaryPassword), {
    verified: true,
    mustChangePassword: true,
    passwordResetToken: resetOtp,
    passwordResetExpiresAt: new Date(resetExpiresAt)
  });

  try {
    await sendEmail({
      to: user.email,
      subject: "Your The Infusion Saga password reset",
      text: `A password reset request was received for ${user.email}.\nReset code: ${resetOtp}\nThis code expires in 15 minutes.\nUse the code on the reset page to choose a new password.`
    });
  } catch (error) {
    console.error("Failed to send forgot-password email:", error);
    return res.status(500).json({ success: false, message: "Failed to send password reset email." });
  }

  return res.json({
    success: true,
    message: "Password reset instructions sent to your email."
  });
});

app.post("/api/auth/verify-email", async (req, res) => {
  const { email, token } = req.body;
  const user = await findStaffAccountByEmail(email);
  if (!user || !user.verificationToken || user.verificationToken !== String(token) || !user.verificationExpiresAt || new Date(user.verificationExpiresAt).getTime() < Date.now()) {
    return res.status(400).json({ message: "Verification link is invalid or expired." });
  }
  await setStaffPassword(user.email, user.passwordHash, { verified: true, verificationToken: null, verificationExpiresAt: null });
  return res.json({ success: true, message: "Email verified successfully. You can now sign in." });
});

app.post("/api/auth/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const user = await findStaffAccountByEmail(email);
  const record = passwordResetOtps.get(user?.email);
  if (!user || !record || record.otp !== String(otp) || record.expiresAt < Date.now()) {
    return res.status(400).json({ message: "OTP is invalid or expired." });
  }
  return res.json({ success: true, message: "OTP verified." });
});

app.post("/api/auth/reset-password", async (req, res) => {
  const { email, otp, password } = req.body;
  const user = await findStaffAccountByEmail(email);
  const record = passwordResetOtps.get(user?.email) || (user ? {
    otp: user.passwordResetToken,
    expiresAt: user.passwordResetExpiresAt ? new Date(user.passwordResetExpiresAt).getTime() : 0
  } : null);
  if (!user || !record || record.otp !== String(otp) || !record.expiresAt || record.expiresAt < Date.now()) {
    return res.status(400).json({ message: "Reset code is invalid or expired." });
  }
  await setStaffPassword(user.email, hashPassword(password), { verified: true, mustChangePassword: false, passwordResetToken: null, passwordResetExpiresAt: null });
  passwordResetOtps.delete(user.email);

  try {
    await sendEmail({
      to: user.email,
      subject: "Your The Infusion Saga password has been reset",
      text: `Your password was reset successfully for ${user.email}.\nYou can sign in with your new password now.`
    });
  } catch (error) {
    console.error("Failed to send reset-password confirmation email:", error);
    return res.status(500).json({ ok: false, message: "Password updated, but failed to send the confirmation email." });
  }

  return res.json({ ok: true, message: "Password updated successfully." });
});

app.get("/api/_debug/orders", async (_req, res, next) => { try { res.json(await store.orders()); } catch (err) { next(err); } });

app.get("/api/categories", async (_req, res, next) => {
  try {
    const includeDeleted = _req.query.includeDeleted === "true";
    const categories = await store.categories();
    if (!includeDeleted) {
      res.json(categories);
      return;
    }
    const deleted = await store.deletedCategories();
    res.json([...categories, ...deleted]);
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

app.patch("/api/categories/:id/restore", requireAdmin, async (req, res, next) => {
  try {
    res.json(await store.restoreCategory(req.params.id));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/categories/:id", requireAdmin, async (req, res, next) => {
  try {
    if (req.query.permanent === "true") {
      res.json(await store.permanentlyDeleteCategory(req.params.id));
      return;
    }
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
        includeInactive: req.query.includeInactive === "true",
        includeDeleted: req.query.includeDeleted === "true"
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

app.patch("/api/menu/:id/restore", requireAdmin, async (req, res, next) => {
  try {
    res.json(await store.restoreMenuItem(req.params.id));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/menu/:id", requireAdmin, async (req, res, next) => {
  try {
    if (req.query.permanent === "true") {
      res.json(await store.permanentlyDeleteMenuItem(req.params.id));
      return;
    }
    res.json(await store.deleteMenuItem(req.params.id));
  } catch (error) {
    next(error);
  }
});

app.post("/api/uploads", requireAdmin, (req, res, next) => {
  upload.single("photo")(req, res, (error) => {
    if (error) return next(error);
    if (!req.file) return res.status(400).json({ message: "Please choose an image file to upload." });
    return res.json({ url: `/uploads/${req.file.filename}` });
  });
});

app.get("/api/orders", requireStaff, async (req, res, next) => {
  try {
    const requestedLimit = Number(req.query.limit || 100);
    const safeLimit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 500) : 100;
    const statuses = typeof req.query.status === "string" && req.query.status.trim()
      ? req.query.status.split(",").map((value) => String(value).trim()).filter(Boolean)
      : [];

    res.json(await store.orders({ limit: safeLimit, status: statuses.join(",") }));
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", async (req, res, next) => {
  try {
    const order = await store.createOrder(req.body);
    cacheOrder(order);
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
    const order = await findPublicOrder(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });
    return res.json(order);
  } catch (error) {
    next(error);
  }
});

// Public retry: allow customers to re-submit payment verification for a public order id
app.post("/api/orders/public/:id/retry", async (req, res, next) => {
  try {
    const order = await findPublicOrder(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });
    const updated = await store.updateOrder(order._id || order.id, { paymentStatus: "pending_verification", status: "pending" });
    cacheOrder(updated);
    res.json(updated);
    try { sendSseEvent("order:updated", { id: updated._id || updated.id, orderId: updated.orderId, status: updated.status }); } catch (e) {}
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
    cacheOrder(order);

    const nextStatus = String(req.body.status || "").toLowerCase().trim();
    if (nextStatus === "confirmed" || nextStatus === "completed") {
      try {
        await store.deductOrderInventory(order._id || order.id);
      } catch (err) {
        console.error("Failed to deduct inventory on status change:", err);
      }
    }

    const updated = await store.orderById(order._id || order.id);
    cacheOrder(updated);
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
    if (!order) return res.status(404).json({ message: "COC request not found. Refresh the list and try again." });
    cacheOrder(order);
    res.json(order);
    scheduleOrderReadySms(order);
    try {
      sendSseEvent("order:updated", { id: order._id || order.id, orderId: order.orderId, status: order.status, paymentStatus: order.paymentStatus });
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
    const result = await store.adjustRawMaterialStock(req.params.id, amount, note || "Stock purchase", req.params.id);
    res.json({
      material: result.material || (await store.rawMaterial(req.params.id)),
      isLowStock: result.isLowStock || false
    });
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

app.post("/api/recipes/sync-defaults", requireAdmin, async (_req, res, next) => {
  try {
    res.json(await store.syncDefaultRecipes(defaultRecipes));
  } catch (error) {
    next(error);
  }
});

app.get("/api/reports", requireAdmin, async (_req, res, next) => {
  try {
    const [orders, rawMaterials] = await Promise.all([store.orders(), store.rawMaterials()]);
    const completedOrders = orders.filter((order) => isCompletedSale(order));
    const totalSales = completedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const totalOrders = completedOrders.length;
    const lowStockItems = rawMaterials.filter((item) => Number(item.stock || 0) <= Number(item.minStock || 0));
    const inventoryValue = rawMaterials.reduce((sum, item) => sum + Number(item.stock || 0) * Number(item.costPerUnit || 0), 0);
    const itemCount = {};
    completedOrders.forEach((order) => {
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

app.get("/api/orders/history", requireAdmin, async (req, res, next) => {
  try {
    const requestedLimit = Number(req.query.limit || 100);
    const safeLimit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 500) : 100;
    res.json(await store.orders({ limit: safeLimit }));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/orders/:id", requireStaff, async (req, res, next) => {
  try {
    const order = await store.updateOrder(req.params.id, req.body);
    if (!order) return res.status(404).json({ message: "Order not found." });
    cacheOrder(order);

    // If order moved to a completed sale state, ensure inventory is deducted once.
    const nextStatus = String(req.body?.status || "").toLowerCase().trim();
    if (nextStatus === "confirmed" || nextStatus === "completed") {
      try {
        await store.deductOrderInventory(order._id || order.id);
      } catch (err) {
        // log but don't fail the request — caller should see the updated order
        console.error("Failed to deduct inventory on confirm:", err);
      }
    }

    const updated = await store.orderById(order._id || order.id);
    cacheOrder(updated);
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
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Photo must be 5MB or smaller." });
    }
    return res.status(400).json({ message: error.message || "Photo upload failed." });
  }
  res.status(400).json({ message: error.message || "Something went wrong." });
});

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

try {
  await connectDatabase();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}

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
