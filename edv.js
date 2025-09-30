// public/edv.js
// Fornisce EDV.chat e EDV.tts come wrapper semplici verso /api/chat e /api/tts
(function (global) {
  const EDV = {};

  async function safeFetch(url, options = {}) {
    const res = await fetch(url, options);
    if (!res.ok) {
      let txt = '';
      try { txt = await res.text(); } catch {}
      const err = new Error(`HTTP ${res.status} su ${url}: ${txt}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }

  // EDV.chat: accetta o un array di messaggi o un oggetto { messages, assistantId }
  EDV.chat = async (messagesOrBody) => {
    const body = Array.isArray(messagesOrBody)
      ? { messages: messagesOrBody }
      : (messagesOrBody || {});

    const res = await safeFetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({}));
    const content =
      data?.content ??
      data?.message ??
      data?.reply ??
      (Array.isArray(data?.choices) ? data.choices?.[0]?.message?.content : undefined);

    return { raw: data, content };
  };

  // EDV.tts: genera audio da testo. Ritorna un Blob (audio/mpeg).
  EDV.tts = async ({ text, voiceId }) => {
    const res = await safeFetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId })
    });
    const blob = await res.blob();
    return blob;
  };

  global.EDV = EDV;
  console.log('✅ edv.js caricato: EDV.chat & EDV.tts pronti');
})(window);
