import React from 'react';

export function categoryImageSrc(category) {
  const path = category.image || `categories/${category.id}.png`;
  return `${import.meta.env.BASE_URL || '/'}${path}`;
}

export default function CategoryArt({ category }) {
  return (
    <img
      className="library-card__media"
      src={categoryImageSrc(category)}
      alt=""
      width="720"
      height="405"
      loading="lazy"
      decoding="async"
    />
  );
}
