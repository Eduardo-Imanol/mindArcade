# Extracción exhaustiva de un source

Objetivo: descomponer el source en unidades de estudio jugables, sin perder
conceptos y sin duplicar ideas. El tema **no es un resumen**: es el source
convertido en preguntas atómicas que se puedan repetir con SRS.

## Paso 0 — Inventario

Antes de escribir una sola carta:

1. Cuenta líneas y secciones del source.
2. Clasifica el documento (guía técnica, lenguaje/API, idiomas, historia,
   procedimientos, mixto).
3. Aplica el tramo de densidad.
4. Anota la ruta del source y el H1 exacto (de ahí sale el `topic-id`).

Comandos de apoyo:

```bash
wc -l src/content/sources/<slug>.md
grep -n '^## ' src/content/sources/<slug>.md
grep -n '^### ' src/content/sources/<slug>.md
```

### Tramos de densidad

| Líneas del source | Cartas objetivo |
|---|---|
| < 300 | 20–40 |
| 300–800 | 40–80 |
| 800–1.500 | 80–120 |
| > 1.500 | 120–200 |

El tramo es una guía, no una cuota rígida: si el source tiene 40 conceptos
distintos en 200 líneas, manda la cobertura conceptual. Reporta el tramo aplicado.

Referencia del propio repo para calibrar el tramo:

| Source | Líneas | Secciones | Resultado |
|---|---|---|---|
| `src/content/sources/dart-funciones.md` | 879 | 19 H2 · 63 H3 | 96 cartas (`funciones-programacion`) |
| `src/content/sources/dart-estructuras-datos.md` | 2.218 | 18 H2 (0–17) · 76 H3 | 120–200 cartas; cuota ≈156 |

## Paso 1 — Mapa de cobertura

Construye esta tabla **antes** de redactar. Una fila por H2 (y H3 cuando aporte
conceptos propios).

| Sección | Líneas | Conceptos detectados | Cuota | Cartas finales | Estado |
|---|---|---|---|---|---|
| 1. <H2> | 0–0 | definición, operación, complejidad | 6 | 6 | ✅ |
| 2. <H2> | 0–0 | … | 8 | 7 | ⚠️ falta matiz |

Reglas:

- Toda sección con contenido conceptual recibe al menos una carta.
- Una sección con N conceptos atómicos recibe N cartas, sujeto al tramo.
- Si el tramo obliga a recortar, prioriza: definición → operaciones → complejidad
  → invariantes → casos límite → trade-offs → casos de uso → anécdotas.
- Toda sección omitida se justifica por escrito (p. ej. «índice», «lecturas
  recomendadas», «apéndice de instalación»).
- El orden de las cartas sigue el orden del source.

### Criterios de omisión justificada

Una sección puede quedar sin cartas solo si cumple uno de estos criterios y queda
anotada en el mapa de cobertura con su motivo:

| Criterio | Ejemplo |
|---|---|
| Índice o navegación | Índice o tabla de contenidos del documento |
| Bibliografía o lecturas | «17. Lecturas recomendadas» |
| Práctica sin concepto | «19. Ejercicios sugeridos» |
| Repetición literal de otra sección | Tabla duplicada |
| Ejemplo ya cubierto | El código de ejemplo de una idea ya redactada |
| Fuera del alcance del tema | Apéndice de tooling o de instalación |

Una sección que parece un índice pero además fija un esquema común o unas
convenciones (por ejemplo «0. Mapa de la guía») no es una omisión: es contenido y
se cubre con cartas.

Cada omisión se registra con: sección, motivo y, si aplica, la carta que la cubre.
«Me parece demasiado advanced» no es un motivo: es una prioridad, no una omisión.

## Paso 2 — Redacción de cartas

### Reglas de `Q`

- Autocontenida: se entiende sin leer las cartas vecinas.
- Una sola idea por pregunta.
- No copies el heading tal cual; conviértelo en pregunta real.
- Sin `|` (el parser lo absorbe y ensucia el id o los cortes de campo).
- Sin markdown, sin bloques de código y sin enlaces.
- Español neutro; conserva el término técnico original cuando sea el concepto
  (p. ej. `closure`, `heap`, `union-find`).

### Reglas de `A`

- Responde en 1–2 frases.
- Incluye el dato exacto cuando el source lo da (complejidad, invariante,
  restricción, nombre de la operación).
- No remite a «el código anterior» ni a «la sección de arriba».
- Sin `|`: el parser lo absorbe dentro del campo y corrompe el resultado.
- Si la respuesta necesita dos matices distintos, probablemente sean dos cartas.

### Reglas de `E`

| Valor | Cuándo |
|---|---|
| `easy` | Definición, dato directo, para qué sirve, operación básica |
| `hard` | Complejidad, excepción, invariante, trade-off, caso límite, variante |

No uses `medium` ni valores numéricos. El parser solo acepta `easy` y `hard`.

### Reglas de `I`

Toda carta lleva `I: asset:<topic-id>/<card-id>.svg`. El arte se genera después;
nunca se escribe a mano.

### Reglas de la descripción del tema

- Sale del source: no inventes el propósito del tema.
- Una sola línea, ≤160 chars, sin markdown.
- Sin prefijos `>` ni `|`: el parser descarta esas líneas y la descripción queda
  vacía o incompleta.
- No repite el H1 ni empieza con «Este tema…».

## Qué extraer según el tipo de documento

### Guía técnica / algoritmos / estructuras de datos

Por cada estructura o técnica, considera estas dimensiones:

| Dimensión | Ejemplo de carta |
|---|---|
| Definición / TAD | «¿Qué es una cola de prioridad?» |
| Invariante | «¿Qué propiedad mantiene un heap mínimo?» |
| Operaciones | «¿Qué cuesta insertar en un heap binario?» |
| Complejidad | «¿Cuál es la complejidad amortizada de un arreglo dinámico?» |
| Memoria | «¿Qué overhead tiene una lista doblemente enlazada?» |
| Variantes | «¿En qué se diferencian un BST, un AVL y un rojinegro?» |
| Casos de uso | «¿Cuándo conviene un trie sobre un hash?» |
| Trade-offs | «¿Qué se gana y qué se pierde con un árbol B+?» |
| Fallos / límites | «¿Qué pasa si la función hash es mala?» |
| Implementación interna | «¿Cómo logra un rope la concatenación O(log n)?» |

No conviertas cada tabla de complejidades en una sola carta: una fila relevante
puede ser una carta `hard`.

### Lenguaje / API

- Sintaxis y semántica.
- Diferencia con la alternativa más cercana.
- Gotcha o error frecuente.
- Buena práctica y por qué.
- Ejemplo mínimo mental (sin pegar código en `A`).

### Idiomas

- Término y traducción.
- Ejemplo de uso.
- Falso amigo o excepción.
- Registro (formal/informal) si el source lo marca.

### Historia / teoría

- Qué, quién, cuándo y por qué.
- Consecuencia o legado.
- Solo fechas y nombres que el source destaque; no inventes contexto.

### Procedimientos

- Precondición.
- Paso clave.
- Excepción o error esperado.
- Resultado verificable.

## Ejemplo aplicado: guía de estructuras de datos

Source: `src/content/sources/dart-estructuras-datos.md` (2.218 líneas, 18 H2
numerados 0–17 y 76 H3).
Tramo: >1.500 → 120–200. Distribución propuesta (cuota 156 cartas):

| Sección | Cuota |
|---|---|
| 0. Mapa de la guía | 2 |
| 1. Fundamentos (TAD, costo, memoria) | 10 |
| 2. Primitivos y arreglos | 8 |
| 3. Listas enlazadas | 10 |
| 4. Pilas | 6 |
| 5. Colas, deques y buffers | 8 |
| 6. Colas de prioridad y heaps | 10 |
| 7. Tablas hash y diccionarios | 12 |
| 8. Conjuntos | 6 |
| 9. Probabilísticas, hashing consistente, LRU | 8 |
| 10. Árboles de búsqueda (BST, AVL, RB, B/B+, splay, treap, skip list) | 20 |
| 11. Tries y cadenas | 8 |
| 12. Especializadas (segment tree, Fenwick, sparse table, union-find, kd-tree, R-tree, rope, Merkle, LSM) | 12 |
| 13. Grafos | 14 |
| 14. Persistentes | 6 |
| 15. Concurrentes | 8 |
| 16. Guía de decisión y trade-offs | 6 |
| 17. Lecturas recomendadas | 2 |

La sección 0 no es un índice puro: además del listado, fija el esquema común
(definición, complejidad, memoria, casos de uso, código, trade-offs) y las
convenciones del código, de ahí sus 2 cartas. Cada estructura de la sección 10
merece al menos: definición, invariante, complejidad de búsqueda/inserción/borrado
y un trade-off. Las secciones 9, 12 y 15 suelen rendir cartas `hard`.

## Deduplicación

- Agrupa preguntas que solo cambian una palabra.
- Si dos cartas comparten respuesta, conserva la más general y convierte la otra
  en un matiz `hard` o elimínala.
- No repitas la definición en varias secciones: una carta, una ubicación.
- Revisa las preguntas que empiezan igual («¿Qué es…?»): si hay demasiadas,
  reformula por operación, complejidad o caso de uso.

## Auditoría final

Antes de generar arte:

1. Recorre el mapa de cobertura sección por sección (H2 y los H3 que aportan
   conceptos propios): cada una tiene cartas o una omisión justificada por escrito.
2. Cuenta cartas por sección y compáralas con la cuota; si te desvías más de un
   20 %, ajusta la redacción, no el número.
3. Verifica que no haya `|` en `Q` ni en `A`.
4. Confirma que todas las `E` son `easy` o `hard`.
5. Revisa que ninguna `Q` esté duplicada.
6. Comprueba que la descripción sea una línea ≤160 chars y sin prefijos `>` ni `|`.
7. Reporta el total, el tramo aplicado y las secciones omitidas con su motivo.

Comandos de apoyo: `wc -l` y `grep -n '^## '` sobre el source (Paso 0) y el
volcado de ids del tema («Volcado de ids» en `reference/topic-format.md`) para
rellenar la columna «Cartas finales» del mapa.

## Anti-patrones

- Copiar los headings como preguntas.
- Cartas que dependen del contexto de la carta anterior.
- Meter cinco ideas en una respuesta.
- Cartas triviales solo para llegar a la cuota.
- Omitir una sección entera porque es «avanzada» sin justificarlo.
- Duplicar definiciones con sinónimos para inflar el número.
