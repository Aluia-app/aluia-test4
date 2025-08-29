// /api/tts.js  (Node runtime su Vercel)
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Use POST');
  }

  // parse body
  let body = {};
  try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); } catch {}
  const text = (body.text || '').toString().slice(0, 2000) || ' ';
  const voiceId = (body.voiceId || 'IyWqvgbFwm4IK1x6M489').toString();

  const XI_KEY = process.env.ELEVENLABS_API_KEY;
  if (!XI_KEY) {
    // Nessuna chiave → il frontend userà la voce nativa (già previsto nel tuo index).
    res.setHeader('content-type','text/plain; charset=utf-8');
    return res.status(200).send('mock tts ok (no ELEVENLABS_API_KEY)');
  }

  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?optimize_streaming_latency=0&output_format=mp3_44100_128`;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': XI_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!r.ok) {
      const t = await r.text().catch(()=> '');
      return res.status(r.status).send(t || 'ElevenLabs error');
    }

    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('content-type','audio/mpeg');
    res.setHeader('cache-control','no-store');
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(500).send(String(e));
  }
};
