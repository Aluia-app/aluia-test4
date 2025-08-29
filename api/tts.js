module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST' });
  }
  res.setHeader('Content-Type', 'audio/mpeg');
  return res.status(200).send(Buffer.alloc(0));
};
