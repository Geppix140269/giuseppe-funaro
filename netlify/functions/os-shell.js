'use strict';

const { getSession } = require('./lib/auth');
const { renderShellHtml } = require('./lib/os-shell-html');

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow'
};

// Serves the private Today shell for /os and /os/*. There is no static file
// behind this route: the HTML only ever exists in memory, rendered here
// after a valid session is confirmed. An unauthenticated or invalid session
// is redirected to /os/login, never shown any part of the shell.
exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: PRIVATE_HEADERS, body: 'Method Not Allowed' };
  }

  const session = getSession(event);
  if (!session) {
    return {
      statusCode: 302,
      headers: { ...PRIVATE_HEADERS, Location: '/os/login' },
      body: ''
    };
  }

  return {
    statusCode: 200,
    headers: { ...PRIVATE_HEADERS, 'Content-Type': 'text/html; charset=utf-8' },
    body: renderShellHtml({ email: session.sub })
  };
};
