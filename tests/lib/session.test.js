'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createSessionToken, verifySessionToken, COOKIE_NAME } = require('../../netlify/functions/lib/session');

test('session token round-trips for the matching secret', () => {
  const token = createSessionToken('owner@example.com', 'secret', 3600);
  const payload = verifySessionToken(token, 'secret');
  assert.equal(payload.sub, 'owner@example.com');
});

test('rejects a token signed with a different secret', () => {
  const token = createSessionToken('owner@example.com', 'secret-a', 3600);
  assert.equal(verifySessionToken(token, 'secret-b'), null);
});

test('rejects a tampered payload', () => {
  const token = createSessionToken('owner@example.com', 'secret', 3600);
  const [, sig] = token.split('.');
  const tamperedPayload = Buffer.from(
    JSON.stringify({ sub: 'attacker@example.com', iat: 0, exp: 9999999999 })
  ).toString('base64url');
  assert.equal(verifySessionToken(`${tamperedPayload}.${sig}`, 'secret'), null);
});

test('rejects an expired token', () => {
  const token = createSessionToken('owner@example.com', 'secret', -10);
  assert.equal(verifySessionToken(token, 'secret'), null);
});

test('fails closed when no secret is configured', () => {
  const token = createSessionToken('owner@example.com', 'secret', 3600);
  assert.equal(verifySessionToken(token, ''), null);
  assert.equal(verifySessionToken(token, undefined), null);
});

test('rejects malformed tokens', () => {
  assert.equal(verifySessionToken('not-a-token', 'secret'), null);
  assert.equal(verifySessionToken('', 'secret'), null);
  assert.equal(verifySessionToken(null, 'secret'), null);
});

test('cookie name is stable', () => {
  assert.equal(COOKIE_NAME, 'gos_session');
});
