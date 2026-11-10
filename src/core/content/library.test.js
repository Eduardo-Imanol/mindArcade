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
    expect(ids).toEqual(['programacion', 'ia', 'idiomas', 'universidad', 'personalizados']);
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

  it('programacion has exactly m1, m2 and m3 in order', () => {
    const prog = CATEGORY_BY_ID.programacion;
    expect(prog.modules).toHaveLength(3);
    expect(prog.modules[0].id).toBe('programacion-m1');
    expect(prog.modules[1].id).toBe('programacion-m2');
    expect(prog.modules[2].id).toBe('programacion-m3');
    expect(prog.modules[0].order).toBeLessThan(prog.modules[1].order);
    expect(prog.modules[1].order).toBeLessThan(prog.modules[2].order);
    expect(prog.modules[0].topicIds).toEqual(['funciones-en-programacion']);
    expect(prog.modules[1].topicIds).toEqual([
      'estructuras-de-datos',
      'algoritmos-y-complejidad-guia-tecnica-exhaustiva',
      'persistencia-local-pwas-y-offline-first',
    ]);
    expect(prog.modules[2].topicIds).toEqual(['control-de-versiones-avanzado-con-git']);
  });

  it('ia has one module with the REA topic', () => {
    const ia = CATEGORY_BY_ID.ia;
    expect(ia.title).toBe('IA');
    expect(ia.modules).toHaveLength(1);
    expect(ia.modules[0].id).toBe('ia-m1');
    expect(ia.modules[0].topicIds).toEqual(['rea-opencode-ingenieria-inversa-con-agentes']);
  });

  it('no duplicate topics across modules', () => {
    const all = [];
    for (const c of CATEGORIES) {
      for (const m of c.modules || []) {
        for (const tid of m.topicIds || []) all.push(tid);
      }
    }
    expect(new Set(all).size).toBe(all.length);
    expect(all.length).toBe(6);
  });

  it('built-ins map to existing nested source files', () => {
    const root = process.cwd();
    const moduleTopics = Object.keys(TOPIC_TO_MODULE);
    for (const tid of Object.keys(SOURCE_BY_TOPIC)) {
      const sp = sourceForTopic(tid);
      expect(fs.existsSync(path.join(root, 'src/content/sources', sp))).toBe(true);
      if (tid === 'arquitectura-de-la-atraccion-y-calibracion-social') {
        expect(moduleTopics).not.toContain(tid);
      } else {
        expect(moduleTopics).toContain(tid);
      }
    }
    expect(Object.keys(SOURCE_BY_TOPIC)).toHaveLength(7);
    const topicFiles = fs.readdirSync(path.join(root, 'src/content/topics/programacion'));
    expect(topicFiles.sort()).toEqual(
      [
        'algoritmos-y-complejidad-guia-tecnica-exhaustiva.md',
        'control-de-versiones-avanzado-con-git.md',
        'estructuras-de-datos.md',
        'funciones-programacion.md',
        'persistencia-local-pwas-y-offline-first.md',
      ].sort()
    );
    expect(fs.readdirSync(path.join(root, 'src/content/topics/ia'))).toEqual([
      'rea-opencode-ingenieria-inversa-con-agentes.md',
    ]);
    expect(fs.readdirSync(path.join(root, 'src/content/topics/personalizados'))).toEqual([
      'arquitectura-de-la-atraccion-y-calibracion-social.md',
    ]);
  });

  it('helpers work', () => {
    expect(findCategory('programacion')).toBe(CATEGORY_BY_ID.programacion);
    expect(findCategory('nope')).toBeNull();
    expect(findModule('programacion-m1').categoryId).toBe('programacion');
    expect(findModule('nope')).toBeNull();
    expect(sourceForTopic('estructuras-de-datos')).toBe('programacion/dart-estructuras-datos.md');
    expect(sourceForTopic('rea-opencode-ingenieria-inversa-con-agentes')).toBe(
      'ia/rea-opencode-ingenieria-inversa-con-agentes.md'
    );
    expect(sourceForTopic('arquitectura-de-la-atraccion-y-calibracion-social')).toBe(
      'personalizados/arquitectura-de-la-atraccion-y-calibracion-social.md'
    );
    expect(sourceForTopic('nope')).toBeNull();
    expect(topicsForCategory('idiomas')).toEqual([]);
    const ia = topicsForCategory('ia');
    expect(ia).toEqual([
      {
        topicId: 'rea-opencode-ingenieria-inversa-con-agentes',
        moduleId: 'ia-m1',
        moduleTitle: 'Módulo 1: Programación de IA',
      },
    ]);
    const prog = topicsForCategory('programacion');
    expect(prog.length).toBe(5);
    expect(prog[0]).toEqual({ topicId: 'funciones-en-programacion', moduleId: 'programacion-m1', moduleTitle: 'Módulo 1: Funciones' });
  });

  it('maps are consistent', () => {
    expect(Object.isFrozen(SOURCE_BY_TOPIC)).toBe(true);
    expect(Object.isFrozen(CATEGORY_BY_ID)).toBe(true);
    expect(Object.isFrozen(MODULE_BY_ID)).toBe(true);
    expect(Object.isFrozen(TOPIC_TO_MODULE)).toBe(true);
  });
});
