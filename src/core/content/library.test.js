import { describe, expect, it } from 'vitest';
import {
  CATEGORIES,
  CATEGORY_BY_ID,
  MODULE_BY_ID,
  SOURCE_BY_TOPIC,
  TOPIC_TO_MODULE,
  findCategory,
  findModule,
  sourceForTopic,
  topicsForCategory,
} from './library.js';
import fs from 'node:fs';
import path from 'node:path';

describe('library manifest (spec-17 T1)', () => {
  it('structure is frozen and has required categories', () => {
    expect(Array.isArray(CATEGORIES)).toBe(true);
    expect(Object.isFrozen(CATEGORIES)).toBe(true);
    const ids = CATEGORIES.map((c) => c.id);
    expect(ids).toEqual(['programacion', 'idiomas', 'universidad', 'personalizados']);
    for (const c of CATEGORIES) {
      expect(c.id).toBeTypeOf('string');
      expect(c.title).toBeTypeOf('string');
      expect(c.order).toBeTypeOf('number');
      expect(c.image).toBe(`categories/${c.id}.png`);
      expect(
        fs.existsSync(path.join(process.cwd(), 'public', c.image)),
        c.image
      ).toBe(true);
      expect(Object.isFrozen(c)).toBe(true);
      expect(Array.isArray(c.modules)).toBe(true);
    }
  });

  it('programacion has exactly m1 and m2 in order', () => {
    const prog = CATEGORY_BY_ID.programacion;
    expect(prog.modules).toHaveLength(2);
    expect(prog.modules[0].id).toBe('programacion-m1');
    expect(prog.modules[1].id).toBe('programacion-m2');
    expect(prog.modules[0].order).toBeLessThan(prog.modules[1].order);
    expect(prog.modules[0].topicIds).toEqual(['funciones-en-programacion']);
    expect(prog.modules[1].topicIds).toEqual([
      'estructuras-de-datos',
      'algoritmos-y-complejidad-guia-tecnica-exhaustiva',
      'persistencia-local-pwas-y-offline-first',
    ]);
  });

  it('no duplicate topics across modules', () => {
    const all = [];
    for (const c of CATEGORIES) {
      for (const m of c.modules || []) {
        for (const tid of m.topicIds || []) all.push(tid);
      }
    }
    expect(new Set(all).size).toBe(all.length);
    expect(all.length).toBe(4);
  });

  it('built-ins map to existing nested source files', () => {
    const root = process.cwd();
    for (const tid of Object.keys(SOURCE_BY_TOPIC)) {
      expect(TOPIC_TO_MODULE[tid]).toBeTruthy();
      const sp = sourceForTopic(tid);
      expect(sp.startsWith('programacion/')).toBe(true);
      expect(fs.existsSync(path.join(root, 'src/content/sources', sp))).toBe(true);
    }
    const topicFiles = fs.readdirSync(path.join(root, 'src/content/topics/programacion'));
    expect(topicFiles.sort()).toEqual(
      [
        'algoritmos-y-complejidad-guia-tecnica-exhaustiva.md',
        'estructuras-de-datos.md',
        'funciones-programacion.md',
        'persistencia-local-pwas-y-offline-first.md',
      ].sort()
    );
  });

  it('helpers work', () => {
    expect(findCategory('programacion')).toBe(CATEGORY_BY_ID.programacion);
    expect(findCategory('nope')).toBeNull();
    expect(findModule('programacion-m1').categoryId).toBe('programacion');
    expect(findModule('nope')).toBeNull();
    expect(sourceForTopic('estructuras-de-datos')).toBe('programacion/dart-estructuras-datos.md');
    expect(sourceForTopic('nope')).toBeNull();
    expect(topicsForCategory('idiomas')).toEqual([]);
    const prog = topicsForCategory('programacion');
    expect(prog.length).toBe(4);
    expect(prog[0]).toEqual({ topicId: 'funciones-en-programacion', moduleId: 'programacion-m1', moduleTitle: 'Módulo 1: Funciones' });
  });

  it('maps are consistent', () => {
    expect(Object.isFrozen(SOURCE_BY_TOPIC)).toBe(true);
    expect(Object.isFrozen(CATEGORY_BY_ID)).toBe(true);
    expect(Object.isFrozen(MODULE_BY_ID)).toBe(true);
    expect(Object.isFrozen(TOPIC_TO_MODULE)).toBe(true);
  });
});
