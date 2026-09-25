'use strict';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderShellHtml({ email }) {
  const safeEmail = escapeHtml(email || '');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Giuseppe OS</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #f6f5f3;
    color: #1c1b1a;
    -webkit-font-smoothing: antialiased;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #e4e1dc;
    background: #fff;
    position: sticky;
    top: 0;
  }
  header .brand { font-weight: 600; font-size: 15px; letter-spacing: 0.01em; }
  header .who { display: flex; align-items: center; gap: 12px; font-size: 13px; color: #6b6862; }
  header .who span { max-width: 40vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  header button {
    border: 1px solid #d8d4cd;
    background: #fff;
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 13px;
    cursor: pointer;
  }
  main { max-width: 640px; margin: 0 auto; padding: 20px 16px 64px; }
  .command {
    display: flex;
    gap: 8px;
    background: #fff;
    border: 1px solid #e4e1dc;
    border-radius: 12px;
    padding: 10px;
    margin-bottom: 8px;
  }
  .command input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    font-size: 15px;
    background: transparent;
  }
  .command button {
    border: none;
    background: #1c1b1a;
    color: #fff;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 13px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .command-note {
    font-size: 12px;
    color: #8a8680;
    margin: 0 0 28px;
    display: none;
  }
  section { margin-bottom: 32px; }
  section h2 {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #8a8680;
    margin: 0 0 12px;
    font-weight: 600;
  }
  .cards { display: flex; flex-direction: column; gap: 10px; }
  .card {
    background: #fff;
    border: 1px solid #e4e1dc;
    border-radius: 12px;
    padding: 14px;
  }
  .card .title { font-size: 14px; font-weight: 600; }
  .empty {
    border: 1px dashed #d8d4cd;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    font-size: 13px;
    color: #8a8680;
  }
</style>
</head>
<body>
<header>
  <div class="brand">Giuseppe OS</div>
  <div class="who">
    <span>${safeEmail}</span>
    <button id="signOut" type="button">Sign out</button>
  </div>
</header>
<main>
  <form class="command" id="command-form">
    <input type="text" id="command-input" placeholder="Ask your Chief of Staff... (coming soon)" autocomplete="off">
    <button type="submit">Send</button>
  </form>
  <p class="command-note" id="command-note">Your Chief of Staff isn't taking instructions yet. This is a preview of what's coming.</p>

  <section id="today-section">
    <h2>Today</h2>
    <div class="cards" id="today-cards"></div>
    <div class="empty" id="today-empty">Nothing needs your attention today.</div>
  </section>

  <section id="waiting-section">
    <h2>Waiting</h2>
    <div class="cards" id="waiting-cards"></div>
    <div class="empty" id="waiting-empty">Nothing is waiting on someone else right now.</div>
  </section>

  <section id="handled-section">
    <h2>Handled by your team</h2>
    <div class="cards" id="handled-cards"></div>
    <div class="empty" id="handled-empty">Your team hasn't handled anything yet.</div>
  </section>
</main>
<script>
(function () {
  var form = document.getElementById('command-form');
  var note = document.getElementById('command-note');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    note.style.display = 'block';
  });

  document.getElementById('signOut').addEventListener('click', function () {
    fetch('/api/os/logout', { method: 'POST', credentials: 'include' })
      .then(function () { window.location.href = '/os/login'; })
      .catch(function () { window.location.href = '/os/login'; });
  });

  function renderList(items, cardsId, emptyId, max) {
    var cardsEl = document.getElementById(cardsId);
    var emptyEl = document.getElementById(emptyId);
    var list = Array.isArray(items) ? items : [];
    if (typeof max === 'number') list = list.slice(0, max);
    if (list.length === 0) {
      cardsEl.style.display = 'none';
      emptyEl.style.display = 'block';
      return;
    }
    cardsEl.style.display = 'flex';
    emptyEl.style.display = 'none';
    cardsEl.innerHTML = '';
    list.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'card';
      var title = document.createElement('div');
      title.className = 'title';
      title.textContent = (item && item.title) ? String(item.title) : 'Untitled';
      card.appendChild(title);
      cardsEl.appendChild(card);
    });
  }

  fetch('/api/os/today', { credentials: 'include' })
    .then(function (res) {
      if (res.status === 401) {
        window.location.href = '/os/login';
        return null;
      }
      return res.json();
    })
    .then(function (data) {
      if (!data) return;
      renderList(data.today, 'today-cards', 'today-empty', 5);
      renderList(data.waiting, 'waiting-cards', 'waiting-empty');
      renderList(data.teamHandled, 'handled-cards', 'handled-empty');
    })
    .catch(function () {});
})();
</script>
</body>
</html>`;
}

module.exports = { renderShellHtml };
