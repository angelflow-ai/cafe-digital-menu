import crypto from 'node:crypto';
import http from 'node:http';

const AUTH_TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 8;
function base64UrlEncode(value) { return Buffer.from(value).toString('base64url'); }
function getAuthTokenSecret() { return process.env.AUTH_TOKEN_SECRET || process.env.SESSION_SECRET || 'change-this-secret'; }
function signAuthPayload(payload){ return crypto.createHmac('sha256', getAuthTokenSecret()).update(payload).digest('base64url'); }

function createAuthToken(user) {
  const payload = base64UrlEncode(JSON.stringify({ role: user.role, email: user.email, exp: Date.now() + AUTH_TOKEN_MAX_AGE_MS }));
  const signature = signAuthPayload(payload);
  return `${payload}.${signature}`;
}

function httpPut(url, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const opts = { hostname: parsed.hostname, port: parsed.port || 80, path: parsed.pathname + parsed.search, method: 'PUT', headers };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main(){
  const token = createAuthToken({ role: 'admin', email: process.env.ADMIN_EMAIL || 'owner@theinfusionsaga.com' });
  const id = process.argv[2] || 'black-coffee';
  const url = `http://localhost:5001/api/menu/${encodeURIComponent(id)}`;
  const body = JSON.stringify({ name: 'HTTP DEBUG NAME' });
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Content-Length': Buffer.byteLength(body) };
  const res = await httpPut(url, headers, body);
  console.log('status', res.status);
  console.log(res.body);
}

main().catch(err=>{ console.error(err); process.exit(1); });
