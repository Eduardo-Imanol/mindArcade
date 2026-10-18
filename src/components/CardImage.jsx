import React, { useEffect, useMemo, useRef, useState } from 'react';
import { resolveCardImage } from '../core/content/image.js';
import { getObjectURL, revokeObjectURL } from '../core/storage/images.js';

const ASSET_URLS = import.meta.glob('../content/assets/**/*.svg', {
  query: '?url',
  import: 'default',
  eager: true,
});

export function assetUrl(value = '') {
  return ASSET_URLS[`../content/assets/${value}`] || null;
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function initials(label = '') {
  const words = String(label)
    .replace(/[^\p{L}\p{N} ]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return words.map((word) => word[0].toUpperCase()).join('') || '?';
}

function drawTile(ctx, { size, dpr, seed, label }) {
  const rand = mulberry32(hashSeed(seed));
  const s = Math.round(size * dpr);
  ctx.fillStyle = '#1a0b2e';
  ctx.fillRect(0, 0, s, s);
  const hues = [168, 320, 120, 45, 265];
  const hue = hues[Math.floor(rand() * hues.length)];
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.arc(rand() * s, rand() * s, (0.12 + rand() * 0.3) * s, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, 90%, ${55 + Math.round(rand() * 15)}%, ${(0.12 + rand() * 0.2).toFixed(2)})`;
    ctx.fill();
  }
  ctx.strokeStyle = `hsl(${hue}, 90%, 60%)`;
  ctx.lineWidth = Math.max(1, s * 0.012);
  ctx.beginPath();
  ctx.moveTo(s * 0.1, s * (0.3 + rand() * 0.4));
  ctx.lineTo(s * 0.9, s * (0.3 + rand() * 0.4));
  ctx.stroke();
  ctx.fillStyle = '#f1f1f1';
  ctx.font = `700 ${Math.round(s * 0.3)}px ui-monospace, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials(label), s / 2, s / 2);
}

function FallbackTile({ seed = 'carta', label = '', size = 96, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || typeof canvas.getContext !== 'function') return;
    let ctx = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      ctx = null;
    }
    if (!ctx) return;
    const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    drawTile(ctx, { size, dpr, seed: String(seed), label });
  }, [seed, size, label]);
  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={label || 'Ilustración generada'}
      className={className}
      style={{ width: size, height: size, display: 'block', borderRadius: 12 }}
    />
  );
}

export default function CardImage({ card = {}, image, overrides, size = 96, alt, className = '' }) {
  const resolved = useMemo(
    () => (image ? image : resolveCardImage(card, overrides)),
    [card, image, overrides]
  );
  const [broken, setBroken] = useState(false);
  const [uploadSrc, setUploadSrc] = useState(null);
  const label = alt ?? card?.front ?? 'Imagen de la carta';

  useEffect(() => {
    setBroken(false);
  }, [resolved]);

  useEffect(() => {
    let active = true;
    let url = null;
    if (resolved?.kind === 'upload' && resolved.value) {
      getObjectURL(resolved.value).then((result) => {
        if (!active) {
          if (result) revokeObjectURL(result);
          return;
        }
        if (result) {
          url = result;
          setUploadSrc(result);
        }
      });
    } else {
      setUploadSrc(null);
    }
    return () => {
      active = false;
      if (url) revokeObjectURL(url);
    };
  }, [resolved]);

  if (resolved?.kind === 'emoji') {
    return (
      <span
        role="img"
        aria-label={label}
        className={className}
        style={{ fontSize: Math.round(size * 0.6), lineHeight: 1, display: 'inline-block', width: size, textAlign: 'center' }}
      >
        {resolved.value}
      </span>
    );
  }

  let src = null;
  if (resolved?.kind === 'url') src = resolved.value;
  else if (resolved?.kind === 'asset') src = assetUrl(resolved.value);
  else if (resolved?.kind === 'upload') src = uploadSrc;

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={label}
        width={size}
        height={size}
        onError={() => setBroken(true)}
        className={className}
        style={{ objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(0,255,204,.35)', display: 'block' }}
      />
    );
  }

  return <FallbackTile seed={resolved?.value || card?.id} label={label} size={size} className={className} />;
}
