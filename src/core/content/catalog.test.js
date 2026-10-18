import { afterEach, describe, expect, it } from 'vitest';
import { buildCatalog, loadCatalog, loadCustomTopics, saveCustomTopic, slugify, uniqueId } from './catalog.js';

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
