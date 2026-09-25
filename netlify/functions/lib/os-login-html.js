'use strict';

function renderLoginHtml({ googleClientId, configured }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Giuseppe OS - Sign in</title>
<script src="https://accounts.google.com/gsi/client" async defer></script>
<style>
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #f6f5f3;
    color: #1c1b1a;
  }
  .card {
    background: #fff;
    border: 1px solid #e4e1dc;
    border-radius: 16px;
    padding: 32px 28px;
    max-width: 320px;
    width: 100%;
    text-align: center;
  }
  h1 { font-size: 17px; margin: 0 0 6px; }
  p { font-size: 13px; color: #6b6862; margin: 0 0 20px; }
  #error { color: #b3261e; font-size: 13px; margin-top: 14px; min-height: 16px; }
  #gsi-button { display: flex; justify-content: center; }
</style>
</head>
<body>
<div class="card">
  <h1>Giuseppe OS</h1>
  <p>Owner sign-in only.</p>
  <div id="gsi-button"></div>
  <div id="error"></div>
</div>
<script>
${configured ? `
window.onload = function () {
  google.accounts.id.initialize({
    client_id: ${JSON.stringify(googleClientId || '')},
    callback: onCredential
  });
  google.accounts.id.renderButton(document.getElementById('gsi-button'), { theme: 'outline', size: 'large' });
};

function onCredential(response) {
  fetch('/api/os/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: response.credential })
  }).then(function (res) {
    if (res.ok) {
      window.location.href = '/os';
    } else {
      document.getElementById('error').textContent = 'This Google account is not authorized for Giuseppe OS.';
    }
  }).catch(function () {
    document.getElementById('error').textContent = 'Sign-in failed. Please try again.';
  });
}
` : `
document.getElementById('error').textContent = 'Giuseppe OS sign-in is not configured yet.';
`}
</script>
</body>
</html>`;
}

module.exports = { renderLoginHtml };
