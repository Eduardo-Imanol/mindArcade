import { afterEach, describe, expect, it } from 'vitest';
import { buildCatalog, loadCatalog, loadCustomTopics, saveCustomTopic, slugify, uniqueId } from './catalog.js';
import { loadTopicMeta } from './topicMeta.js';

const FIXTURE_A = `# Funciones en Programación
Una función encapsula lógica reutilizable y evita repetir código.

- Q: ¿Qué es una función? | A: Bloque de código reutilizable que realiza una tarea | E: easy
- Q: ¿Qué es un parámetro? | A: Variable que recibe valores de entrada | E: easy
- Q: ¿Qué es el valor de retorno? | A: Resultado que la función devuelve al llamador | E: hard
- LINEA SIN MARCADORES`;

afterEach(() => {
  localStorage.clear();
});

describe('slugify + dedupe', () => {
  it('slugs accented titles', () => {
    expect(slugify('Funciones en Programación')).toBe('funciones-en-programacion');
    expect(slugify('  ¡Hola, mundo! ')).toBe('hola-mundo');
    expect(slugify('')).toBe('');
  });
  it('dedupes with -2 suffix', () => {
    const taken = ['funciones-en-programacion'];
    expect(uniqueId('funciones-en-programacion', taken)).toBe('funciones-en-programacion-2');
    expect(uniqueId('nuevo', taken)).toBe('nuevo');
  });
});

describe('buildCatalog', () => {
  it('merges builtin + custom, builtin order first, unique ids', () => {
    const catalog = buildCatalog([FIXTURE_A], [{ title: 'Funciones en Programación', md: FIXTURE_A }]);
    expect(catalog.map((t) => t.id)).toEqual(['funciones-en-programacion', 'funciones-en-programacion-2']);
    expect(catalog[0].source).toBe('builtin');
    expect(catalog[1].source).toBe('custom');
    expect(catalog[0].cards).toHaveLength(3);
    expect(catalog[0].errors).toHaveLength(1);
  });
  it('skips empty / invalid mds without crashing', () => {
    expect(buildCatalog([null, 'nada'], [{ md: '' }, null])).toEqual([]);
  });
});

describe('library metadata (spec-17 T2)', () => {
  const FIXTURE_UNLISTED = `# Tema fuera del manifiesto
Tema de prueba sin entrada en library.js.

- Q: ¿Qué es esto? | A: Un tema no listado | E: easy`;

  it('built-in gets category, module and sourcePath', () => {
    const [topic] = buildCatalog([FIXTURE_A]);
    expect(topic.id).toBe('funciones-en-programacion');
    expect(topic.categoryId).toBe('programacion');
    expect(topic.moduleId).toBe('programacion-m1');
    expect(topic.moduleTitle).toBe('Módulo 1: Funciones');
    expect(topic.sourcePath).toBe('programacion/dart-funciones.md');
  });

  it('custom always goes to personalizados with null sourcePath', () => {
    const [topic] = buildCatalog([], [{ title: 'Mi tema', md: FIXTURE_A }]);
    expect(topic.source).toBe('custom');
    expect(topic.categoryId).toBe('personalizados');
    expect(topic.moduleId).toBeNull();
    expect(topic.sourcePath).toBeNull();
  });

  it('unlisted built-in falls back safely', () => {
    const [topic] = buildCatalog([FIXTURE_UNLISTED]);
    expect(topic.id).toBe('tema-fuera-del-manifiesto');
    expect(topic.categoryId).toBe('personalizados');
    expect(topic.moduleId).toBeNull();
    expect(topic.sourcePath).toBeNull();
  });

  it('loadCatalog loads the four nested built-ins with metadata', () => {
    const builtins = loadCatalog().filter((t) => t.source === 'builtin');
    expect(builtins.map((t) => t.id).sort()).toEqual(
      [
        'algoritmos-y-complejidad-guia-tecnica-exhaustiva',
        'estructuras-de-datos',
        'funciones-en-programacion',
        'persistencia-local-pwas-y-offline-first',
      ].sort()
    );
    for (const topic of builtins) {
      expect(topic.categoryId).toBe('programacion');
      expect(topic.moduleId === 'programacion-m1' || topic.moduleId === 'programacion-m2').toBe(true);
      expect(topic.sourcePath.startsWith('programacion/')).toBe(true);
    }
  });
});

describe('custom topic persistence', () => {
  it('save → reload survives, keeps errors count, rejects 0 valid cards', () => {
    const bad = saveCustomTopic({ title: 'Vacío', md: 'sin preguntas' });
    expect(bad.ok).toBe(false);
    expect(bad.error).toBe('No se encontraron preguntas válidas');

    const ok = saveCustomTopic({ title: 'Mi tema', md: FIXTURE_A, images: { q1: { kind: 'emoji', value: '🧩' } } });
    expect(ok.ok).toBe(true);
    expect(ok.topic.id).toBe('mi-tema');
    const reloaded = loadCustomTopics();
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0].title).toBe('Mi tema');
    expect(reloaded[0].images.q1).toEqual({ kind: 'emoji', value: '🧩' });
  });

  it('duplicate custom id gets -2 and builtin never shadowed', () => {
    saveCustomTopic({ title: 'Funciones en Programación', md: FIXTURE_A });
    const catalog = buildCatalog([FIXTURE_A], loadCustomTopics());
    expect(catalog.map((t) => t.id)).toEqual(['funciones-en-programacion', 'funciones-en-programacion-2']);
  });

  it('corrupt stored JSON → [] and loadCatalog does not crash', () => {
    localStorage.setItem('sepect.topics.custom.v1', '{oops');
    expect(loadCustomTopics()).toEqual([]);
    expect(() => loadCatalog()).not.toThrow();
  });
});

describe('addedAt (spec-12 AC-8)', () => {
  const META = { 'funciones-en-programacion': { addedAt: '2026-01-01T00:00:00.000Z' } };

  it('buildCatalog exposes addedAt from meta without writing', () => {
    const catalog = buildCatalog([FIXTURE_A], [], META);
    expect(catalog[0].addedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(localStorage.getItem('sepect.topics.meta.v1')).toBeNull();
  });
  it('without meta → no addedAt field', () => {
    const catalog = buildCatalog([FIXTURE_A], []);
    expect(catalog[0].addedAt).toBeUndefined();
  });
  it('custom createdAt wins over meta', () => {
    const catalog = buildCatalog([], [{ title: 'Mi tema', md: FIXTURE_A, createdAt: '2026-05-05T05:05:05.000Z' }], META);
    expect(catalog[0].source).toBe('custom');
    expect(catalog[0].addedAt).toBe('2026-05-05T05:05:05.000Z');
  });
  it('old custom without createdAt falls back to meta, or to nothing', () => {
    const custom = { title: 'Mi tema', md: FIXTURE_A };
    const withMeta = buildCatalog([], [custom], { 'mi-tema': { addedAt: '2026-01-01T00:00:00.000Z' } });
    expect(withMeta[0].addedAt).toBe('2026-01-01T00:00:00.000Z');
    const without = buildCatalog([], [custom]);
    expect(without[0].addedAt).toBeUndefined();
  });
  it('corrupt meta input is ignored', () => {
    const catalog = buildCatalog([FIXTURE_A], [], { 'funciones-en-programacion': { addedAt: 'nope' } });
    expect(catalog[0].addedAt).toBeUndefined();
    expect(buildCatalog([FIXTURE_A], [], []).length).toBe(1);
  });
  it('saveCustomTopic persists createdAt and returns addedAt', () => {
    const ok = saveCustomTopic({ title: 'Con fecha', md: FIXTURE_A });
    expect(ok.ok).toBe(true);
    const reloaded = loadCustomTopics()[0];
    expect(typeof reloaded.createdAt).toBe('string');
    expect(Number.isFinite(Date.parse(reloaded.createdAt))).toBe(true);
    expect(ok.topic.addedAt).toBe(reloaded.createdAt);
    expect(buildCatalog([], loadCustomTopics())[0].addedAt).toBe(reloaded.createdAt);
  });
  it('loadCatalog is pure: it never writes topic meta', () => {
    loadCatalog();
    expect(localStorage.getItem('sepect.topics.meta.v1')).toBeNull();
  });
  it('loadCatalog merges builtin + meta dates', () => {
    localStorage.setItem('sepect.topics.meta.v1', JSON.stringify(META));
    const catalog = loadCatalog();
    const builtin = catalog.find((topic) => topic.id === 'funciones-en-programacion');
    expect(builtin).toBeTruthy();
    expect(builtin.source).toBe('builtin');
    expect(builtin.addedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(loadTopicMeta()).toEqual(META);
  });
});
