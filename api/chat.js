// api/chat.js — handler minimo per testare la route
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST' }); // 405 su GET = la route ESISTE
  }

  let body = {};
  try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); } catch {}

  const lastUser = Array.isArray(body.messages)
    ? body.messages.filter(m => m.role === 'user').slice(-1)[0]?.content
    : null;

  return res.status(200).json({
    content: lastUser ? `Echo: ${lastUser}` : 'Ciao! (mock server ok)'
  });
};
