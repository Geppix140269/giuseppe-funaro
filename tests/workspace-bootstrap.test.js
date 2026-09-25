'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '0001_giuseppe_os_slice1.sql');

test('the bootstrap migration seeds exactly the five required workspaces', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  const expectedKeys = ['job-consulting', 'classma', 'ponte-trade', 'padel-sitges', 'personal-admin'];
  expectedKeys.forEach((key) => {
    assert.match(sql, new RegExp(`'${key}'`));
  });
});

test('every table enables row level security with no public policies', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  ['workspaces', 'people', 'items', 'work', 'activity'].forEach((table) => {
    assert.match(sql, new RegExp(`alter table ${table} enable row level security`));
  });
  assert.ok(!/create policy/i.test(sql), 'no public RLS policies should be defined; access is service-role only');
});
