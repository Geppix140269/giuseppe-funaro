'use strict';

const TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';
const VALID_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

// Verifies a Google Identity Services ID token server-side. Google's
// tokeninfo endpoint already checks the signature and expiry for us; we only
// need to additionally pin the audience (our OAuth client), the issuer and
// that the email is verified. This is a one-owner, low-volume login, so the
// documented rate limits on this endpoint are not a concern.
async function verifyGoogleIdToken(idToken, expectedClientId) {
  if (!idToken || !expectedClientId) return null;

  let response;
  try {
    response = await fetch(`${TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`);
  } catch {
    return null;
  }
  if (!response.ok) return null;

  let payload;
  try {
    payload = await response.json();
  } catch {
    return null;
  }

  if (payload.aud !== expectedClientId) return null;
  if (!VALID_ISSUERS.has(payload.iss)) return null;
  if (payload.email_verified !== 'true' && payload.email_verified !== true) return null;
  if (!payload.email) return null;

  return payload;
}

module.exports = { verifyGoogleIdToken };
