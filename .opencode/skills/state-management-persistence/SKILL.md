---
name: state-management-persistence
description: Store central reactivo para mindArcade con persistencia localStorage e IndexedDB, progreso y rachas.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: state
  scope: mindArcade
---

# State Management + Persistence

## Store mínimo
```js
// src/state/store.js
export const store = {
  state: { user:{xp:0,streak:0}, progress:{}, settings:{sound:true} },
  subs: new Set(),
  get(){ return this.state },
  set(patch){ Object.assign(this.state, patch); this.save(); this.emit() },
  subscribe(fn){ this.subs.add(fn); return ()=>this.subs.delete(fn) },
  emit(){ this.subs.forEach(f=>f(this.state)) },
  save(){ localStorage.setItem('mindarcade', JSON.stringify(this.state)) },
  load(){ try{ Object.assign(this.state, JSON.parse(localStorage.getItem('mindarcade')||'{}')) }catch{} }
}
```

## Reglas
1. **Un solo store.** Los juegos leen/escriben vía `store.get()/set()`, nunca estado global suelto.
2. **Persistencia:** `localStorage` para settings/progreso ligero, `IndexedDB` para historial grande.
3. **Versiona la key:** `mindarcade:v1`. Al cambiar schema, migra, no borres.
4. **Debounce save:** 300ms para no escribir en cada frame.
5. **Settings de sonido/accesibilidad** siempre persistidos.

## Cuándo usar
Guardar XP, nivel, tópico desbloqueado, racha, o al añadir nueva opción global.
