'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

process.env.OS_SESSION_SECRET = 'test-secret';
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

const { handler } = require('../../netlify/functions/os-today');
const { createSessionToken, COOKIE_NAME } = require('../../netlify/functions/lib/session');

test('unauthenticated requests to the OS API are blocked', async () => {
  const res = await handler({ httpMethod: 'GET', headers: {} });
  assert.equal(res.statusCode, 401);
});

test('an invalid session cookie is also blocked', async () => {
  const res = await handler({ httpMethod: 'GET', headers: { cookie: `${COOKIE_NAME}=garbage` } });
  assert.equal(res.statusCode, 401);
});

test('the allowed owner gets the empty-state contract before Supabase is configured', async () => {
  const token = createSessionToken('owner@example.com', 'test-secret', 3600);
  const res = await handler({ httpMethod: 'GET', headers: { cookie: `${COOKIE_NAME}=${token}` } });
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.deepEqual(body, { workspaces: [], today: [], waiting: [], teamHandled: [] });
});
