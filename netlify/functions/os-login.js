'use strict';

const { verifyGoogleIdToken } = require('./lib/google');
const { createSessionToken, COOKIE_NAME } = require('./lib/session');

const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function jsonResponse(statusCode, body, extraHeaders) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      ...extraHeaders
    },
    body: JSON.stringify(body)
  };
}

// The only path that mints a session. Verifies the Google ID token the
// client posted, then checks the resulting email against the single
// configured owner address. Anything else - wrong client, wrong issuer,
// unverified email, wrong person, missing config - is rejected before any
// cookie is set.
exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  const clientId = process.env.OS_GOOGLE_CLIENT_ID;
  const allowedEmail = process.env.OS_ALLOWED_OWNER_EMAIL;
  const sessionSecret = process.env.OS_SESSION_SECRET;

  if (!clientId || !allowedEmail || !sessionSecret) {
    return jsonResponse(500, { error: 'Giuseppe OS is not configured yet' });
  }

  let credential;
  try {
    ({ credential } = JSON.parse(event.body || '{}'));
  } catch {
    return jsonResponse(400, { error: 'Invalid request' });
  }

  if (!credential) {
    return jsonResponse(400, { error: 'Missing credential' });
  }

  const payload = await verifyGoogleIdToken(credential, clientId);
  if (!payload || payload.email.toLowerCase() !== allowedEmail.toLowerCase()) {
    return jsonResponse(401, { error: 'This Google account is not authorized' });
  }

  const token = createSessionToken(payload.email, sessionSecret, SESSION_TTL_SECONDS);
  const cookie = `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;

  return jsonResponse(200, { ok: true }, { 'Set-Cookie': cookie });
};
