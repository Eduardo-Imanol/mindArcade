---
name: audio-fx-integration
description: Efectos de sonido WebAudio sin assets pesados, toggle global y respeto a autoplay en mindArcade.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: audio
  scope: mindArcade
---

# Audio FX Integration

## Manager
```js
// src/audio/fx.js
let ctx=null, enabled=true;
export function beep(freq=440,dur=0.1,type='square'){
  if(!enabled) return;
  ctx??=new (window.AudioContext||window.webkitAudioContext)();
  const o=ctx.createOscillator(), g=ctx.createGain();
  o.type=type; o.frequency.value=freq;
  g.gain.setValueAtTime(0.15,ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+dur);
  o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime+dur);
}
export const sfx={ ok:()=>beep(880,0.12), fail:()=>beep(160,0.2,'sawtooth'), click:()=>beep(600,0.05), win:()=>{beep(523,.1);setTimeout(()=>beep(784,.15),100)} };
export function setSound(v){ enabled=v; store.set({settings:{...store.get().settings,sound:v}}) }
```

## Reglas
1. **WebAudio sintetizado**, cero mp3 salvo música (y entonces lazy-load).
2. AudioContext solo tras gesto de usuario (autoplay policy).
3. Toggle en settings + tecla `M`, persistido.
4. Volumen bajo (gain 0.15), sonidos <200ms salvo win.
5. `destroy()` de juego corta sonidos pendientes.

## TTS obligatorio (spec-03 — todo juego)
- Todo juego DEBE leer los textos en voz alta con **Web Speech API** (gratis, 0 deps): helper compartido `src/core/audio/tts.js`.
- Patrón requerido: lectura automática al voltear/interactuar (tras gesto de usuario) + botón 🔊 por carta/elemento + toggle global de sonido persistido en `sepect.settings.v1 = { muted }`.
- `speak(text, {lang})` cancela utterance previo (rate 0.9, pitch 1.1), selecciona voz por prefijo de idioma; `isSupported()` false → ocultar controles, nunca crashear.
- Flashcards y Memorama (spec-03) son la referencia de integración.

## Cuándo usar
Al añadir feedback de acierto/fallo/click/win o texto leído en voz alta (TTS) en cualquier juego.
