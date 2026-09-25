'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { verifyGoogleIdToken } = require('../../netlify/functions/lib/google');

function mockFetch(payload, ok = true) {
  global.fetch = async () => ({ ok, json: async () => payload });
}

test('accepts a valid, verified Google token', async () => {
  mockFetch({ aud: 'client-123', iss: 'https://accounts.google.com', email: 'owner@example.com', email_verified: 'true' });
  const result = await verifyGoogleIdToken('token', 'client-123');
  assert.equal(result.email, 'owner@example.com');
});

test('rejects a token issued for a different client id', async () => {
  mockFetch({ aud: 'someone-elses-client', iss: 'https://accounts.google.com', email: 'owner@example.com', email_verified: 'true' });
  assert.equal(await verifyGoogleIdToken('token', 'client-123'), null);
});

test('rejects an unverified email', async () => {
  mockFetch({ aud: 'client-123', iss: 'https://accounts.google.com', email: 'owner@example.com', email_verified: 'false' });
  assert.equal(await verifyGoogleIdToken('token', 'client-123'), null);
});

test('rejects an untrusted issuer', async () => {
  mockFetch({ aud: 'client-123', iss: 'https://evil.example.com', email: 'owner@example.com', email_verified: 'true' });
  assert.equal(await verifyGoogleIdToken('token', 'client-123'), null);
});

test('rejects when Google reports the token invalid', async () => {
  mockFetch({ error: 'invalid_token' }, false);
  assert.equal(await verifyGoogleIdToken('token', 'client-123'), null);
});

test('rejects when the network call fails', async () => {
  global.fetch = async () => { throw new Error('network down'); };
  assert.equal(await verifyGoogleIdToken('token', 'client-123'), null);
});
