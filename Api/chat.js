// api/chat.js
import { Configuration, OpenAIApi } from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Solo POST');

  const { messages } = req.body ?? {};
  if (!messages?.length) return res.status(400).json({ error: 'servono i messaggi' });

  try {
    // Usa la chiave nascosta che hai messo in Variant (Environment Variables di Vercel)
    const openai = new OpenAIApi(
      new Configuration({ apiKey: process.env.OPENAI_API_KEY })
    );

    const completion = await openai.createChatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Sei Alu, assistente empatico. Rispondi in italiano (≤150 parole).' },
        ...messages.slice(-10)         // prende gli ultimi 10 messaggi
      ],
      max_tokens: 400,
      temperature: 0.7
    });

    return res.status(200).json({ content: completion.data.choices[0].message.content });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'chat_error' });
  }
}
