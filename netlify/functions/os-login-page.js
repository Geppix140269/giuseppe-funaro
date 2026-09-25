'use strict';

const { getSession } = require('./lib/auth');
const { renderLoginHtml } = require('./lib/os-login-html');

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow'
};

// Public page (no session required) that renders the Sign in with Google
// button. If a valid session already exists, skip straight to the shell.
exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: PRIVATE_HEADERS, body: 'Method Not Allowed' };
  }

  const session = getSession(event);
  if (session) {
    return { statusCode: 302, headers: { ...PRIVATE_HEADERS, Location: '/os' }, body: '' };
  }

  const googleClientId = process.env.OS_GOOGLE_CLIENT_ID || '';
  return {
    statusCode: 200,
    headers: { ...PRIVATE_HEADERS, 'Content-Type': 'text/html; charset=utf-8' },
    body: renderLoginHtml({ googleClientId, configured: Boolean(googleClientId) })
  };
};
