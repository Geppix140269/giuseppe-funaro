'use strict';

const { COOKIE_NAME } = require('./lib/session');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const cookie = `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Set-Cookie': cookie
    },
    body: JSON.stringify({ ok: true })
  };
};
