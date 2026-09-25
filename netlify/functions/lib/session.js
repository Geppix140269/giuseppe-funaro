'use strict';

const crypto = require('crypto');

const COOKIE_NAME = 'gos_session';

function sign(payloadB64, secret) {
  return crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
}

function createSessionToken(email, secret, ttlSeconds) {
  if (!secret) throw new Error('Missing session secret');
  const now = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({ sub: email, iat: now, exp: now + ttlSeconds });
  const payloadB64 = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = sign(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

// Fails closed: a missing secret, a malformed token, a bad signature, a
// tampered payload or an expired token all return null, never a session.
function verifySessionToken(token, secret) {
  if (!secret || !token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;

  const expectedSig = sign(payloadB64, secret);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp < now) return null;
  if (typeof payload.sub !== 'string' || !payload.sub) return null;

  return payload;
}

module.exports = { COOKIE_NAME, createSessionToken, verifySessionToken };
