'use strict';

const { getSession } = require('./lib/auth');
const { supabaseSelect, isSupabaseConfigured } = require('./lib/supabase');

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow'
    },
    body: JSON.stringify(body)
  };
}

function emptyToday() {
  return { workspaces: [], today: [], waiting: [], teamHandled: [] };
}

// Backs the Today surface. Requires a valid owner session regardless of
// whether Supabase is configured yet, so the empty-state contract (and the
// 401 for anyone else) holds even before the database exists.
exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  const session = getSession(event);
  if (!session) {
    return jsonResponse(401, { error: 'Unauthorized' });
  }

  if (!isSupabaseConfigured()) {
    return jsonResponse(200, emptyToday());
  }

  try {
    const [workspaces, work] = await Promise.all([
      supabaseSelect('workspaces', 'id,key,name,description', { order: 'name.asc' }),
      supabaseSelect('work', 'id,workspace_id,title,stage,authority_level,created_at', { order: 'created_at.asc' })
    ]);

    return jsonResponse(200, {
      workspaces,
      today: work.filter((item) => item.stage === 'today').slice(0, 5),
      waiting: work.filter((item) => item.stage === 'waiting'),
      teamHandled: work.filter((item) => item.stage === 'done')
    });
  } catch {
    return jsonResponse(502, { error: 'Upstream error' });
  }
};
