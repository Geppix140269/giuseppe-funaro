'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { handler } = require('../../netlify/functions/os-logout');
const { COOKIE_NAME } = require('../../netlify/functions/lib/session');

test('logout clears the session cookie', async () => {
  const res = await handler({ httpMethod: 'POST' });
  assert.equal(res.statusCode, 200);
  assert.match(res.headers['Set-Cookie'], new RegExp(`^${COOKIE_NAME}=;`));
  assert.match(res.headers['Set-Cookie'], /Max-Age=0/);
});

test('rejects non-POST methods', async () => {
  const res = await handler({ httpMethod: 'GET' });
  assert.equal(res.statusCode, 405);
});
