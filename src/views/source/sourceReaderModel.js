import { blocksToSpeech } from '../../core/content/markdown.js';

export function documentStats(blocks) {
  const words = blocksToSpeech(blocks).join(' ').split(/\s+/).filter(Boolean).length;
  return { words, minutes: Math.max(1, Math.round(words / 200)) };
}
