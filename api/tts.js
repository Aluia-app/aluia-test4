// /api/tts.js - Versione con OpenAI TTS e voce Nova
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

  const { text, voiceId } = body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text parameter required' });
  }

  // Limitare la lunghezza del testo per controllo costi
  if (text.length > 4000) {
    return res.status(400).json({ error: 'Text too long (max 4000 characters)' });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY non configurata, usando fallback');
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    return res.status(200).send('TTS non disponibile: API key non configurata');
  }

  // Voce Sage come default, o quella specificata dall'utente
  const selectedVoice = voiceId || 'nova';
  
  // Pulizia testo per TTS (rimuovi emoji e caratteri speciali)
  const cleanText = text
    .replace(/[🔥💙✅❌⚠️🆘🎤💬🔒👋❤️🌍🚨🛡️🏥💚🤝📞]/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1') // Rimuovi markdown bold
    .replace(/\*(.*?)\*/g, '$1')     // Rimuovi markdown italic
    .trim() || 'Messaggio vuoto';

  try {
    // Chiamata a OpenAI TTS API
    const openaiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1', // Modello standard (più economico di tts-1-hd)
        input: cleanText,
        voice: selectedVoice, // sage, alloy, echo, fable, nova, onyx, shimmer
        response_format: 'mp3',
        speed: 1.0 // Velocità normale
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text().catch(() => '');
      console.error(`OpenAI TTS error ${openaiResponse.status}:`, errorText);
      
      // Gestione errori specifici
      if (openaiResponse.status === 401) {
        return res.status(500).json({ error: 'API key OpenAI non valida' });
      } else if (openaiResponse.status === 429) {
        return res.status(500).json({ error: 'Limite rate OpenAI raggiunto' });
      } else if (openaiResponse.status === 400) {
        return res.status(400).json({ error: 'Testo non valido per TTS' });
      } else {
        return res.status(500).json({ error: 'Errore del servizio TTS OpenAI' });
      }
    }

    // Ritorna l'audio blob
    const audioBuffer = await openaiResponse.arrayBuffer();
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength.toString());
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache per 1 ora
    
    return res.status(200).send(Buffer.from(audioBuffer));

  } catch (error) {
    console.error('OpenAI TTS error:', error);
    
    // Fallback in caso di errore di rete
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    return res.status(500).send('Errore interno del servizio TTS');
  }
};

