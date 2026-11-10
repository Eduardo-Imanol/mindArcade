// src/core/content/library.js — Datos puros del manifiesto de biblioteca (sin globs/storage)
// Estructura congelada; fuente de verdad para categorías, módulos, orden y mapping de sources.

export const CATEGORIES = Object.freeze([
  Object.freeze({
    id: 'programacion',
    image: 'categories/programacion.png',
    title: 'Programación',
    description: 'Fundamentos de Dart, estructuras, algoritmos y persistencia.',
    order: 1,
    modules: Object.freeze([
      Object.freeze({
        id: 'programacion-m1',
        title: 'Módulo 1: Funciones',
        description: 'Bloques reutilizables, parámetros, retorno y funciones de primera clase.',
        order: 1,
        topicIds: Object.freeze(['funciones-en-programacion']),
      }),
      Object.freeze({
        id: 'programacion-m2',
        title: 'Módulo 2: Estructuras, Algoritmos y Persistencia',
        description: 'TAD, complejidad, ordenación, búsqueda y persistencia local/offline-first.',
        order: 2,
        topicIds: Object.freeze([
          'estructuras-de-datos',
          'algoritmos-y-complejidad-guia-tecnica-exhaustiva',
          'persistencia-local-pwas-y-offline-first',
        ]),
      }),
      Object.freeze({
        id: 'programacion-m3',
        title: 'Módulo 3: Git y Control de Versiones',
        description: 'Grafos y objetos, diff, merge, rebase, hooks, branching y monorepos.',
        order: 3,
        topicIds: Object.freeze(['control-de-versiones-avanzado-con-git']),
      }),
    ]),
  }),
  Object.freeze({
    id: 'ia',
    image: 'categories/ia.png',
    title: 'IA',
    description: 'Agentes, protocolo MCP e ingeniería inversa asistida.',
    order: 2,
    modules: Object.freeze([
      Object.freeze({
        id: 'ia-m1',
        title: 'Módulo 1: Programación de IA',
        description: 'Agentes en la terminal, servidores MCP y análisis de binarios con REA.',
        order: 1,
        topicIds: Object.freeze(['rea-opencode-ingenieria-inversa-con-agentes']),
      }),
    ]),
  }),
  Object.freeze({
    id: 'idiomas',
    image: 'categories/idiomas.png',
    title: 'Idiomas',
    description: 'Vocabulario y gramática para practicar con juegos.',
    order: 3,
    modules: Object.freeze([]),
  }),
  Object.freeze({
    id: 'universidad',
    image: 'categories/universidad.png',
    title: 'Universidad',
    description: 'Materias con teoría y ejercicios.',
    order: 4,
    modules: Object.freeze([]),
  }),
  Object.freeze({
    id: 'personalizados',
    image: 'categories/personalizados.png',
    title: 'Mis temas',
    description: 'Temas creados por ti desde el hub.',
    order: 5,
    modules: Object.freeze([]),
  }),
]);

// topicId -> sourcePath relativo a src/content/sources
export const SOURCE_BY_TOPIC = Object.freeze({
  'funciones-en-programacion': 'programacion/dart-funciones.md',
  'estructuras-de-datos': 'programacion/dart-estructuras-datos.md',
  'algoritmos-y-complejidad-guia-tecnica-exhaustiva':
    'programacion/algoritmos-y-complejidad-guia-tecnica-exhaustiva.md',
  'persistencia-local-pwas-y-offline-first':
    'programacion/persistencia-local-pwas-offline-first.md',
  'control-de-versiones-avanzado-con-git': 'programacion/control-de-versiones-avanzado-con-git.md',
  'rea-opencode-ingenieria-inversa-con-agentes': 'ia/rea-opencode-ingenieria-inversa-con-agentes.md',
  'arquitectura-de-la-atraccion-y-calibracion-social':
    'personalizados/arquitectura-de-la-atraccion-y-calibracion-social.md',
});

function freezeMap(map) {
  return Object.freeze(map);
}

export const CATEGORY_BY_ID = freezeMap(
  Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))
);

export const MODULE_BY_ID = freezeMap(
  Object.fromEntries(
    CATEGORIES.flatMap((c) => (c.modules || []).map((m) => [m.id, { ...m, categoryId: c.id }]))
  )
);

export const TOPIC_TO_MODULE = freezeMap(
  Object.fromEntries(
    CATEGORIES.flatMap((c) =>
      (c.modules || []).flatMap((m) =>
        (m.topicIds || []).map((tid) => [tid, { moduleId: m.id, categoryId: c.id, moduleTitle: m.title }])
      )
    )
  )
);

export function findCategory(id) {
  if (!id || typeof id !== 'string') return null;
  return CATEGORY_BY_ID[id] || null;
}

export function findModule(id) {
  if (!id || typeof id !== 'string') return null;
  return MODULE_BY_ID[id] || null;
}

export function sourceForTopic(topicId) {
  if (!topicId || typeof topicId !== 'string') return null;
  return SOURCE_BY_TOPIC[topicId] || null;
}

export function topicsForCategory(categoryId) {
  const cat = findCategory(categoryId);
  if (!cat) return [];
  const res = [];
  for (const mod of cat.modules || []) {
    for (const tid of mod.topicIds || []) {
      res.push({ topicId: tid, moduleId: mod.id, moduleTitle: mod.title });
    }
  }
  return res;
}
