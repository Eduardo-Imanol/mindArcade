---
feature: integracion-hardening
status: signed
owner: Eduardo
created: 2026-10-23
updated: 2026-10-23
related_tasks: specs/tasks-23-integracion-hardening.md
---

# Spec — Integración y hardening (spec-23)

> [!abstract] Resumen
> Cierra el programa de 9 cambios verificando que biblioteca, mazos, dominio, arcade,
> lector/TTS, categorías, juegos de código y Ahorcado conviven sin regresiones.
> No añade features nuevas: audita dependencias, ejecuta la matriz de integración,
> mide rendimiento/accesibilidad, blinda storage/cuota y actualiza documentación.

| Campo | Valor |
|---|---|
| Estado | ✅ Firmada — Eduardo aprobó la spec por chat (2026-10-23) |
| Escala | Media (auditoría + integración + gates) |
| Fecha | 2026-10-23 |
| Revisada por | Eduardo — 2026-10-23 |

---

## 🎯 Decisiones firmadas (2026-10-23)

1. **Orden de integración por fases**: Fase 1 spec-17 → spec-19; Fase 2 spec-18;
   Fase 3 spec-20 ∥ spec-22; Fase 4 spec-21; Fase 5 spec-23. Dentro de cada fase se
   firma e implementa una spec antes de la siguiente; spec-20 y spec-22 pueden ir en
   paralelo porque no comparten archivos.
2. **Sin features nuevas**: los bugs encontrados se corrigen dentro de la spec que
   los originó; spec-23 solo integra, documenta y verifica. Un cambio de alcance
   requiere spec nueva.
3. **Matriz manual/automatizada** por ruta y por juego; incluye deep links, recarga,
   atrás, móvil 360 px, teclado y lector de pantalla.
4. **Storage**: auditar `sepect.srs.v1`, `sepect.profile.v1`, `sepect.settings.v1`,
   `sepect.arcade.v1`, `sepect.exercises.v1` y custom topics; sin colisiones,
   migraciones ni pérdida de progreso. Cuota/errores manejados como hoy
   (cuota-seguro).
5. **Rendimiento**: el bundle inicial no incluye sources ni ejercicios; los juegos se
   cargan bajo demanda; el juego mantiene 60 fps y pausa en `visibilitychange`.
6. **PWA/offline**: no se cambia la estrategia del service worker salvo que un nuevo
   asset local lo requiera; no hay red para progreso/XP/historial.
7. **Cierre**: `spec-16` se renombra/cierra, `MEMORY.md` y `FOCUS.md` quedan limpios,
   y el programa se declara terminado solo con todos los gates en verde.

---

## 🗂️ Fases de ejecución propuestas

| Fase | Specs | Objetivo | Tareas interiores |
|---|---|---|---|
| 1 | `spec-17` → `spec-19` | Biblioteca por categorías/módulos y lector de fuente con TTS | 17: T1–T9; 19: T1–T7 |
| 2 | `spec-18` | Mazos de 10, dominio compartido y Arcade en los 8 juegos | 18: T1–T16 |
| 3 | `spec-20` ∥ `spec-22` | Alcance de juegos por categoría e inversión del Ahorcado | 20: T1–T4; 22: T1–T4 |
| 4 | `spec-21` | 6 ejercicios universales por mazo + 3 juegos de código + progreso | 21: T1–T21 |
| 5 | `spec-23` | Integración, hardening, matrices, docs y cierre | 23: T1–T5 |

Reglas de ejecución:

- Una spec se firma antes de implementarse; no se mezclan ACs de dos specs en un
  mismo diff salvo dependencia explícita.
- Al cerrar cada spec: tests/lint/build al 100%, ACs marcados, tasks archivadas,
  `MEMORY.md` actualizado y `FOCUS.md` limpio.
- `spec-17` T3 es el dueño único de `src/core/content/sources.js`; `spec-19` T1 lo
  verifica y extiende, no lo duplica.
- `spec-21` depende del parser Markdown de `spec-19`, de los mazos/arcade de
  `spec-18` y del filtro por categoría de `spec-20`.
- En la Fase 4, T1–T4 (parser, progreso, sandbox y editor) van antes que las
  mecánicas; el contenido T9–T18 puede prepararse en borradores paralelos tras T1,
  pero la integración al documento único y su validación son secuenciales; T19 espera
  a los 10 mazos.

---

## 📖 Historias de usuario

### HU-1 — Programa integrado sin regresiones
**Como** mantenedor, **quiero** que las 7 specs convivan y que todo lo anterior siga
funcionando, **para** poder publicar sin deuda oculta.

**Criterios de aceptación:**
- [ ] AC-1: Las specs 17–22 están firmadas, implementadas y sus tasks cerradas; se
  respetó el orden por fases (17 → 19 → 18 → 20 ∥ 22 → 21). `spec-16` está
  renombrada/cerrada.
- [ ] AC-2: Matriz de rutas verde: `#/`, `#/categoria/:id`, `#/tema/:id`,
  `#/tema/:id/fuente`, `#/tema/:id/juego/:gameId`, `#/progreso`,
  `#/configuracion` y `#/personalizados`; deep link, recarga y atrás funcionan.
- [ ] AC-3: Matriz de juegos verde: los 11 juegos (8 existentes, incluido Ahorcado, +
  3 de código) con mazos, dominio, arcade, récords, TTS/mute y «Próximamente» donde
  corresponde. Los juegos de código comparten los 6 ejercicios universales del mazo,
  permiten dificultad 2/4/6 y reflejan el nivel de ejercicios completado.
- [ ] AC-4: Sin colisiones de storage ni pérdida de progreso al actualizar desde una
  versión previa; `sepect.exercises.v1` convive con SRS/arcade sin duplicar dominio;
  cuota llena/errores no rompen la app; custom topics siguen funcionando sin source.
- [ ] AC-5: El bundle inicial no incluye documents/exercises; el lector y los juegos
  de código cargan lazy. No hay regresiones de 60 fps, pausa en hidden ni memoria.
- [ ] AC-6: A11y: navegación completa por teclado, foco visible, headings, labels,
  `aria-live` sin ruido, contraste y 360 px sin scroll horizontal en las vistas
  nuevas. TTS/mute consistente.
- [ ] AC-7: `npm test`, `npm run lint` y `npm run build` pasan al 100%; sin
  dependencias nuevas, sin red para progreso/XP/historial y sin secretos.
- [ ] AC-8: `docs/architecture.md`, `docs/testing.md`, `docs/manual-a11y-checklist.md`,
  `MEMORY.md` y `FOCUS.md` reflejan el estado final; no quedan TODOs de las specs.
- [ ] AC-9: Cualquier bug encontrado tiene test de regresión y se corrige en la spec
  de origen; spec-23 no introduce lógica de producto nueva.

---

## 🚧 Restricciones arquitectónicas

- No se reabren decisiones firmadas de specs 17–22 sin spec nueva.
- No se añaden dependencias, backend, cuentas ni sincronización.
- No se cambia el esquema SRS ni se duplica el dominio.
- El service worker solo se toca si un asset local nuevo lo exige.
- Los tests de integración no dependen de red ni de tiempo real.

## ⚠️ Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Actualización con progreso previo | Sin pérdida; keys compatibles |
| Storage lleno/corrupto | Mensaje/cuota-seguro, app usable |
| Tema custom | Sin source; juegos globales; sin crash |
| Tema de programación sin ejercicios | 3 juegos «Próximamente» |
| Mazo con 6 ejercicios | Dificultad 2/4/6 y tres juegos comparten el mismo set |
| Los 6 ejercicios aprendidos | Nivel «completado» persistente, sin alterar dominio de cartas |
| Ejercicio resuelto en otro juego | Se refleja como aprendido en los tres |
| Deep link a fuente/juego | Carga/errores controlados |
| Navegación rápida | Sin TTS/iframe/intervalos huérfanos |
| Móvil 360 px | Sin overflow en todas las vistas |
| PWA offline | App shell y assets locales; sin red de datos |
| Spec-16 con nombre corrupto | Renombrada y cerrada con evidencia |

---

## 🧪 Contrato de pruebas

**Matriz mínima:**

```
Rutas: /, /categoria/:id, /tema/:id, /tema/:id/fuente,
       /tema/:id/juego/:gameId, /progreso, /configuracion, /personalizados
Juegos: 8 existentes (incluido Ahorcado) + ordena/escribe/completa
Ejercicios: 6 universales por mazo, dificultad 2/4/6, progreso y nivel completado
Estados: sin datos, con progreso, todo aprendido, storage lleno,
         source ausente, ejercicios ausentes, TTS no soportado
Dispositivos: 360, 768, desktop; teclado; VoiceOver
```

**Tests/gates:**
- Suite completa + tests de integración de rutas/storage.
- Snapshot/medición de bundle (sin sources/exercises en el inicial).
- `npm test`, `npm run lint`, `npm run build` al 100%.
- Checklist manual firmado.

---

## 🚫 Fuera de alcance

- Features nuevas o cambios de UX no especificados.
- Backend, sincronización, cuentas o analítica remota.
- Reescritura de juegos existentes.
- Cambios de esquema SRS o de contenido no planificados.
- Publicación/deploy (solo se deja listo).

---

## ✍️ Firma

- [x] Spec revisada y firmada por humano: **Eduardo — 2026-10-23**
- [ ] `specs/tasks-23-integracion-hardening.md` revisado
