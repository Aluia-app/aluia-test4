// /api/tts.js  — handler minimo per verificare la route
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Use POST'); // 405 su GET = la route ESISTE ✅
  }

  // Risposta mock (test). In produzione sostituiremo con ElevenLabs.
  res.setHeader('content-type', 'text/plain; charset=utf-8');
  return res.status(200).send('mock tts ok');
};
