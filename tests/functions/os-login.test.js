'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

process.env.OS_GOOGLE_CLIENT_ID = 'client-123';
process.env.OS_ALLOWED_OWNER_EMAIL = 'owner@example.com';
process.env.OS_SESSION_SECRET = 'test-secret';

const { handler } = require('../../netlify/functions/os-login');
const { verifySessionToken, COOKIE_NAME } = require('../../netlify/functions/lib/session');

function mockGoogle(payload, ok = true) {
  global.fetch = async () => ({ ok, json: async () => payload });
}

test('the allowed owner is signed in and receives a session cookie', async () => {
  mockGoogle({ aud: 'client-123', iss: 'https://accounts.google.com', email: 'owner@example.com', email_verified: 'true' });
  const res = await handler({ httpMethod: 'POST', body: JSON.stringify({ credential: 'abc' }) });
  assert.equal(res.statusCode, 200);

  const setCookie = res.headers['Set-Cookie'];
  assert.match(setCookie, new RegExp(`^${COOKIE_NAME}=`));
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /Secure/);

  const token = setCookie.split(';')[0].split('=')[1];
  const session = verifySessionToken(token, 'test-secret');
  assert.equal(session.sub, 'owner@example.com');
});

test('any other Google identity is rejected and no cookie is set', async () => {
  mockGoogle({ aud: 'client-123', iss: 'https://accounts.google.com', email: 'someone-else@example.com', email_verified: 'true' });
  const res = await handler({ httpMethod: 'POST', body: JSON.stringify({ credential: 'abc' }) });
  assert.equal(res.statusCode, 401);
  assert.equal(res.headers['Set-Cookie'], undefined);
});

test('rejects malformed request bodies', async () => {
  const res = await handler({ httpMethod: 'POST', body: 'not json' });
  assert.equal(res.statusCode, 400);
});

test('rejects non-POST methods', async () => {
  const res = await handler({ httpMethod: 'GET' });
  assert.equal(res.statusCode, 405);
});

test('fails closed when required configuration is missing', async () => {
  const original = process.env.OS_SESSION_SECRET;
  delete process.env.OS_SESSION_SECRET;
  mockGoogle({ aud: 'client-123', iss: 'https://accounts.google.com', email: 'owner@example.com', email_verified: 'true' });
  const res = await handler({ httpMethod: 'POST', body: JSON.stringify({ credential: 'abc' }) });
  assert.equal(res.statusCode, 500);
  process.env.OS_SESSION_SECRET = original;
});
