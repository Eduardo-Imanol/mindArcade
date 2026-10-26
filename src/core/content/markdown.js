// src/core/content/markdown.js — Parser Markdown por bloques (spec-19 T2).
// Produce bloques serializables para React y para spec-21. Nunca HTML crudo.

import { inlineToText, parseInline } from './markdownInline.js';

export { inlineToText, parseInline, safeHref } from './markdownInline.js';

const HEADING = /^(#{1,6})\s+(.*)$/;
const FENCE = /^(`{3,}|~{3,})\s*([^\s`]*)?.*$/;
const HR = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;
const QUOTE = /^ {0,3}>\s?(.*)$/;
const UL = /^\s*[-*+]\s+(.*)$/;
const OL = /^\s*\d+[.)]\s+(.*)$/;

function isBlockStart(line) {
  return HEADING.test(line) || FENCE.test(line) || HR.test(line) || QUOTE.test(line);
}

function parseFence(lines, start) {
  const open = FENCE.exec(lines[start]);
  const marker = open[1];
  const language = (open[2] || '').replace(/[^a-z0-9-]/gi, '').toLowerCase();
  const body = [];
  let index = start + 1;
  while (index < lines.length) {
    if (lines[index].trim().startsWith(marker)) {
      index += 1;
      break;
    }
    body.push(lines[index]);
    index += 1;
  }
  return { block: { type: 'code', language, code: body.join('\n') }, next: index };
}

function parseQuote(lines, start) {
  const body = [];
  let index = start;
  while (index < lines.length && QUOTE.test(lines[index])) {
    body.push(QUOTE.exec(lines[index])[1]);
    index += 1;
  }
  const text = body.join(' ').trim();
  return { block: { type: 'blockquote', inline: parseInline(text), text: inlineToText(parseInline(text)) }, next: index };
}

function parseList(lines, start, ordered) {
  const pattern = ordered ? OL : UL;
  const items = [];
  let index = start;
  while (index < lines.length) {
    const match = pattern.exec(lines[index]);
    if (match) {
      const inline = parseInline(match[1].trim());
      items.push({ inline, text: inlineToText(inline) });
      index += 1;
      continue;
    }
    const continuation = lines[index];
    if (!ordered && UL.test(continuation)) break;
    if (ordered && OL.test(continuation)) break;
    if (!continuation.trim() || isBlockStart(continuation) || !/^\s+/.test(continuation)) break;
    if (items.length) {
      const last = items[items.length - 1];
      last.inline = parseInline(`${last.text} ${continuation.trim()}`);
      last.text = inlineToText(last.inline);
    }
    index += 1;
  }
  return { block: { type: 'list', ordered, items }, next: index };
}

function parseParagraph(lines, start) {
  const body = [];
  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim() || isBlockStart(line) || UL.test(line) || OL.test(line)) break;
    body.push(line.trim());
    index += 1;
  }
  const text = body.join(' ').trim();
  const inline = parseInline(text);
  return { block: { type: 'paragraph', inline, text: inlineToText(inline) }, next: index };
}

export function parseSourceMarkdown(md) {
  const source = typeof md === 'string' ? md.replace(/\r\n?/g, '\n') : '';
  if (!source.trim()) return [];
  const lines = source.split('\n');
  const blocks = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }
    if (FENCE.test(line)) {
      const parsed = parseFence(lines, index);
      blocks.push(parsed.block);
      index = parsed.next;
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      const text = heading[2].trim();
      const inline = parseInline(text);
      blocks.push({ type: 'heading', level: heading[1].length, inline, text: inlineToText(inline) });
      index += 1;
      continue;
    }
    if (HR.test(line)) { blocks.push({ type: 'hr' }); index += 1; continue; }
    if (QUOTE.test(line)) {
      const parsed = parseQuote(lines, index);
      blocks.push(parsed.block);
      index = parsed.next;
      continue;
    }
    if (UL.test(line) || OL.test(line)) {
      const parsed = parseList(lines, index, OL.test(line));
      blocks.push(parsed.block);
      index = parsed.next;
      continue;
    }
    const parsed = parseParagraph(lines, index);
    if (parsed.block.text) blocks.push(parsed.block);
    index = parsed.next > index ? parsed.next : index + 1;
  }
  return blocks;
}

export function blocksToSpeech(blocks) {
  if (!Array.isArray(blocks)) return [];
  const parts = [];
  for (const block of blocks) {
    if (!block) continue;
    if (block.type === 'heading' || block.type === 'paragraph' || block.type === 'blockquote') {
      if (block.text) parts.push(block.text);
    } else if (block.type === 'list') {
      for (const item of block.items || []) if (item.text) parts.push(item.text);
    }
  }
  return parts.map((part) => String(part).trim()).filter(Boolean);
}
