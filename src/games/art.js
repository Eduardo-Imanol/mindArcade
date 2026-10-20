const GAME_ART = import.meta.glob('../assets/games/*.svg', {
  query: '?url',
  import: 'default',
  eager: true,
});

export function gameArtUrl(id = '') {
  return GAME_ART[`../assets/games/${id}.svg`] || null;
}
