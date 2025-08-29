// api/tts.js — handler minimo (per ora non genera audio)
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST' });
  }
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.status(200).send('mock tts ok');
};
