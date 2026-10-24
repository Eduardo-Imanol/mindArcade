---
feature: juegos-codigo-ejercicios
status: signed
owner: Eduardo
created: 2026-10-23
updated: 2026-10-23
related_tasks: specs/tasks-21-juegos-codigo-ejercicios.md
---

# Spec — Juegos de código y ejercicios universales por mazo (spec-21)

> [!abstract] Resumen
> Añade tres juegos de Programación —**Ordena el código**, **Escribe el código** y
> **Completa el código**— y un documento de ejercicios por mazo. Cada mazo de 10
> flashcards tiene **6 ejercicios universales**: el mismo ejercicio puede jugarse en
> cualquiera de los tres juegos, en Normal y en Arcade, sin quedar atado a un tipo.
> La dificultad elige cuántos se practican: **Fácil 2, Medio 4, Difícil 6**. Se
> registra si cada ejercicio se aprendió y, cuando los 6 están aprendidos, el nivel
> de ejercicios del mazo queda **Completado**. El formato de contenido es Markdown
> estricto, con el mismo pipeline que los topics; los otros temas siguen sin
> ejercicios. Incluye sandbox aislado para JavaScript, sin backend, sin dependencias
> nuevas y con TTS obligatorio.

| Campo | Valor |
|---|---|
| Estado | ✅ Firmada — Eduardo aprobó la spec por chat (2026-10-23) |
| Escala | Alta (contenido + 3 juegos + progreso + sandbox + editor + integración) |
| Fecha | 2026-10-23 |
| Revisada por | Eduardo — 2026-10-23 |
| Depende de | spec-17 (categorías), spec-18 (mazos/arcade), spec-19 (parser Markdown), spec-20 (juegos por categoría) |

---

## 🎯 Decisiones firmadas (2026-10-23)

1. **Formato de ejercicios: Markdown estricto**, no módulos JavaScript ni JSON como
   fuente de contenido. Se usa el mismo pipeline actual: archivo `.md`, parser puro,
   validación antes de publicar y carga lazy. Ruta:
   `src/content/exercises/programacion/funciones-en-programacion.md` (ID canónico;
   el topic legacy conserva el archivo `funciones-programacion.md`). El `Tema:` del
   documento es `funciones-en-programacion`. El parser vive en
   `src/core/exercises/parse.js` y puede reutilizar el parser de
   bloques Markdown de spec-19 (`src/core/content/markdown.js`) sin dependencias
   nuevas. El manifiesto lazy `src/content/exercises/index.js` mapea
   `topicId → import('...md?raw')` con `import.meta.glob`.
2. **Ejercicio universal**: todos los ejercicios comparten un único esquema con todo
   lo necesario para las tres mecánicas. No hay `type: ordena|escribe|completa`; el
   juego es una vista distinta del mismo ejercicio:
   - `id`, `deckNumber`, `cardIds`, `prompt`, `language: 'javascript'`.
   - `solution`: código correcto completo.
   - `starter`: código inicial del editor.
   - `functionName`: función que se ejecuta.
   - `cases`: `[{ args: unknown[], expected: unknown }]`.
   - `template`: código con marcadores `{{blank-id}}`.
   - `blanks`: `[{ id, answer, alternatives? }]`.
   - `pieces: [{ id, code }]`: piezas ordenadas con IDs únicos; si se omiten, se
     derivan de las líneas de `solution`. La UI las baraja.
   - `explanation?`.
   Todos los ejercicios se escriben en **JavaScript ejecutable** porque el sandbox
   del navegador solo ejecuta JS y así el mismo ejercicio funciona en las tres
   mecánicas. Es un cambio deliberado frente a los fragmentos Dart de la propuesta
   anterior; ejecutar Dart queda fuera de alcance.
3. **Composición del mazo**: cada mazo tiene **exactamente 6 ejercicios**, sin
   reparto 2/2/2 y sin campo de tipo. Los 6 están disponibles en los tres juegos.
4. **Dificultad por cantidad**: `facil = 2`, `medio = 4`, `dificil = 6` ejercicios
   por sesión. La selección prioriza los ejercicios aún no aprendidos y luego los
   aprendidos, en orden de autoría; así Fácil puede recorrer el mazo en varias
   sesiones. La misma selección se usa en Normal y en Arcade y en los tres juegos.
5. **Aprendizaje del ejercicio**: estado por ejercicio
   `no-intentado | en-progreso | aprendido`.
   - `aprendido`: se resolvió correctamente al menos una vez (un reintento cuenta).
   - `en-progreso`: se intentó pero todavía no se resolvió.
   - `no-intentado`: sin intentos.
   El **nivel de ejercicios del mazo** es
   `no-iniciado | en-progreso | completado`; `completado` cuando los 6 ejercicios
   están `aprendido`, aunque se hayan resuelto en juegos, modos o sesiones distintas.
6. **Persistencia del progreso de ejercicios**: clave nueva `sepect.exercises.v1`,
   independiente de `sepect.srs.v1`. Esquema:
   `{ [topicId]: { [deckNumber]: { [exerciseId]: { attempts, correct, done,
   updatedAt } } } }`. Escritura cuota-segura, datos sanitizados y sin red. No se crea
   una segunda clave de dominio de cartas: `No aprendida / Repasar / Aprendida` sigue
   derivándose del SRS.
7. **Grading SRS**: en el primer resultado de un ejercicio se gradúan sus `cardIds`
   una sola vez por sesión: `facil` si es correcto y `otra-vez` si falla. Los
   reintentos de Normal no vuelven a graduar. El aprendizaje del ejercicio es
   independiente del SRS; un ejercicio puede quedar `aprendido` aunque sus cartas
   sigan en `Repasar`.
8. **Sandbox**: iframe oculto con `sandbox="allow-scripts"` y CSP
   `default-src 'none'; script-src 'unsafe-inline'`, sin `allow-same-origin`, sin
   red, sin storage y con timeout de 2 s. La comunicación es `postMessage`. El
   ejecutor se inyecta como prop para tests; en runtime se usa el iframe.
9. **Editor**: textarea con números de línea, monoespaciado, tab como 2 espacios y
   `Ctrl/Cmd+Enter` para ejecutar. Sin Monaco/CodeMirror ni dependencias nuevas.
10. **Sesión de código**: setup con `DeckPicker`, dificultad 2/4/6 y modo
    Normal/Arcade. Normal permite reintentar sin vidas. Arcade: 3 vidas; un ejercicio
    incorrecto resta una vida; termina a 0 vidas o al agotar el set de 2/4/6
    ejercicios elegido. Para los juegos de código, el set de ejercicios es la unidad
    de la partida; no se fuerza el mazo completo de cartas como en los juegos de
    tarjetas.
11. **Progreso visible**: el setup de los juegos de código (junto al `DeckPicker`
    compartido) y el resumen muestran `Ejercicios: X/6`, el estado del nivel y, al
    completar los 6, la etiqueta **Nivel de ejercicios completado**. El progreso se
    actualiza sin recargar; el `DeckPicker` compartido no cambia de contrato.
12. **Disponibilidad**: los 3 juegos declaran `categories: ['programacion']`,
    `needsExercises: true`, `minExercises: 2` y `minCards: 1`. `defineGame` valida
    `needsExercises`/`minExercises` de forma aditiva. El juego se habilita si el tema
    tiene manifiesto y el mazo tiene al menos 2 ejercicios; en el setup se deshabilitan
    las dificultades que no alcancen (Medio 4, Difícil 6). El validador de contenido
    exige 6 por mazo.
13. **TTS obligatorio** en los tres juegos: botón 🔊 para el prompt, mute global y
    lectura al iniciar/terminar; no se lee código ejecutable salvo petición.
14. **Sin dependencias nuevas**, sin red, sin backend y sin tocar la mecánica de los
    8 juegos existentes ni el esquema SRS.

### Formato Markdown de un ejercicio

El documento es estricto y validado; los bloques cercados son parte del formato, no
HTML ni JavaScript libre:

````md
# Funciones en Programación — Ejercicios

Tema: funciones-en-programacion

## Mazo 1

### E: suma-dos-enteros
- Cartas: que-es-una-funcion-en-dart, que-indica-el-tipo-de-retorno-de-una-funcion
- Prompt: Ordena, completa o escribe una función que sume dos enteros.
- Lenguaje: javascript

Solución:
```js
function sumar(a, b) {
  return a + b;
}
```

Starter:
```js
function sumar(a, b) {
  // tu código
}
```

Plantilla:
```js
function sumar({{a}}, {{b}}) {
  return {{op}};
}
```

Blanks:
- a = a
- b = b
- op = a + b

Función: sumar

Casos:
- [2, 3] → 5
- [-1, 1] → 0
````

`Piezas:` es opcional; si se omite, el parser deriva una pieza por línea de
`Solución`. El validador comprueba que las piezas reconstruyan la solución y que la
plantilla, al rellenar los blanks, coincida con la solución normalizada.

---

## 📖 Historias de usuario

### HU-1 — Documento de ejercicios universales por mazo
**Como** autor de contenido, **quiero** un documento Markdown con 6 ejercicios por
mazo y todos los campos de las tres mecánicas, **para** que cualquier juego pueda
usar cualquier ejercicio sin duplicar contenido.

**Criterios de aceptación:**
- [ ] AC-1: Existe
  `src/content/exercises/programacion/funciones-en-programacion.md` con
  `Tema: funciones-en-programacion` y 10 mazos (1–10). Cada mazo tiene exactamente 6
  ejercicios universales, sin reparto 2/2/2 ni campo `type`.
- [ ] AC-2: Cada ejercicio referencia al menos una carta del mazo actual y ninguna de
  otro mazo. El validador compara `cardIds` contra `buildDecks()` y falla con el ID y
  el mazo exactos.
- [ ] AC-3: IDs de ejercicio únicos, `prompt` no vacío, `language` permitido,
  `solution`/`starter`/`functionName`/`cases`/`template`/`blanks` válidos, blanks con
  IDs únicos y respuestas no vacías, piezas con IDs únicos que reconstruyen la
  solución y casos con `args`/`expected`. El validador devuelve `{ ok, errors }` sin
  lanzar.
- [ ] AC-4: El manifiesto lazy permite `hasExercises(topicId)` y
  `loadExercises(topicId)`; temas sin archivo devuelven `null`/`false`, sin error, y
  no se cargan en el bundle inicial.
- [ ] AC-5: El contenido de cada mazo no usa conceptos de mazos posteriores. La
  revisión se apoya en `cardIds` del mazo y en una checklist de autoría; el test de
  validación es obligatorio antes de cerrar cada lote.
- [ ] AC-6: Los 6 ejercicios de un mazo son compatibles con los tres juegos: no hay
  filtro por tipo y el mismo ejercicio puede abrirse en Ordena, Completa y Escribe.

### HU-2 — Ordena el código
**Como** aprendiz, **quiero** ordenar piezas de código tocándolas, **para** practicar
la estructura y el orden de cualquier ejercicio del mazo.

**Criterios de aceptación:**
- [ ] AC-7: El setup muestra `DeckPicker`, dificultad (Fácil 2 / Medio 4 / Difícil 6)
  y el número de ejercicios del mazo. Al empezar, se ve el prompt, el banco de piezas
  barajado y la zona de respuesta.
- [ ] AC-8: Se puede añadir/quitar una pieza con toque, clic o teclado; se puede
  reordenar con botones subir/bajar; el foco y los targets son accesibles.
- [ ] AC-9: «Comprobar» compara la secuencia de IDs de las piezas con el orden
  correcto. Éxito/fracaso se anuncia en `aria-live`; se muestra el orden correcto si
  falla y se permite continuar. En Arcade, un fallo resta una vida.
- [ ] AC-10: TTS lee el prompt y el resultado; el mute global se respeta. Sin scroll
  horizontal a 360 px.

### HU-3 — Completa el código
**Como** aprendiz, **quiero** rellenar las palabras clave, operadores o fragmentos que
faltan, **para** fijar la sintaxis exacta de cualquier ejercicio.

**Criterios de aceptación:**
- [ ] AC-11: El código se muestra con inputs en cada marcador `{{blank-id}}`; el resto
  del texto se conserva y los inputs tienen `aria-label`/`aria-describedby`.
- [ ] AC-12: «Comprobar» valida cada blank contra `answer`/`alternatives` con
  comparación exacta tras `trim()`; marca aciertos/errores y explica el esperado. En
  Arcade, un fallo resta una vida.
- [ ] AC-13: Se puede navegar con teclado entre blanks, el foco no se pierde y el
  resultado se anuncia. TTS lee el prompt; el código no se lee por defecto.

### HU-4 — Escribe el código
**Como** aprendiz, **quiero** escribir una función en un editor y ejecutarla, **para**
comprobar que compila y devuelve lo esperado en cualquier ejercicio.

**Criterios de aceptación:**
- [ ] AC-14: El juego muestra prompt, starter, editor con números de línea y botón
  «Ejecutar». El editor admite tabulación, `Ctrl/Cmd+Enter`, selección y undo nativo;
  no usa dependencias de editor.
- [ ] AC-15: `runCode({ code, functionName, cases, timeoutMs })` ejecuta en el sandbox
  y devuelve `{ ok, results: [{ ok, actual?, error?, expected, args }] }` o
  `{ ok: false, error }`. Se comparan valores JSON con igualdad profunda.
- [ ] AC-16: El sandbox no tiene red, storage, same-origin ni acceso al DOM de la app;
  un bucle infinito se corta a los 2 s; un error de sintaxis se muestra sin romper la
  partida. Sin iframe disponible, el juego muestra un error accesible y no bloquea el
  resto.
- [ ] AC-17: Si todos los casos pasan, el ejercicio es correcto; si falla, se muestran
  los casos y se permite reintentar en Normal. En Arcade, el fallo resta una vida.
- [ ] AC-18: TTS lee el prompt; el mute global se respeta. El editor y los resultados
  son accesibles a 360 px y con teclado.

### HU-5 — Aprendizaje del ejercicio y nivel completado
**Como** aprendiz, **quiero** saber qué ejercicios ya aprendí y cuándo completé el
nivel, **para** retomar el mazo sin repetir lo que ya domino.

**Criterios de aceptación:**
- [ ] AC-19: `exerciseStatus(entry)` es puro y devuelve
  `no-intentado | en-progreso | aprendido`; `deckExerciseMastery(...)` devuelve
  `{ status: no-iniciado|en-progreso|completado, done, total, learnedIds }`.
  `aprendido` exige una resolución correcta; un fallo deja `en-progreso`.
- [ ] AC-20: `sepect.exercises.v1` persiste el progreso por tema/mazo/ejercicio;
  datos inválidos se descartan; JSON corrupto → `{}`; cuota llena → la partida sigue
  y el aviso es no bloqueante. No se toca `sepect.srs.v1`.
- [ ] AC-21: El mazo queda **Completado** cuando sus 6 ejercicios están `aprendido`,
  aunque se hayan resuelto en juegos, modos o sesiones distintas. El estado se ve en
  el setup (junto al picker) y el resumen, y no altera las etiquetas de dominio de
  cartas.
- [ ] AC-22: La selección de dificultad devuelve 2/4/6 ejercicios, prioriza los no
  aprendidos y es la misma para los tres juegos. Si el mazo no alcanza la dificultad
  elegida, esa dificultad se deshabilita con motivo.
- [ ] AC-23: El SRS se gradúa como máximo una vez por carta y sesión: correcto
  `facil`, fallo `otra-vez`; el aprendizaje del ejercicio se registra aparte y no
  duplica claves de dominio.

### HU-6 — Integración con mazos, arcade y categorías
**Como** aprendiz, **quiero** que los tres juegos funcionen con el mismo mazo, dominio,
progreso y arcade que el resto, **para** tener una experiencia consistente.

**Criterios de aceptación:**
- [ ] AC-24: Los 3 juegos se registran con IDs `ordena-codigo`, `escribe-codigo` y
  `completa-codigo`, `categories: ['programacion']`, `needsExercises: true`,
  `minExercises: 2`, `minCards: 1`; la disponibilidad por mazo exige manifiesto y al
  menos 2 ejercicios. En el setup, las dificultades sin ejercicios suficientes se
  deshabilitan con motivo.
- [ ] AC-25: `TopicView` los muestra en Programación; si el tema no tiene manifiesto,
  aparecen como «Próximamente» deshabilitados. `GameHost` carga el documento lazy,
  valida el mazo, pasa `exercises`, `exerciseProgress` y `onExerciseResult` al juego;
  un mazo con menos de 2 ejercicios no se abre.
- [ ] AC-26: Los 3 juegos usan `DeckPicker`, `deckMastery`, `arcade.js` y el grading
  compartido. En Arcade usan el set de 2/4/6 ejercicios elegido, con 3 vidas, score,
  récord y resumen; no se fuerza el mazo completo de cartas.
- [ ] AC-27: TTS y mute obligatorios en los tres. Sin imports de storage/router/parser
  en los juegos; todo por props.
- [ ] AC-28: `npm test`, `npm run lint` y `npm run build` pasan al 100%; sin
  dependencias nuevas ni red.

---

## 🚧 Restricciones arquitectónicas

- El contenido vive en `src/content/exercises/` y se carga lazy; no se importa en el
  bundle inicial.
- `src/core/exercises/` contiene parser, validador, selección y progreso puros; no
  conoce React ni storage.
- `src/core/storage/exercises.js` es la única capa que persiste
  `sepect.exercises.v1`.
- `src/core/code/` contiene el ejecutor y el builder del sandbox; no importa storage.
- `src/games/code-common/` comparte shell/editor/piezas; los 3 juegos solo aportan su
  mecánica.
- Los juegos no leen el documento ni el progreso directamente: reciben `exercises`,
  `exerciseProgress`, `onExerciseResult` y `onGrade` por props.
- `GameHost` es el único que carga ejercicios, progreso y persiste arcade.
- No se cambia el esquema SRS ni se crea una clave de dominio de cartas.

## ⚠️ Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Tema sin ejercicios | Juegos «Próximamente»; ruta directa no disponible |
| Mazo con menos de 6 ejercicios | Dificultad insuficiente deshabilitada; contenido no se publica |
| Ejercicio con carta de otro mazo | Validador falla; no se publica el contenido |
| `cardIds` vacío | Validador falla |
| Blanks sin respuesta o IDs repetidos | Validador falla |
| Piezas que no reconstruyen la solución | Validador falla |
| Plantilla que no coincide con la solución | Validador falla |
| Código con error de sintaxis | Sandbox devuelve error; se muestra y no rompe |
| Código con `</script>` o HTML | Se escapa antes de inyectarlo; no rompe el sandbox |
| Bucle infinito | Timeout 2 s; se destruye el iframe |
| iframe bloqueado | Estado de error accesible; reintento/volver |
| Intento de red/storage | CSP/sandbox lo bloquea; el resultado es error |
| Salir a mitad | No se gradúan cartas no resueltas; si ya hubo intento el ejercicio queda `en-progreso`, si no, `no-intentado` |
| Arcade con 1 vida | Fallo termina; resumen y récord |
| Ejercicio aprendido en otro juego | Se refleja como `aprendido` en los tres |
| Los 6 ejercicios aprendidos | Nivel `completado` persistente |
| Dificultad Fácil con 6 pendientes | Juega 2; las siguientes sesiones priorizan los pendientes |
| `exercises` no cargado | Loading/error; no crash |
| Móvil 360 px | Editor/piezas/results sin scroll horizontal |

---

## 🧪 Contrato de pruebas

```
ENTRADA: markdown de ejercicios
SALIDA: {
  topicId,
  decks: [{ number, exercises: Exercise[6] }],
  errors: string[]
}

Exercise = {
  id, deckNumber, cardIds, prompt, language: 'javascript',
  solution, starter, pieces: [{ id, code }], template, blanks, functionName, cases,
  explanation?
}

ENTRADA: validateExercises(topicId, data, { cards, decks })
SALIDA: { ok: boolean, errors: string[] }

ENTRADA: selectExercises(data, deckNumber, { count, progress })
SALIDA: Exercise[] (2/4/6, pendientes primero)

ENTRADA: exerciseStatus(entry)
SALIDA: 'no-intentado' | 'en-progreso' | 'aprendido'

ENTRADA: deckExerciseMastery(deckNumber, exercises, progress)
SALIDA: { status: 'no-iniciado'|'en-progreso'|'completado', done, total, learnedIds }

ENTRADA: runCode({ code, functionName, cases, timeoutMs: 2000 })
SALIDA: { ok: true, results: [{ ok, actual?, error?, expected, args }] }
        | { ok: false, error }
```

**Tests mínimos:**
- `exercises.test.js`: parser Markdown, 6 universales por mazo, 10 mazos,
  `cardIds` del mazo, IDs únicos, future-deck rejection, blanks/cases/plantilla,
  manifiesto lazy, path traversal.
- `functions-exercises.test.js`: contenido real de Funciones, 60 ejercicios, todos
  validan; revisión de `cardIds`.
- `exerciseProgress.test.js`: estados, aprendizaje, nivel completado, selección
  2/4/6 con pendientes primero.
- `exerciseStore.test.js`: persistencia, corrupción, cuota, aislamiento de SRS.
- `sandbox.test.js`: builder CSP, mensajes, timeout, error de sintaxis, deep equal,
  fallback sin iframe.
- `CodeGameShell.test.jsx`: deck picker, dificultad, modos, TTS, progreso, grading,
  arcade, resumen.
- `OrdenaCodigo.test.jsx`, `CompletaCodigo.test.jsx`, `EscribeCodigo.test.jsx`:
  mecánica con ejercicios universales, teclado, feedback, fallos, a11y.
- Test cruzado: el mismo `Exercise` se abre en los 3 juegos y los 3 reflejan el
  progreso; completar los 6 en distintos juegos deja el nivel completado.
- Router/GameHost/TopicView: categoría, needsExercises, lazy, mazo sin ejercicios,
  progreso persistido.
- Aislamiento de los 3 juegos.
- Gates completos.

---

## 🚫 Fuera de alcance

- Ejercicios de otros temas (solo queda el formato listo).
- Ejecutar Dart u otros lenguajes en el sandbox.
- Monaco/CodeMirror, IA, corrección semántica avanzada o tests generados.
- Backend, red, cuentas o sincronización.
- Cambiar la mecánica de los 8 juegos existentes.
- Añadir más de 6 ejercicios por mazo.
- Cambiar el esquema SRS o las etiquetas de dominio de cartas.

---

## ✍️ Firma

- [x] Spec revisada y firmada por humano: **Eduardo — 2026-10-23**
- [ ] `specs/tasks-21-juegos-codigo-ejercicios.md` revisado
