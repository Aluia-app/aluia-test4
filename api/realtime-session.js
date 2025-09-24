// /api/realtime-session.js
// Crea una sessione effimera Realtime (WebRTC) e restituisce il client_secret (ek_...)
module.exports = async (req, res) => {
  // CORS minimi allineati al tuo stile
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST' });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime';
  const voice = process.env.OPENAI_REALTIME_VOICE || 'marin';
  const instructions = process.env.OPENAI_SYSTEM_INSTRUCTIONS || 
`Sei Alu, un assistente vocale empatico di supporto psicologico.
Parla in italiano con tono caldo e professionale.
Evita diagnosi e consigli medici specifici.
In caso di urgenza invita ai servizi di emergenza.
Non salvare le conversazioni in modo permanente.`;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY non configurata' });
  }

  try {
    const r = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1'
      },
      body: JSON.stringify({
        model,
        voice,
        instructions,
        modalities: ['audio', 'text'] // audio out + (opzionale) testo
      })
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      return res.status(500).json({ error: `OpenAI realtime error ${r.status}`, details: txt });
    }

    const session = await r.json();
    // Restituisco SOLO ciò che serve al client
    return res.status(200).json({ client_secret: session.client_secret });
  } catch (e) {
    return res.status(500).json({ error: 'Errore creazione sessione', details: String(e?.message || e) });
  }
};
