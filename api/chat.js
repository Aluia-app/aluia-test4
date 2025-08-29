// /api/chat.js - Versione corretta con CORS e gestione errori migliorata
module.exports = async (req, res) => {
  // CORS headers per permettere richieste cross-origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  
  // Gestione preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST' });
  }

  // Parse body robusto
  let body = {};
  try { 
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); 
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const assistantId = body.assistantId; // opzionale, per futura estensione

  // Sistema prompt migliorato per Alu
  const sys = `Sei Alu, un assistente di supporto psicologico empatico e professionale. 
Caratteristiche:
- Rispondi sempre in italiano con tono caldo e comprensivo
- Massimo 150 parole per risposta
- Mostra empatia e validazione delle emozioni
- In caso di emergenze (suicidio, autolesionismo) invita SEMPRE a contattare professionisti qualificati o servizi di emergenza
- Non fornire diagnosi mediche o consigli terapeutici specifici
- Incoraggia la ricerca di aiuto professionale quando appropriato
- Usa un linguaggio accessibile e non tecnico`;

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY non configurata, usando fallback');
    const lastUser = messages.filter(m => m.role === 'user').slice(-1)[0]?.content;
    return res.status(200).json({ 
      content: lastUser ? `Echo (no-API): ${lastUser}` : 'Ciao! (mock senza chiave OpenAI configurata)',
      warning: 'API key non configurata'
    });
  }

  // Limitare la cronologia per evitare token eccessivi
  const recentMessages = messages.slice(-10);

  const payload = {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 400,
    messages: [{ role: 'system', content: sys }, ...recentMessages]
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
      const errorText = await r.text().catch(() => '');
      console.error(`OpenAI API error ${r.status}:`, errorText);
      
      // Gestione errori specifici
      if (r.status === 401) {
        return res.status(500).json({ error: 'API key non valida' });
      } else if (r.status === 429) {
        return res.status(500).json({ error: 'Limite rate raggiunto, riprova tra poco' });
      } else {
        return res.status(500).json({ error: 'Errore del servizio AI' });
      }
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content || 'Mi dispiace, non sono riuscito a elaborare la tua richiesta.';
    
    return res.status(200).json({ 
      content,
      usage: data.usage // Informazioni sull'utilizzo per debugging
    });
  } catch (e) {
    console.error('Chat API error:', e);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
};

