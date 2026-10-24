---
feature: juegos-por-categoria
status: signed
owner: Eduardo
created: 2026-10-23
updated: 2026-10-23
related_tasks: specs/tasks-20-juegos-por-categoria.md
---

# Spec — Juegos por categoría (spec-20)

> [!abstract] Resumen
> Añade alcance por categoría al catálogo de juegos (`GameDefinition`). Los 8 juegos
> actuales siguen siendo globales; los nuevos juegos de código se limitan a
> Programación y la base queda lista para que Idiomas y Universidad tengan sus
> propios juegos. No cambia la mecánica de ningún juego ni la ruta de juego.

| Campo | Valor |
|---|---|
| Estado | ✅ Firmada — Eduardo aprobó la spec por chat (2026-10-23) |
| Escala | Micro/Media (contrato de registry + filtros de vistas) |
| Fecha | 2026-10-23 |
| Revisada por | Eduardo — 2026-10-23 |

---

## 🎯 Decisiones firmadas (2026-10-23)

1. `defineGame` acepta `categories?: string[]`. Si se omite, el juego es global
   (`categories: ['*']`). El array se valida, se deduplica y se congela.
2. `listGames()` sigue devolviendo todos; se añade `listGames({ categoryId })` o
   `gamesForCategory(categoryId)` para filtrar por categoría. Un juego es visible si
   incluye `'*'` o la categoría exacta.
3. Los 8 juegos actuales no declaran `categories` y siguen globales.
4. Los 3 juegos nuevos de código declaran `categories: ['programacion']` y no
   aparecen en Idiomas/Universidad. `needsExercises`/`minExercises` y los 6
   ejercicios universales se añaden en spec-21.
5. `TopicView` muestra solo juegos globales + los de la categoría del tema; el
   contador «X de Y» se calcula sobre ese subconjunto.
6. `GameHost` valida que el juego aplique a la categoría del tema; si no, muestra
   «Juego no disponible para esta categoría»/`NotFound`, sin cargar el módulo.
7. No cambia la ruta `#/tema/:topicId/juego/:gameId`, ni el contrato de props, ni la
   mecánica de los juegos.
8. Sin dependencias nuevas, sin red y sin persistencia nueva.

---

## 📖 Historias de usuario

### HU-1 — Catálogo de juegos por categoría
**Como** aprendiz, **quiero** ver solo los juegos que aplican a la categoría del
tema, **para** no entrar a juegos que no tienen sentido para ese contenido.

**Criterios de aceptación:**
- [ ] AC-1: `defineGame` acepta `categories` opcional:
  - ausente → `['*']`;
  - array no vacío de strings no vacíos, sin duplicados;
  - valores inválidos lanzan `TypeError` con mensaje claro;
  - el objeto sigue congelado.
- [ ] AC-2: `listGames()` conserva el orden y devuelve todos los juegos registrados
  (8 en esta spec; 11 tras spec-21). Con `categoryId`, filtra por `'*'` o por la
  categoría; sin categoría, no filtra.
- [ ] AC-3: Los 8 juegos actuales no cambian de comportamiento ni de orden. Los
  juegos nuevos se registrarán con `categories: ['programacion']` y no aparecerán en
  Idiomas/Universidad. Los ejercicios universales y su disponibilidad se integran en
  spec-21.
- [ ] AC-4: `TopicView` usa la categoría del tema (spec-17) y muestra solo los juegos
  aplicables; el contador y el estado vacío son coherentes. Un tema custom
  (`personalizados`) ve los juegos globales.
- [ ] AC-5: `GameHost` rechaza un juego no aplicable a la categoría del tema con un
  mensaje claro y un enlace de vuelta, sin importar el módulo del juego.
- [ ] AC-6: Una categoría sin juegos propios sigue viendo los globales; si en el
  futuro no hay ninguno, se muestra un estado vacío, no una rejilla rota.
- [ ] AC-7: La vista sigue siendo accesible (teclado, foco, 360 px) y no se rompen
  los tests de disponibilidad, título ni rutas.
- [ ] AC-8: `npm test`, `npm run lint` y `npm run build` pasan al 100%; sin
  dependencias nuevas, sin red y sin cambios en la mecánica/SRS/XP.

---

## 🚧 Restricciones arquitectónicas

- `defineGame` sigue siendo el único constructor de `GameDefinition`.
- El filtro es puro; las vistas no hardcodean IDs de juego.
- Los juegos no conocen su categoría en runtime: solo el registry/host.
- No se añade una ruta de catálogo por categoría; el filtro se aplica sobre el tema.

## ⚠️ Casos límite

| Caso | Comportamiento esperado |
|---|---|
| `categories` ausente | Juego global (`['*']`) |
| `categories: []` | `TypeError` |
| `categories: ['']` / no string | `TypeError` |
| Duplicados | Se deduplican |
| Categoría desconocida en la ruta del juego | No disponible, sin crash |
| Tema custom | Ve juegos globales |
| Juego global + categoría | Aparece en todas |
| Juego de Programación en Idiomas | No aparece y GameHost lo rechaza |
| Futuro juego de Idiomas | Se añade solo al registry con su categoría |

---

## 🧪 Contrato de pruebas

```
ENTRADA: defineGame({ id, title, status, minCards, load, categories? })
SALIDA: GameDefinition con categories: string[] (default ['*'])

ENTRADA: listGames({ categoryId: 'programacion' })
SALIDA: juegos con categories incluye '*' o 'programacion'

ENTRADA: TopicView/GameHost con topic.categoryId
SALIDA: solo juegos aplicables; mismatch → estado no disponible
```

**Tests mínimos:**
- `definition.test.js`: default, validación, dedupe, freeze.
- `registry.test.js`: orden, filtro, globales, categoría.
- `TopicView.test.jsx`: 8 globales en personalizados; programación con los 3 nuevos.
- `GameHost.test.jsx`: mismatch y ruta.
- A11y/360 px.

---

## 🚫 Fuera de alcance

- Crear los juegos de código (spec-21).
- Crear juegos de Idiomas/Universidad.
- Cambiar la mecánica o el layout de los 8 juegos.
- Reorganizar categorías/módulos (spec-17).
- Persistir la categoría elegida.

---

## ✍️ Firma

- [x] Spec revisada y firmada por humano: **Eduardo — 2026-10-23**
- [ ] `specs/tasks-20-juegos-por-categoria.md` revisado
