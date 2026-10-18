// src/core/content/slug.js — id slugs + collision-safe dedupe (pure, no deps)
export function slugify(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

export function uniqueId(base, taken = []) {
  const seen = taken instanceof Set ? taken : new Set(taken);
  const root = base || 'tema';
  if (!seen.has(root)) return root;
  let n = 2;
  while (seen.has(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}
