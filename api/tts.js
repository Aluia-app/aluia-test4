// /api/tts.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const XI_API_KEY = process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY;
  if (!XI_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing ELEVENLABS_API_KEY' }), {
      status: 500, headers: { 'content-type': 'application/json' }
    });
  }

  const { text = '', voiceId = 'IyWqvgbFwm4IK1x6M489' } = await req.json();

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=0`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'accept': 'audio/mpeg',
      'content-type': 'application/json',
      'xi-api-key': XI_API_KEY
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.6, similarity_boost: 0.7, style: 0.4, use_speaker_boost: true }
    })
  });

  if (!r.ok) {
    const t = await r.text();
    return new Response(JSON.stringify({ error: t }), {
      status: r.status, headers: { 'content-type': 'application/json' }
    });
  }

  const audio = await r.arrayBuffer();
  return new Response(audio, { headers: { 'content-type': 'audio/mpeg' } });
}
