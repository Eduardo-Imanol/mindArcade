// src/core/parser/parser.js — Markdown/JSON → { questions, errors }; topics via parseTopic
import { slugify, uniqueId } from '../content/slug.js';

export function parseMarkdown(md = '') {
  try {
    if (typeof md !== 'string') return { questions: [], errors: ['Input must be a string'] };
    const lines = md.split('\n');
    let topic = 'general';
    const questions = [];
    const errors = [];
    let n = 0;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      const h = line.match(/^#{1,6}\s+(.+)/);
      if (h) {
        topic = h[1].trim().slice(0, 80) || topic;
        continue;
      }
      if (!line.startsWith('-')) continue;
      const m = line.match(/^-\s*Q:\s*(.+?)\s*\|\s*A:\s*(.+?)(?:\s*\|\s*E:\s*(easy|hard))?\s*$/i);
      if (!m) {
        errors.push(`Skipped: ${line.slice(0, 80)}`);
        continue;
      }
      n += 1;
      questions.push({
        id: `q${n}`,
        prompt: m[1].trim(),
        answer: m[2].trim(),
        difficulty: (m[3] || 'easy').toLowerCase(),
        topic,
      });
    }
    if (questions.length === 0 && errors.length === 0) return { questions: [], errors: [] };
    return { questions, errors };
  } catch (e) {
    return { questions: [], errors: [String(e?.message || e)] };
  }
}

function classifyImage(value) {
  if (/^https?:\/\//i.test(value)) return { kind: 'url', value };
  if (/^asset:/i.test(value)) return { kind: 'asset', value: value.slice(6).trim() };
  return { kind: 'emoji', value };
}

export function parseTopic(md = '') {
  const empty = { topic: { id: '', title: '', description: '' }, cards: [], errors: [] };
  try {
    if (typeof md !== 'string') return { ...empty, errors: ['Input must be a string'] };
    const lines = md.split('\n');
    let title = '';
    let inCode = false;
    let seenCard = false;
    const descriptionLines = [];
    const cardLines = [];
    for (const raw of lines) {
      const line = raw.trim();
      if (line.startsWith('```')) {
        inCode = !inCode;
        continue;
      }
      if (inCode) continue;
      if (!line) {
        if (!seenCard && descriptionLines.length) descriptionLines.push('');
        continue;
      }
      const h = line.match(/^#{1,6}\s+(.+)/);
      if (h) {
        if (!title) title = h[1].trim().slice(0, 80);
        continue;
      }
      if (/^[-*_=]{3,}$/.test(line)) continue;
      if (line.startsWith('-')) {
        seenCard = true;
        cardLines.push(line);
        continue;
      }
      if (seenCard) continue;
      if (/^[>|]/.test(line)) continue;
      descriptionLines.push(raw.trimStart());
    }
    const description = descriptionLines.join('\n').trim();
    const topic = { id: slugify(title), title, description };
    const cards = [];
    const errors = [];
    const taken = new Set();
    for (const line of cardLines) {
      let work = line;
      let image = null;
      const img = work.match(/\|\s*I:\s*(.*)$/i);
      if (img) {
        work = work.slice(0, img.index).trimEnd();
        const value = img[1].trim();
        if (value) image = classifyImage(value);
      }
      const parsed = parseMarkdown(work);
      const q = parsed.questions[0];
      if (!q || parsed.questions.length !== 1) {
        errors.push(`Skipped: ${line.slice(0, 80)}`);
        continue;
      }
      const id = uniqueId(slugify(q.prompt), taken);
      taken.add(id);
      const card = { id, front: q.prompt, back: q.answer, difficulty: q.difficulty };
      if (image) card.image = image;
      cards.push(card);
    }
    return { topic, cards, errors };
  } catch (e) {
    return { ...empty, errors: [String(e?.message || e)] };
  }
}
