# ODD (Organic Driven Development) y desarrollo con agentes de IA

*Guía técnica de nivel intermedio a experto · noviembre 2026 · Basada en la documentación pública de Gentle-AI y en análisis de terceros. Lo que es extensión mía va marcado como \[Extensión\].*

## 0. Nota de rigor: qué es (y qué no es) ODD

ODD no es un estándar de la industria como TDD. Es el nombre que el proyecto open source Gentle-AI (de Gentleman Programming, licencia MIT) da al protocolo que siguen sus agentes en cada petición. No hay papers ni comité: hay un protocolo escrito con detalle, una historia (el proyecto usaba SDD con OpenSpec, convirtió ODD en flujo por defecto en la serie 3.x y retiró SDD en la v4.0.0, el 1 de octubre de 2026) y benchmarks propios de una sola ejecución. Otras siglas ODD (Observability-, Outcome- u Outline-Driven Development) son cosas distintas.

Para que la guía sea útil y honesta, separo tres capas:

- **Canónico (documentado):** los 7 pasos, la prueba del diff, el documento único `odd/tasks/<feature>.md`, el test primero condicionado, commits revisables de unas 400 líneas, delegación solo con razón, especificación por referencia y no por resumen, cierre con evidencia, espejo en memoria persistente (Engram) y revisión por recibos (RDD).
- **\[Extensión\] compatible:** rebanadas verticales, Navigator/Driver, los skills Backlog, Story Refinement y Pair Execution, y la prueba de arranque en frío. Encajan con ODD, pero no forman parte del protocolo oficial.
- **Dos matices frente a tu planteamiento:** (1) ODD *raciona* las preguntas —como mucho una por decisión de producto real—; la meta «cero suposiciones ocultas» se consigue investigando primero y registrando los supuestos que queden. (2) El plan maestro (Plan-First) solo existe para trabajo grande; crearlo para un cambio pequeño es justo el error que ODD quiere evitar.

## 1. Filosofía y fundamentos

### 1.1 El problema: un ejecutor veloz con memoria corta

Un agente de código escribe rápido, no se cansa y trabaja con un contexto finito que se compacta o desaparece al cerrar la sesión. De ahí salen dos modos de fallo opuestos: improvisar demasiado (vibe coding) y ritualizar demasiado (SDD como valor por defecto). ODD intenta quedarse en medio con un criterio explícito en lugar de una preferencia estética.

### 1.2 Por qué falla el vibe coding

- **Intención no externalizada.** Si el requisito vive solo en el chat, no hay contra qué verificar. El resultado «parece bien» y nada más.
- **Huecos rellenados en silencio.** Ante una ambigüedad el modelo elige la opción más plausible y no lo avisa. Es un supuesto sin auditar que se descubre en producción.
- **El «casi bien».** Según Web Reactiva, la frustración más citada en la encuesta de Stack Overflow 2025 son las soluciones casi correctas. Sin criterio de aceptación, ese «casi» no se puede detectar.
- **Cero continuidad.** El conocimiento está en el contexto de la sesión. Si se corta, quien retoma reconstruye desde cero.
- **Diffs inrevisables.** Cambios grandes y mezclados (feature, refactor y formato) que el humano aprueba sin leer.
- **Sensación de velocidad.** En el estudio de METR de 2025, desarrolladores veteranos con IA fueron un 19 % más lentos aunque creían ir más rápido. No es un argumento contra los agentes: es un argumento contra no medir.

### 1.3 Por qué falla SDD como valor por defecto

SDD (Spec Kit, Kiro, OpenSpec) resuelve un problema real: especificar antes de generar. Falla cuando se aplica a todo:

- **Ceremonia fija.** Birgitta Böckeler (martinfowler.com) vio a Kiro convertir un bug pequeño en cuatro historias de usuario con 16 criterios de aceptación, y concluyó que prefería revisar código antes que montañas de Markdown.
- **Dos fuentes de verdad.** Alguien corrige a mano y la spec queda obsoleta.
- **Paráfrasis en cada fase.** Cada fase reescribe tu petición y el error se acumula, como en el teléfono descompuesto. Gentle-AI reporta (una sola ejecución) que una spec de 73 líneas pasada en resumen entre agentes dejó 13 de 26 comprobaciones fallando y, tras dos rondas de correcciones, aún pasaban solo 23 de 26. Pasarla por referencia lo resolvió.
- **Requisitos que todavía no sabes escribir.** Si no entiendes el problema, la spec exige una claridad que no tienes.

Matiz importante: SDD no es cascada literal. Böckeler distingue *spec-first*, *spec-anchored* y *spec-as-source*; la crítica de «cascada» (Marmelab) apunta a las fases fijas aplicadas sin mirar el tamaño. Y SDD sigue ganando cuando la spec es un entregable: contratos entre equipos, auditoría, requisitos firmados, documentación viva del sistema.

### 1.4 El principio orgánico: el proceso crece con el problema

La ceremonia debe ser función del **riesgo**, la **incertidumbre** y el **coste de retomar**, no del tamaño aparente del código.

| Señal | Respuesta de proceso |
| --- | --- |
| Pregunta, revisión o propuesta | Solo lectura: no se toca nada |
| Cambio entendido, riesgo acotado, se retoma con la petición y `git diff` | En línea: sin documentos, test primero si hay un test útil |
| Varias sesiones, esperas externas o requisitos que no sobrevivirían a una compactación del contexto | Un documento de feature antes del primer cambio |
| Riesgo alto (dinero, permisos, datos de usuarios, migraciones) | \[Síntesis\] Verificación independiente, además de lo que toque por tamaño |

El número de archivos o de líneas no decide: un renombrado en 80 archivos puede ser pequeño; un cambio de una línea en el redondeo de una factura puede no serlo.

### 1.5 Seis invariantes que nunca se encogen

1. Separar pregunta de cambio.
2. Explorar antes de modificar.
3. Conservar las palabras literales del usuario.
4. Marcar «hecho» solo con evidencia observada.
5. Estado honesto: reportar lo fallido y lo pendiente; una memoria que no se pudo escribir se informa, no se da por guardada.
6. Un solo documento por feature grande, no un expediente.

Documentos, subagentes y revisión escalan con el problema; estos seis no.

**Qué dicen los números (con cautela).** En el README de Gentle-AI, un bug de 3 líneas pasó de 335 s, 56 turnos y 0,339 USD a 77 s, 10 turnos y 0,105 USD. Una migración de alto riesgo salió *más cara* (0,403 a 0,555 USD) pero se aceptó a la primera con un verificador independiente. Lectura: ahorra donde el riesgo es bajo y gasta donde equivocarse duele. Cada celda es una sola ejecución y el mismo README admite que la tarea grande tardó unas tres veces más que Codex CLI con el mismo modelo. Son indicios, no estudios.

## 2. El protocolo de 7 pasos, a fondo

Se aplica a cada petición, sin que el usuario pida un plan ni elija un modo. Cada paso se describe con lo que hace, el fallo que previene, sus reglas y su antipatrón.

### Paso 1 · Autorizar: ¿esto pide un cambio?

**Qué hace.** Distingue consulta (pregunta, revisión, propuesta) de cambio. Una consulta se responde leyendo y razonando; el agente no edita ni siquiera «de paso».

**Previene.** El diff que nadie pidió: preguntas «¿por qué falla este test?» respondidas con cuatro archivos editados.

**Reglas.**

- Una orden o petición explícita de cambio autoriza (`añade`, `arregla`, `¿puedes cambiar…?` como cortesía).
- Preguntas de análisis, `revisa`, `propón` o `¿qué pasaría si…?` se quedan en solo lectura.
- &#91;Extensión\] En duda, tratarlo como consulta y ofrecer el cambio al final.
- Los hallazgos de la exploración no amplían la autorización: si el agente encuentra otro bug, lo reporta y no lo arregla.

**Antipatrón.** Tratar cualquier mensaje como orden de ejecución.

### Paso 2 · Explorar, en proporción

**Qué hace.** Lee puntos de entrada, llamadores, tests existentes, convenciones y el `git log` de la zona. Antes de tocar nada ejecuta la suite relevante para conocer la línea base (qué falla ya).

**Previene.** Duplicar clases que ya existen (Böckeler lo observó en agentes que ignoraban notas sobre código existente), romper convenciones y atribuir al cambio fallos previos.

**Reglas.** El presupuesto de lectura es proporcional a la petición: cambiar un literal no exige leer medio repositorio. Si la exploración es amplia y rompería el contexto, se delega a un explorador con esa razón y no por costumbre.

**Antipatrón.** Editar sin leer, o explorar sin límite.

### Paso 3 · Resolver la incertidumbre (sin trasladársela al humano)

Hay cuatro instrumentos, ordenados por coste:

1. **Investigar** (barato, resuelve hechos): leer código y docs, ejecutar, comprobar. Es la respuesta por defecto a una duda concreta.
2. **Una pregunta**, solo si hay una decisión de producto real que el código no puede responder. Plantilla: contexto en una línea, opciones, tu valor por defecto y la consecuencia de equivocarse. Ejemplo: «¿Separador `,` o `;`? Propongo `;` porque Excel en español lo espera; cambiarlo después solo toca el serializador.»
3. **Un desafío** como máximo a una premisa arriesgada y no probada («esto asume que el total nunca es nulo, ¿está garantizado?»).
4. &#91;Extensión\] **Registro de supuestos.** Para ambigüedades reversibles y baratas no se pregunta: se escribe el supuesto en el log (o en el cierre) con cómo revertirlo. Para lo irreversible o caro, se pregunta.

Triage rápido: ¿se averigua leyendo o ejecutando? Investigar. ¿Es reversible y barato? Suponer y registrar. ¿Es una decisión de producto con consecuencias? Una pregunta. ¿La premisa es peligrosa? Un desafío.

**Por qué racionar.** Cada pregunta consume atención humana y rompe el flujo; un agente que hace diez preguntas te transfiere su incertidumbre. Eliminar supuestos del modelo no significa interrogar al usuario, significa que ningún supuesto relevante quede sin dueño.

### Paso 4 · Clasificar: la prueba del diff

Una tarea es **pequeña** si se entiende, su riesgo está acotado y se podría retomar solo con la petición original y `git diff`. Es **grande** únicamente cuando esa prueba falla: varias sesiones, esperas externas (otro equipo, un deploy) o requisitos que no sobrevivirían a una compactación del contexto. El conteo de archivos o líneas no decide.

Ejemplos: un renombrado masivo con el IDE es pequeño. Cambiar la regla de redondeo de una factura toca un archivo pero nadie lo retoma sin saber qué se decidió y por qué, así que probablemente no lo es. Una exportación a CSV con un botón y un endpoint es pequeña; exportar a tres formatos con filtros, cola en segundo plano y correo no lo es.

&#91;Síntesis\] Son dos ejes distintos: la *retomabilidad* decide si hay documento; el *riesgo* decide la profundidad de verificación.

```text
si no autoriza_cambio                      -> SOLO_LECTURA
si retomable_con_diff y entendido y acotado -> EN_LINEA
si no retomable_con_diff                   -> DOCUMENTO_DE_FEATURE
si toca dinero|permisos|datos|migracion    -> + VERIFICADOR_INDEPENDIENTE
```

El riesgo principal de ODD es justamente clasificar como pequeño algo que tenía trampa. Por eso el humano puede subir el nivel en cualquier momento.

### Paso 5 · Registrar antes de escribir (Plan-First)

Solo si la tarea es grande y antes del primer cambio, se crea un único documento de feature y se anuncia en una línea (qué archivo y cuántas tareas). Nada de plan para cambios pequeños. La anatomía completa está en la sección 3.

### Paso 6 · Implementar tarea a tarea

Bucle por tarea:

1. Tomar la siguiente tarea sin marcar, con sus `S#`.
2. Escribir el test que falla (RED) cuando hay un test ejecutable con resultado esperado claro, y observar que falla por la razón correcta.
3. Implementar lo mínimo para pasar (GREEN).
4. Refactorizar con la suite en verde.
5. Ejecutar las comprobaciones proporcionales al cambio.
6. Marcar la tarea solo con una prueba observada.
7. Cerrar con un commit de unidad de trabajo revisable (unas 400 líneas, orientativo) y anotar en el log.

Reglas: push, PR y merge son decisiones separadas. Un cambio de alcance aceptado actualiza intención y tareas a la vez, conserva lo hecho que siga siendo válido y reabre lo invalidado con su motivo. Se delega en un escritor solo con razón (unidades paralelas, contexto, verificación), nunca por tamaño, número de archivos o relación de precio.

### Paso 7 · Cerrar con evidencia

```text
Resultado:   qué cambió y qué comportamiento se verificó
Evidencia:   comando -> resultado observado
Fallido o pendiente: cada check que falló o no se ejecutó, con motivo
Supuestos:   los registrados y cómo revertirlos
Siguiente paso: acción concreta
```

Sin «debería funcionar». Si el espejo en memoria no se pudo escribir, se dice. La revisión por recibos (RDD) de Gentle-AI es una capa aparte, activada por defecto y desactivable: valida un candidato de cambio exacto, no una casilla marcada.

## 3. Plan-First: el documento de feature

### 3.1 Qué es

Un único archivo, `odd/tasks/<feature>.md`, creado antes del primer cambio de una tarea grande. Las fuentes lo describen con ligeras variaciones según la versión (secciones Specs, Tasks y Log; o campos de objetivo, alcance, restricciones, checklist con IDs estables, evidencia, progreso y siguiente paso). Lo que no varía: un solo archivo, IDs estables, palabras literales del usuario, criterio de aceptación verificable, evidencia y un siguiente paso ejecutable.

### 3.2 Ejemplo completo

```markdown
# Informes de pedidos exportables en segundo plano

Estado: en curso · Rama: feat/informes-async
Siguiente paso: T3, filtros por estado y rango de fechas (empezar por el test)

## Alcance
Incluye: exportar pedidos a CSV y XLSX, con filtros, generación asíncrona
para más de 5000 filas y envío por correo.
Excluye: PDF y programación periódica.
Restricción: reutilizar el worker existente, sin dependencias nuevas.

## Specs
S1. «El botón dice Exportar CSV y descarga pedidos.csv»
    Aceptación: GET /pedidos/export devuelve text/csv con cabecera y fechas ISO 8601.
S2. «Si no hay pedidos, el botón aparece deshabilitado»
    Aceptación: test de componente.
S3. «Los archivos grandes llegan por correo»
    Aceptación: más de 5000 filas -> 202 con job_id; correo con enlace válido 24 h.
S4. Separador punto y coma (decisión del usuario, ver L2).

## Tasks
- [x] T1 (S1,S4) Rebanada mínima extremo a extremo: consulta, serializador, endpoint, botón.
      Evidencia: pytest tests/test_export.py -> 4 passed; descarga manual verificada. Commit 3f2a9c1
- [x] T2 (S2) Estado vacío del botón.
      Evidencia: test_boton_deshabilitado_sin_pedidos RED -> GREEN. Commit 8b41d07
- [ ] T3 (S1) Filtros por estado y rango de fechas (query params).
- [ ] T4 (S3) Umbral y job asíncrono: 202, job_id, consulta de estado.
- [ ] T5 (S3) Correo con enlace firmado de 24 h.
- [ ] T6 (S1) Formato XLSX reutilizando el serializador.

## Log
L1. Petición original (literal): «Quiero exportar los pedidos a CSV desde la lista.
    Que el botón diga Exportar CSV, que esté deshabilitado si no hay pedidos y que
    los archivos grandes lleguen por correo.»
L2. Decisión del usuario: separador `;` por Excel en español.
L3. T2: el primer RED falló por ImportError y no por la regla; corregido y repetido.
```

### 3.3 Reglas de mantenimiento

- **IDs estables.** Nunca se renumeran; una tarea invalidada se reabre con motivo, no se borra.
- **`L1` es intocable.** Es tu petición tal cual; lo posterior se añade al log.
- **Citas literales en las specs.** Si ves tus requisitos reescritos en `## Specs`, pide que copie los originales.
- **Cambios de alcance.** Aceptado el cambio, se actualizan specs y tareas juntas. Los hallazgos por sí solos no autorizan ampliar el alcance.
- **Concisión.** Es un documento de trabajo, no un diario exhaustivo: motivo breve para los cambios significativos.

### 3.4 Espejo en memoria y recuperación

Gentle-AI copia el documento a memoria persistente (Engram, tema `odd/<feature>/tasks`). Al retomar, el agente padre reconcilia ambas copias, y si la memoria falta lo informa en vez de darlo por bueno. Como las escrituras no son atómicas, se escribe primero el archivo local y se releen las dos copias. Sin Engram, basta con versionar el documento en la rama: el repositorio ya es la fuente de continuidad.

### 3.5 Pasarlo a subagentes

Se entrega una **referencia** (ruta, `T#` y `S#`), nunca un resumen de tu petición. Cada paráfrasis es un traspaso con pérdida.

## 4. Continuidad, TDD guiado por agentes y commits atómicos

### 4.1 El test de la continuidad

La formulación canónica es la prueba del diff (paso 4): si mañana otra persona o agente abre la petición y el `git diff` y sabe por dónde ibas, la tarea es pequeña. Si no, hace falta documento.

&#91;Extensión\] **Prueba de arranque en frío.** Para tareas grandes, abre una sesión limpia, dale solo el documento de feature y hazle cinco preguntas:

1. ¿Qué se pidió exactamente?
2. ¿Qué está hecho y con qué prueba?
3. ¿Qué falta?
4. ¿Qué se decidió y por qué?
5. ¿Cuál es el siguiente comando que ejecutarías?

Si responde mal, el defecto está en el documento, no en el agente: se arregla ahí. Hazla al crear el plan y cada vez que una sesión se haya cortado.

**Estados de corte y cómo retomar**

- **Entre tareas** (árbol limpio, tarea marcada con su commit): se lee el documento y se toma la siguiente.
- **A mitad de tarea** (test RED sin commit): `git status`, `git diff` y la línea «Siguiente paso». Regla: cada commit deja la suite en verde; el trabajo en curso vive en el árbol de trabajo y en esa línea.
- **Tras un fallo de memoria o sincronización:** se reconcilian las dos copias del documento. \[Extensión\] Como criterio práctico, manda la copia versionada en el repositorio y se informa la discrepancia.
- **Tras una compactación del contexto:** se vuelve a leer el documento. Nada importante debe depender de lo que «recuerda» la sesión.

El «Siguiente paso» debe ser una acción o un comando concretos, nunca «continuar con lo del correo».

### 4.2 TDD guiado por agentes

Reglas de ODD (Gentle-AI): test primero por defecto cuando existe un test ejecutable y determinista y un resultado esperado claro; si no existe, el agente explica la excepción y hace comprobaciones funcionales. Que haya tests en el repositorio no activa por sí solo el modo estricto (Strict TDD es un interruptor aparte). Se escribe un test RED por cada regla pedida, un test por cada comando u opción existente que se toca (para probar que su comportamiento previo se conserva) y ningún caso más. Esa última regla es anti-inflación: los agentes tienden a generar baterías enormes y redundantes que nadie revisa.

**El ciclo con agente**

- **RED.** El agente escribe el test, lo ejecuta y muestra el fallo. Se comprueba que falla por la razón correcta (una aserción, no un ImportError). El Navigator revisa este test: es la revisión de mayor palanca, porque el test es la especificación ejecutable.
- **GREEN.** Implementación mínima. Los tests son de solo lectura en esta fase.
- **REFACTOR.** Con la suite en verde y sin cambiar comportamiento.

```python
# RED: la regla pedida (S1) y la regresión del comportamiento previo
def test_descuento_no_supera_el_50_por_ciento():
    assert aplicar_descuento(precio=100, porcentaje=80) == 50

def test_descuento_normal_se_conserva():
    assert aplicar_descuento(precio=100, porcentaje=20) == 80

# GREEN: lo mínimo que pasa ambos
def aplicar_descuento(precio, porcentaje):
    porcentaje = min(porcentaje, 50)
    return precio * (100 - porcentaje) / 100
```

**Catálogo de trampas** (cómo un agente «aprueba» sin cumplir)

1. RED falso: el test falla por un error de importación o un typo, no por la regla.
2. Modificar el test para que pase.
3. Hardcodear el valor exacto que espera el test.
4. Mocks que reimplementan la lógica bajo prueba.
5. Snapshots actualizados a ciegas (`-u`).
6. Borrar, `skip` o `xfail` de tests incómodos.
7. Aserciones débiles (`is not None`, `assert True`).
8. Tests acoplados a la implementación, que se rompen al refactorizar.
9. Test-after disfrazado: escribir el test mirando el código y presentar un RED fabricado.

**Defensas**

- Test de solo lectura durante GREEN: si debe cambiar, el agente se detiene, explica por qué y se actualiza primero la spec.
- El RED se acredita con la salida real del comando, no con la narración.
- Sanidad por mutación: romper la implementación a propósito y ver que el test falla.
- Revisar el diff de tests por separado del de producción.
- Ejecutar la suite afectada completa, no solo el test nuevo.
- Cobertura como trinquete (no puede bajar), no como objetivo.
- Regla fija en `AGENTS.md`: no editar, borrar ni saltar tests existentes sin autorización explícita.

### 4.3 Commits atómicos por iteración

- Una tarea, un commit de unidad de trabajo: test, implementación y documentación afectada. Unas 400 líneas es orientativo, no un límite.
- Cada commit deja la suite en verde, de modo que `git bisect` siga siendo útil.
- Refactor y cambio de comportamiento van en commits distintos.
- El mensaje referencia la tarea y la spec.
- La tarea se marca en el documento con el hash, en el mismo commit o en uno `chore(odd)` inmediato.
- Push, PR y merge siguen siendo decisiones separadas.

```text
3f2a9c1 feat(export): T1 CSV extremo a extremo (S1,S4)
8b41d07 feat(export): T2 botón deshabilitado sin pedidos (S2)
5d7e210 refactor(export): serializador común, sin cambio de comportamiento
```

## 5. Rebanadas verticales frente a capas horizontales \[Extensión compatible\]

Las rebanadas verticales no forman parte del protocolo oficial, pero resuelven justo lo que ODD exige a cada tarea: un incremento verificable, revisable y retomable.

### 5.1 Por qué importan con agentes

- Un agente que trabaja por capas produce cientos de líneas por capa que nadie puede probar de extremo a extremo hasta el final: integración «big bang», errores acumulados y tareas marcadas sin evidencia real.
- Una rebanada vertical entrega comportamiento observable en cada tarea, así que el «marcar solo con prueba observada» tiene sentido.
- El humano revisa comportamiento y un diff pequeño, no arquitectura abstracta.

|  | Capas horizontales | Rebanadas verticales |
| --- | --- | --- |
| Unidad de trabajo | Toda la base de datos, luego todo el backend, luego toda la UI | Un comportamiento de usuario de punta a punta |
| Primera evidencia de valor | Al final | En la primera tarea |
| Riesgo de integración | Concentrado al final | Distribuido y temprano |
| Revisión humana | Diffs grandes y abstractos | Diffs pequeños con una prueba demostrable |
| Tentación del agente | Sobreingeniería: abstracciones sin uso | Mínima: solo lo que la rebanada necesita |
| Retomar tras un corte | Difícil: nada funciona hasta el final | Fácil: cada commit deja algo funcionando |

### 5.2 Criterios de una buena rebanada

- Comportamiento demostrable: un usuario, un script o un test de integración lo observa.
- Cruza solo las capas necesarias y de forma mínima.
- Está ligada a un `S#` con aceptación verificable.
- Cabe en un commit revisable.
- Es reversible o puede desplegarse tras un flag.
- Se ordena por riesgo: primero un esqueleto andante (*walking skeleton*) que toque todas las capas con la mínima lógica, después lo más arriesgado y al final lo cosmético.

### 5.3 Contra la sobreingeniería

- Ninguna abstracción hasta el segundo uso real; se extrae al tercero.
- Esquema de base de datos solo con los campos de la rebanada y migraciones aditivas (expandir, migrar, contraer).
- Nada de frameworks internos «por si acaso»: si ningún test de la rebanada ejercita una pieza, no entra.
- Pedir al agente que enumere lo que dejó fuera a propósito reduce el *scope creep*.

### 5.4 La misma feature, mal y bien

**Mal (por capas):** T1 crear tablas y modelos, T2 crear servicios, T3 crear endpoints, T4 crear la UI. Nada es observable hasta T4.

**Bien (verticales, como en la sección 3):** T1 CSV de punta a punta con consulta mínima, endpoint y botón; T2 estado vacío; T3 filtros; T4 job asíncrono; T5 correo; T6 XLSX. Tras T1 ya hay valor y cada tarea suma un comportamiento.

### 5.5 Cuándo lo horizontal está justificado

En trabajo de plataforma compartida, en la fase «expandir» de una migración de esquema o al extraer una librería. Incluso ahí conviene rebanar por consumidor: un primer consumidor real valida el cambio antes de generalizar.

### 5.6 Revisión humana

Orden de lectura: primero el test (intención), luego la implementación, luego el documento (¿la tarea se actualizó con su evidencia?). Si una rebanada pide más de unos minutos de revisión, es demasiado grande: hay que partirla.

## 6. AI pair programming: Navigator, Driver y el humano en el lazo \[Extensión sobre ODD\]

### 6.1 El modelo

En el pair programming clásico, el *driver* teclea y el *navigator* piensa en dirección, riesgos y siguiente paso. Con agentes, el humano es el Navigator (intención, restricciones, aceptación, veto de riesgo) y el LLM es el Driver (velocidad, trabajo mecánico, ejecución de comprobaciones). Dos matices: el agente también explora y propone, así que hace de navegante local; y en el protocolo de Gentle-AI hay una jerarquía de agente padre y subagentes por debajo del humano. El humano no teclea, pero conserva las decisiones.

### 6.2 Puntos de control: dónde interviene el humano

1. **Autorizar:** decide si algo es un cambio.
2. **Una pregunta:** responde las decisiones de producto.
3. **Clasificar:** puede subir el nivel (veto de riesgo).
4. **Plan en trabajo grande:** lectura rápida de `## Specs` para confirmar que las citas literales son las suyas.
5. **RED:** revisa que los tests expresan la intención.
6. **Diff por tarea:** revisa comportamiento y alcance.
7. **Cierre:** comprueba evidencia, pendientes y supuestos.

División del trabajo: el humano decide *qué* y *por qué* y valida aceptación y riesgo; el agente decide *cómo*, hace los cambios mecánicos, ejecuta las comprobaciones y reporta evidencia.

### 6.3 Evitar bucles infinitos

- **Presupuesto de intentos:** dos o tres intentos como máximo con la misma estrategia ante un check que falla.
- **Cambio de hipótesis:** antes de reintentar, anotar en el log hipótesis, experimento y resultado. Sin hipótesis nueva no hay intento nuevo.
- **Parada de línea:** agotado el presupuesto, volver al último commit verde de la rama y re-explorar.
- **Detección de oscilación:** los mismos archivos editados de ida y vuelta, o el mismo error con otra redacción, son un bucle.
- **Escalado:** preguntar al humano con opciones concretas y con lo ya descartado.
- **Higiene de contexto:** ante contexto sucio, sesión nueva alimentada solo por el documento.

### 6.4 Alucinaciones de código

- Verificar ejecutando: compilar, tipar, correr. Nada de «parece correcto».
- Comprobar que los símbolos existen (búsqueda en el repositorio) y que las flags existen (`--help`).
- Versiones fijadas: leer el lockfile y la documentación de esa versión, no la memoria del modelo.
- Afirmaciones sobre código con `archivo:línea`.
- Salida de comandos pegada como evidencia; un test que «pasó» sin salida no cuenta.
- Riesgo alto: verificador independiente, otro agente o contexto que recibe la spec literal y el candidato de cambio, pero no la narrativa del autor.

### 6.5 Delegación sana

El padre delega en un subagente solo con razón: unidades paralelas, protección del contexto o verificación independiente; nunca por tamaño o conteo de archivos. Al subagente se le pasa la referencia al documento y su salida cuenta como evidencia, no como conclusión.

### 6.6 Economía de la atención humana

Revisar tests rinde más que revisar código, y revisar `## Specs` rinde más que revisar tareas. Si tu atención es limitada, gástala en tres sitios: las citas literales, los tests RED y la lista de supuestos y pendientes del cierre.

## 7. Skills y prompts estructurados

### 7.1 Capas de empaquetado

1. **Reglas siempre activas** (`AGENTS.md` o `CLAUDE.md`): el núcleo del protocolo, corto.
2. **Skills:** procedimientos bajo demanda.
3. **Plantillas:** el documento de feature.
4. **Comprobaciones automáticas:** CI, hooks y linters que actúan como trinquetes.

Principio: la ceremonia debe encogerse, no apilarse. Según el análisis de un proyecto que adoptó ODD, Gentle-AI mantiene el contrato pesado en el *harness* (se renderiza de forma determinista en el prompt de cada agente) y sus skills son envoltorios finos sobre comandos de CLI.

### 7.2 Dónde vive cada cosa

- `AGENTS.md`: convención compartida por varios agentes.
- Claude Code: `CLAUDE.md` y `.claude/skills/<nombre>/SKILL.md`.
- Cursor: reglas en `.cursor/rules/` (siempre activas o activadas por descripción). Windsurf: `.windsurf/rules/`. Los formatos de estos editores cambian con frecuencia: confirma el vigente en su documentación.
- Gentle-AI automatiza la instalación para más de una docena de agentes, con `--dry-run` para ver el plan antes. Instala más que ODD (memoria, persona, permisos, RDD): revisa el plan, sobre todo si ya tienes un archivo de reglas trabajado.

### 7.3 Bloque siempre activo: el núcleo de ODD

```markdown
## Cómo trabajamos (ODD, proporcional al riesgo)

- Pregunta, revisión o propuesta: solo lectura. No edites archivos.
- Antes de cambiar código, lee el afectado y ejecuta la suite relevante para conocer la línea base.
- Dudas: investiga primero. Haz UNA pregunta solo si hay una decisión de producto real, con opciones y tu valor por defecto. Los supuestos reversibles se anotan, no se preguntan.
- Tarea pequeña (se entiende, riesgo acotado, se retoma con mi petición y git diff): hazla en línea, sin documentos.
- Tarea grande (no se retoma con el diff): antes del primer cambio crea odd/tasks/<feature>.md con Specs (mis frases literales, S1..), Tasks (T1.. con sus S#) y Log (L1 = mi petición literal). Avísame en una línea.
- Si tocas dinero, permisos, datos de usuarios o migraciones, pide verificación independiente.
- Test primero cuando haya un test ejecutable útil: observa el RED. No edites, borres ni saltes tests existentes sin permiso.
- Una tarea, un commit revisable. Marca una tarea solo con una prueba observada (comando y resultado).
- No amplíes el alcance por hallazgos: repórtalos.
- Si delegas, pasa la ruta del documento y los S#, nunca un resumen.
- Cierra con: resultado verificado, lo fallido o pendiente, supuestos y siguiente paso.
```

### 7.4 Los tres skills \[Extensión\]

Aviso: no son skills oficiales de ODD. Son una forma de empaquetar las fases de producto en piezas reutilizables encima del protocolo.

**Skill 1 · odd-refine (Story Refinement).** Convierte una petición cruda en specs verificables.

```markdown
---
name: odd-refine
description: Convierte una petición de cambio en specs S# con citas literales y criterios de aceptación. Úsalo antes de planificar trabajo grande o cuando la petición sea ambigua.
---
1. Copia la petición íntegra como L1. No la reformules.
2. Extrae cada requisito como S# con tu cita literal entre « » y un criterio de aceptación verificable (comando, test o comprobación manual).
3. Clasifica cada ambigüedad: se averigua leyendo o ejecutando (investiga); es reversible y barato (anota el supuesto); es decisión de producto (UNA pregunta con opciones y valor por defecto).
4. Máximo una pregunta y un desafío a una premisa arriesgada.
5. Salida: lista de S# y lista de supuestos con cómo revertirlos. No escribas código.
```

**Skill 2 · odd-backlog (Backlog).** Ordena el trabajo en rebanadas verticales.

```markdown
---
name: odd-backlog
description: Descompone specs S# en tareas T# como rebanadas verticales ordenadas por riesgo y crea o actualiza odd/tasks/<feature>.md. Solo para trabajo grande.
---
1. Verifica la prueba del diff. Si la tarea es pequeña, detente: no crees documento.
2. T1 es un esqueleto andante que cruza todas las capas con lógica mínima.
3. Cada T# enlaza uno o más S#, produce un comportamiento observable, cabe en un commit revisable y declara cómo se prueba.
4. Ordena por riesgo y luego por valor; lo cosmético al final.
5. Rechaza tareas por capa (crear tablas, crear servicios). Reescríbelas por comportamiento.
6. Escribe el documento con IDs estables y la línea Siguiente paso. Anuncia archivo y número de tareas en una línea.
```

**Skill 3 · odd-pair (Pair Execution).** Ejecuta el bucle de implementación.

```markdown
---
name: odd-pair
description: Ejecuta una tarea T# del documento con test primero, evidencia observada y commit atómico. Úsalo para implementar tareas ya planificadas.
---
1. Lee el documento y toma la siguiente T# sin marcar, con sus S#.
2. RED: escribe el test, ejecútalo y muestra el fallo. Debe fallar por la regla, no por un error de importación.
3. GREEN: implementa lo mínimo. Los tests son de solo lectura; si hay que cambiarlos, detente y explica por qué.
4. REFACTOR con la suite en verde, sin cambiar comportamiento.
5. Ejecuta las comprobaciones proporcionales. Pega comando y salida.
6. Marca T# con la evidencia y el hash. Actualiza el Log.
7. Presupuesto: tras dos fallos con la misma estrategia, anota una hipótesis nueva en el Log o detente y pregunta con opciones.
8. Cierra con resultado verificado, fallido o pendiente, supuestos y siguiente paso.
```

### 7.5 Cómo escribir buenos prompts de protocolo

- **Prescripción positiva:** di qué hacer («lee el archivo afectado antes de editar»), no solo qué evitar.
- **Formatos de salida explícitos:** plantilla de cierre, IDs estables.
- **Condiciones de parada explícitas.**
- **Referencias, no resúmenes.**
- **Cada regla nueva compite con las anteriores:** si añades una, quita otra.
- **Prueba tus skills con escenarios:** un cambio pequeño, uno grande, una petición ambigua y una consulta. El comportamiento debe cambiar con el tamaño.
- Si conviven dos flujos (por ejemplo Spec Kit y ODD), declara en `AGENTS.md` cuál manda.

### 7.6 Prompts de uso

- **Arranque de una tarea grande:** «Quiero \[petición literal\]. Aplica el protocolo ODD. Antes de escribir código, dime si es pequeña o grande y por qué. Si es grande, crea el documento y espera mi visto bueno sobre las Specs.»
- **Retoma:** «Retoma odd/tasks/informes-async.md. Lee solo el documento y dime, antes de tocar nada, qué está hecho con prueba, qué falta y cuál es el siguiente comando.»
- **Revisión independiente:** «Verifica este cambio contra S1 a S3 del documento, con las citas literales. No uses el resumen del autor. Ejecuta las comprobaciones y reporta evidencia, fallos y lo que no pudiste verificar.»

## 8. Casos de estudio de refactorización incremental

### Caso A · Un bug de tres líneas, todo en línea

Petición: «El total sale mal cuando el cupón supera el subtotal».

1. **Autorizar:** es un cambio.
2. **Explorar:** localizar la función de totales y sus llamadores; ejecutar la suite: línea base en verde.
3. **Resolver:** el requisito no dice qué pasa con un cupón mayor que el subtotal y hay dinero de por medio, así que una pregunta con valor por defecto: «¿Total 0 o error? Propongo 0.».
4. **Clasificar:** pequeña (se entiende, acotada, se retoma con el diff). Como toca dinero, se sube la verificación: una segunda lectura independiente del diff.
5. **Implementar:** RED con el cupón mayor que el subtotal, GREEN acotando el total a cero, test de regresión del cupón normal.
6. **Cerrar:** reporte con evidencia. Sin documento, sin subagentes de escritura.

### Caso B · Extraer el cálculo de comisiones de un controlador monolítico

Contexto: un controlador de unas 900 líneas mezcla HTTP, SQL y cálculo de comisiones. Está en producción y hay dinero. Clasificación: **grande** (varias sesiones, riesgo alto), así que documento más verificador independiente. Estrategia: tests de caracterización, *branch by abstraction* y *parallel change* con modo sombra.

```text
## Tasks
- [x] T1 (S1) Tests de caracterización del comportamiento actual con casos reales anonimizados.
      Evidencia: 42 casos en verde sobre el código existente; mutar una regla a propósito rompe 5.
- [x] T2 (S1) Costura: interfaz CalculadoraComisiones; el controlador la usa y la implementación sigue siendo la vieja.
      Evidencia: suite completa verde; diff sin cambio de comportamiento.
- [x] T3 (S2) Implementación nueva y pura (sin HTTP ni SQL) tras un flag apagado.
      Evidencia: sus tests unitarios más los mismos 42 casos pasan contra la nueva.
- [ ] T4 (S3) Modo sombra: ejecutar ambas, devolver la vieja y registrar discrepancias.
- [ ] T5 (S3) Activar la nueva para el 10 % de las cuentas y luego el 100 %, con discrepancias en cero.
- [ ] T6 (S4) Retirar la implementación vieja y el flag.
```

Nota: en T1 no hay RED, porque los tests de caracterización se escriben para pasar contra el código existente. Su red de seguridad se comprueba por mutación. El RED aplica a las reglas nuevas.

```text
1a2b3c4 test(comisiones): T1 caracterización del comportamiento actual (S1)
2b3c4d5 refactor(comisiones): T2 costura CalculadoraComisiones, sin cambio de comportamiento
3c4d5e6 feat(comisiones): T3 implementación pura tras flag apagado (S2)
```

**Corte de sesión tras T3.** Una sesión nueva recibe solo el documento. En la prueba de arranque en frío reconoce T1 a T3 con su evidencia y propone como siguiente paso: «Implementar T4, empezando por un test que verifique que se devuelve el resultado viejo y se registra la discrepancia». No se pierde nada.

**Lecciones.** Cada paso queda en verde y se revisa en minutos; el riesgo se mide con datos reales antes de conmutar; el verificador independiente entra en T5, donde se juega el dinero.

## 9. Patrones de diseño aplicados al desarrollo orgánico con agentes

- **Router proporcional.** Problema: decidir cuánto proceso. Mecánica: un clasificador determinista (autorizado, retomable, riesgo) que devuelve el nivel, en lugar de dejarlo a la improvisación del modelo.
- **Referencia, no resumen.** Problema: pérdida en los traspasos. Mecánica: pasar ruta e IDs, nunca paráfrasis.
- **Libro mayor.** Problema: historia que se reescribe. Mecánica: un log de solo añadir, con `L1` intocable.
- **Checkpoint y retoma.** Problema: continuidad. Mecánica: «Siguiente paso» ejecutable más prueba de arranque en frío.
- **Test de caracterización.** Problema: refactorizar sin red. Mecánica: fijar el comportamiento actual antes de tocarlo.
- **Strangler Fig, Branch by Abstraction y Parallel Change.** Problema: cambios grandes sin parar el producto. Mecánica: costura, convivencia, modo sombra, conmutación gradual y retiro.
- **Esqueleto andante.** Problema: riesgo de integración tardío. Mecánica: T1 cruza todas las capas con lógica mínima.
- **Verificador independiente.** Problema: sesgo del autor. Mecánica: un segundo contexto que recibe la spec literal y el candidato de cambio.
- **Recibo de evidencia.** Problema: confianza sin pruebas. Mecánica: la revisión se ata al candidato exacto (RDD) y los checks muestran su salida.
- **Trinquete.** Problema: regresión de calidad. Mecánica: cobertura, lint y tamaño de commit solo pueden mejorar.
- **Parada de línea.** Problema: bucles. Mecánica: presupuesto de intentos, hipótesis nueva y vuelta al último verde.
- **Estado honesto.** Problema: promesas falsas. Mecánica: nada se declara guardado, probado o hecho sin lectura de vuelta o salida observada.

## 10. Límites, riesgos y cuándo no usar ODD

- **Clasificación errónea.** Es el riesgo principal. Se mitiga con una lista de palabras de riesgo en `AGENTS.md` y con el veto humano.
- **Trazabilidad formal.** En auditorías, sectores regulados o contratos entre equipos, SDD (o specs de contrato) manda; el documento de ODD enlaza a esas specs en lugar de duplicarlas. Reparto razonable: ODD por defecto, SDD para contratos (API pública, esquema de eventos, reglas de negocio que consultan otros).
- **Evidencia débil.** Los benchmarks son de una sola ejecución y del propio proyecto, y la tarea grande fue unas tres veces más lenta que Codex CLI con el mismo modelo. Mide en tu código.
- **No es un estándar.** No hay literatura detrás. Lo valioso son las ideas (proporcionalidad, prueba del diff, citas literales, evidencia), no el nombre.
- **Dos regímenes a la vez.** Si conviven SDD y ODD, declara cuál manda o el agente mezclará ambos.
- **Documentos que crecen.** Un documento de feature de 800 líneas ya es un expediente: recorta y archiva.
- **Tensión entre preguntar y suponer.** Demasiadas preguntas trasladan la incertidumbre al humano; muy pocas esconden supuestos. El registro de supuestos equilibra ambas.
- **No sustituye a TDD, BDD ni DDD.** Trabaja a otra altura: decide cuánta especificación y proceso hacen falta.

## 11. Ruta de adopción en una semana

1. **Día 1:** copia el bloque de la sección 7.3 en tu `AGENTS.md` o `CLAUDE.md` y úsalo en tareas pequeñas. Observa si el agente deja de generar documentos que nadie lee.
2. **Día 2:** aplica la prueba del diff antes de cada tarea.
3. **Día 3:** crea tu primera feature grande con documento y haz la prueba de arranque en frío.
4. **Día 4:** añade las reglas de tests (RED observado, no tocar tests existentes).
5. **Día 5:** reescribe tu backlog en rebanadas verticales.
6. **Día 6:** empaqueta los tres skills y pruébalos con cuatro escenarios.
7. **Día 7:** revisa qué tareas se clasificaron mal y qué pregunta sobró. Ajusta las reglas quitando una por cada una que añadas.

**Checklist de una página**

- ¿Me pidieron un cambio o es una consulta?
- ¿Leí antes de tocar y conozco la línea base?
- ¿Hice como mucho una pregunta, y era de producto?
- ¿Se retoma con la petición y el diff? Si no, ¿existe el documento?
- ¿Toca dinero, permisos, datos o migraciones? Verificación independiente.
- ¿Cada tarea es una rebanada con prueba observada y un commit?
- ¿El cierre dice qué se verificó, qué falló, qué se supuso y cuál es el siguiente paso?

## 12. Fuentes

- Gentle-AI (Gentleman-Programming/gentle-ai): README, `docs/usage.md` y `docs/intended-usage.md`, sobre el protocolo ODD y las versiones 3.x y 4.0.0.
- Gentle Shell (Gentleman-Programming/gentle-shell): ODD como flujo diario y notas de la versión 3.0.0.
- codigoagente.blog, «ODD vs SDD: qué es Organic Driven Development y por qué reemplaza al Spec-Driven Development en Gentle-AI» (26 de octubre de 2026, actualizado el 17 de noviembre).
- Web Reactiva, «ODD vs SDD: Organic vs Spec Driven Development con IA» (16 de noviembre de 2026).
- Birgitta Böckeler, «Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl», martinfowler.com (2025).
- Marmelab, «Spec-Driven Development: The Waterfall Strikes Back» (2025).
- METR (estudio de productividad con IA, 2025) y Stack Overflow Developer Survey 2025, citados a través de Web Reactiva.
- Issue 307 de gtrabanco/agentic-workflow, sobre la adopción de ODD en otro proyecto.

*Los benchmarks citados son de una sola ejecución y del propio proyecto. Las secciones marcadas como \[Extensión\] o \[Síntesis\] son aportes de esta guía, no del protocolo oficial.*
