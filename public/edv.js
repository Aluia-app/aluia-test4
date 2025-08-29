// /edv.js
(() => {
  window.EDV = {
    async chat(messages) {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages })
      });
      if (!res.ok) throw new Error('Chat API error ' + res.status);
      return await res.json(); // -> { content }
    },
    async tts({ text, voiceId }) {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, voiceId })
      });
      if (!res.ok) throw new Error('TTS API error ' + res.status);
      return await res.blob(); // audio/mpeg
    }
  };
})();
