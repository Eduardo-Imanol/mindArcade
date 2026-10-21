import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  COVER_TARGET,
  ICON_TARGETS,
  generatePwaAssets,
  renderCover,
  renderIcon,
} from './generate-pwa-assets.mjs';
import { coverLayout } from './p5-art/arcade-brand.mjs';
import { textWidth } from './p5-art/pixel-font.mjs';
import { readPNGSize } from './p5-art/raster.mjs';

const PUBLIC = path.join(process.cwd(), 'public');
const MAX_BYTES = 220 * 1024;
const temps = [];

function tempRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sepect-pwa-'));
  temps.push(dir);
  return dir;
}

afterEach(() => {
  while (temps.length > 0) fs.rmSync(temps.pop(), { recursive: true, force: true });
});

describe('pwa assets (PNG) ', () => {
  it('genera PNG válidos con las dimensiones que exige Chrome', () => {
    for (const target of ICON_TARGETS) {
      const png = renderIcon(target.size, { maskable: target.maskable });
      expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(readPNGSize(png)).toEqual({ width: target.size, height: target.size });
      expect(png.length, target.file).toBeLessThan(MAX_BYTES);
    }

    const cover = renderCover();
    expect(cover.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(readPNGSize(cover)).toEqual({ width: 1200, height: 630 });
    expect(cover.length).toBeLessThan(MAX_BYTES);
  });

  it('es determinista (mismo byte con la misma semilla)', () => {
    expect(renderIcon(192).equals(renderIcon(192))).toBe(true);
    expect(renderCover().equals(renderCover())).toBe(true);
  });

  it('mantiene el texto de la carátula dentro del lienzo', () => {
    const layout = coverLayout(1200, 630);
    const tagline = 'PROGRAMACION . IDIOMAS . UNIVERSIDAD . MAS TEMAS';
    expect(layout.margin + textWidth(tagline, layout.tagScale)).toBeLessThanOrEqual(1200);
    expect(layout.margin + textWidth('ARCADE DE APRENDER', layout.subScale)).toBeLessThanOrEqual(1200);
    expect(layout.baseY).toBeLessThanOrEqual(630);
  });

  it('escribe los assets en public/ y los omite si ya existen', () => {
    const root = tempRoot();
    const first = generatePwaAssets({ root, force: true });
    expect(first.written.sort()).toEqual(
      [...ICON_TARGETS.map((target) => target.file), COVER_TARGET.file].sort()
    );
    const second = generatePwaAssets({ root });
    expect(second.written).toEqual([]);
    expect(second.skipped).toHaveLength(ICON_TARGETS.length + 1);
  });

  it('mantiene los assets versionados en public/ sincronizados con el generador', () => {
    for (const target of ICON_TARGETS) {
      const file = path.join(PUBLIC, target.file);
      expect(fs.existsSync(file), file).toBe(true);
      expect(fs.readFileSync(file).equals(renderIcon(target.size, { maskable: target.maskable })), file).toBe(
        true
      );
    }
    const coverFile = path.join(PUBLIC, COVER_TARGET.file);
    expect(fs.existsSync(coverFile)).toBe(true);
    expect(fs.readFileSync(coverFile).equals(renderCover())).toBe(true);
  });
});

describe('manifiesto instalable', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(PUBLIC, 'manifest.webmanifest'), 'utf8')
  );

  it('declara los campos que Chrome exige para instalar', () => {
    expect(manifest.name.length).toBeGreaterThan(0);
    expect(manifest.short_name.length).toBeGreaterThan(0);
    expect(manifest.start_url).toBe('./');
    expect(manifest.scope).toBe('./');
    expect(['standalone', 'fullscreen', 'minimal-ui']).toContain(manifest.display);
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.lang).toBe('es');
  });

  it('incluye iconos PNG de 192 y 512 y uno maskable', () => {
    const pngs = manifest.icons.filter((icon) => icon.type === 'image/png');
    expect(pngs.map((icon) => icon.sizes)).toContain('192x192');
    expect(pngs.map((icon) => icon.sizes)).toContain('512x512');
    expect(pngs.some((icon) => icon.purpose === 'maskable')).toBe(true);
    for (const icon of manifest.icons) {
      const file = path.join(PUBLIC, icon.src.replace('./', ''));
      expect(fs.existsSync(file), icon.src).toBe(true);
      const size = readPNGSize(fs.readFileSync(file));
      const [width, height] = icon.sizes.split('x').map(Number);
      expect(size.width).toBe(width);
      expect(size.height).toBe(height);
    }
  });
});

describe('service worker e index.html', () => {
  const sw = fs.readFileSync(path.join(PUBLIC, 'sw.js'), 'utf8');
  const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');

  it('el service worker precachea el shell y atiende fetch', () => {
    expect(sw).toContain("addEventListener('install'");
    expect(sw).toContain("addEventListener('activate'");
    expect(sw).toContain("addEventListener('fetch'");
    expect(sw).toContain('./index.html');
    expect(sw).toContain('./manifest.webmanifest');
    expect(sw).toContain('caches.open');
    expect(sw).toContain('skipWaiting');
  });

  it('index.html enlaza manifiesto, iconos y theme-color', () => {
    expect(html).toMatch(/<link rel="manifest" href="\.\/manifest\.webmanifest"/);
    expect(html).toMatch(/<meta name="theme-color" content="#[0-9a-f]{6}"/i);
    expect(html).toMatch(/<link rel="apple-touch-icon" href="\.\/icons\/apple-touch-icon\.png"/);
    expect(html).toMatch(/<link rel="icon" type="image\/png" sizes="192x192"/);
    expect(html).toMatch(/<meta property="og:image" content="\.\/cover\/arcade-cover\.png"/);
  });

  it('la app registra el service worker en producción', () => {
    const main = fs.readFileSync(path.join(process.cwd(), 'src/main.jsx'), 'utf8');
    expect(main).toContain('registerServiceWorker');
    expect(main).toContain('import.meta.env.PROD');
    expect(main).toContain('import.meta.env.BASE_URL');
  });
});
