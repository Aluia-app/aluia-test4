// api/tts.js
export const config = { api: { bodyParser: { sizeLimit: '2mb' } } }; // accetta testi fino a ~2 MB

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Solo POST');

  const { text, voiceId = 'IyWqvgbFwm4IK1x6M489' } = req.body ?? {};
  if (!text) return res.status(400).json({ error: 'manca il testo' });

  try {
    // Chiave ElevenLabs letta dalle variabili d’ambiente di Vercel
    const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.7,
          style: 0.4,
          use_speaker_boost: true
        }
      })
    });

    if (!elRes.ok) throw new Error(`EL status ${elRes.status}`);
    const audio = await elRes.arrayBuffer();

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(Buffer.from(audio));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'tts_error' });
  }
}
