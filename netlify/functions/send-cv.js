exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let name, email, company;
  try {
    const body = JSON.parse(event.body);
    name = body.name;
    email = body.email;
    company = body.company;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  if (!name || !email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Name and email required' }) };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
  }

  const cvUrl = 'https://giuseppefunaro.com/cv.pdf';

  // Email to visitor with CV link
  const visitorEmail = {
    from: 'Giuseppe Funaro <hello@giuseppefunaro.com>',
    to: [email],
    subject: 'Giuseppe Funaro — CV enclosed',
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a2e;padding:32px 24px">
        <p style="font-size:17px;line-height:1.6;margin-bottom:20px">Dear ${name},</p>
        <p style="font-size:17px;line-height:1.6;margin-bottom:20px">
          Thank you for your interest. You can download my CV using the link below.
        </p>
        <p style="text-align:center;margin:36px 0">
          <a href="${cvUrl}"
             style="background:#0d1b2a;color:#e3c178;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;display:inline-block">
            Download CV →
          </a>
        </p>
        <p style="font-size:17px;line-height:1.6;margin-bottom:20px">
          If you'd like to explore how I might be able to help — whether as an advisor, interim executive,
          or on a specific project — I'm happy to find 30 minutes to talk.
        </p>
        <p style="text-align:center;margin:28px 0">
          <a href="https://calendly.com/hello-giuseppefunaro/30min"
             style="border:1px solid #c79a4b;color:#c79a4b;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;display:inline-block">
            Book a call
          </a>
        </p>
        <p style="font-size:17px;line-height:1.6;margin-top:32px">
          Best regards,<br>
          <strong>Giuseppe Funaro</strong><br>
          <span style="color:#666;font-size:14px">hello@giuseppefunaro.com</span>
        </p>
      </div>
    `
  };

  // Notification to Giuseppe with lead details
  const notificationEmail = {
    from: 'CV Gate <hello@giuseppefunaro.com>',
    to: ['hello@giuseppefunaro.com'],
    subject: `New CV request — ${name}${company ? ` (${company})` : ''}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#333;padding:24px">
        <h2 style="margin-bottom:20px">New CV download request</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#666;width:90px">Name</td><td style="padding:8px 0"><strong>${name}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#666">Company</td><td style="padding:8px 0">${company || '—'}</td></tr>
        </table>
        <p style="margin-top:20px;color:#666;font-size:13px">CV link sent automatically.</p>
      </div>
    `
  };

  try {
    // Send both emails in parallel
    await Promise.all([visitorEmail, notificationEmail].map(payload =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }).then(r => r.json())
    ));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send email' })
    };
  }
};
