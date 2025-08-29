// /api/chat.js  (Node runtime su Vercel)
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST' });
  }

  // parse body robusto
  let body = {};
  try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); } catch {}

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const assistantId = body.assistantId; // opzionale, per futura estensione

  const sys = "Sei Alu, un assistente di supporto psicologico empatico e professionale. Rispondi sempre in italiano, tono caldo, massimo ~150 parole. In caso di emergenze invita a contattare professionisti/servizi di emergenza.";

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    // fallback educato per sviluppo senza chiave
    const lastUser = messages.filter(m => m.role === 'user').slice(-1)[0]?.content;
    return res.status(200).json({ content: lastUser ? `Echo (no-API): ${lastUser}` : 'Ciao! (mock senza chiave)' });
  }

  const payload = {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 400,
    messages: [{ role: 'system', content: sys }, ...messages]
  };

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const t = await r.text().catch(()=> '');
      return res.status(r.status).json({ error: t || 'OpenAI error' });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content || '…';
    return res.status(200).json({ content });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
