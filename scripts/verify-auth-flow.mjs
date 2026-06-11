import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const serverDir = path.join(rootDir, "server");
const authFile = path.join(serverDir, "src", "persisted-auth.json");
const backupFile = path.join(serverDir, "src", "persisted-auth.backup.json");
const apiBase = "http://127.0.0.1:5011/api";

function fail(message) {
  throw new Error(message);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(pathname, options = {}, cookie = "") {
  const response = await fetch(`${apiBase}${pathname}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    const message = body.message || body.raw || `Request failed with ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return { response, body };
}

function toCookieHeader(setCookie) {
  if (!setCookie) return "";
  return setCookie.split(";")[0];
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${apiBase}/health`);
      if (response.ok) return;
    } catch {
      // retry
    }
    await wait(1000);
  }
  fail("Server did not become ready in time.");
}

function getOwnerAccount() {
  const raw = JSON.parse(fs.readFileSync(authFile, "utf8"));
  return raw.find((item) => item.email === "owner@theinfusionsaga.com");
}

async function main() {
  fs.writeFileSync(backupFile, fs.readFileSync(authFile, "utf8"), "utf8");

  const child = spawn("node", ["src/index.js"], {
    cwd: serverDir,
    env: { ...process.env, PORT: "5011", NODE_ENV: "development" },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  try {
    await waitForServer();

    const setPasswordResult = await request("/auth/set-password", {
      method: "POST",
      body: JSON.stringify({ email: "owner@theinfusionsaga.com", password: "AuthE2E-Init-2026!", confirmPassword: "AuthE2E-Init-2026!" })
    });
    if (!setPasswordResult.body.success) fail("Set-password endpoint did not succeed.");

    const ownerAfterSet = getOwnerAccount();
    if (!ownerAfterSet || ownerAfterSet.verified) fail("Set-password did not place the owner account into unverified state.");
    if (!ownerAfterSet.verificationToken) fail("Set-password did not create a verification token.");

    const verifyResult = await request("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email: "owner@theinfusionsaga.com", token: String(ownerAfterSet.verificationToken) })
    });
    if (!verifyResult.body.success) fail("Email verification did not succeed.");

    const loginResult = await request("/auth/owner/login", {
      method: "POST",
      body: JSON.stringify({ email: "owner@theinfusionsaga.com", password: "AuthE2E-Init-2026!" })
    });
    if (!loginResult.body.success) fail("Owner login failed after verification.");

    const cookie = toCookieHeader(loginResult.response.headers.get("set-cookie"));
    if (!cookie) fail("Login did not return a session cookie.");

    const logoutResult = await request("/auth/logout", { method: "POST" }, cookie);
    if (!logoutResult.body.ok) fail("Logout did not succeed.");

    const forgotResult = await request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "owner@theinfusionsaga.com", role: "admin" })
    });
    if (!forgotResult.body.success) fail("Forgot-password endpoint did not succeed.");

    const ownerAfterResetRequest = getOwnerAccount();
    if (!ownerAfterResetRequest || !ownerAfterResetRequest.passwordResetToken || !ownerAfterResetRequest.passwordResetExpiresAt) {
      fail("Forgot-password did not persist a reset token and expiry.");
    }

    const resetResult = await request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email: "owner@theinfusionsaga.com", otp: String(ownerAfterResetRequest.passwordResetToken), password: "AuthE2E-New-2026!" })
    });
    if (!resetResult.body.ok) fail("Reset-password endpoint did not succeed.");

    const ownerAfterReset = getOwnerAccount();
    if (ownerAfterReset.passwordResetToken) fail("Reset-password did not clear the reset token.");
    if (ownerAfterReset.mustChangePassword) fail("Reset-password did not clear forced password change state.");

    const loginWithNewPassword = await request("/auth/owner/login", {
      method: "POST",
      body: JSON.stringify({ email: "owner@theinfusionsaga.com", password: "AuthE2E-New-2026!" })
    });
    if (!loginWithNewPassword.body.success) fail("Login with the new password failed.");

    child.kill("SIGTERM");
    await wait(1000);

    const restarted = spawn("node", ["src/index.js"], {
      cwd: serverDir,
      env: { ...process.env, PORT: "5011", NODE_ENV: "development" },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let restartedOutput = "";
    restarted.stdout.on("data", (chunk) => { restartedOutput += chunk.toString(); });
    restarted.stderr.on("data", (chunk) => { restartedOutput += chunk.toString(); });

    try {
      await waitForServer();
      const finalLogin = await request("/auth/owner/login", {
        method: "POST",
        body: JSON.stringify({ email: "owner@theinfusionsaga.com", password: "AuthE2E-New-2026!" })
      });
      if (!finalLogin.body.success) fail("Login after server restart failed.");
      console.log(JSON.stringify({ ok: true, message: "Auth flow verification passed", output: restartedOutput.trim() }, null, 2));
    } finally {
      restarted.kill("SIGTERM");
    }
  } finally {
    child.kill("SIGTERM");
    fs.writeFileSync(authFile, fs.readFileSync(backupFile, "utf8"), "utf8");
    fs.rmSync(backupFile, { force: true });
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, message: error.message, status: error.status || null }, null, 2));
  process.exit(1);
});
