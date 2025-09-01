// /api/chat.js - Versione con Assistant + OpenAI TTS
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST' });
  }

  // Parse body
  let body = {};
  try { 
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); 
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY non configurata');
    return res.status(200).json({ 
      content: `Echo (no-API): ${lastUserMessage}`,
      warning: 'API key non configurata'
    });
  }

  // Il tuo Assistant ID con tutti i PDF di psicologia
  const assistantId = 'asst_rtkyJKEY2O3WmHh7GjkIhcvT';

  try {
    // 1. Crea un nuovo thread per la conversazione
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({})
    });

    if (!threadResponse.ok) {
      throw new Error(`Thread creation failed: ${threadResponse.status}`);
    }

    const thread = await threadResponse.json();
    const threadId = thread.id;

    // 2. Aggiungi il messaggio dell'utente al thread
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: lastUserMessage
      })
    });

    // 3. Esegui l'Assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistantId
      })
    });

    if (!runResponse.ok) {
      throw new Error(`Run creation failed: ${runResponse.status}`);
    }

    const run = await runResponse.json();
    const runId = run.id;

    // 4. Aspetta che l'Assistant completi la risposta
    let runStatus = 'in_progress';
    let attempts = 0;
    const maxAttempts = 30; // 30 secondi max

    while (runStatus === 'in_progress' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Aspetta 1 secondo
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      const statusData = await statusResponse.json();
      runStatus = statusData.status;
      attempts++;
    }

    if (runStatus !== 'completed') {
      throw new Error(`Assistant run failed with status: ${runStatus}`);
    }

    // 5. Recupera la risposta dell'Assistant
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    const messagesData = await messagesResponse.json();
    const assistantMessage = messagesData.data.find(msg => msg.role === 'assistant');
    const content = assistantMessage?.content?.[0]?.text?.value || 'Mi dispiace, non sono riuscito a elaborare la tua richiesta.';

    return res.status(200).json({ 
      content,
      source: 'Terapeuta AI',
      assistant_id: assistantId
    });

  } catch (error) {
    console.error('Assistant API error:', error);
    
    // Fallback con risposta di supporto psicologico
    const fallbackResponses = [
      "Ti ascolto e capisco quello che stai vivendo. È normale sentirsi così a volte.",
      "Grazie per aver condiviso questo con me. Come ti senti ora dopo averlo espresso?",
      "Quello che provi è valido e importante. Vuoi parlarmi di più di questa situazione?",
      "Ti sono vicino in questo momento. Ricorda che non sei solo in questo percorso.",
      "È un passo importante quello di parlarne. Come posso aiutarti a sentirti meglio?"
    ];
    
    const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    return res.status(200).json({ 
      content: fallback,
      source: 'Terapeuta AI (modalità di emergenza)',
      error: 'Assistant temporaneamente non disponibile'
    });
  }
};
