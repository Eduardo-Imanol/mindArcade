// scripts/p5-art/raster.mjs — mini canvas raster zero-dep: RGBA + encoder PNG.
// Complementa al engine SVG (`engine.mjs`): aquí se dibujan los assets que el
// navegador exige en PNG (iconos PWA, carátula). API estilo canvas 2D.
import zlib from 'node:zlib';

export function createCanvas(width, height) {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
}

export function parseColor(color) {
  if (Array.isArray(color)) return { r: color[0], g: color[1], b: color[2], a: color[3] ?? 255 };
  const hex = String(color).trim().replace('#', '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  const value = Number.parseInt(full.slice(0, 6), 16);
  const alpha = full.length === 8 ? Number.parseInt(full.slice(6, 8), 16) : 255;
  if (Number.isNaN(value)) return { r: 255, g: 0, b: 255, a: 255 };
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255, a: alpha };
}

function blend(canvas, x, y, color) {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) return;
  const alpha = color.a / 255;
  if (alpha <= 0) return;
  const index = (py * canvas.width + px) * 4;
  const data = canvas.data;
  const dstA = data[index + 3] / 255;
  const outA = alpha + dstA * (1 - alpha);
  if (outA <= 0) {
    data[index] = 0;
    data[index + 1] = 0;
    data[index + 2] = 0;
    data[index + 3] = 0;
    return;
  }
  data[index] = (color.r * alpha + data[index] * dstA * (1 - alpha)) / outA;
  data[index + 1] = (color.g * alpha + data[index + 1] * dstA * (1 - alpha)) / outA;
  data[index + 2] = (color.b * alpha + data[index + 2] * dstA * (1 - alpha)) / outA;
  data[index + 3] = outA * 255;
}

export function fillRect(canvas, x, y, w, h, color) {
  const rgba = parseColor(color);
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  const x1 = x0 + Math.round(w);
  const y1 = y0 + Math.round(h);
  for (let py = y0; py < y1; py += 1) {
    for (let px = x0; px < x1; px += 1) blend(canvas, px, py, rgba);
  }
}

export function strokeRect(canvas, x, y, w, h, color, thickness = 2) {
  const rgba = parseColor(color);
  const t = Math.max(1, Math.round(thickness));
  for (let i = 0; i < t; i += 1) {
    fillRect(canvas, x + i, y + i, w - i * 2, 1, rgba);
    fillRect(canvas, x + i, y + h - 1 - i, w - i * 2, 1, rgba);
    fillRect(canvas, x + i, y + i, 1, h - i * 2, rgba);
    fillRect(canvas, x + w - 1 - i, y + i, 1, h - i * 2, rgba);
  }
}

export function fillRoundRect(canvas, x, y, w, h, radius, color) {
  const rgba = parseColor(color);
  const r = Math.min(Math.max(0, radius), Math.min(w, h) / 2);
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  const x1 = x0 + Math.round(w);
  const y1 = y0 + Math.round(h);
  for (let py = y0; py < y1; py += 1) {
    for (let px = x0; px < x1; px += 1) {
      const dx = Math.max(x0 + r - px - 0.5, px + 0.5 - (x1 - r), 0);
      const dy = Math.max(y0 + r - py - 0.5, py + 0.5 - (y1 - r), 0);
      if (dx * dx + dy * dy <= r * r) blend(canvas, px, py, rgba);
    }
  }
}

export function fillCircle(canvas, cx, cy, r, color) {
  const rgba = parseColor(color);
  const radius = Math.max(0, r);
  const x0 = Math.round(cx - radius);
  const x1 = Math.round(cx + radius);
  const y0 = Math.round(cy - radius);
  const y1 = Math.round(cy + radius);
  const rr = radius * radius;
  for (let py = y0; py <= y1; py += 1) {
    for (let px = x0; px <= x1; px += 1) {
      const dx = px + 0.5 - cx;
      const dy = py + 0.5 - cy;
      if (dx * dx + dy * dy <= rr) blend(canvas, px, py, rgba);
    }
  }
}

export function fillPolygon(canvas, points, color) {
  const rgba = parseColor(color);
  const ys = points.map(([, y]) => y);
  const yMin = Math.floor(Math.min(...ys));
  const yMax = Math.ceil(Math.max(...ys));
  for (let py = yMin; py <= yMax; py += 1) {
    const y = py + 0.5;
    const xs = [];
    for (let i = 0; i < points.length; i += 1) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      if (y1 === y2) continue;
      if (y >= Math.min(y1, y2) && y < Math.max(y1, y2)) {
        xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      for (let px = Math.floor(xs[i]); px < Math.ceil(xs[i + 1]); px += 1) {
        blend(canvas, px, py, rgba);
      }
    }
  }
}

export function strokeLine(canvas, x1, y1, x2, y2, color, thickness = 2) {
  const rgba = parseColor(color);
  const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) * 2));
  const half = Math.max(0, thickness / 2);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    if (half <= 0.5) {
      blend(canvas, x, y, rgba);
      continue;
    }
    for (let oy = -Math.ceil(half); oy <= Math.ceil(half); oy += 1) {
      for (let ox = -Math.ceil(half); ox <= Math.ceil(half); ox += 1) {
        if (ox * ox + oy * oy <= half * half) blend(canvas, x + ox, y + oy, rgba);
      }
    }
  }
}

// Halo radial (glow) con caída cuadrática: el look "neón" del arcade.
export function radialGlow(canvas, cx, cy, radius, color, strength = 0.6) {
  const rgba = parseColor(color);
  const x0 = Math.max(0, Math.floor(cx - radius));
  const x1 = Math.min(canvas.width - 1, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const y1 = Math.min(canvas.height - 1, Math.ceil(cy + radius));
  for (let py = y0; py <= y1; py += 1) {
    for (let px = x0; px <= x1; px += 1) {
      const dx = px + 0.5 - cx;
      const dy = py + 0.5 - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) continue;
      const falloff = (1 - dist / radius) ** 2;
      blend(canvas, px, py, {
        r: rgba.r,
        g: rgba.g,
        b: rgba.b,
        a: rgba.a * falloff * strength,
      });
    }
  }
}

// Rejilla en perspectiva (suelo del arcade): líneas convergen a un punto.
export function perspectiveGrid(canvas, { horizon, color = '#00ffcc', alpha = 0.22, rows = 12 } = {}) {
  const rgba = parseColor(color);
  const c = { ...rgba, a: Math.round(rgba.a * alpha) };
  const cx = canvas.width / 2;
  const bottom = canvas.height;
  for (let i = 0; i <= rows; i += 1) {
    const t = i / rows;
    const y = horizon + (bottom - horizon) * t ** 2.1;
    fillRect(canvas, 0, y, canvas.width, 1, c);
  }
  for (let i = -8; i <= 8; i += 1) {
    const xBottom = cx + i * (canvas.width / 7);
    strokeLine(canvas, cx, horizon, xBottom, bottom, c, 1);
  }
}

export function scanlines(canvas, { color = '#000000', alpha = 0.16, spacing = 4 } = {}) {
  const rgba = parseColor(color);
  const c = { ...rgba, a: Math.round(rgba.a * alpha) };
  for (let y = 0; y < canvas.height; y += spacing) fillRect(canvas, 0, y, canvas.width, 1, c);
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

export function encodePNG(canvas) {
  const { width, height, data } = canvas;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filtro None
    Buffer.from(data.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Lectura mínima del IHDR (solo para tests y verificación de assets).
export function readPNGSize(buffer) {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < signature.length; i += 1) {
    if (buffer[i] !== signature[i]) throw new Error('PNG inválido: firma incorrecta');
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}
