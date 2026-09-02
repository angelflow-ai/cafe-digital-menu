import crypto from 'node:crypto';
import fetch from 'node-fetch';
import fs from 'node:fs';

const AUTH_TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 8;
function base64UrlEncode(value) { return Buffer.from(value).toString('base64url'); }
function getAuthTokenSecret() { return process.env.AUTH_TOKEN_SECRET || process.env.SESSION_SECRET || 'change-this-secret'; }
function signAuthPayload(payload){ return crypto.createHmac('sha256', getAuthTokenSecret()).update(payload).digest('base64url'); }

function createAuthToken(user) {
  const payload = base64UrlEncode(JSON.stringify({ role: user.role, email: user.email, exp: Date.now() + AUTH_TOKEN_MAX_AGE_MS }));
  const signature = signAuthPayload(payload);
  return `${payload}.${signature}`;
}

async function main(){
  const token = createAuthToken({ role: 'admin', email: process.env.ADMIN_EMAIL || 'owner@theinfusionsaga.com' });
  console.log('Token:', token.slice(0,20) + '...');
  const id = process.argv[2] || 'black-coffee';
  const url = `http://localhost:5001/api/menu/${encodeURIComponent(id)}`;
  const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ name: 'HTTP DEBUG NAME' }) });
  const body = await res.text();
  console.log('status', res.status);
  try{ console.log(JSON.parse(body)); } catch(e){ console.log(body); }
}

main().catch(err => { console.error(err); process.exit(1); });
