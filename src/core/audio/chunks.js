// src/core/audio/chunks.js — Troceado de texto para TTS (spec-19 AC-6).

const MAX_CHUNK = 200;

export function chunkSpeechText(text, max = MAX_CHUNK) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= max) return [clean];
  const sentences = clean.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) || [clean];
  const chunks = [];
  let current = '';

  const flush = () => {
    if (current.trim()) chunks.push(current.trim());
    current = '';
  };
  const splitLong = (sentence) => {
    let rest = sentence;
    while (rest.length > max) {
      let cut = rest.lastIndexOf(' ', max);
      if (cut < Math.floor(max / 2)) cut = max;
      chunks.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    return rest;
  };

  for (const raw of sentences) {
    let sentence = raw.trim();
    if (!sentence) continue;
    if (sentence.length > max) {
      flush();
      sentence = splitLong(sentence);
      if (sentence) current = sentence;
      continue;
    }
    if (!current) current = sentence;
    else if (`${current} ${sentence}`.length <= max) current = `${current} ${sentence}`;
    else {
      flush();
      current = sentence;
    }
  }
  flush();
  return chunks;
}
