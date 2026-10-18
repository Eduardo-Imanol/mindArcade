---
name: topic-parser-engine
description: Parser de tópicos para mindArcade que convierte Markdown o JSON en preguntas y niveles validados.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: content-pipeline
  scope: mindArcade
---

# Topic Parser Engine

## Formato de entrada
```md
# Tema: JavaScript Básico
- q: ¿Qué es `let`? | a: Declaración mutable | distractors: Función,Clase,Loop | d:1
- q: ¿Símbolo de spread? | a: ... | distractors: {},[],=> | d:2
```

## Parser
```js
// src/topics/parser.js
export function parseTopic(text){
  const items=[];
  for(const line of text.split('\n')){
    const m=line.match(/- q:(.+)\| a:(.+)\| distractors:(.+)\| d:(\d)/);
    if(!m) continue;
    const [,q,a,distractors,d]=m.map(s=>s.trim());
    items.push({q, a, options:shuffle([a,...distractors.split(',')]), d:+d});
  }
  return validate(items);
}
function validate(items){
  return items.filter(i=>i.q && i.a && i.options.length>=3);
}
```

## Reglas
1. **Validación estricta:** sin respuesta o sin 3+ opciones = descartado + warn en consola.
2. **Dificultad 1-5** obligatoria, sirve a spaced-repetition.
3. **Soporta .md y .json** con mismo output `{q,a,options,d,topic}`.
4. **Sanitiza HTML** antes de render (anti-XSS).
5. Tests en `topics/parser.test.js` para cada sintaxis nueva.

## Cuándo usar
Al añadir tópicos, importar contenido o cambiar formato de preguntas.
