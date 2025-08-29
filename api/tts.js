// /api/tts.js - Implementazione completa con ElevenLabs
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

  // Limitare la lunghezza del testo per evitare costi eccessivi
  if (text.length > 5000) {
    return res.status(400).json({ error: 'Text too long (max 5000 characters)' });
  }

  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  
  if (!ELEVENLABS_API_KEY) {
    console.warn('ELEVENLABS_API_KEY non configurata, usando fallback');
    // Fallback: ritorna un audio silenzioso o un messaggio di errore
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    return res.status(200).send('TTS non disponibile: API key non configurata');
  }

  // Voice ID di default per italiano (Rachel o altro)
  const defaultVoiceId = 'EXAVITQu4vr4xnSDxMaL'; // Bella (italiano)
  const selectedVoiceId = voiceId || process.env.ELEVENLABS_VOICE_ID || defaultVoiceId;

  try {
    // Chiamata a ElevenLabs API
    const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2', // Supporta italiano
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text().catch(() => '');
      console.error(`ElevenLabs API error ${elevenLabsResponse.status}:`, errorText);
      
      // Gestione errori specifici
      if (elevenLabsResponse.status === 401) {
        return res.status(500).json({ error: 'API key ElevenLabs non valida' });
      } else if (elevenLabsResponse.status === 429) {
        return res.status(500).json({ error: 'Limite rate ElevenLabs raggiunto' });
      } else if (elevenLabsResponse.status === 422) {
        return res.status(400).json({ error: 'Testo non valido per TTS' });
      } else {
        return res.status(500).json({ error: 'Errore del servizio TTS' });
      }
    }

    // Ritorna l'audio blob
    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength.toString());
    
    return res.status(200).send(Buffer.from(audioBuffer));

  } catch (error) {
    console.error('TTS API error:', error);
    
    // Fallback in caso di errore di rete
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    return res.status(500).send('Errore interno del servizio TTS');
  }
};

