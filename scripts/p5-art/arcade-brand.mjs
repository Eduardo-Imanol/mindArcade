// scripts/p5-art/arcade-brand.mjs — arte de marca del arcade (icono PWA + carátula).
// Todo procedural y determinista: sin assets externos ni dependencias.
import {
  fillCircle,
  fillPolygon,
  fillRect,
  fillRoundRect,
  perspectiveGrid,
  radialGlow,
  scanlines,
  strokeLine,
  strokeRect,
} from './raster.mjs';
import { drawText, textWidth } from './pixel-font.mjs';
import { AMBER, BG, BG2, CYAN, GREEN, MAGENTA, MUTED, TEXT } from './palette.mjs';

const SCREEN_BG = '#050a18';

function verticalGradient(canvas, top, bottom) {
  for (let y = 0; y < canvas.height; y += 1) {
    const t = y / Math.max(1, canvas.height - 1);
    const r = Math.round(top[0] + (bottom[0] - top[0]) * t);
    const g = Math.round(top[1] + (bottom[1] - top[1]) * t);
    const b = Math.round(top[2] + (bottom[2] - top[2]) * t);
    fillRect(canvas, 0, y, canvas.width, 1, [r, g, b, 255]);
  }
}

function hexToRgb(hex) {
  const value = Number.parseInt(String(hex).replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function starField(canvas, { count = 90, seed = 7 } = {}) {
  let state = seed >>> 0;
  const rand = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  for (let i = 0; i < count; i += 1) {
    const x = Math.floor(rand() * canvas.width);
    const y = Math.floor(rand() * canvas.height * 0.72);
    const size = rand() > 0.85 ? 3 : 2;
    fillRect(canvas, x, y, size, size, [241, 241, 241, Math.round(60 + rand() * 120)]);
  }
}

// Máquina recreativa frontal. Devuelve el rect de la pantalla para pintar su contenido.
function drawCabinet(canvas, { x, y, w, h, accent = CYAN, marquee = 'ARCADE' }) {
  const radius = w * 0.1;
  // cuerpo
  fillRoundRect(canvas, x, y, w, h, radius, BG2);
  strokeRect(canvas, x, y, w, h, accent, Math.max(2, w * 0.018));
  // marquesina
  const marqueeY = y + h * 0.045;
  const marqueeH = h * 0.155;
  const marqueeW = w * 0.84;
  const marqueeX = x + (w - marqueeW) / 2;
  fillRoundRect(canvas, marqueeX, marqueeY, marqueeW, marqueeH, w * 0.05, '#12072a');
  strokeRect(canvas, marqueeX, marqueeY, marqueeW, marqueeH, MAGENTA, Math.max(1, w * 0.012));
  const label = String(marquee).toUpperCase();
  const labelScale = Math.max(1, Math.floor((marqueeH * 0.62) / 7));
  const labelWidth = textWidth(label, labelScale);
  drawText(canvas, label, marqueeX + (marqueeW - labelWidth) / 2, marqueeY + (marqueeH - 7 * labelScale) / 2, {
    scale: labelScale,
    color: AMBER,
  });
  // bisel + pantalla
  const bezelX = x + w * 0.12;
  const bezelY = y + h * 0.245;
  const bezelW = w * 0.76;
  const bezelH = h * 0.36;
  fillRoundRect(canvas, bezelX, bezelY, bezelW, bezelH, w * 0.045, '#1c0b38');
  strokeRect(canvas, bezelX, bezelY, bezelW, bezelH, accent, Math.max(2, w * 0.014));
  const inset = w * 0.04;
  const screen = {
    x: bezelX + inset,
    y: bezelY + inset,
    w: bezelW - inset * 2,
    h: bezelH - inset * 2,
  };
  fillRoundRect(canvas, screen.x, screen.y, screen.w, screen.h, w * 0.02, SCREEN_BG);
  radialGlow(canvas, screen.x + screen.w / 2, screen.y + screen.h / 2, screen.w * 0.75, accent, 0.28);
  // panel de control
  const panelY = y + h * 0.645;
  const panelH = h * 0.115;
  const panelX = x + w * 0.08;
  const panelW = w * 0.84;
  fillPolygon(
    canvas,
    [
      [panelX, panelY + panelH * 0.35],
      [panelX + panelW, panelY + panelH * 0.35],
      [panelX + panelW - w * 0.03, panelY + panelH],
      [panelX + w * 0.03, panelY + panelH],
    ],
    '#241046'
  );
  // joystick
  const stickX = x + w * 0.28;
  const stickTop = panelY - h * 0.035;
  strokeLine(canvas, stickX, panelY + panelH * 0.3, stickX, stickTop, TEXT, Math.max(2, w * 0.016));
  fillCircle(canvas, stickX, stickTop, w * 0.055, MAGENTA);
  fillCircle(canvas, stickX, stickTop, w * 0.028, '#ffd9ec');
  // botones
  fillCircle(canvas, x + w * 0.63, panelY + panelH * 0.45, w * 0.045, CYAN);
  fillCircle(canvas, x + w * 0.78, panelY + panelH * 0.55, w * 0.045, GREEN);
  // base + ranura de monedas
  fillRoundRect(canvas, x + w * 0.16, y + h * 0.79, w * 0.68, h * 0.17, w * 0.03, '#160a2c');
  strokeRect(canvas, x + w * 0.16, y + h * 0.79, w * 0.68, h * 0.17, accent, Math.max(1, w * 0.008));
  fillRect(canvas, x + w * 0.42, y + h * 0.845, w * 0.16, h * 0.022, AMBER);
  return screen;
}

function drawSnakeScreen(canvas, screen) {
  const cell = Math.min(screen.w / 7, screen.h / 5);
  const path = [
    [0, 3],
    [1, 3],
    [2, 3],
    [2, 2],
    [2, 1],
    [3, 1],
    [4, 1],
  ];
  for (const [cx, cy] of path) {
    fillRect(
      canvas,
      screen.x + cx * cell,
      screen.y + cy * cell,
      cell * 0.92,
      cell * 0.92,
      GREEN
    );
  }
  fillCircle(canvas, screen.x + 5 * cell + cell / 2, screen.y + cell / 2, cell * 0.44, MAGENTA);
  fillCircle(canvas, screen.x + 5 * cell + cell / 2, screen.y + cell / 2, cell * 0.2, '#ffd9ec');
}

function drawCodeScreen(canvas, screen) {
  const scale = Math.max(1, Math.floor(screen.h / 16));
  const label = '</>';
  const width = textWidth(label, scale);
  drawText(canvas, label, screen.x + (screen.w - width) / 2, screen.y + (screen.h - 7 * scale) / 2, {
    scale,
    color: CYAN,
  });
}

function drawLanguageScreen(canvas, screen) {
  const scale = Math.max(1, Math.floor(screen.h / 18));
  const label = 'ABC';
  const width = textWidth(label, scale);
  drawText(canvas, label, screen.x + (screen.w - width) / 2, screen.y + (screen.h - 7 * scale) / 2 - scale * 2, {
    scale,
    color: MAGENTA,
  });
  const bubbleW = width + scale * 8;
  const bubbleH = scale * 9;
  const bubbleX = screen.x + (screen.w - bubbleW) / 2;
  const bubbleY = screen.y + screen.h - bubbleH - scale;
  fillRoundRect(canvas, bubbleX, bubbleY, bubbleW, bubbleH, scale * 2, '#2a1148');
  strokeRect(canvas, bubbleX, bubbleY, bubbleW, bubbleH, MAGENTA, Math.max(1, scale));
  const dots = ['?', '!', '.'];
  let dotX = bubbleX + scale * 2;
  for (const dot of dots) {
    drawText(canvas, dot, dotX, bubbleY + scale, { scale: Math.max(1, scale - 1), color: AMBER });
    dotX += scale * 6;
  }
}

function drawUniversityScreen(canvas, screen) {
  const capW = screen.w * 0.62;
  const capH = capW * 0.34;
  const capX = screen.x + (screen.w - capW) / 2;
  const capY = screen.y + screen.h * 0.28;
  fillPolygon(
    canvas,
    [
      [capX, capY + capH * 0.5],
      [capX + capW / 2, capY],
      [capX + capW, capY + capH * 0.5],
      [capX + capW / 2, capY + capH],
    ],
    GREEN
  );
  fillRoundRect(
    canvas,
    capX + capW / 2 - capW * 0.22,
    capY + capH * 0.35,
    capW * 0.44,
    capH * 0.55,
    capW * 0.08,
    '#1c0b38'
  );
  strokeLine(
    canvas,
    capX + capW / 2 + capW * 0.2,
    capY + capH * 0.6,
    capX + capW / 2 + capW * 0.26,
    capY + capH * 1.7,
    AMBER,
    Math.max(1, capW * 0.035)
  );
  fillCircle(canvas, capX + capW / 2 + capW * 0.26, capY + capH * 1.8, capW * 0.055, AMBER);
}

function drawPersonalScreen(canvas, screen) {
  const cardW = screen.w * 0.46;
  const cardH = screen.h * 0.58;
  const cx = screen.x + screen.w / 2;
  const cy = screen.y + screen.h * 0.54;
  const colors = [CYAN, MAGENTA, AMBER];
  for (let i = 2; i >= 0; i -= 1) {
    const x = cx - cardW / 2 + (i - 1) * screen.w * 0.07;
    const y = cy - cardH / 2 + (i - 1) * screen.h * 0.06;
    const accent = colors[i];
    fillRoundRect(canvas, x, y, cardW, cardH, cardW * 0.08, '#2a1148');
    strokeRect(canvas, x, y, cardW, cardH, accent, Math.max(1, cardW * 0.025));
    fillCircle(canvas, x + cardW * 0.25, y + cardH * 0.28, cardH * 0.1, accent);
    fillRoundRect(
      canvas,
      x + cardW * 0.14,
      y + cardH * 0.5,
      cardW * 0.72,
      cardH * 0.08,
      cardH * 0.04,
      MUTED
    );
    fillRoundRect(
      canvas,
      x + cardW * 0.14,
      y + cardH * 0.66,
      cardW * 0.5,
      cardH * 0.08,
      cardH * 0.04,
      MUTED
    );
  }

  const starX = screen.x + screen.w * 0.76;
  const starY = screen.y + screen.h * 0.26;
  const outer = screen.w * 0.09;
  const inner = outer * 0.44;
  const points = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push([starX + Math.cos(angle) * radius, starY + Math.sin(angle) * radius]);
  }
  fillPolygon(canvas, points, AMBER);
}

/** Icono de la app: una máquina recreativa con serpiente en la pantalla. */
export function drawIcon(canvas, { maskable = false } = {}) {
  verticalGradient(canvas, hexToRgb(BG2), hexToRgb(BG));
  radialGlow(canvas, canvas.width * 0.5, canvas.height * 0.42, canvas.width * 0.62, CYAN, 0.35);
  radialGlow(canvas, canvas.width * 0.5, canvas.height * 0.86, canvas.width * 0.5, MAGENTA, 0.22);
  perspectiveGrid(canvas, { horizon: canvas.height * 0.62, color: CYAN, alpha: 0.16, rows: 8 });

  // El gabinete se dimensiona por alto para que nunca se salga del lienzo.
  const inset = maskable ? 0.2 : 0.07;
  const cabH = canvas.height * (1 - inset * 2);
  const cabW = cabH * 0.8;
  const cabX = (canvas.width - cabW) / 2;
  const cabY = (canvas.height - cabH) / 2;
  radialGlow(canvas, canvas.width / 2, canvas.height / 2, cabW * 0.8, MAGENTA, 0.18);
  const screen = drawCabinet(canvas, { x: cabX, y: cabY, w: cabW, h: cabH, accent: CYAN });
  drawSnakeScreen(canvas, screen);
  scanlines(canvas, { alpha: 0.18, spacing: Math.max(2, Math.round(canvas.height / 128)) });
}

/** Layout del texto de la carátula: compartido por el dibujo y los tests. */
export function coverLayout(width, height) {
  const margin = Math.round(width * 0.07);
  const titleScale = Math.max(6, Math.round(width / 96));
  const subScale = Math.max(2, Math.round(titleScale / 2.2));
  const tagScale = Math.max(1, subScale - 3);
  const titleY = Math.round(height * 0.09);
  const subY = titleY + 7 * titleScale + subScale * 2;
  const tagY = subY + 7 * subScale + tagScale * 2;
  const cabH = height * 0.46;
  const cabW = cabH * 0.8;
  const gap = width * 0.035;
  const totalW = cabW * 3 + gap * 2;
  return {
    margin,
    titleScale,
    subScale,
    tagScale,
    titleY,
    subY,
    tagY,
    cabH,
    cabW,
    gap,
    startX: (width - totalW) / 2,
    baseY: height * 0.93,
  };
}

/** Carátula ancha (og:image / splash): el lobby del arcade con un gabinete por dominio. */
export function drawCover(canvas) {
  verticalGradient(canvas, hexToRgb(BG2), hexToRgb(BG));
  starField(canvas, { count: 110, seed: 11 });
  radialGlow(canvas, canvas.width * 0.18, canvas.height * 0.42, canvas.width * 0.42, CYAN, 0.32);
  radialGlow(canvas, canvas.width * 0.86, canvas.height * 0.5, canvas.width * 0.4, MAGENTA, 0.28);
  perspectiveGrid(canvas, { horizon: canvas.height * 0.62, color: CYAN, alpha: 0.2, rows: 10 });

  // Título (bloque superior izquierdo)
  const layout = coverLayout(canvas.width, canvas.height);
  const { margin, titleScale, subScale, tagScale, titleY, subY, tagY } = layout;
  const title = 'SEPECT';
  drawText(canvas, title, margin + 4, titleY + 4, { scale: titleScale, color: '#2b0f4d' });
  drawText(canvas, title, margin, titleY, { scale: titleScale, color: CYAN });

  const sub = 'ARCADE DE APRENDER';
  drawText(canvas, sub, margin + 2, subY + 2, { scale: subScale, color: '#2b0f4d' });
  drawText(canvas, sub, margin, subY, { scale: subScale, color: MAGENTA });

  const tagline = 'PROGRAMACION . IDIOMAS . UNIVERSIDAD . MAS TEMAS';
  drawText(canvas, tagline, margin, tagY, { scale: tagScale, color: MUTED });

  // Un gabinete por dominio, centrados en la mitad inferior
  const { cabH, cabW, gap, startX, baseY } = layout;
  const cabinets = [
    { accent: CYAN, marquee: 'CODE', screen: drawCodeScreen },
    { accent: MAGENTA, marquee: 'IDIOMA', screen: drawLanguageScreen },
    { accent: GREEN, marquee: 'UNIV', screen: drawUniversityScreen },
  ];
  cabinets.forEach((cabinet, index) => {
    const x = startX + index * (cabW + gap);
    const y = baseY - cabH;
    const screen = drawCabinet(canvas, { x, y, w: cabW, h: cabH, accent: cabinet.accent, marquee: cabinet.marquee });
    cabinet.screen(canvas, screen);
  });

  // Joystick and coins
  const joyX = Math.max(margin + canvas.width * 0.03, startX * 0.55);
  const joyY = canvas.height * 0.88;
  fillRoundRect(canvas, joyX - canvas.width * 0.035, joyY - canvas.height * 0.05, canvas.width * 0.07, canvas.height * 0.055, canvas.width * 0.012, '#241046');
  strokeLine(canvas, joyX, joyY - canvas.height * 0.045, joyX, joyY - canvas.height * 0.12, TEXT, canvas.width * 0.006);
  fillCircle(canvas, joyX, joyY - canvas.height * 0.135, canvas.width * 0.022, MAGENTA);
  for (let i = 0; i < 3; i += 1) {
    fillCircle(canvas, joyX + canvas.width * 0.045 + i * canvas.width * 0.028, joyY - canvas.height * 0.03, canvas.width * 0.011, AMBER);
  }

  scanlines(canvas, { alpha: 0.12, spacing: Math.max(3, Math.round(canvas.height / 130)) });
}

const CATEGORY_ART = {
  programacion: { accent: CYAN, marquee: 'CODE', screen: drawCodeScreen },
  idiomas: { accent: MAGENTA, marquee: 'IDIOMA', screen: drawLanguageScreen },
  universidad: { accent: GREEN, marquee: 'UNIV', screen: drawUniversityScreen },
  personalizados: { accent: AMBER, marquee: 'MIS TEMAS', screen: drawPersonalScreen },
};

/** Imagen representativa de una categoría: un gabinete arcade con su pantalla. */
export function drawCategory(canvas, categoryId) {
  const art = CATEGORY_ART[categoryId];
  if (!art) throw new Error(`Unknown category art: ${categoryId}`);
  const accentRgb = hexToRgb(art.accent);
  verticalGradient(canvas, hexToRgb(BG2), hexToRgb(BG));
  starField(canvas, { count: 46, seed: 17 });
  radialGlow(canvas, canvas.width * 0.5, canvas.height * 0.45, canvas.width * 0.55, art.accent, 0.3);
  radialGlow(
    canvas,
    canvas.width * 0.5,
    canvas.height * 0.9,
    canvas.width * 0.45,
    art.accent,
    0.16
  );
  perspectiveGrid(canvas, { horizon: canvas.height * 0.7, color: art.accent, alpha: 0.18, rows: 7 });

  const cabH = canvas.height * 0.82;
  const cabW = cabH * 0.8;
  const cabX = (canvas.width - cabW) / 2;
  const cabY = (canvas.height - cabH) / 2;
  fillCircle(canvas, canvas.width * 0.5, canvas.height * 0.5, cabW * 0.62, [
    accentRgb[0],
    accentRgb[1],
    accentRgb[2],
    18,
  ]);
  const screen = drawCabinet(canvas, {
    x: cabX,
    y: cabY,
    w: cabW,
    h: cabH,
    accent: art.accent,
    marquee: art.marquee,
  });
  art.screen(canvas, screen);
  scanlines(canvas, { alpha: 0.14, spacing: Math.max(2, Math.round(canvas.height / 110)) });
}
