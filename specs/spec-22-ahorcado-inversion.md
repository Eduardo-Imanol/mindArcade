---
feature: ahorcado-inversion
status: signed
owner: Eduardo
created: 2026-10-23
updated: 2026-10-23
related_tasks: specs/tasks-22-ahorcado-inversion.md
---

# Spec — Ahorcado: palabra arriba y pista abajo (spec-22)

> [!abstract] Resumen
> Corrige la jerarquía visual del Ahorcado: la **palabra/guiones** debe ocupar la
> posición principal (arriba) y la **pista** debe quedar debajo. La inversión es
> obligatoria: el DOM actual pinta la pista antes que la palabra y se corrige. No hay
> no-op ni verificación condicional. No cambia la lógica, el scoring, las vidas, el
> SRS ni el TTS.

| Campo | Valor |
|---|---|
| Estado | ✅ Firmada — Eduardo aprobó la spec por chat (2026-10-23) |
| Escala | Micro (layout + a11y + verificación visual) |
| Fecha | 2026-10-23 |
| Revisada por | Eduardo — 2026-10-23 |

---

## 🎯 Decisiones firmadas (2026-10-23)

1. **Inversión obligatoria**: el DOM actual (`Ahorcado.jsx:199-232`) pinta `card.back`
   (pista) antes de `card.front` (palabra). Se invierte siempre; las capturas
   before/after a 360, 768 y desktop solo documentan la evidencia, no condicionan el
   cambio.
2. **Orden final**: arriba la palabra (slots/letras descubiertas), debajo la pista y
   el estado de intentos. El arte decorativo se mantiene en su bloque y no puede
   quedar por encima de la palabra. El teclado/acciones quedan al final.
3. **Cambio mínimo**: mover el bloque de la palabra antes de la pista en
   `Ahorcado.jsx` y, si hace falta, ajustar los estilos
   `.ahorcado-word`/`.ahorcado-hint`. No se reescribe el juego; el arte y el muñeco
   conservan su diseño.
4. **Semántica**: el orden del DOM debe coincidir con el visual. La pista lleva
   `aria-label="Pista"`; la palabra se anuncia como progreso (`aria-live` ya
   existente). No se duplica texto oculto.
5. **Responsive**: la palabra puede partirse en varias líneas sin desbordar a
   360 px; la pista se trunca/expande sin tapar la palabra.
6. **Sin cambios** en `MAX_MISTAKES`, scoring, arcade, `onGrade`, TTS ni mazo.
7. **Sin dependencias nuevas**; solo CSS/JSX/tests.

---

## 📖 Historias de usuario

### HU-1 — Ver la palabra antes que la pista
**Como** aprendiz, **quiero** ver la palabra/guiones como elemento principal y la
pista debajo, **para** intentar recordar antes de mirar la ayuda.

**Criterios de aceptación:**
- [ ] AC-1: A 360, 768 y desktop, la palabra/slots aparece **arriba** y la pista
  **debajo**, con separación visible y sin solaparse. Evidencia: captura before/after
  y `getBoundingClientRect()` con `word.top < hint.top`. El cambio es obligatorio.
- [ ] AC-2: La pista conserva su contenido y estilo; no se elimina ni se oculta. El
  estado de intentos/vidas sigue visible y cerca de la pista.
- [ ] AC-3: El orden del DOM coincide con el visual: palabra → pista → intentos →
  teclado; el arte decorativo puede intercalarse y no cuenta para el orden semántico.
  La pista tiene label accesible y la palabra mantiene su `aria-live` sin anuncios
  duplicados.
- [ ] AC-4: La mecánica no cambia: letras correctas/incorrectas, `MAX_MISTAKES`,
  vidas de arcade, grados `facil`/`otra-vez`, score y récord siguen igual.
- [ ] AC-5: El botón de TTS y el mute global siguen funcionando; el orden no altera
  la lectura en voz alta.
- [ ] AC-6: No se acepta no-op: el orden final del DOM y el visual debe ser
  palabra → pista → intentos → teclado, aunque una medición previa sugiera que ya
  estaba correcto.
- [ ] AC-7: `npm test`, `npm run lint` y `npm run build` pasan al 100%; sin
  dependencias nuevas ni red.

---

## 🚧 Restricciones arquitectónicas

- `Ahorcado.jsx` sigue siendo un juego aislado; no importa storage/router/parser.
- El cambio no toca `src/core/repetition`, `arcade.js`, `GameHost` ni el contenido.
- Los tests de layout no dependen de píxeles reales: validan orden DOM y, cuando se
  pueda, `getBoundingClientRect()` con jsdom mockeado.
- La verificación visual manual es obligatoria porque jsdom no calcula layout.

## ⚠️ Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Palabra larga | Wrap a varias líneas sin tapar la pista |
| Pista larga | Debajo, sin scroll horizontal; puede expandirse |
| Pantalla 360 px | Orden correcto, targets ≥44 px |
| Lector de pantalla | Lee palabra, pista e intentos en orden |
| Reduced motion | Sin animación añadida |
| TTS activo | No se duplica la lectura |
| Medición previa ya correcta | Se fuerza igualmente palabra → pista; el test lo impide |
| Arcade con 1 vida | Sin cambios de lógica |

---

## 🧪 Contrato de pruebas

```
SALIDA DOM: [data-testid="ahorcado-word"] antes de [data-testid="ahorcado-hint"]
SALIDA VISUAL (manual): word.top < hint.top en 360/768/desktop
```

**Tests mínimos:**
- `Ahorcado.test.jsx`: orden DOM, labels, `aria-live`, teclado, TTS/mute.
- Test de no regresión: letras/vidas/scoring/arcade sin cambios.
- Capturas manuales before/after (360, 768, desktop).

---

## 🚫 Fuera de alcance

- Rediseñar el Ahorcado o el dibujo del muñeco.
- Cambiar palabras, pistas, mazos, vidas o scoring.
- Añadir animaciones o dependencias.
- Cambiar el layout de otros juegos.

---

## ✍️ Firma

- [x] Spec revisada y firmada por humano: **Eduardo — 2026-10-23**
- [ ] `specs/tasks-22-ahorcado-inversion.md` revisado
