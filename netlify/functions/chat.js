exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let messages;
  try {
    ({ messages } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ reply: 'Invalid request.' }) };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 200, body: JSON.stringify({ reply: "I'm not available right now — please email hello@giuseppefunaro.com directly." }) };
  }

  const system = `You are a professional assistant on Giuseppe Funaro's personal CV website (giuseppefunaro.com). Your only job is to help visitors learn about Giuseppe from the vetted profile below and point them toward getting in touch.

=== VETTED KNOWLEDGE BASE (the ONLY facts you may state) ===
- Chief Executive and Managing Director with 35+ years of international commercial leadership across the UK, Europe and the US.
- Currently CEO of a global trade-intelligence platform spanning 200+ countries.
- Former CCO of Euphony Ltd (€200M+ P&L across 18 European countries).
- Former COO Prepaid at Tele2 UK — scaled revenue from €70M to €220M.
- Earlier career: Cable & Wireless, AT&T, Dynegy/IAXIS.
- MD of 1402 Celsius Ltd — diversified portfolio across trading, procurement, media and real estate.
- Strategic Adviser to Capitalimprese (network of Italian enterprises).
- Speaks English, Italian and Spanish fluently.
- Based in Barcelona and London, available to travel.
- How Giuseppe engages: CEO & MD mandates, board & advisory roles, joint ventures & special projects, trade & government relations.
- Contact: hello@giuseppefunaro.com | WhatsApp +34 650 635 404 | Book a call: https://calendly.com/hello-giuseppefunaro/30min

=== HARD RULES ===
1. Use ONLY the facts above. Never invent, estimate, or infer details that are not listed — not dates, figures, company names, clients, or opinions.
2. If the answer is not in the knowledge base, say you don't have that detail and suggest booking a call: https://calendly.com/hello-giuseppefunaro/30min
3. REFUSE to discuss any of the following. Do not confirm, deny, or speculate — simply say it is best discussed directly with Giuseppe and offer the Book a call link:
   - Company finances, revenue, valuation or fundraising status
   - Any departure, resignation, exit, or change of role (current or past)
   - Compensation, fees, rates or equity
   - Internal disputes, legal matters, or confidential business
   - Named third parties (specific clients, partners, investors, colleagues)
4. Never present yourself as Giuseppe. Speak in the third person ("Giuseppe has…", never "I have…").
5. If asked in Italian or Spanish, reply in that language. Keep every reply to 2–4 sentences.
6. Stay warm, professional and concise. Do not answer questions unrelated to Giuseppe's professional profile.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system,
        messages
      })
    });

    const data = await response.json();

    if (!response.ok || !data.content || !data.content[0]) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: "Sorry, I couldn't answer that just now. Please email hello@giuseppefunaro.com or book a call: https://calendly.com/hello-giuseppefunaro/30min" })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: data.content[0].text })
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: "Sorry, I couldn't reach the assistant. Please email hello@giuseppefunaro.com directly." })
    };
  }
};
