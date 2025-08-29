// /api/chat.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing OPENAI_API_KEY' }), {
      status: 500, headers: { 'content-type': 'application/json' }
    });
  }

  const { messages = [] } = await req.json();

  const sys = "Sei Alu, un assistente di supporto psicologico empatico e professionale. Rispondi sempre in italiano, tono caldo, massimo ~150 parole. In caso di emergenze invita a contattare professionisti/servizi di emergenza.";

  const payload = {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 400,
    messages: [{ role: 'system', content: sys }, ...messages]
  };

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!r.ok) {
    const t = await r.text();
    return new Response(JSON.stringify({ error: t }), {
      status: r.status, headers: { 'content-type': 'application/json' }
    });
  }

  const data = await r.json();
  const content = data.choices?.[0]?.message?.content || '';
  return new Response(JSON.stringify({ content }), {
    headers: { 'content-type': 'application/json' }
  });
}
