'use strict';

const { parseCookies, getCookieHeader } = require('./cookies');
const { COOKIE_NAME, verifySessionToken } = require('./session');

function getSession(event) {
  const cookies = parseCookies(getCookieHeader(event));
  return verifySessionToken(cookies[COOKIE_NAME], process.env.OS_SESSION_SECRET || '');
}

module.exports = { getSession };
