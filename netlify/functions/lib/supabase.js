'use strict';

function getConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

// Talks to Supabase's PostgREST API directly with the service role key.
// This key never leaves the server: it is read only from process.env here
// and never included in any response sent to the browser.
async function supabaseSelect(table, columns, params = {}) {
  const config = getConfig();
  if (!config) throw new Error('Supabase is not configured');

  const url = new URL(`${config.url}/rest/v1/${table}`);
  url.searchParams.set('select', columns);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed with status ${response.status}`);
  }
  return response.json();
}

module.exports = { supabaseSelect, isSupabaseConfigured: () => getConfig() !== null };
