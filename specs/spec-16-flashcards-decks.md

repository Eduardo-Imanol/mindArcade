# spec-16 — Flashcards por mazos

> Estado: 🟡 draft (pendiente de firma). Creado el 2026-10-22 por opencode tras confirmación explícita del usuario.
> Incremento: Flashcards con selección de mazos fijos de 10 cartas en orden de contenido, barra de progreso por mazo y modo estudio/resumen sin romper el resto de juegos.

## Objetivo
Añadir una pantalla de selección de mazos a Flashcards (bloques consecutivos de 10), barajado solo dentro del mazo seleccionado, progreso derivado del SRS existente («calificada al menos una vez»), comportamiento de reanudación/repaso/completado y resumen al finalizar. No se añade ninguna clave nueva a localStorage.

## Alcance
- Nuevos: `src/core/repetition/flashcardDecks.js` (+tests). Lógica de sesión en `src/games/flashcards/flashcards.logic.js` ampliada.
- Modificados: `src/games/flashcards/Flashcards.jsx`, `src/views/GameHost.jsx`, `src/ui/tokens.css`, tests afectados.
- Reutilizado: `src/components/GameSetup.jsx`.
- Sin cambios: `src/core/repetition/selectStudyCards.js`, `src/core/repetition/srs.js`, lógica global de XP/guardado, gate de disponibilidad, otros 7 juegos.

## Decisiones confirmadas
- **Mazos por orden**: 1–10, 11–20, ..., último parcial. Sin secciones semánticas.
- **Tamaño fijo**: 10 (no configurable).
- **Estudiada**: carta calificada al menos una vez. Derivado del estado SRS (`reps`/entrada válida); sin clave nueva.
- **Salida a mitad**: solo se guardan cartas calificadas; las pendientes quedan sin emitir `otra-vez`.
- **Barajado**: solo dentro del mazo seleccionado.
- **Composición**: los mazos incluyen todas las cartas del tema (aunque estén aprendidas/no vencidas). La sesión usa pendientes o todas en modo repaso.
- **Compatibilidad**: si `Flashcards` se usa sin `decks`, conserva el modo legacy directo.
- **Gate**: se mantiene el gate actual de elegibles; no se modifica.

## Contrato
- `GameHost` construye `decks = buildFlashcardDecks(cards, srs[topic.id])` y pasa `decks` (y opcionalmente `deck` legacy) a Flashcards.
- `Flashcards({ deck, decks, onGrade, onExit, onBackToTopic, ... })`. Si hay `decks`, muestra setup primero.
- `buildFlashcardDecks(cards, srsTopic, { size=10 } = {})` devuelve array de `{ id, number, label, from, to, cards, total, studied, studiedIds, pending, complete }`. `cards` en orden del tema; `studied` = nº con estado SRS válido; `pending` = tarjetas sin estado SRS.
- Estado de sesión: `sessionDeck` (pendientes barajadas o todas barajadas en repaso), `index`, `flipped`, `gradedIds` (Set), `phase` (`setup|playing|summary`), `complete`. La sesión finaliza solo cuando todas las cartas de la sesión están calificadas.

## Criterios de aceptación
- **AC-1 Setup**: Al recibir `decks`, Flashcards muestra pantalla de selección antes de la primera carta (mazo, progreso, estado, CTA).
- **AC-2 Chunking**: Se generan mazos consecutivos de 10 en orden del tema; último mazo parcial correcto.
- **AC-3 Barajado**: Solo se baraja dentro del mazo seleccionado; el orden global nunca se mezcla entre mazos.
- **AC-4 Progreso**: «Estudiada» = tiene estado SRS. Se muestra `X/Y estudiadas`. `pending` excluye estudiadas.
- **AC-5 Reanudación/repaso**: Mazo parcial → sesión con solo pendientes (barajadas). Mazo completo → «Repasar mazo» con las 10 (barajadas). Al marcar todas calificadas, pasa a completado.
- **AC-6 Calificación**: Al calificar se emite a `onGrade(card.id, grade)` una sola vez por carta. No hay doble emisión por doble clic. Se persiste vía mecanismo existente.
- **AC-7 Completado real**: El mazo se marca completado cuando todas las cartas de la sesión fueron calificadas. Si hay una sin calificar, la UI vuelve a ella.
- **AC-8 Salida a mitad**: Al salir con cartas sin calificar, no se emite `otra-vez` por ellas. Solo lo ya calificado persiste.
- **AC-9 Resumen**: Al finalizar la sesión muestra mazo completado, aciertos/fallos/XP de la sesión y acciones (siguiente mazo / repetir / elegir mazo / volver al tema).
- **AC-10 Legacy**: Sin `decks`, `<Flashcards deck={...} />` mantiene comportamiento directo idéntico a antes.
- **AC-11 A11y/TTS**: Setup y sesión accesibles (teclado, foco, targets ≥44px), TTS disponible y `SoundToggle` presente. Respeta reduced-motion.
- **AC-12 Aislamiento**: El juego no accede directo a storage/parser/router; todo por props. Imports directos coherentes con aislamiento.
- **AC-13 No regresiones**: `npm test`, `npm run lint`, `npm run build` en verde. Otros 7 juegos sin cambios funcionales. Test AC-14 de GameHost reubicado a otro juego.

## Pruebas clave
- `flashcardDecks.test.js`: chunking, último parcial, progresión con SRS, estudio/pendiente.
- `flashcards.logic.test.js`: start con pendientes/todo, barajado, `gradedIds`, finalización, no recalificación.
- `Flashcards.a11y.test.jsx`: setup presente con `decks`, selección de mazo, a11y.
- `flashcards.isolation.test.js`: contrato con `decks`.
- `GameHost.test.jsx`: pasa `decks`, reubica AC-14.

## Fuera de alcance
- Cambiar gate de disponibilidad. Cambiar métricas globales del tema. Añadir clave localStorage. Configurar tamaño de mazo. Nuevos juegos.
