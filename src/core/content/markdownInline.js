// src/core/content/markdownInline.js — inline Markdown seguro y reutilizable.

const SAFE_SCHEME = /^https?:\/\//i;
const ABSOLUTE_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

export function safeHref(value) {
  const href = typeof value === 'string' ? value.trim() : '';
  if (!href || /\s/.test(href)) return null;
  for (const char of href) {
    if (char.charCodeAt(0) < 32) return null;
  }
  if (SAFE_SCHEME.test(href)) return href;
  if (href.startsWith('//') || ABSOLUTE_SCHEME.test(href)) return null;
  if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../') || href.startsWith('#')) {
    return href;
  }
  return href.includes(':') ? null : href;
}

function pushText(nodes, value) {
  if (!value) return;
  const last = nodes[nodes.length - 1];
  if (last && last.type === 'text') last.value += value;
  else nodes.push({ type: 'text', value });
}

function matchInline(rest) {
  const code = /^`([^`\n]+)`/.exec(rest);
  if (code) return { length: code[0].length, node: { type: 'code', value: code[1] } };
  const strong = /^\*\*([\s\S]+?)\*\*/.exec(rest) || /^__([\s\S]+?)__/.exec(rest);
  if (strong) {
    return {
      length: strong[0].length,
      node: { type: 'strong', children: parseInline(strong[1]) },
    };
  }
  const em = /^\*([^*\n]+)\*/.exec(rest) || /^_([^_\n]+)_/.exec(rest);
  if (em) return { length: em[0].length, node: { type: 'em', children: parseInline(em[1]) } };
  const link = /^\[([^\]\n]+)\]\(((?:[^()\s]|\([^()\s]*\))+)(?:\s+"[^"]*")?\)/.exec(rest);
  if (link) {
    return {
      length: link[0].length,
      node: {
        type: 'link',
        href: safeHref(link[2]),
        rawHref: link[2],
        children: parseInline(link[1]),
      },
    };
  }
  return null;
}

export function parseInline(input) {
  const text = typeof input === 'string' ? input : '';
  const nodes = [];
  let buffer = '';
  let index = 0;
  while (index < text.length) {
    const match = matchInline(text.slice(index));
    if (match) {
      pushText(nodes, buffer);
      buffer = '';
      nodes.push(match.node);
      index += match.length;
    } else {
      buffer += text[index];
      index += 1;
    }
  }
  pushText(nodes, buffer);
  return nodes;
}

export function inlineToText(nodes) {
  if (!Array.isArray(nodes)) return '';
  return nodes
    .map((node) => {
      if (!node) return '';
      if (node.type === 'text' || node.type === 'code') return node.value || '';
      return inlineToText(node.children);
    })
    .join('');
}
