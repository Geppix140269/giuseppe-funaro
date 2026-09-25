'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

process.env.OS_SESSION_SECRET = 'test-secret';

const { createSessionToken, COOKIE_NAME } = require('../../netlify/functions/lib/session');
const { handler } = require('../../netlify/functions/os-shell');

test('unauthenticated GET /os is redirected to login, not the shell', async () => {
  const res = await handler({ httpMethod: 'GET', headers: {} });
  assert.equal(res.statusCode, 302);
  assert.equal(res.headers.Location, '/os/login');
  assert.equal(res.body, '');
});

test('an invalid session cookie is also blocked', async () => {
  const res = await handler({ httpMethod: 'GET', headers: { cookie: `${COOKIE_NAME}=garbage` } });
  assert.equal(res.statusCode, 302);
});

test('the allowed owner with a valid session sees the Today shell', async () => {
  const token = createSessionToken('owner@example.com', 'test-secret', 3600);
  const res = await handler({ httpMethod: 'GET', headers: { cookie: `${COOKIE_NAME}=${token}` } });
  assert.equal(res.statusCode, 200);
  assert.match(res.body, /Giuseppe OS/);
  assert.match(res.body, /owner@example\.com/);
  assert.equal(res.headers['X-Robots-Tag'], 'noindex, nofollow');
});

test('the shell response is never cached', async () => {
  const res = await handler({ httpMethod: 'GET', headers: {} });
  assert.equal(res.headers['Cache-Control'], 'private, no-store');
});
