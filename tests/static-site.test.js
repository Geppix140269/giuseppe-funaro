'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

test('the public homepage is untouched and still present', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /Giuseppe Funaro/);
});

test('no OS secrets are referenced by name in statically published public pages', () => {
  const publicFiles = ['index.html', 'thanks.html'];
  const forbidden = ['OS_SESSION_SECRET', 'SUPABASE_SERVICE_ROLE_KEY', 'OS_ALLOWED_OWNER_EMAIL'];
  publicFiles.forEach((file) => {
    const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
    forbidden.forEach((needle) => {
      assert.ok(!content.includes(needle), `${file} must not reference ${needle}`);
    });
  });
});

test('the OS shell and login templates never reference server-only secrets', () => {
  ['os-shell-html.js', 'os-login-html.js'].forEach((file) => {
    const content = fs.readFileSync(path.join(ROOT, 'netlify/functions/lib', file), 'utf8');
    assert.ok(!content.includes('SUPABASE_SERVICE_ROLE_KEY'));
    assert.ok(!content.includes('OS_SESSION_SECRET'));
    assert.ok(!content.includes('OS_ALLOWED_OWNER_EMAIL'));
  });
});
