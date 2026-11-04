# Evidencia — spec-23 Integración y hardening

> Auditoría de T1 y matriz de T2 ejecutadas el 2026-10-31. Sin features nuevas:
> los cambios de esta evidencia son rutas de integración, una pantalla mínima de
> configuración ya prevista por AC-2 y tests de no regresión.

## T1 — Auditoría de specs y cierre de spec-16

### Firma e implementación (estado real al 2026-10-31)

| Spec | Firma | Tasks | Implementación | Pendiente |
|---|---|---|---|---|
| `spec-17` | ✅ 2026-10-23 | 28/29 | Biblioteca por categorías/módulos, sources lazy y docs | Diff humano |
| `spec-18` | ✅ 2026-10-23 | 38/42 | Mazos, dominio y Arcade en los 8 juegos | Manual 360/VoiceOver, AC-21, cierre y diff |
| `spec-19` | ✅ 2026-10-23 | 23/26 | Lector Markdown seguro, TTS y rutas | Manual real, cierre y diff |
| `spec-20` | ✅ 2026-10-23 | 13/15 | `defineGame.categories`, filtro del registry y bloqueo por categoría | Cierre y diff |
| `spec-21` | ✅ 2026-10-23 | 51/59 | Parser, progreso, sandbox, editor, 3 juegos de código y 10×6 ejercicios | Items de DoD y diff |
| `spec-22` | ✅ 2026-10-23 | 15/16 | Ahorcado con palabra arriba y evidencia visual | VoiceOver y diff |

`spec-19` y `spec-21` conservan ACs sin marcar en el documento aunque sus tasks
de implementación están cerradas; el dueño de marcarlos es el cierre de cada spec
(tasks-19 T7 y tasks-21 T21), no una task huérfana.

### Orden por fases

El orden real coincide con el firmado:

1. **spec-17** (2026-10-24): biblioteca, categorías, módulos, sources lazy y
   reorganización del contenido.
2. **spec-19** (2026-10-26): lector de fuente + TTS sobre el registro lazy de 17.
3. **spec-18** (2026-10-27): mazos, dominio y Arcade sobre los 8 juegos.
4. **spec-20 ∥ spec-22** (2026-10-27): filtro por categoría y Ahorcado invertido;
   no comparten archivos.
5. **spec-21** (2026-10-27): ejercicios universales y 3 juegos de código sobre el
   parser de 19, los mazos/arcade de 18 y el filtro de 20.

### Grafo de dependencias real

```
spec-17 T3 (sources.js lazy) ──> spec-19 T1/T2 (Markdown/TTS)
spec-17 T1/T2 (library + catalog) ──> spec-20 T2/T3 (categorías)
spec-19 T2 (parser Markdown) ──> spec-21 T1 (parser de ejercicios)
spec-18 T1–T4 (decks/mastery/arcade) ──> spec-20 T3, spec-21 T5, spec-22
spec-18 T5–T13 (8 juegos por mazos) ──> spec-22 T2 (Ahorcado invertido)
spec-23 T1 ──> T2 ∥ T3 ∥ T4 ──> T5 (docs, gates y cierre)
```

No hay dependencias circulares nuevas ni tasks huérfanas. El único documento sin
tasks propias es `spec-16`, cerrado y absorbido por `spec-18`.

### Cierre de spec-16

- El archivo ya se llamaba `specs/spec-16-flashcards-decks.md` (el sufijo literal
  `\n` se corrigió en spec-17 T9).
- Estado cambiado a **cerrada/absorbida por spec-18**.
- Sin tasks propias; su alcance (mazos de 10, progreso por mazo y resumen) vive en
  `tasks-18` T1/T6 y sus tests.

## T2 — Matriz de rutas, storage y compatibilidad

### Rutas (8/8)

| Ruta | Vista | Verificación |
|---|---|---|
| `#/` | `TopicsHub` | deep link, recarga y hashchange |
| `#/categoria/:id` | `CategoryView` | deep link y título |
| `#/tema/:id` | `TopicView` | deep link y título |
| `#/tema/:id/fuente` | `SourceReader` | deep link, carga lazy y título |
| `#/tema/:id/juego/:gameId` | `GameHost` | deep link, carga lazy y título |
| `#/progreso` | `Dashboard` | deep link, hashchange y vuelta atrás |
| `#/configuracion` | `SettingsView` | ruta nueva de integración (AC-2) |
| `#/personalizados` | `CategoryView` | alias de `#/categoria/personalizados` |

`#/configuracion` reutiliza el ajuste existente de sonido/TTS y resume datos ya
guardados; no crea claves ni lógica de producto. `#/personalizados` es un alias de
navegación, no una segunda vista.

### Storage y compatibilidad

- Se conservan las keys `sepect.srs.v1`, `sepect.profile.v1`, `sepect.settings.v1`,
  `sepect.arcade.v1` y `sepect.topics.custom.v1`.
- `sepect.exercises.v1` convive con SRS/arcade sin duplicar dominio ni cardinalidad.
- Los datos antiguos se normalizan al leer (perfil incompleto, `muted` string,
  récord sin `runs`, progreso de ejercicios sin `done`).
- JSON corrupto → valores vacíos seguros; cuota llena → `ok:false` sin romper.
- Temas custom sin `sourcePath` siguen funcionando y no exponen lector de fuente.

### Tests añadidos

- `src/app/routes.integration.test.jsx`: matriz de las 8 rutas, deep link,
  hashchange/atrás y recarga con storage corrupto.
- `src/views/SettingsView.test.jsx`: resumen de solo lectura, enlaces y fallback
  cuando no hay voz del sistema.
- `src/core/storage/integration.test.js`: aislamiento de exercises, actualización
  desde estado previo, corrupto/cuota y custom topics sin source.
- `src/app/router.test.js` y `src/app/title.test.js`: nuevas rutas y título.

### Diseño y verificación de la pantalla mínima

`SettingsView` reutiliza tokens y `SoundToggle`; no añade dependencias ni claves.
Medición con Chrome headless 155 + CDP sobre `/configuracion`:

| Viewport | `scrollWidth / clientWidth` | Overflow horizontal | Tarjetas | Datos | Título |
|---|---|---|---|---|---|
| 360 | 360 / 360 | No | 2 | 6 | 28 px |
| 768 | 768 / 768 | No | 2 | 6 | 38 px |
| 1440 | 1440 / 1440 | No | 2 | 6 | 38 px |

Sin elementos fuera del viewport ni scroll horizontal. El resumen es solo
lectura: el test compara el storage antes/después y no cambia ninguna key.

### Gates de T1–T2

- `npm test`: **1064/1064** (122 files).
- `npm run lint`: 0 warnings.
- `npm run build`: OK (solo warning preexistente de chunk >500 kB).
- Sin dependencias nuevas, sin red para progreso/XP/historial y sin secretos.

## T3 — Matriz de juegos, arcade y TTS

### Los 11 juegos

| Juego | Mazos/dominio | Arcade/récord | TTS/mute | Categoría |
|---|---|---|---|---|
| Flashcards | `Flashcards.decks.test.jsx` | `Flashcards.decks.test.jsx` | `tts.integration.test.jsx`, `Flashcards.a11y.test.jsx` | global |
| Memorama | `Memorama.decks.test.jsx` | `Memorama.decks.test.jsx` | `tts.integration.test.jsx`, `Memorama.a11y.test.jsx` | global |
| Ahorcado | `Ahorcado.decks.test.jsx` | `Ahorcado.decks.test.jsx` | `tts.integration.test.jsx`, `Ahorcado.a11y.test.jsx` | global |
| Elige el significado | `QuizSignificado.decks.test.jsx` | `QuizSignificado.decks.test.jsx` | `QuizSignificado.a11y.test.jsx` | global |
| El intruso | `Intruso.decks.test.jsx` | `Intruso.decks.test.jsx` | `Intruso.a11y.test.jsx` | global |
| Lluvia de meteoros | `LluviaMeteoros.decks.test.jsx` | `LluviaMeteoros.decks.test.jsx` | `LluviaMeteoros.a11y.test.jsx` | global |
| Conecta pares | `ConectaPares.decks.test.jsx` | `ConectaPares.decks.test.jsx` | `ConectaPares.a11y.test.jsx` | global |
| Serpiente | `SerpienteSignificados.decks.test.jsx` | `SerpienteSignificados.decks.test.jsx` | `SerpienteSignificados.a11y.test.jsx` | global |
| Ordena el código | `universal-exercises.test.jsx` | `CodeGameShell.test.jsx`, `OrdenaCodigo.test.jsx` | `CodeGameShell.test.jsx` | Programación |
| Escribe el código | `universal-exercises.test.jsx` | `CodeGameShell.test.jsx`, `EscribeCodigo.test.jsx` | `CodeGameShell.test.jsx` | Programación |
| Completa el código | `universal-exercises.test.jsx` | `CodeGameShell.test.jsx`, `CompletaCodigo.test.jsx` | `CodeGameShell.test.jsx` | Programación |

### Contratos transversales

- **Registro:** 11 juegos disponibles, ids únicos, `load()` dinámico y definiciones
  congeladas (`registry.test.js`); 8 globales + 3 solo de Programación (`spec-20`).
- **Mazos/dominio:** los 8 juegos de cartas usan `decks`/`Alternar mazo`, juegan solo
  el mazo elegido y reciben `DeckPicker`/`GameModeSwitch`; los tests perfecto → dominio
  y fallo → `No aprendida` viven en `TopicView.decks.test.jsx` y cada `*.decks.test`.
- **Ejercicios universales:** los 3 juegos de código abren el mismo documento de 6
  ejercicios, dificultad 2/4/6, progreso por ejercicio, «Nivel en progreso» y «Nivel
  de ejercicios completado» (`CodeGameShell.test.jsx`, `universal-exercises.test.jsx`).
- **Arcade/récords:** 3 vidas, resumen, `onArcadeEnd` y persistencia en
  `sepect.arcade.v1` con recarga y tope de 20 (`arcadeStore.test.js`).
- **TTS/mute:** todos los juegos leen su contenido, respetan el mute global y ocultan
  los controles sin `speechSynthesis`; los 3 juegos de código comparten el shell.
- **Categoría:** un juego de Programación abierto por URL en un tema custom muestra
  la pantalla segura y no llama a `load()` (`GameHost.category.test.jsx`).
- **«Próximamente»:** temas sin ejercicios mantienen los 3 juegos de código cerrados
  (`TopicView.exercises.test.jsx`, `GameHost.exercises.test.jsx`).

### Ejecución T3

`npx vitest run` focalizado en registro, matrices, 8 decks, 8 a11y, 8 isolation,
shell de código, ejercicios universales, arcade, TTS y GameHost:
**36 files / 243 tests passed**, sin fallos ni flakes en esta ejecución.

## T4 — Accesibilidad, rendimiento y bundle

### Bundle y carga lazy

`npm run build` (Vite 5.4.21):

- `dist/assets/index-BysjGSy0.js` (inicial): **2.253,14 kB / 364,77 kB gzip**.
- Documentos fuente en chunks separados: 22,15 kB (`dart-funciones`), 55,77 kB
  (`funciones-en-programacion` — ejercicios), 82,01–132,63 kB (sources largas).
- Los marcadores únicos de sources/ejercicios (`# Funciones en Dart`, `Completa la
  función suma1`, `Parámetros posicionales`, `HiperLogLog`) **no aparecen** en el
  chunk inicial; solo aparecen en sus chunks lazy.
- `sources.js` y `content/exercises/index.js` usan `import.meta.glob` sin `eager`;
  los tests lo verifican (`sources.test.js`, `exercises.test.js`).
- Los 11 juegos se importan con `load()` dinámico desde `GameHost`.

### 360 px / escritorio

Medición real con Chrome headless 155 + CDP sobre el build de producción. Todas las
rutas dieron `scrollWidth === clientWidth` a 360 y 1440, con un solo `<main>` y el
`h1` esperado:

`#/`, `#/categoria/programacion`, `#/categoria/personalizados`,
`#/tema/funciones-en-programacion`, `/fuente`, `/juego/flashcards`,
`/juego/completa-codigo`, `#/progreso`, `#/configuracion` y 404.

En la fuente, los bloques `pre` tienen scroll interno; no generan overflow de página.

### Rendimiento, pausa y limpieza

- `engine.test.js`: un solo rAF, doble `start()` no-op, `visibilitychange` oculto
  pausa y `stop()` cancela.
- Lluvia y Serpiente tienen tests explícitos de pausa/reanudación en pestaña oculta.
- Los `*.isolation.test.js` confirman que Flashcards, Memorama, Quiz, Intruso,
  Lluvia, Conecta, Serpiente y Ahorcado no importan storage/router/parser ni crean
  bucles/intervalos ajenos al engine.
- `tts.test.js`/`tts.integration.test.jsx`/`SourceReader.test.jsx` cubren
  cancelación, `stopSpeech()` y desmontaje sin utterances huérfanas.
- El sandbox de código elimina el iframe y su timer al terminar/desmontar
  (`sandbox.test.js`, tests de los 3 juegos).

### A11y

`docs/manual-a11y-checklist.md` incorpora las secciones de Configuración e
integración spec-23 (foco, teclado, 360 px, lector y deep links).
`SettingsView.a11y.test.jsx` añade el contrato automatizado de la vista nueva:
un solo `h1`, navegación etiquetada, dos secciones con `aria-labelledby`
resoluble, un único `role="status"` para el aviso de voz, objetivos ≥44 px,
`overflow-wrap`, rejilla sin desbordamiento a 479 px, foco visible y ausencia de
animaciones en los estados de Configuración. La pasada manual con VoiceOver/teclado
físico sigue pendiente de firma humana, como en specs 13/18/19/22.

### Gates de T3–T4

- `npm test`: **1067/1067** (123 files).
- `npm run lint`: 0 warnings.
- `npm run build`: OK; se mantienen los chunks lazy de sources/ejercicios y el
  warning preexistente del chunk inicial >500 kB.
- Sin dependencias nuevas, sin red para progreso/XP/historial y sin secretos.

## T5 — Documentación, gates y cierre técnico

Docs sincronizados con el estado final:

- `docs/architecture.md`: nota de integración del programa 17→19→18→20∥22→21,
  `SettingsView` (`#/configuracion`) y alias `#/personalizados`.
- `docs/testing.md`: sección spec-23 (rutas, storage, pantalla mínima, matriz de
  juegos, bundle/perf y gate manual).
- `docs/security.md`: `sepect.exercises.v1` aislado y auditoría de las keys de
  storage de spec-23 (sin colisiones, sin migraciones, configuración de solo lectura).
- `docs/manual-a11y-checklist.md`: estado del cierre técnico y pasada manual pendiente.
- `MEMORY.md` y `FOCUS.md`: decision/cierre y siguiente paso atómico.

Gates (2026-11-03):

- `npm test`: **1067/1067** (123 files) — verde.
- `npm run lint`: **0** warnings — verde.
- `npm run build`: **OK** (solo warning preexistente de chunk inicial >500 kB) —
  verde.
- Sin dependencias nuevas, sin red para progreso/XP/historial y sin secretos.

Pendiente humano: pasada real con teclado/VoiceOver a 360 px (AC-6) y firma del
diff de specs 12–22 (AC-1). Hasta entonces no se declara formalmente terminado el
programa; el código y la documentación quedan listos para esa revisión.
