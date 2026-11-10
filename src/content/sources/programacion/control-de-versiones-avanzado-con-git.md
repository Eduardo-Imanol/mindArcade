# Guía definitiva: Algoritmos, Complejidad y Control de Versiones Avanzado con Git

*De la teoría de grafos al desastre en producción: arquitectura interna, algoritmos de diff y merge, reescritura de historial, hooks, estrategias de branching y monorepos.*

## 0. Cómo usar esta guía

| Nivel | Perfil | Dónde enfocarte |
| --- | --- | --- |
| 0 · Fundamentos | Usas `add`, `commit` y `push` sin saber por qué funcionan | Secciones 1 y 2 |
| 1 · Intermedio | Ramificas y fusionas con soltura | 2, 3.3 y 6 |
| 2 · Avanzado | Reescribes historia y depuras regresiones | 3, 4 y 5 |
| 3 · Experto | Diseñas flujos, gobernanza y repos a escala | 5 a 8 |

Convenciones: los comandos funcionan en Git ≥ 2.40; cuando una característica depende de una versión concreta se indica. `<sha>` es un identificador de objeto (completo o abreviado). Cada sección cierra con **Ideas clave**. Todo es agnóstico de plataforma (GitHub, GitLab, Bitbucket, Gerrit o servidores propios).

---

## 1. Fundamentos computacionales

### 1.1 Grafos, DAG y por qué importan

Un **grafo** es un par G = (V, E): vértices (aquí, commits) y aristas (relaciones padre–hijo). Es **dirigido** si las aristas tienen sentido y **acíclico** si, siguiendo las flechas, nunca regresas al punto de partida. Un **DAG** (*Directed Acyclic Graph*) admite un **orden topológico**: una secuencia donde cada nodo aparece después de aquello de lo que depende. Es justo lo que necesita un historial: «este cambio se construyó sobre aquellos».

En Git cada commit guarda punteros a sus **padres**, así que las flechas van del hijo hacia el pasado:

```
  A ◀── B ◀── C ◀──── F ◀── G        main
         \          /
          D ◀── E                    feature

  (B apunta a A; F es un merge commit con dos padres: C y E)
```

**¿Por qué nunca hay ciclos?** El identificador de un commit es el hash de su contenido, y ese contenido incluye los hashes de sus padres. Para cerrar un ciclo, un commit tendría que contener su propio hash: un punto fijo de la función hash, computacionalmente inviable. Como además los objetos son inmutables (cambiar un byte cambia el ID), el grafo solo puede crecer añadiendo nodos.

| Término | Significado |
| --- | --- |
| Raíz | Commit sin padres (puede haber varias: `checkout --orphan`, `--allow-unrelated-histories`) |
| Merge commit | Commit con dos o más padres |
| Punta (*tip*) | Commit al que apunta una rama |
| Ancestro / descendiente | Alcanzable siguiendo padres / alcanzable en sentido inverso |
| Alcanzable (*reachable*) | Existe un camino desde una referencia hasta el objeto |
| Merge base | Mejor ancestro común de dos commits (LCA en el DAG) |
| Primer padre | En un merge, el padre de la rama donde estabas parado |

### 1.2 Almacenamiento direccionable por contenido y Merkle DAG

En su núcleo, Git es un **almacén clave–valor** donde la clave es el hash del valor. De ahí salen propiedades que explican casi todo su comportamiento:

- **Integridad:** si un objeto se corrompe, su hash ya no coincide; `git fsck` lo detecta.
- **Deduplicación:** dos archivos idénticos, en cualquier ruta o commit, son un único objeto.
- **Inmutabilidad:** no se «edita» un objeto; se crea otro con otro ID.
- **Compartición estructural:** un commit nuevo reutiliza todo lo que no cambió (sección 2.2).
- **Comparación en O(1):** dos árboles son iguales si y solo si su hash es igual. Por eso `diff` y `merge` saltan directorios enteros sin leerlos.

Como un árbol contiene los hashes de sus hijos, el hash raíz *autentica* todo lo que hay debajo. Cambiar un byte altera el blob, luego los árboles que lo contienen, luego el commit y, por contener el hash del padre, **todos los descendientes**. Esto es un **Merkle DAG**, la misma idea detrás de blockchains, IPFS o las capas de Docker.

> **SHA-1 y SHA-256.** Por defecto Git usa SHA-1 (160 bits, 40 caracteres hex). Tras el ataque de colisión SHAttered (2017), Git incorpora desde la 2.13 una variante endurecida (*sha1dc*) que detecta los patrones de ese ataque. Existe `git init --object-format=sha256`, pero el soporte del ecosistema (hosting, herramientas) aún es limitado y un repo SHA-256 no es interoperable con uno SHA-1.

### 1.3 Complejidad algorítmica: mini-primer

La notación **O(f(n))** describe cómo crece el costo cuando crece la entrada n, ignorando constantes.

| Clase | Ejemplo cotidiano |
| --- | --- |
| O(1) | Leer una referencia, crear una rama |
| O(log n) | Búsqueda binaria en un índice ordenado, `git bisect` |
| O(n) | Recorrer todos los archivos (`git status` sin ayudas) |
| O(n log n) | Ordenar (p. ej., entradas de un árbol) |
| O(n²) | Comparar todos contra todos (detección de renombres sin límites) |
| O(N·D) | Diff de Myers: N = tamaño de los archivos, D = tamaño de la diferencia |

Costo típico de operaciones de Git:

| Operación | Costo | Nota |
| --- | --- | --- |
| Buscar objeto por hash | O(1) suelto · O(log n) en pack | El `.idx` usa tabla *fanout* + búsqueda binaria |
| Crear rama | O(1) | Escribir un archivo de \~41 bytes |
| `git commit` | O(archivos modificados × profundidad) | Solo se reescriben los árboles en la ruta modificada |
| `git status` | O(archivos del working tree) | Un `stat` por archivo, salvo fsmonitor |
| `git log` | O(commits visitados) | `--first-parent` y *commit-graph* lo aceleran |
| `git merge-base` | O(commits entre puntas y ancestro) | Los *generation numbers* acotan la búsqueda |
| Diff de dos archivos | O(N·D), esperado O(N + D²) | Myers |
| `git bisect` | O(log n) pruebas | Cada paso recorre parte del grafo |
| `git clone` | O(tamaño del historial) | *Partial clone* lo reduce (sección 7) |

**Ideas clave (sección 1):** el historial es un DAG inmutable; el hash de cada commit certifica todo su pasado; casi todo en Git es barato porque comparar hashes es O(1) y porque lo que no cambió se comparte.

---

## 2. El modelo de objetos de Git

### 2.1 Los cuatro tipos de objeto

| Tipo | Qué guarda | Analogía |
| --- | --- | --- |
| **blob** | Los bytes de un archivo (sin nombre ni permisos) | Contenido |
| **tree** | Lista de entradas `(modo, nombre, hash)` | Directorio |
| **commit** | Un tree + padres + autor/committer + mensaje | Foto con contexto |
| **tag anotado** | Puntero a un objeto + tagger + mensaje (+ firma) | Etiqueta con metadatos |

**Formato de almacenamiento.** Todo objeto es `<tipo> <tamaño>\0<contenido>`; se calcula su SHA-1, se comprime con zlib y se guarda en `.git/objects/xx/yyyy…` (los dos primeros caracteres del hash son el directorio). Puedes reproducirlo a mano:

```bash
echo 'hola' | git hash-object --stdin          # calcula el hash sin escribir
(printf 'blob 5\0'; echo 'hola') | sha1sum      # mismo hash: 'hola' + salto = 5 bytes
```

Laboratorio mínimo:

```bash
git init lab && cd lab
echo 'hola' | git hash-object -w --stdin   # -w escribe el objeto; imprime <blob>
git cat-file -t <blob>                     # blob
git cat-file -p <blob>                     # hola
git cat-file -s <blob>                     # 5
find .git/objects -type f                  # el objeto suelto en disco
```

**Blob.** Solo contenido. No sabe cómo se llama ni dónde vive: renombrar un archivo no crea un blob nuevo, y dos archivos con el mismo contenido comparten blob.

**Tree.** Cada entrada es `<modo> <nombre>\0<hash binario>` y se ordena por nombre en bytes (los directorios se comparan como si terminaran en `/`). Modos posibles: `100644` archivo normal, `100755` ejecutable, `120000` enlace simbólico, `040000` subárbol, `160000` *gitlink* (submódulo). Git **no versiona directorios vacíos**: un árbol sin entradas no existe.

```
$ git ls-tree HEAD
100644 blob 3b18e51   README.md
100755 blob 8f2a0c1   build.sh
040000 tree 9c1d2e4   src
160000 commit 5d3f1ab vendor/lib      <- submódulo: apunta a un commit de otro repo
```

**Commit.** Texto plano con cabeceras:

```
$ git cat-file -p HEAD
tree 9c1d2e4...
parent 7ab43f1...
author Ana Pérez <ana@ejemplo.com> 1730000000 -0600
committer Luis Gómez <luis@ejemplo.com> 1730003600 -0600
gpgsig -----BEGIN PGP SIGNATURE----- ...

fix: corrige el redondeo del IVA
```

Puntos finos: **author** (quién escribió el cambio) y **committer** (quién lo aplicó) son distintos; un `rebase` o `cherry-pick` conserva el autor y cambia el committer. El mensaje y los metadatos entran en el hash, así que *editar un mensaje equivale a crear un commit nuevo* y, en cascada, nuevos hashes para todos sus descendientes. Un merge tiene varias líneas `parent`.

**Tag anotado.** Objeto propio con cabeceras `object`, `type`, `tag`, `tagger` y mensaje; admite firma GPG/SSH. Un tag *ligero* es solo una referencia en `refs/tags/` sin objeto propio. Usa anotados para releases: guardan quién, cuándo y por qué.

### 2.2 Compartición estructural: snapshots, no diffs

Git guarda **instantáneas completas**, no listas de cambios. Lo que evita que esto explote en tamaño es la compartición:

```
C1 ──▶ T1 ─┬─ README.md ──▶ blob b1
           └─ src/ ──▶ t1 ─┬─ main.go ──▶ blob b2
                           └─ util.go ──▶ blob b3

C2 (edita util.go) ──▶ T2 ─┬─ README.md ──▶ blob b1   ← reutilizado
                           └─ src/ ──▶ t2 ─┬─ main.go ──▶ blob b2   ← reutilizado
                                           └─ util.go ──▶ blob b4   ← NUEVO
```

Un commit que cambia un archivo crea: 1 blob + 1 tree por cada nivel de directorio en la ruta + 1 commit. Las diferencias se **calculan bajo demanda** comparando árboles; la compresión por deltas ocurre después, a nivel físico (sección 2.6).

### 2.3 Construir un commit a mano (plumbing)

Git tiene comandos de *alto nivel* (porcelain: `add`, `commit`) y de *bajo nivel* (plumbing). Un commit completo con solo plumbing:

```bash
BLOB=$(echo 'hola mundo' | git hash-object -w --stdin)
git update-index --add --cacheinfo 100644 $BLOB hola.txt   # lo mete al índice
TREE=$(git write-tree)                                      # índice -> objeto tree
COMMIT=$(echo 'primer commit' | git commit-tree $TREE)      # crea el commit
git update-ref refs/heads/main $COMMIT                      # mueve la rama
git log --oneline                                           # ¡funciona!
```

Conclusión: `git commit` = `write-tree` + `commit-tree` + `update-ref`.

### 2.4 El índice y los tres árboles

`.git/index` es un archivo binario con la lista ordenada de rutas, su blob y metadatos de `stat` (mtime, tamaño, inodo) usados como caché para detectar cambios sin releer contenido. Define tres «lugares»:

```
 Working tree ──(git add)──▶ Índice ──(git commit)──▶ HEAD (commit)
      ◀───────(git restore)────── ◀──(git restore --staged)──
```

| Comando | Compara |
| --- | --- |
| `git diff` | working tree vs índice |
| `git diff --staged` | índice vs HEAD |
| `git diff HEAD` | working tree vs HEAD |

| `git reset` | Mueve rama/HEAD | Reescribe índice | Reescribe working tree |
| --- | --- | --- | --- |
| `--soft` | Sí | No | No |
| `--mixed` (por defecto) | Sí | Sí | No |
| `--hard` | Sí | Sí | **Sí (destructivo)** |

Durante un merge con conflicto, el índice guarda **tres versiones** de cada archivo conflictivo en «etapas» (`git ls-files -s` muestra `<modo> <sha> <etapa> <ruta>`): etapa 0 = normal, **1 = ancestro común (base)**, **2 = ours**, **3 = theirs**. Es el insumo exacto del merge de tres vías (sección 3).

### 2.5 Referencias: nombres móviles sobre objetos inmutables

Los objetos nunca cambian; lo que se mueve son las **referencias**, archivos de texto con un hash:

```
.git/HEAD                       ->  ref: refs/heads/main        (referencia simbólica)
.git/refs/heads/main            ->  9fceb02...  (40 hex + salto de línea)
.git/refs/tags/v1.0             ->  hash del tag anotado, o del commit si es ligero
.git/refs/remotes/origin/main   ->  último valor conocido del remoto
```

Una rama es literalmente un archivo de \~41 bytes: por eso crear ramas es O(1). **HEAD** normalmente apunta a una rama (simbólica); en **detached HEAD** contiene un hash directo y los commits nuevos no tienen rama que los sostenga (¡cuidado con el GC!).

| Espacio de nombres | Contenido |
| --- | --- |
| `refs/heads/*` | Ramas locales |
| `refs/tags/*` | Etiquetas |
| `refs/remotes/<remoto>/*` | Ramas de seguimiento remoto |
| `refs/stash` | Último stash (los anteriores en su reflog) |
| `refs/notes/*`, `refs/replace/*` | Notas y reemplazo de objetos |
| `refs/pull/N/head` | Convención de plataformas para PRs |

Referencias especiales que Git crea temporalmente: `ORIG_HEAD` (dónde estabas antes de una operación peligrosa), `MERGE_HEAD`, `FETCH_HEAD`, `CHERRY_PICK_HEAD`, `REBASE_HEAD`.

Herramientas: `git symbolic-ref HEAD`, `git rev-parse <rev>`, `git update-ref`, `git for-each-ref`, `git show-ref`. Para muchas referencias, Git las empaqueta en `.git/packed-refs` (`git pack-refs`); desde Git 2.45 existe el backend experimental **reftable** (`--ref-format=reftable`) para escalar a millones de refs.

**Sintaxis de revisiones:**

| Expresión | Significado |
| --- | --- |
| `HEAD~3` | Tres commits atrás siguiendo siempre el primer padre |
| `HEAD^2` | Segundo padre de un merge |
| `A..B` | Commits alcanzables desde B pero no desde A |
| `A...B` | Diferencia simétrica: alcanzables desde uno solo de los dos |
| `@{u}` | Rama upstream de la actual |
| `@{2}` · `main@{yesterday}` | Posiciones anteriores según el reflog |
| `:/texto` | Commit más reciente cuyo mensaje coincide |

```
        M  ← HEAD
       / \
   (^1)   (^2)       M^1 = main antes del merge, M^2 = feature
     X     Y         M~1 = M^1 = X   (~ siempre sigue el primer padre)
```

### 2.6 Almacenamiento físico: sueltos, packfiles y deltas

**Objetos sueltos (*loose*)**: un archivo zlib por objeto en `.git/objects/xx/`. Simples, pero ineficientes con miles de objetos (sistema de archivos, bloques de 4 KB).

**Packfiles** (`.git/objects/pack/pack-*.pack` + `.idx`): muchos objetos en un solo archivo.

- **Compresión delta:** Git guarda un objeto como la diferencia contra otro similar (`OFS_DELTA` / `REF_DELTA`). Lo importante: *el delta puede ir contra cualquier objeto*, no necesariamente la versión anterior; Git ordena candidatos por tipo, nombre y tamaño y prueba una ventana (`pack.window`, 10 por defecto) con una cadena máxima (`pack.depth`, 50).
- **`.idx`:** tabla *fanout* de 256 entradas (por primer byte del hash) + hashes ordenados: búsqueda en O(log n).
- **Auxiliares:** `commit-graph` (grafo de commits con *generation numbers* y, opcionalmente, filtros Bloom de rutas modificadas), `multi-pack-index`, índices `.rev` y *bitmaps* de alcanzabilidad (aceleran mucho clones/fetch en servidores).
- **Transferencia:** `fetch`/`push` envían packfiles *thin* con solo lo que falta (negociación de «have/want» sobre el DAG).

Inspección del espacio:

```bash
git count-objects -vH                      # sueltos vs empaquetados, tamaño en disco
git verify-pack -v .git/objects/pack/*.idx | sort -k3 -n | tail -5   # los mayores en pack

# Los 10 blobs más grandes de TODA la historia (para cazar binarios olvidados)
git rev-list --objects --all \
 | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
 | awk '$1=="blob"' | sort -k3 -n -r | head -10
```

### 2.7 Anatomía de `.git/`

```
.git/
├── HEAD              # rama actual (o hash en detached)
├── config            # configuración del repo
├── hooks/            # scripts de automatización (no se versionan)
├── index             # área de staging
├── info/exclude      # .gitignore local no compartido
├── logs/             # reflogs: HEAD y cada rama
├── objects/          # base de datos: xx/ sueltos, pack/, info/
├── refs/             # heads/, tags/, remotes/
├── packed-refs       # refs empaquetadas
└── ORIG_HEAD, MERGE_HEAD, rebase-merge/ ...   # estado de operaciones en curso
```

Alcanzabilidad y recolección de basura (qué objetos sobreviven y cuáles se borran) se tratan a fondo en la sección 4.6.

**Ideas clave (sección 2):** cuatro tipos de objeto inmutables; las ramas y tags son punteros baratos; el índice es el tercer árbol; el espacio en disco lo gobierna la compartición estructural más la compresión por deltas en packfiles.

---

## 3. Algoritmos de diferenciación y fusión (Diff & Merge)

### 3.1 El problema formal

Calcular un diff es encontrar el **script de edición más corto (SES)** que transforma una secuencia A (N líneas) en otra B (M líneas) usando solo inserciones y borrados. Es equivalente al problema de la **subsecuencia común más larga (LCS)**:

> |SES| = N + M − 2·|LCS|

La solución clásica por programación dinámica (tipo Wagner–Fischer / Hunt–McIlroy) llena una tabla de N×M celdas: O(N·M) en tiempo y espacio. Dos archivos de 100 000 líneas serían 10¹⁰ celdas: inviable. La observación práctica que lo cambia todo: **los archivos que se comparan casi siempre son parecidos**, es decir, la distancia D es pequeña. Hace falta un algoritmo cuyo costo dependa de D, no solo del tamaño.

Además, antes de comparar, Git (en su biblioteca *xdiff*) convierte cada línea a un entero mediante hash, recorta el prefijo y el sufijo comunes y descarta las líneas que no aparecen en el otro archivo. Así, comparar dos líneas es O(1).

### 3.2 El algoritmo de Myers (1986)

Eugene Myers, *An O(ND) Difference Algorithm and Its Variations*. Es el algoritmo por defecto de `git diff`.

**Idea: un grafo de edición.** Dibuja una cuadrícula de (N+1)×(M+1) puntos. Cada punto (x, y) significa «he consumido x líneas de A y y líneas de B». Desde (x, y) puedes moverte:

- **Derecha** → (x+1, y): *borrar* la línea A\[x\] (cuesta 1).
- **Abajo** → (x, y+1): *insertar* la línea B\[y\] (cuesta 1).
- **Diagonal** ↘ (x+1, y+1): *gratis*, solo si A\[x\] == B\[y\] (línea común).

El diff mínimo es el **camino más corto** de (0, 0) a (N, M), donde solo cuestan los movimientos no diagonales. Sea **D** el número de esos movimientos. Se organizan los puntos por **diagonales** k = x − y.

**Búsqueda por «alcance máximo».** Para cada d = 0, 1, 2, … y cada diagonal k ∈ {−d, −d+2, …, d}, se calcula el mayor x alcanzable con exactamente d aristas no diagonales (`V[k]`). La recurrencia: llegas a la diagonal k o bien desde k+1 bajando (inserción) o desde k−1 yendo a la derecha (borrado); eliges la que llegue más lejos y luego sigues por la diagonal todo lo que puedas (una *serpiente*). El primer d que alcanza (N, M) es el D óptimo.

```python
def myers(a, b):
    n, m = len(a), len(b)
    v = {1: 0}                      # V[k] = x más lejano en la diagonal k
    trace = []                      # historial para reconstruir el camino
    for d in range(n + m + 1):
        trace.append(v.copy())
        for k in range(-d, d + 1, 2):
            if k == -d or (k != d and v[k - 1] < v[k + 1]):
                x = v[k + 1]        # bajar: inserción
            else:
                x = v[k - 1] + 1    # derecha: borrado
            y = x - k
            while x < n and y < m and a[x] == b[y]:
                x, y = x + 1, y + 1 # serpiente: líneas iguales gratis
            v[k] = x
            if x >= n and y >= m:
                return d, trace     # d = tamaño del SES; backtrack con trace
```

**Complejidad.** Tiempo O(N·D) en el peor caso y **O(N + D²) esperado**; con el refinamiento de espacio lineal (buscar la *serpiente media* avanzando desde ambos extremos y recursar en cada mitad) el espacio baja a O(N). Si los archivos son casi iguales, D es pequeño y el diff es casi lineal. Si son totalmente distintos, D ≈ N + M y degenera a cuadrático.

**Ejemplo del artículo original.** A = `ABCABBA`, B = `CBABAC`: D = 5 (LCS = 4, y 7 + 6 − 8 = 5). Un SES posible:

```
- A
- B
  C
+ B
  A
  B
- B
  A
+ C
```

Hay varios SES de igual longitud; cuál se elige afecta a la **legibilidad**, lo que motiva los algoritmos alternativos.

**Lo que añade Git sobre Myers puro:** (1) una heurística de *coste máximo*: si la búsqueda se vuelve demasiado cara, acepta un diff no mínimo pero rápido (`--minimal` la desactiva); (2) una fase de **compactación** que desliza los hunks hacia arriba/abajo entre posiciones equivalentes, con la *indent heuristic* (por defecto desde 2.14) para alinearlos con líneas en blanco e indentación, de modo que un bloque insertado aparezca como función completa y no como «la mitad de dos funciones».

### 3.3 Otros algoritmos y el formato del diff

| `--diff-algorithm` | Idea | Cuándo usarlo |
| --- | --- | --- |
| `myers` (defecto) | SES con heurísticas | Uso general, rápido |
| `minimal` | Myers sin heurísticas de corte | Diff mínimo garantizado, más lento |
| `patience` | Ancla en líneas **únicas** presentes en ambos archivos; calcula su LIS (subsecuencia creciente más larga, vía *patience sorting*) y recursa entre anclas | Código con llaves/líneas repetidas; diffs más «semánticos» tras refactors |
| `histogram` | Extensión de patience (origen: JGit): construye un histograma de apariciones y ancla en la línea común **menos repetida** | Suele ser el mejor equilibrio calidad/velocidad |

```bash
git config --global diff.algorithm histogram
git diff --word-diff                 # diff a nivel de palabra
git diff --color-moved=zebra         # resalta bloques movidos (no solo borrados/insertados)
git diff -w                          # ignora espacios
```

**Formato unificado:** cada *hunk* empieza con `@@ -a,b +c,d @@`: en el archivo viejo, desde la línea `a`, `b` líneas; en el nuevo, desde `c`, `d` líneas. Por defecto muestra 3 líneas de contexto. El diff es **textual por líneas**: no entiende sintaxis ni semántica.

**Detección de renombres.** Git no guarda renombres; los **infiere** al hacer diff o merge. Primero busca renombres *exactos* (mismo hash de blob, con una tabla hash: O(n)). Luego, para los archivos borrados y añadidos restantes, calcula una **similitud** (por defecto ≥ 50 %) comparando fragmentos hasheados. Ese emparejamiento es potencialmente cuadrático, así que se acota con `diff.renameLimit` y `merge.renameLimit`. Por eso en refactors masivos aparece el aviso de que la detección inexacta de renombres se omitió por demasiados archivos.

### 3.4 Fusión de tres vías (three-way merge)

Dados el **ancestro común O** (base), **A** (ours, tu lado) y **B** (theirs, el otro lado), la regla por región es:

| Base O | Ours A | Theirs B | Resultado |
| --- | --- | --- | --- |
| X | X | X | X |
| X | X | Y | **Y** (solo theirs cambió) |
| X | Y | X | **Y** (solo ours cambió) |
| X | Y | Y | **Y** (cambio idéntico en ambos: sin conflicto) |
| X | Y | Z | **CONFLICTO** |

**Por qué se necesita la base.** Con solo dos versiones no puedes distinguir si una línea «desapareció» porque un lado la borró o porque el otro la añadió. La base convierte cada diferencia en una *intención*.

**Algoritmo (estilo diff3, implementado en xdiff):**

1. Calcula `diff(O → A)` y `diff(O → B)` (con Myers/histogram).
2. Recorre ambas listas de hunks usando las coordenadas de O como eje común.
3. Un hunk que no se solapa con ningún hunk del otro lado se aplica sin más.
4. Hunks de ambos lados que **se solapan o son contiguos** forman una región: si el texto resultante es idéntico, se acepta; si no, es conflicto.

Costo: dos diffs más un recorrido lineal. Importante: un conflicto es **una colisión de regiones**, no de significado. Dos ediciones en líneas *adyacentes* chocan aunque sean lógicamente independientes.

**Ejemplo.** Base:

```
timeout = 30
host = local
retries = 3
```

Ours cambia `timeout = 60`; theirs cambia `timeout = 45` y `retries = 5`. La línea 1 colisiona; la 3 solo la tocó theirs, así que se acepta `5`:

```
<<<<<<< HEAD
timeout = 60
||||||| base
timeout = 30
=======
timeout = 45
>>>>>>> feature
host = local
retries = 5
```

**Estilos de marcadores** (`merge.conflictStyle`): `merge` (por defecto, solo ours/theirs), `diff3` (añade la sección *base* tras `|||||||`) y **`zdiff3`** (Git 2.35: como diff3 pero saca fuera de los marcadores las líneas comunes al inicio y al final, dejando conflictos más pequeños). Recomendado: `git config --global merge.conflictStyle zdiff3`.

**Herramientas durante un conflicto:**

```bash
git status                          # 'both modified: ...'
git ls-files -u                     # etapas 1 (base), 2 (ours), 3 (theirs)
git show :1:ruta :2:ruta :3:ruta    # lee cada versión desde el índice
git diff --base ruta                # y --ours / --theirs
git log --merge -p -- ruta          # commits de AMBOS lados que tocaron el conflicto
git checkout --ours -- ruta         # toma tu lado completo (o --theirs)
git checkout --conflict=diff3 ruta  # regenera marcadores si los borraste
git diff --check                    # detecta marcadores olvidados
git merge --abort                   # vuelve al estado previo al merge
```

> **Conflictos semánticos.** Git fusiona *texto*, no significado. Si A renombra `foo()` a `bar()` y B añade una llamada a `foo()` en otro archivo, la fusión es limpia **y el build se rompe**. La defensa es CI sobre el resultado del merge, colas de merge y buenos tests (sección 6).

### 3.5 El merge base: ancestro común más cercano en un DAG

El **merge base** de A y B es un ancestro común que no es ancestro de otro ancestro común (el LCA, *lowest common ancestor*, del DAG). Git lo calcula con un recorrido de **«pintado hacia abajo»**: marca los commits alcanzables desde cada punta con banderas, procesa una cola de prioridad ordenada por fecha (o por *generation number*), y cuando un commit tiene ambas banderas es un ancestro común; lo marca como *stale* y propaga esa marca a sus ancestros para no reportarlos. El costo es proporcional a los commits entre las puntas y el merge base.

```bash
git merge-base main feature            # el mejor ancestro común
git merge-base --all A B               # todos, si hay varios
git merge-base --is-ancestor X Y       # ¿X es ancestro de Y? (exit 0 = sí)
git merge-base --fork-point origin/main feature   # punto de bifurcación usando el reflog
```

**Merge cruzado (criss-cross).** A veces hay *más de un* mejor ancestro:

```
base ◀── A1 ◀── A2        A2 = merge(A1, B1)
  ▲                         B2 = merge(B1, A1)
  └───── B1 ◀── B2        merge-base(A2, B2) = { A1, B1 }  (dos bases)
```

Con varias bases, el merge de tres vías es ambiguo. Resolverlo bien es la diferencia entre estrategias (siguiente apartado). Los **generation numbers** (en el `commit-graph`) también corrigen el problema de relojes desajustados: no dependen de las fechas, solo de la topología.

### 3.6 Estrategias de fusión: resolve, recursive, ort

| Estrategia | Qué hace |
| --- | --- |
| **ort** | Por defecto desde Git 2.34 (2021). Sucesora de recursive |
| **recursive** | Por defecto hasta 2.33. Si hay varias bases, las fusiona entre sí formando un *ancestro virtual* |
| **resolve** | Tres vías con una sola base; no maneja bien merges cruzados |
| **octopus** | Fusiona más de dos ramas; se niega si hay conflictos manuales |
| **ours** | Registra el merge pero **conserva el árbol actual entero** |
| **subtree** | Variante de recursive que ajusta rutas cuando un proyecto vive en un subdirectorio |

**recursive:** con bases A1 y B1, primero fusiona A1 y B1 (usando `base` como ancestro) para producir un commit virtual V, y usa V como base del merge real. La recursión se aplica si V mismo necesita varias bases.

**ort** (*Ostensibly Recursive's Twin*, de Elijah Newren) conserva esa semántica pero reescribe el motor:

- **Todo en memoria.** Calcula el resultado primero y solo después escribe árbol de trabajo e índice: no deja un working tree a medias, y habilita `git merge-tree --write-tree` (2.38), que las plataformas usan para comprobar si un PR es fusionable sin hacer checkout.
- **Recorrido por árboles.** Salta subdirectorios cuyo hash es idéntico en las tres versiones, así que el costo es proporcional a lo *cambiado*, no al tamaño del repo.
- **Mejor detección de renombres.** Exactos primero, caché de resultados durante secuencias como `rebase`, detección de renombres de *directorio* y mejor manejo de conflictos rename/rename. En casos con muchos renombres la mejora es de órdenes de magnitud.
- Corrige errores históricos de corrección del motor recursive.

**Opciones de estrategia (`-X`):**

| Opción | Efecto |
| --- | --- |
| `-X ours` / `-X theirs` | Resuelve **solo los hunks en conflicto** a favor de un lado; el resto se fusiona normal |
| `-X patience` · `histogram` · `minimal` | Algoritmo de diff usado dentro del merge |
| `-X ignore-space-change` | Ignora cambios de espacios |
| `-X renormalize` | Normaliza finales de línea antes de fusionar |
| `-X find-renames=70` · `no-renames` | Ajusta o apaga la detección de renombres |
| `-X subtree=ruta` | Ajusta la ruta del subproyecto |

> **No confundir** `-X ours` (opción: gana tu lado *solo donde hay conflicto*) con `-s ours` (estrategia: ignora **todo** el contenido del otro lado pero registra el merge). `-s ours` sirve para declarar «integrada» una rama muerta sin traer sus cambios. Y `-X theirs` descarta silenciosamente líneas de tu lado: úsalo con revisión posterior.

### 3.7 `rerere`, `.gitattributes` y drivers de merge

**rerere** (*reuse recorded resolution*) memoriza cómo resolviste un conflicto y lo reaplica cuando reaparece (típico en rebases repetidos o ramas largas). Guarda en `.git/rr-cache/<hash>/` el *preimage* (conflicto) y el *postimage* (tu resolución), indexados por un hash del conflicto normalizado.

```bash
git config --global rerere.enabled true
git rerere status      # conflictos con resolución registrada
git rerere diff        # qué aplicó
git rerere forget ruta # olvida una resolución mala
```

**`.gitattributes`** controla cómo se fusiona cada ruta:

```
* text=auto eol=lf          # normaliza finales de línea (evita conflictos fantasma)
CHANGELOG.md  merge=union   # concatena ambos lados, nunca conflicto
*.lock        merge=binary  # lockfiles: no se fusionan; eliges un lado y regeneras
*.png         binary
```

Para un driver propio (p. ej., regenerar un lockfile con la herramienta de paquetes):

```bash
git config merge.lockfile.name 'regenera lockfile'
git config merge.lockfile.driver './scripts/merge-lock.sh %O %A %B'
# y en .gitattributes:  package-lock.json merge=lockfile
```

`%O` = base, `%A` = ours (el driver debe dejar aquí el resultado), `%B` = theirs. Salida 0 = resuelto; distinta de 0 = conflicto.

### 3.8 Protocolo de resolución y cómo reducir conflictos

1. `git status` y `git diff --name-only --diff-filter=U` para ver qué está en conflicto.
2. Entiende la **intención** de ambos lados: `git log --merge -p -- ruta` y los mensajes de commit.
3. Edita con `zdiff3` activo; si dudas, `git merge --abort` y vuelve a empezar.
4. `git add ruta`, luego `git diff --check`, **compila y corre los tests** (un merge limpio o resuelto puede estar roto).
5. `git merge --continue` (o `git rebase --continue`).

**Reducir conflictos en origen:** ramas pequeñas e integración frecuente; un formateador automático obligatorio (los cambios de espacios son la fuente número uno de conflictos inútiles); **separar los renombres de las ediciones** en commits distintos (así la detección es *exacta*); no editar archivos generados a mano; `rerere` activo.

**Ideas clave (sección 3):** diff = camino mínimo en un grafo de edición (Myers, O(N·D)); merge = dos diffs contra una base común más una regla de decisión por región; el conflicto es solapamiento textual, no semántico; `ort` hace lo mismo que `recursive` pero en memoria, por árboles y con mejores renombres.

---

## 4. Operaciones avanzadas de historial: rebase, bisect, reflog

### 4.1 Rebase: la mecánica interna

`git rebase` **no mueve commits: crea copias** sobre otra base. Dado:

```
Antes:
          D ── E              feature
         /
  A ── B ── C ── F           main

Después de `git rebase main` (estando en feature):

                    D' ── E'     feature
                   /
  A ── B ── C ── F               main      (D y E siguen vivos en el reflog)
```

Pasos reales:

1. Calcula `merge-base(HEAD, main)` = B y la lista `main..HEAD` = \[D, E\] en orden topológico (los merges se descartan salvo con `--rebase-merges`).
2. Guarda `ORIG_HEAD` y hace *detached checkout* de la punta de `main` (o del destino de `--onto`).
3. Reaplica cada commit como un **cherry-pick**, que es un merge de tres vías con *base = padre del commit*, *ours = HEAD actual*, *theirs = el commit*. Conserva el autor; cambia committer y fecha de committer.
4. Omite los commits cuyo **patch-id** (hash del diff normalizado, sin números de línea ni espacios) ya exista en el destino: detecta «el mismo cambio» aunque tenga otro hash.
5. Al terminar, mueve la rama al HEAD final y vuelve a asociar HEAD con ella.

D' ≠ D porque su **padre** cambió (y con él, el árbol y el hash). Costo: k merges de tres vías secuenciales, cada uno puede entrar en conflicto de nuevo (de ahí el valor de `rerere`).

**`--onto`: trasplantar un rango.**

```bash
# feature2 nació de feature1, pero feature1 ya no se usará: méntela directamente sobre main
git rebase --onto main feature1 feature2
#                 destino viejo-base  rama
```

Se lee: «toma los commits de `feature1..feature2` y reaplica sobre `main`».

|  | **merge** | **rebase** |
| --- | --- | --- |
| Historia | Conserva la topología real | Lineal, reescrita |
| Hashes existentes | Intactos | Los commits movidos obtienen hashes nuevos |
| Conflictos | Se resuelven una vez | Potencialmente en cada commit reaplicado |
| Trazabilidad | El merge commit marca la integración | Se pierde cuándo/cómo se integró |
| En ramas compartidas | Seguro | **Peligroso** |
| Riesgo oculto | — | Commits intermedios que nunca existieron probados (usa `--exec`) |

Regla práctica: **rebase para limpiar tu rama privada antes de integrarla; merge para integrar en ramas compartidas.**

### 4.2 Rebase interactivo (`rebase -i`)

`git rebase -i main` (o `HEAD~5`) abre una lista de tareas con los commits **del más antiguo al más nuevo** (al revés que `git log`):

```
pick   a1b2c3 feat: agrega modelo de usuario
fixup  d4e5f6 fix typo
reword 0a9b8c feat: endpoint /users
squash 7d6e5f test: casos de borde
drop   3c2b1a debug: logs temporales
exec   make test
```

| Comando | Efecto |
| --- | --- |
| `pick` (p) | Usa el commit tal cual |
| `reword` (r) | Usa el commit y abre el editor para el mensaje |
| `edit` (e) | Se detiene tras aplicarlo: puedes enmendar o dividirlo |
| `squash` (s) | Lo funde con el anterior y combina los mensajes |
| `fixup` (f) | Como squash pero descarta este mensaje (`-C` conserva el de este commit) |
| `drop` (d) | Elimina el commit |
| `exec` (x) | Ejecuta un comando; si falla, se detiene |
| `break` (b) | Pausa en ese punto |
| `label` · `reset` · `merge` | Reconstruyen la topología con `--rebase-merges` |
| `update-ref` | Actualiza ramas apiladas (`--update-refs`) |

**Reordenar** commits = reordenar las líneas. Si borras una línea, ese commit se descarta.

**Por qué `squash` es sencillo:** como cada commit es un snapshot, fundir un grupo equivale a crear *un* commit con el árbol del último del grupo y el padre del primero.

**Mecánica:** el estado vive en `.git/rebase-merge/` (`git-rebase-todo`, `done`, `onto`, `head-name`, `orig-head`, `stopped-sha`). Control: `git rebase --continue | --skip | --abort | --edit-todo`.

**Recetas:**

```bash
# 1) Fixups automáticos
git commit --fixup <sha-del-commit-a-corregir>
git rebase -i --autosquash main          # o: git config --global rebase.autoSquash true

# 2) Dividir un commit: marca 'edit' y, al detenerse:
git reset HEAD^                          # deshace el commit pero deja los cambios
git add -p && git commit -m 'parte 1'    # repite por cada parte
git rebase --continue

# 3) Garantizar que CADA commit compila y pasa tests (serie 'bisectable')
git rebase main --exec 'make test'

# 4) Ramas apiladas: mueve también las ramas intermedias (Git 2.38)
git rebase -i --update-refs main

# 5) Comparar la serie antes y después de reescribirla
git range-diff main feature@{1} feature
```

### 4.3 Peligros de alterar la historia en entornos distribuidos

Reescribir **no modifica** los commits viejos: crea nuevos y mueve una referencia. Pero en un sistema distribuido, otros clones siguen teniendo los viejos. Si publicas la versión reescrita con `push --force`, quienes ya trabajaron sobre los commits antiguos quedan con una historia **divergente**; al hacer `pull` se les fusionan los commits viejos con los nuevos y el mismo cambio aparece **duplicado** con hashes distintos (más conflictos). Efectos colaterales: se invalidan las firmas, los comentarios de revisión pierden su ancla y CI vuelve a correr.

**Regla de oro:** reescribe solo commits que **no hayas compartido** (o ramas que sean *tuyas* por acuerdo).

**Forzar con red de seguridad.** `--force-with-lease` es un *compare-and-swap*: el push solo procede si la rama remota sigue donde tú crees que está. Un `git fetch` automático del IDE actualiza tu referencia remota y anula esa protección sin avisar, así que añade `--force-if-includes` (2.30) o fija el valor esperado:

```bash
git push --force-with-lease --force-if-includes origin feature
git push --force-with-lease=feature:<sha-esperado> origin feature
```

**Si un compañero reescribió una rama compartida y tú tienes commits locales encima:**

```bash
git fetch origin
git rebase --onto origin/feature origin/feature@{1} feature
#   transplanta SOLO tus commits locales nuevos (los posteriores a la punta anterior del remoto)
```

**Prevención institucional:** protección de ramas (sin force-push en `main`/`release/*`), `receive.denyNonFastForwards true` en servidores propios y una convención clara de qué ramas son reescribibles.

### 4.4 Git bisect: búsqueda binaria sobre el DAG

**Teoría.** Si existe un predicado *monótono* sobre n commits ordenados (bueno, bueno, …, bueno, malo, malo, …), la transición se localiza con ⌈log₂ n⌉ pruebas:

| Commits en el rango | Pruebas máximas |
| --- | --- |
| 100 | 7 |
| 1 000 | 10 |
| 5 000 | 13 |
| 100 000 | 17 |
| 1 000 000 | 20 |

En un DAG real no hay una secuencia lineal. Los **candidatos** son los commits alcanzables desde `bad` pero no desde `good` (el rango `good..bad`). Git no elige el punto medio cronológico: elige el commit que **divide ese conjunto de candidatos de la forma más pareja** (según cuántos candidatos son ancestros suyos). Cada prueba elimina aproximadamente la mitad, también a través de merges y ramas paralelas. El costo por paso (contar candidatos) es pequeño; el que domina es compilar y probar.

**Uso manual:**

```bash
git bisect start
git bisect bad                 # el commit actual falla
git bisect good v2.3.0         # esta etiqueta funcionaba
# Git hace checkout del commit central; pruebas y marcas:
git bisect good                # o: git bisect bad  /  git bisect skip
# ... ~log2(n) iteraciones; al final: '<sha> is the first bad commit'
git bisect log > bisect.txt    # guarda la sesión (git bisect replay bisect.txt)
git bisect reset               # vuelve a donde estabas
```

**Automatizado (`bisect run`).** El script devuelve: `0` = bueno; `1`–`127` (salvo 125) = malo; **`125` = no se puede probar (saltar)**; `128`+ = abortar.

```bash
cat > /tmp/probar.sh <<'EOF'
#!/usr/bin/env bash
make -s build || exit 125        # no compila: ni bueno ni malo -> saltar
./bin/app --self-test            # 0 = bueno, 1 = malo
EOF
chmod +x /tmp/probar.sh          # fuera del repo: el checkout no lo pisa

git bisect start HEAD v2.3.0
git bisect run /tmp/probar.sh    # 5 000 commits ≈ 13 pruebas sin intervención
```

**Buenas prácticas y límites:**

- El criterio debe ser **determinista**. Con pruebas intermitentes, repítela N veces dentro del script y falla si alguna falla.
- Si el bug se introdujo, se corrigió y se reintrodujo, bisect puede señalar cualquiera de las transiciones. La suposición de monotonía es suya, no de Git.
- Usa un *worktree* limpio (`git worktree add ../bisect-wt`) para no ensuciar tu trabajo.
- `git bisect start --first-parent` en flujos con merge commits: localiza **el merge** que introdujo el problema (más rápido; luego refinas dentro de la rama).
- Términos propios para regresiones de rendimiento: `git bisect start --term-old=rapido --term-new=lento`.
- Complementos: `git log -S'texto'` (commits que cambian el *número de apariciones* de una cadena), `git log -G'regex'`, `git log -L :funcion:archivo` (historia de una función) y `git blame -w -C -L 10,20 archivo`.

### 4.5 Reflog: la red de seguridad

El **reflog** es el diario **local** de cada movimiento de una referencia. Vive en `.git/logs/HEAD` y `.git/logs/refs/heads/<rama>`; cada línea guarda hash anterior, hash nuevo, autor, marca de tiempo y causa (`commit`, `checkout`, `reset`, `rebase`, `merge`...). No se sube con `push` ni se clona.

```bash
git reflog                          # HEAD@{0}, HEAD@{1}, ...
# 3f2a1b9 HEAD@{0}: reset: moving to HEAD~3
# 8c7d6e5 HEAD@{1}: commit: feat: reporte mensual
git reset --hard 8c7d6e5            # o: git reset --hard HEAD@{1}
git branch rescate 8c7d6e5          # alternativa segura: una rama sobre el commit perdido

git reflog show main --date=iso     # reflog de una rama
git diff main@{yesterday} main      # sintaxis temporal
```

**Caducidad:** entradas alcanzables, 90 días (`gc.reflogExpire`); entradas inalcanzables, 30 días (`gc.reflogExpireUnreachable`). Los repositorios *bare* de servidor normalmente **no** llevan reflog, así que la recuperación allí es distinta.

**Cuando el reflog no alcanza:** si nunca hiciste commit ni `git add`, el cambio solo existía en el working tree y se perdió. Si hiciste `git add`, el contenido quedó como **blob colgante**:

```bash
git fsck --lost-found               # escribe blobs/commits colgantes en .git/lost-found/
git fsck --unreachable --no-reflogs | grep commit   # stashes borrados, commits huérfanos
```

### 4.6 Alcanzabilidad y recolección de basura (`git gc`)

Git usa un modelo **mark & sweep**: las *raíces* son las referencias (`refs/**`), los reflogs, el índice y HEAD; todo lo alcanzable desde ellas (commit → tree → blob → tags) sobrevive; lo demás es basura candidata.

```
commit creado ─▶ alcanzable (rama) ─▶ huérfano (la rama se movió)
   ─▶ protegido por reflog (90/30 días) ─▶ caduca la entrada
   ─▶ inalcanzable ─▶ `gc` lo conserva ~2 semanas (gc.pruneExpire) ─▶ `prune` lo borra
```

`git gc` ejecuta, en esencia: `pack-refs`, `reflog expire`, `repack -d` (reempaqueta objetos sueltos y consolida packs), `prune --expire` (borra inalcanzables viejos), `worktree prune`, `rerere gc` y actualiza el `commit-graph`.

| Parámetro | Valor por defecto | Efecto |
| --- | --- | --- |
| `gc.auto` | 6700 | Nº de objetos sueltos que dispara un `gc` automático |
| `gc.autoPackLimit` | 50 | Nº de packs que dispara reempaquetado |
| `gc.pruneExpire` | 2 semanas | Edad mínima para borrar un inalcanzable |
| `gc.reflogExpire` | 90 días | Caducidad de entradas alcanzables del reflog |
| `gc.reflogExpireUnreachable` | 30 días | Caducidad de entradas inalcanzables |

```bash
git gc                                    # mantenimiento normal
git gc --aggressive                       # ventana 250: más lento, ganancia marginal

# Purga REAL e irreversible (p. ej., tras reescribir historia para quitar un secreto):
git reflog expire --expire=now --all && git gc --prune=now

git maintenance start                     # tareas en segundo plano (commit-graph, prefetch, loose-objects, incremental-repack...)
```

> **Servidores y secretos.** Un force-push no borra datos del servidor al instante: los objetos viejos siguen ahí hasta su GC, y plataformas con refs ocultas (`refs/pull/*`) o forks pueden conservarlos más. Un secreto publicado se considera **comprometido** aunque reescribas la historia: se rota siempre.

**Ideas clave (sección 4):** rebase = cherry-pick masivo con hashes nuevos; `rebase -i` edita la lista de tareas de esa copia; bisect es búsqueda binaria sobre el rango `good..bad` del DAG; reflog y `fsck` recuperan casi todo lo que fue commiteado, mientras GC define cuándo deja de ser recuperable.

---

## 5. Automatización y gobernanza con Git Hooks

### 5.1 Qué son y cómo se ejecutan

Un **hook** es un ejecutable (en cualquier lenguaje, con *shebang*) que Git invoca en eventos concretos. Reglas básicas:

- Viven en `.git/hooks/` con el **nombre exacto** del evento, sin extensión y con permiso de ejecución. Los `*.sample` no se ejecutan.
- En los hooks `pre-*` un código de salida distinto de 0 **aborta** la operación; los `post-*` son informativos.
- **No se versionan ni se clonan** (`.git/` no es parte del repo). Soluciones: `git config core.hooksPath .githooks` (Git 2.9+) con una carpeta versionada, o un gestor (Husky, pre-commit, Lefthook) que los instala al preparar el proyecto.
- `git commit --no-verify` / `git push --no-verify` omiten los hooks del cliente. Los hooks del servidor no se pueden omitir.

> **Principio de gobernanza:** los hooks del cliente existen para dar **retroalimentación rápida** al desarrollador; la **aplicación obligatoria** de las reglas ocurre en CI, protección de ramas y hooks del servidor, porque lo local siempre se puede saltar.

### 5.2 Ciclo de vida de los hooks

```
 git commit:   pre-commit ─▶ prepare-commit-msg ─▶ (editor) ─▶ commit-msg ─▶ [commit creado] ─▶ post-commit

 git push:     pre-push (cliente)
                  │
                  ▼  (viaja el packfile)
               pre-receive (servidor, todas las refs) ─▶ update (por ref) ─▶ [refs actualizadas] ─▶ post-receive
```

**Hooks del cliente:**

| Hook | Cuándo | Entrada | Uso típico |
| --- | --- | --- | --- |
| `pre-commit` | Tras `git add`, antes de crear el commit | — | Formato, lint, tipos, secretos, pruebas rápidas |
| `prepare-commit-msg` | Antes de abrir el editor | `$1` archivo del mensaje, `$2` origen | Prefijar con el ID de ticket sacado del nombre de la rama |
| `commit-msg` | Tras escribir el mensaje | `$1` archivo del mensaje | Validar Conventional Commits |
| `post-commit` | Tras crear el commit | — | Avisos locales |
| `pre-rebase` | Antes de un rebase | upstream, rama | Impedir rebase de ramas ya publicadas |
| `post-checkout` · `post-merge` | Tras cambiar de rama / fusionar | refs, banderas | Reinstalar dependencias si cambió el lockfile |
| `post-rewrite` | Tras `amend`/`rebase` | stdin: `<viejo> <nuevo>` | Resincronizar notas o metadatos |
| `pre-push` | Antes de enviar | stdin: `<ref-local> <sha-local> <ref-remota> <sha-remota>` | Tests, bloquear pushes indebidos |

**Hooks del servidor:**

| Hook | Cuándo | Entrada / efecto |
| --- | --- | --- |
| `pre-receive` | Al recibir un push, antes de tocar refs | stdin: `<old> <new> <ref>` por ref; un `exit` ≠ 0 rechaza **todo** el push |
| `update` | Una vez por ref | Argumentos `ref old new`; puede rechazar **solo esa** ref |
| `post-receive` | Tras actualizar las refs | Notificaciones, despliegues, disparar CI |
| `proc-receive` | Push a refs especiales (2.29+) | Base de flujos tipo Gerrit |

### 5.3 Hooks escritos a mano (nivel experto)

**`pre-commit`: validar solo lo que entra al commit.** Dos problemas clásicos: (1) procesar archivos que no cambiaron es un desperdicio; (2) los linters leen el *working tree*, que puede diferir del *índice* si hiciste `git add -p` (staging parcial). Los gestores resuelven (2) guardando temporalmente los cambios no preparados; a mano puedes usar `git stash push --keep-index` o leer el contenido del índice con `git show :ruta`.

```bash
#!/usr/bin/env bash
# .githooks/pre-commit   (chmod +x)
set -euo pipefail

# Lint SOLO de los .py staged (agregados/copiados/modificados/renombrados)
git diff --cached --name-only --diff-filter=ACMR -z -- '*.py' \
  | xargs -0 -r ruff check --force-exclude

# Bloquea archivos nuevos de más de 5 MB
limit=$((5 * 1024 * 1024))
git diff --cached --name-only --diff-filter=A -z | while IFS= read -r -d '' f; do
  size=$(git cat-file -s ":$f")
  if [ "$size" -gt "$limit" ]; then echo "Archivo demasiado grande: $f" >&2; exit 1; fi
done
```

**`commit-msg`: Conventional Commits.** Formato: `<tipo>[alcance][!]: <descripción>`, cuerpo opcional y pies (`BREAKING CHANGE: ...`, `Refs: #123`). Se mapea a SemVer: `fix` → PATCH, `feat` → MINOR, `!` o `BREAKING CHANGE` → MAJOR. Herramientas como *semantic-release*, *release-please* o *git-cliff* generan versión y changelog a partir de estos mensajes.

```bash
#!/usr/bin/env bash
# .githooks/commit-msg
first=$(head -n1 "$1")
case "$first" in 'Merge '*|'Revert '*|'fixup! '*|'squash! '*) exit 0;; esac

re='^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)([(][a-z0-9._-]+[)])?!?: .{1,72}$'
if ! [[ $first =~ $re ]]; then
  echo 'Mensaje inválido. Formato: tipo(alcance)!: descripción (máx. 72 caracteres)' >&2
  echo 'Ejemplo: feat(api): agrega paginación' >&2
  exit 1
fi
```

**`pre-push`:** recibe por stdin una línea por ref que se enviará.

```bash
#!/usr/bin/env bash
# .githooks/pre-push
while read -r local_ref local_sha remote_ref remote_sha; do
  if [ "$remote_ref" = refs/heads/main ]; then
    echo 'Push directo a main bloqueado: abre un PR.' >&2; exit 1
  fi
done
npm test -- --changedSince=origin/main     # ejemplo: solo las pruebas afectadas
```

**`pre-receive` (servidor): prohibir force-push y borrado en ramas protegidas.**

```bash
#!/usr/bin/env bash
# hooks/pre-receive  (en repos SHA-256 el hash nulo tiene 64 ceros)
zero=0000000000000000000000000000000000000000
while read -r old new ref; do
  case "$ref" in refs/heads/main|refs/heads/release/*) ;; *) continue;; esac
  if [ "$new" = "$zero" ]; then echo "Prohibido borrar $ref" >&2; exit 1; fi
  if [ "$old" != "$zero" ] && ! git merge-base --is-ancestor "$old" "$new"; then
    echo "Force-push rechazado en $ref" >&2; exit 1
  fi
done
```

### 5.4 Gestores de hooks: Husky, pre-commit, Lefthook

**Husky + lint-staged + commitlint (ecosistema JS).** Husky v9: tras `npm install`, el script `prepare` ejecuta `husky`, que configura `core.hooksPath` para que **todo el equipo** tenga los hooks sin pasos manuales.

```bash
npm i -D husky lint-staged @commitlint/cli @commitlint/config-conventional
npx husky init      # crea .husky/pre-commit y agrega el script 'prepare'
```

Archivos (cada hook de Husky es un script de shell normal):

```
# .husky/pre-commit
npx lint-staged

# .husky/commit-msg
npx --no -- commitlint --edit $1
```

```js
// commitlint.config.js
export default { extends: ['@commitlint/config-conventional'] };
```

```yaml
# .lintstagedrc.yaml — recibe SOLO los archivos staged que casan con cada glob
'*.{js,jsx,ts,tsx}': ['eslint --fix --max-warnings=0 --cache', 'prettier --write']
'*.{json,md,yml,yaml,css}': 'prettier --write'
'*.py': ['ruff check --fix', 'ruff format']
```

lint-staged ejecuta las tareas sobre los archivos preparados, respalda y restaura los cambios *no* preparados (staging parcial) y vuelve a añadir lo que los formateadores corrigieron. En CI se desactiva con `HUSKY=0`.

**Framework `pre-commit` (Python, agnóstico del lenguaje).** Cada hook corre en su propio entorno aislado y cacheado:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: <tag>                 # fija SIEMPRE una versión
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
        args: ['--maxkb=1024']
      - id: detect-private-key
  - repo: https://github.com/gitleaks/gitleaks
    rev: <tag>
    hooks:
      - id: gitleaks           # escaneo de secretos
  - repo: https://github.com/compilerla/conventional-pre-commit
    rev: <tag>
    hooks:
      - id: conventional-pre-commit
        stages: [commit-msg]
```

```bash
pre-commit install --hook-type pre-commit --hook-type commit-msg
pre-commit run --all-files      # el mismo comando sirve en CI
```

**Lefthook (Go, un solo binario, paralelo por diseño):**

```yaml
# lefthook.yml
pre-commit:
  parallel: true
  commands:
    lint:
      glob: '*.{js,ts}'
      run: npx eslint --fix {staged_files}
      stage_fixed: true
    format-go:
      glob: '*.go'
      run: gofmt -w {staged_files}
      stage_fixed: true
pre-push:
  commands:
    tests:
      run: go test ./...
```

### 5.5 Rendimiento y diseño de validaciones

Un hook lento se acaba saltando con `--no-verify`. El diseño importa tanto como las reglas:

| Principio | Táctica |
| --- | --- |
| **Presupuesto de tiempo** | `pre-commit` en pocos segundos; `pre-push` en uno o dos minutos; lo exhaustivo, en CI |
| **Solo lo que cambió** | Archivos staged; `jest --changedSince` / `--findRelatedTests`, `pytest --testmon`, builds *affected-only* (Nx, Bazel, Turborepo, Pants) |
| **Paralelismo** | `parallel: true` en Lefthook; `xargs -P`; `pre-commit` paraleliza por lotes de archivos |
| **Caché** | `eslint --cache`, `prettier --cache`, caché de ruff, entornos cacheados de `pre-commit` |
| **Orden barato → caro** | Formato → lint → tipos → pruebas unitarias; falla rápido |
| **Fixers vs. checkers** | Los formateadores corrigen y re-preparan; lo que no se puede arreglar automáticamente, falla |
| **Sin red** | Evita llamadas de red en hooks (lentos e inestables) |
| **Disparadores condicionales** | En `post-checkout`/`post-merge`, reinstala dependencias solo si cambió el lockfile (`git diff --name-only $1 $2`) |
| **Reproducibilidad** | Versiones fijadas (lockfile, `rev:`) para que local y CI den el mismo veredicto |
| **Fuente de verdad** | CI repite todo (`commitlint --from origin/main --to HEAD`, `pre-commit run --all-files`) y la protección de ramas lo exige |

**Ideas clave (sección 5):** los hooks son automatización local barata; los gestores resuelven la distribución; la velocidad (solo archivos staged, caché, paralelismo) decide si el equipo los respeta; la gobernanza real vive en CI y en el servidor.

---

## 6. Estrategias de branching y arquitectura de colaboración

### 6.1 El principio que gobierna todo: lotes pequeños, integración frecuente

El costo de integrar crece con la **divergencia**: cuantas más líneas tocadas, durante más tiempo y por más personas, más conflictos textuales y, sobre todo, **semánticos**. Los modelos de branching difieren principalmente en dos cosas: **cuánto viven las ramas** y **cómo se libera** el software. La investigación DORA asocia mejores resultados de entrega (frecuencia de despliegue, *lead time*, tasa de fallos y tiempo de recuperación) con ramas cortas e integración continua.

### 6.2 Gitflow tradicional

Propuesto por Vincent Driessen en 2010. Ramas permanentes: `main` (lo publicado, con etiquetas) y `develop` (integración). Ramas temporales: `feature/*`, `release/*`, `hotfix/*`.

```
feature/*  ──▶  develop  ──▶  release/x.y  ──▶  main (tag vx.y)  ──▶  (merge de vuelta a develop)
hotfix/*   ──────────────────────────────────▶  main (tag vx.y.z) ──▶  (merge de vuelta a develop)
```

Flujo: se desarrolla en `feature/*` y se integra en `develop`; al acercarse una versión se corta `release/x.y` donde solo se estabiliza (fixes, versión, docs); al terminar se fusiona a `main` con tag y de vuelta a `develop`. Los errores urgentes en producción salen de `main` en `hotfix/*`.

- **Cuándo aplica:** software **versionado** con varias versiones en soporte, ciclos de QA o certificación largos (apps móviles con revisión de tienda, firmware, on-premise, librerías con mantenimiento por versión).
- **Costos:** ramas de larga vida, fusiones grandes, retraso entre escribir y desplegar, y doble merge en cada release o hotfix. El propio autor añadió después una nota recomendando algo más simple para aplicaciones web con entrega continua.

### 6.3 GitHub Flow

`main` siempre es desplegable. Cada cambio: rama corta desde `main` → commits → *pull request* → revisión + CI → merge → despliegue (idealmente inmediato). Es simple y encaja con SaaS. Sus límites: no modela versiones en soporte paralelas, exige CI confiable y capacidad de revertir rápido, y un `main` roto bloquea a todos.

### 6.4 Trunk-Based Development (TBD)

Todos integran en **una sola rama** (el *trunk*) al menos una vez al día. Dos variantes: (a) commits directos al trunk (equipos pequeños y muy maduros) y (b) **TBD escalado**: ramas de vida de horas (como máximo uno o dos días) con PR rápido. Lo practican organizaciones con monorepos enormes como Google.

**Releases en TBD:** se despliega desde el trunk, o se crean **ramas de release** en el momento del corte. Los arreglos se hacen **primero en el trunk** y se pasan a la rama de release con `cherry-pick` (*fix-forward*): nunca se fusiona la release de vuelta al trunk.

**Requisitos:** CI rápido, pruebas automatizadas fiables, **feature flags**, PR pequeños con revisión ágil (o pair/mob programming) y un trunk siempre verde (cola de merge).

| Criterio | Gitflow | GitHub Flow | Trunk-Based |
| --- | --- | --- | --- |
| Ramas permanentes | `main`, `develop` (+ `release/*`) | `main` | trunk (+ `release/*` opcional) |
| Vida de una rama de trabajo | Días a semanas | Horas a días | Horas (≤ 1–2 días) |
| Cadencia de entrega | Versionada, planificada | Continua (cada PR) | Continua, o desde ramas de release |
| Complejidad del proceso | Alta | Baja | Baja (alta en disciplina técnica) |
| Exigencia de CI y pruebas | Media | Alta | Muy alta |
| Feature flags | Opcionales | Recomendables | Prácticamente obligatorios |
| Versiones en soporte paralelas | Nativo | No nativo | Ramas de release + cherry-pick |
| Riesgo principal | Merges enormes, integración tardía | `main` inestable sin buenas pruebas | Funcionalidad incompleta expuesta sin flags |
| Mejor para | Firmware, apps con tiendas, on-prem, librerías | SaaS de equipos pequeños y medianos | Entrega continua, monorepos, equipos grandes |

### 6.5 Cómo integrar un PR: merge, squash o rebase

| Método | Resultado en `main` | Pros | Contras |
| --- | --- | --- | --- |
| **Merge commit** (`--no-ff`) | Un merge commit que conserva los commits de la rama | Trazabilidad total; mantiene la granularidad | Historia ruidosa (usa `git log --first-parent`) |
| **Squash and merge** | Un solo commit por PR | Historia lineal y legible; revertir un PR = revertir un commit | Se pierde granularidad (bisect y blame más gruesos); las ramas derivadas necesitan `rebase --onto` |
| **Rebase and merge** | Los commits del PR reaplicados en línea recta | Historia lineal con granularidad | Hashes nuevos; sin marca del PR; exige commits limpios |

Emparejamientos habituales: GitHub Flow/TBD con PR pequeños → *squash*; Gitflow → *merge commit* para `release` y `hotfix`.

**Cola de merge (*merge queue / merge train*).** Serializa los PR y prueba cada uno **sobre el resultado de fusionar `main` más los PR anteriores de la cola**. Elimina la clase de errores «ambos PR pasaban por separado, juntos rompen `main`» (conflictos semánticos de la sección 3). Existen en GitHub, GitLab (*merge trains*) y herramientas como Bors, Zuul o Mergify.

### 6.6 Feature Flags: desacoplar despliegue de lanzamiento

**Desplegar** (poner código en producción) y **lanzar** (exponerlo a usuarios) son decisiones distintas. Con un flag el código viaja apagado y se enciende por porcentaje, segmento o entorno, lo que permite integrar en el trunk trabajo inacabado.

| Tipo | Propósito | Vida |
| --- | --- | --- |
| **Release toggle** | Ocultar funcionalidad incompleta | Corta (días/semanas) |
| **Experiment toggle** | Pruebas A/B | Corta |
| **Ops toggle** | *Kill switch*, degradación controlada | Media/larga |
| **Permission toggle** | Betas, planes premium | Larga |

```ts
if (flags.isEnabled('nuevo-checkout', { userId, plan })) {
  return renderNuevoCheckout();     // camino nuevo
}
return renderCheckoutActual();      // camino estable: el rollback es apagar el flag
```

**Prácticas:** apagado por defecto; **un único punto de decisión** por flag (no `if` dispersos); evaluar en el servidor cuando se pueda; probar **ambos caminos** en CI; asignar dueño y fecha de caducidad; **retirar el flag y el código muerto** apenas se completa el despliegue (la «deuda de flags» es real); registro de auditoría. Estándar neutral: **OpenFeature**; productos: LaunchDarkly, Unleash, Flagsmith, GrowthBook. Despliegue progresivo típico: *dark launch* → equipo interno → 1 % → 10 % → 50 % → 100 % → limpieza.

**Técnicas hermanas:**

- **Branch by abstraction:** introduce una abstracción sobre lo que se va a reemplazar, migra los consumidores poco a poco, cambia la implementación y retira la vieja. Permite refactors enormes **en el trunk** sin una rama de semanas.
- **Expand / contract (parallel change):** para esquemas de base de datos y APIs: *expand* (añade lo nuevo, compatible con lo viejo), *migrate* (doble escritura/lectura, migración de datos), *contract* (elimina lo viejo). Compatible con despliegues graduales y rollback.
- **Canary y blue/green** complementan los flags a nivel de infraestructura.

### 6.7 Cómo elegir

- **¿Despliegas varias veces al día y puedes revertir o apagar rápido?** GitHub Flow, o TBD con flags.
- **¿Mantienes v1.x y v2.x en paralelo o publicas artefactos versionados?** Ramas de release (Gitflow simplificado o TBD con ramas de release).
- **¿Hay revisión de tienda o ventanas de certificación?** Ramas de release más flags remotos para desacoplar el lanzamiento.
- **¿Equipo grande en un monorepo?** TBD + cola de merge + CI *affected-only*.
- **¿Poca cobertura de pruebas?** No empieces por TBD: invierte primero en pruebas; GitHub Flow con revisión fuerte es un paso intermedio sensato.

**Versionado y hotfix:** SemVer con tags anotados (`git tag -a v1.4.0 -m '...'`, `git push origin v1.4.0`). Un hotfix en TBD con rama de release:

```bash
git switch release/1.4
git cherry-pick -x <sha-del-fix-en-main>      # -x deja 'cherry picked from commit ...'
git tag -a v1.4.1 -m 'hotfix: corrige redondeo de IVA'
git push origin release/1.4 v1.4.1
```

**Ideas clave (sección 6):** el criterio central es cuánto tiempo viven las ramas; Gitflow para software versionado, GitHub Flow/TBD para entrega continua; los feature flags y la cola de merge son lo que hace viable integrar a diario sin romper producción.

---

## 7. Complejidad algorítmica en monorepos

### 7.1 Por qué escalar duele

Al crecer, aparecen distintas dimensiones de costo: tamaño del historial, número de archivos (F), número de referencias (R), tamaño de los objetos. El ejemplo extremo conocido es el repositorio de Windows de Microsoft (millones de archivos y cientos de GB), que motivó VFS for Git y, después, **Scalar**.

| Dimensión | Síntoma | Costo base | Mitigación |
| --- | --- | --- | --- |
| Historial y objetos | `clone`/`fetch` de GB | O(historial) | Partial clone, shallow clone, bundle URIs |
| Archivos en el working tree | `status`/`checkout` lentos | O(F) | Sparse checkout, sparse index, fsmonitor, untracked cache |
| Recorridos del grafo | `log`, `merge-base`, `branch --contains` lentos | O(commits) | `commit-graph`, generation numbers, filtros Bloom, bitmaps |
| Número de refs | `fetch`/`push` lentos, listas enormes | O(R) | `packed-refs`/reftable, podar ramas, ocultar refs, negociación *skipping* |
| Binarios grandes | Repos de decenas de GB | O(Σ tamaños) | Git LFS, filtros de blobs, almacenamiento externo |
| Dependencias entre componentes | CI completo en cada PR | O(componentes) | Grafo de build, pruebas *affected-only*, CODEOWNERS |

### 7.2 Partial clone y shallow clone

**Partial clone** (`--filter`): el servidor (que debe permitirlo) envía solo parte de los objetos; los demás se piden **bajo demanda** al *promisor remote* cuando algún comando los necesita.

- `--filter=blob:none`: todos los commits y árboles, sin contenido de archivos hasta que se necesiten. Es el punto de equilibrio para desarrollo diario.
- `--filter=tree:0`: solo commits; el más pequeño. Ideal para CI que solo necesita la punta, pero comandos como `log -- ruta` pueden provocar muchas descargas diferidas.
- `--filter=blob:limit=1m`: omite blobs grandes.

**Shallow clone** (`--depth=N`): trunca la historia. Barato, pero `git log` queda limitado y `merge-base` o `describe` pueden fallar (`--deepen`, `--unshallow` para recuperarla). Úsalo en CI de solo build; para desarrollo, partial clone conserva la historia completa.

```bash
# Desarrollo: historial completo, blobs bajo demanda, solo mis carpetas
git clone --filter=blob:none --sparse https://git.ejemplo.com/empresa/monorepo.git
cd monorepo
git sparse-checkout set services/pagos libs/comun

# CI de build puro: lo mínimo
git clone --depth=1 --filter=blob:none --sparse <url>
git sparse-checkout set services/pagos
```

### 7.3 Sparse checkout (modo cone) y sparse index

**Sparse checkout** materializa en disco solo parte del árbol. En **modo cone** defines directorios (no patrones tipo gitignore), y Git decide qué incluir con un conjunto hash de directorios: coste proporcional a la profundidad de la ruta, no al número de patrones.

```bash
git sparse-checkout init --cone --sparse-index
git sparse-checkout set services/pagos libs/comun
git sparse-checkout add docs
git sparse-checkout list
git sparse-checkout disable
```

El **sparse index** colapsa en el índice los directorios fuera del cone en una sola entrada de árbol: el índice pasa de O(F) a O(tamaño del cone), y `status`, `add` y `commit` se aceleran porque ya no leen ni escriben millones de entradas.

### 7.4 Acelerar `status`, `log` y `merge-base`

```bash
git config core.fsmonitor true              # daemon de eventos del SO (Windows/macOS); Watchman en otros
git config core.untrackedCache true         # cachea el escaneo de archivos no rastreados
git config feature.manyFiles true           # índice v4, untracked cache y otras optimizaciones
git config fetch.writeCommitGraph true
git commit-graph write --reachable --changed-paths
git config fetch.negotiationAlgorithm skipping    # menos idas y vueltas con muchas refs
git maintenance start                       # prefetch, commit-graph, loose-objects, incremental-repack
```

- **fsmonitor:** en lugar de un `stat` por cada archivo, Git pregunta a un daemon qué cambió: `status` pasa de O(F) a O(cambios).
- **commit-graph:** guarda padres y *generation numbers* en un archivo compacto. `merge-base`, `log --graph`, `branch --contains` y `tag --contains` dejan de recorrer toda la historia porque pueden **cortar** cuando el generation number lo permite.
- **Filtros Bloom de rutas (`--changed-paths`):** `git log -- ruta` salta los commits que *seguro* no tocaron esa ruta, sin comparar árboles en cada uno.
- **Scalar** (incluido en Git desde 2.38): `scalar clone <url>` o `scalar register` activan de una vez partial clone, sparse checkout, fsmonitor, commit-graph y mantenimiento en segundo plano.
- **Lado servidor:** *reachability bitmaps*, `multi-pack-index`, reempaquetado geométrico, `uploadpack.allowFilter` y **bundle URIs** (descargar el grueso del clone desde un CDN).

### 7.5 Dependencias entre repositorios: submódulos vs. subtrees

Antes de elegir: para **librerías con versión**, lo normal es un **gestor de paquetes** (npm, pip, Maven, Go modules, Cargo). Submódulos y subtrees son para cuando necesitas incluir **código fuente** de otro repositorio.

**Submódulos.** Internamente, el árbol del padre contiene una entrada `160000` (*gitlink*) que apunta a un **commit exacto** del repo hijo, más un archivo `.gitmodules` (URL y ruta). El hijo mantiene su propio repositorio (en `.git/modules/` del padre).

```bash
git submodule add https://git.ejemplo.com/equipo/libx.git vendor/libx
git clone --recurse-submodules <url>                  # o tras clonar: git submodule update --init --recursive
git submodule update --remote vendor/libx             # avanza al último commit de la rama seguida
git config --global submodule.recurse true            # checkout/pull propagan a submódulos
git config --global push.recurseSubmodules check      # no deja subir el padre si el hijo no está subido
```

Pros: versión exacta y reproducible, historiales separados, límites claros, un componente reutilizado en varios proyectos. Contras: HEAD *detached* dentro del submódulo, el clásico «subí el padre pero no el hijo» (el padre apunta a un commit que nadie puede descargar), conflictos de gitlink poco intuitivos, CI y onboarding más complejos y dos flujos de revisión.

**Subtrees.** Copian el contenido del otro repo en un subdirectorio y **fusionan su historia** (o la aplastan con `--squash`). No hay metadatos extra: un clone normal ya trae todo.

```bash
git subtree add  --prefix=vendor/libx https://git.ejemplo.com/equipo/libx.git main --squash
git subtree pull --prefix=vendor/libx https://git.ejemplo.com/equipo/libx.git main --squash
git subtree push --prefix=vendor/libx https://git.ejemplo.com/equipo/libx.git mi-cambio
git subtree split --prefix=vendor/libx -b libx-solo        # extrae la historia del subdirectorio
```

Pros: transparente para quien clona, un solo repo para CI, funciona offline. Contras: el repo crece, `split` recorre **toda** la historia (O(commits), lento en repos grandes), la historia queda entremezclada y contribuir de vuelta es más torpe.

| Criterio | Submódulo | Subtree | Paquete versionado |
| --- | --- | --- | --- |
| Fijación de versión | Commit exacto | Commit copiado | Versión SemVer |
| Clonar | Requiere `--recurse-submodules` | Normal | Instalar dependencias |
| Modificar y devolver cambios | Cómodo (repo separado) | Posible, torpe | Fork + PR al upstream |
| Tamaño del repo | Pequeño | Crece | Pequeño |
| Complejidad para el equipo | Alta | Media | Baja |
| Mejor para | Fuentes fijadas, assets compartidos, firmware | Vendorizar con pocas contribuciones | Librerías |

**`git worktree`:** varios directorios de trabajo, cada uno con su rama, **compartiendo una sola base de objetos**. Ideal en monorepos para no volver a clonar, correr un `bisect` o pruebas largas en paralelo y atender un hotfix sin tocar tu trabajo (una rama solo puede estar activa en un worktree a la vez).

```bash
git worktree add ../hotfix-1.4 release/1.4
git worktree list
git worktree remove ../hotfix-1.4
```

### 7.6 Gobernanza de un monorepo

- **CODEOWNERS** por ruta: revisores obligatorios por directorio.
- **CI *affected-only*:** calcula lo cambiado con `git diff --name-only $(git merge-base origin/main HEAD)..HEAD`, cruza con el **grafo de dependencias** (Bazel, Nx, Turborepo, Pants) y compila/prueba solo lo afectado, con caché remota de builds.
- **Cola de merge** para mantener el trunk verde con mucha concurrencia.
- **Reglas de arquitectura:** límites entre módulos (lint de imports), una sola versión por dependencia, formateo unificado, tamaño máximo de PR.
- **Cuándo no:** equipos con ciclos de release independientes, permisos de acceso distintos por código o tecnologías sin herramientas comunes.

**Ideas clave (sección 7):** cada dimensión de escala tiene su mitigación (partial clone para historial, sparse para archivos, fsmonitor para `status`, commit-graph para recorridos); submódulo = puntero a un commit, subtree = copia con historia; y el cuello de botella de un monorepo maduro suele ser el CI, no Git.

---

## 8. Catástrofes en producción: escenarios reales y su resolución

**Protocolo general ante un desastre:**

1. **Para y no sigas tecleando.** Antes de cualquier comando destructivo, respalda el estado actual: `git branch respaldo-antes-de-arreglar` o `cp -r .git ../respaldo-git`.
2. **Entiende antes de actuar:** `git status`, `git reflog`, `git log --graph --oneline --all --decorate`.
3. **Aísla.** Para reescrituras de historia trabaja sobre un clon espejo (`git clone --mirror`), no sobre tu copia de trabajo.
4. **Comunica** al equipo qué ramas están congeladas y cuándo habrá que reclonar.
5. **Postmortem sin culpables:** ¿qué control (hook, protección de rama, CI) habría evitado esto?

### 8.1 Un secreto (API key) llegó a `main`

**Prioridad uno: revocar y rotar la credencial ahora.** Reescribir historia no «des-filtra» nada: el secreto pudo ser clonado o indexado en minutos. Después, limpieza con `git filter-repo` (la herramienta recomendada oficialmente en lugar de `filter-branch`):

```bash
git clone --mirror https://git.ejemplo.com/equipo/app.git && cd app.git
cat > reemplazos.txt <<'EOF'
AKIA1234EJEMPLOKEY==>***REMOVIDO***
EOF
git filter-repo --replace-text reemplazos.txt     # o: --path config/secrets.env --invert-paths
git remote add origin https://git.ejemplo.com/equipo/app.git   # filter-repo borra 'origin' a propósito
git push --force --mirror origin                  # puede requerir levantar la protección de ramas un momento
```

**Detalles que se olvidan:** forks, clones locales, refs de PR (`refs/pull/*`) y cachés de la plataforma siguen conteniendo el secreto: pide la purga al soporte. Todo el equipo debe **reclonar** (un `pull` reintroduciría los commits viejos). En copias locales: `git reflog expire --expire=now --all && git gc --prune=now`. **Prevención:** escaneo de secretos (gitleaks, trufflehog) en `pre-commit` y CI, *push protection* de la plataforma, secretos en un gestor (Vault, KMS) y `.env` en `.gitignore`.

### 8.2 Un force-push sobrescribió `main`

**Síntoma:** desaparecieron commits del equipo. **Recuperación:**

1. Encuentra el SHA anterior: en el reflog de cualquier clon que no haya hecho `fetch` desde entonces (`git reflog show origin/main`), en los registros de CI/despliegue, o en el log de auditoría/eventos de push de la plataforma.
2. Verifica y restaura:

```bash
git fetch origin
git branch main-recuperada <sha-anterior>
git log --oneline -5 main-recuperada                       # ¿es lo esperado?
git push --force-with-lease origin main-recuperada:main    # restaura (permitir force un momento)
```

**Prevención:** protección de ramas, `receive.denyNonFastForwards true`, el hook `pre-receive` de la sección 5.3 y la costumbre de usar `--force-with-lease`.

### 8.3 `reset --hard` o `checkout` borró trabajo

- **Fue commiteado alguna vez:** reflog (sección 4.5): `git reflog` y `git reset --hard HEAD@{n}`, o una rama de rescate.
- **Solo estuvo en el índice (`git add`):** `git fsck --lost-found` escribe los commits colgantes en `.git/lost-found/commit/` y los blobs en `.git/lost-found/other/`; revisa su contenido con `git show <sha>`.
- **Stash borrado:** `git fsck --unreachable | grep commit`, inspecciona con `git show <sha>` y recupéralo con `git stash store -m 'rescatado' <sha>`.
- **Nunca preparado:** no hay copia en Git; revisa el historial local del editor o IDE.

### 8.4 Un merge malo llegó a producción: `revert -m` y la trampa del «revert del revert»

**Solución inmediata:** revertir el **merge commit**, indicando cuál padre es la línea principal:

```bash
git revert -m 1 <sha-del-merge>      # -m 1 = conserva el lado del primer padre (main)
git push origin main                 # despliega el revert
```

**La trampa.** Cuando corrijas la rama y la vuelvas a fusionar, Git **no** traerá los cambios originales: los commits de la rama ya son ancestros de `main` (el merge original los incorporó) y el revert es solo *otro commit* que deshizo sus efectos.

```
main:      A ── B ── M ── R         M = merge(B, F2)    R = revert de M
                \   /
feature:         F1 ─ F2

Al fusionar de nuevo: F1 y F2 ya son ancestros de main  →  «Already up to date»
(lo que R deshizo NO vuelve)
```

**Dos salidas:** (a) **revertir el revert** antes de re-fusionar (`git revert <sha-de-R>`: reintroduce los cambios) y añadir las correcciones encima; o (b) crear una rama nueva con los commits corregidos y **hashes nuevos** (`cherry-pick` o `rebase`) y fusionar esa. Es una consecuencia directa de cómo el merge base lee el DAG (sección 3.5).

### 8.5 Una regresión de origen desconocido

«El cálculo de impuestos falla desde hace semanas»: 5 000 commits desde la última versión buena. Con `bisect run` son unas 13 pruebas:

```bash
git bisect start HEAD v2.3.0
git bisect run ./scripts/test-impuestos.sh      # 0 bueno · 1 malo · 125 saltar
git bisect reset
git show <sha-culpable>                         # entender; luego corregir hacia adelante o `git revert <sha>`
```

### 8.6 Se commiteó un archivo enorme y el repo engordó

```bash
# 1) Localiza los culpables (comando de la sección 2.6) y 2) elimínalos de TODA la historia:
git filter-repo --strip-blobs-bigger-than 50M
#    o por ruta:
git filter-repo --path datos/dump.sql --invert-paths
# 3) Si el binario debe seguir versionado, migra a Git LFS:
git lfs migrate import --include='*.psd,*.zip' --everything
```

Sigue el mismo protocolo del escenario 8.1: espejo, `push --force`, reclonar, purga y GC en el servidor. **Prevención:** `check-added-large-files` en `pre-commit`, límite de tamaño en `pre-receive` y filtros LFS en `.gitattributes`.

### 8.7 Un rebase salió mal

- **En curso y enredado:** `git rebase --abort` devuelve todo al estado previo.
- **Terminado pero equivocado:** `git reset --hard ORIG_HEAD` (válido mientras no hayas hecho otra operación que lo sobrescriba) o `git reflog` seguido de `git reset --hard <rama>@{n}`. Compara el antes y el después con `git range-diff <rama>@{1} <rama>`.
- **Mismos conflictos una y otra vez:** activa `rerere` o cambia a `merge` para esa integración.

### 8.8 Commits hechos en *detached HEAD*

Síntoma: tras cambiar de rama, «desaparecen». Si sigues ahí: `git switch -c rescate`. Si ya te fuiste: `git reflog`, localiza el último commit y `git branch rescate <sha>`.

### 8.9 Corrupción del repositorio

Síntomas: `object file ... is empty`, `fatal: bad object`, errores de `fsck`. Causas típicas: fallo de disco, corte de energía, carpetas sincronizadas (Dropbox/OneDrive) sobre `.git/`, antivirus.

```bash
git fsck --full                                   # lista objetos corruptos o faltantes
find .git/objects -type f -empty -delete          # elimina objetos sueltos vacíos
git fetch origin                                  # vuelve a descargar lo que falte
# si el objeto existe en otro clon sano:
git fetch /ruta/al/clon-sano 'refs/heads/*:refs/remotes/sano/*'
git fsck --full                                   # confirma la reparación
```

Último recurso: clon limpio y trasladar el trabajo no subido con `git format-patch` o copiando archivos.

### 8.10 Hotfix urgente con `main` ya adelantado

Producción corre v1.4.0, pero `main` ya tiene trabajo inacabado de v1.5.

```bash
git switch -c hotfix/1.4.1 v1.4.0                    # parte de lo que está en producción
# ... corrige y prueba ...
git tag -a v1.4.1 -m 'hotfix: corrige redondeo de IVA'
git push origin hotfix/1.4.1 v1.4.1
git switch main && git cherry-pick -x <sha-del-fix>   # el fix debe existir en TODAS las líneas vivas
```

Si el fix no llega a `main`, reaparecerá el bug en la siguiente release.

### 8.11 Tormenta de conflictos tras una rama larga

- **Mide antes:** `git merge-tree --write-tree main feature` (2.38) simula el merge **sin tocar el working tree** y sale con código 1 si hay conflictos.
- **Integra por partes:** trae `main` hacia la rama de forma incremental, con `rerere` activo y `-X histogram`; separa los cambios mecánicos (formato, renombres) en commits propios.
- **Cambia el proceso:** divide el trabajo en PR pequeños detrás de feature flags (sección 6.6).

### 8.12 Borré una rama por error

- **Local:** `git reflog`, y `git branch nombre <sha>`.
- **Remota:** `git push origin <sha>:refs/heads/nombre` desde un clon que aún tenga el commit; muchas plataformas ofrecen «restaurar rama». Si nadie lo tiene, el servidor puede conservarlo hasta su GC.

### 8.13 Triage rápido

| Síntoma | Primer comando |
| --- | --- |
| «Perdí commits» | `git reflog` |
| «¿Qué cambió entre ayer y hoy?» | `git diff main@{yesterday} main` |
| «¿Quién o cuándo introdujo esto?» | `git log -S'texto'`, `git blame -w -C`, `git bisect run` |
| «Mi push fue rechazado» | `git fetch` + `git log --graph --oneline --all`; integra, no fuerces |
| «Conflicto en merge/rebase» | `git status`, `git diff`, `git log --merge -p` |
| «Estado raro» | `git log --graph --oneline --all --decorate` |
| «Repo corrupto» | `git fsck --full` |
| «Repo gigante» | `git count-objects -vH` y los comandos de 2.6 |

---

## 9. Referencia rápida, hoja de ruta y autoevaluación

### 9.1 Configuración recomendada

```bash
git config --global init.defaultBranch main
git config --global pull.rebase true               # o 'pull.ff only' si prefieres merges explícitos
git config --global fetch.prune true
git config --global rebase.autoStash true
git config --global rebase.autoSquash true
git config --global rebase.updateRefs true
git config --global merge.conflictStyle zdiff3
git config --global rerere.enabled true
git config --global diff.algorithm histogram
git config --global diff.colorMoved zebra
git config --global push.autoSetupRemote true
git config --global push.followTags true
git config --global help.autocorrect prompt
git config --global branch.sort -committerdate
git config --global alias.lg 'log --graph --oneline --decorate --all'
```

### 9.2 Comandos de inspección imprescindibles

```bash
git log --graph --oneline --decorate --all     # el DAG, dibujado
git log --first-parent --oneline main          # solo la línea principal (ignora el detalle de ramas)
git log main..feature --oneline                # lo que trae feature y main no tiene
git diff main...feature                        # cambios de feature desde el merge base
git cherry -v main feature                     # commits de feature aún no aplicados (por patch-id)
git rev-list --count main..feature             # cuántos commits
git name-rev <sha>                             # nombre simbólico de un commit
git describe --tags                            # versión más cercana + distancia
git shortlog -sn --no-merges                   # contribuciones por autor
git for-each-ref --sort=-committerdate refs/heads --format='%(refname:short) %(committerdate:relative)'
```

### 9.3 Hoja de ruta de estudio, nivel 0 a experto

| Nivel | Ejercicios |
| --- | --- |
| **0 · Fundamentos** (1–2 días) | Reproduce el commit con *plumbing* (2.3); calcula a mano el hash de un blob; recorre HEAD → tree → blob solo con `git cat-file -p` |
| **1 · Intermedio** (1 semana) | Provoca un conflicto y léelo con `zdiff3`; prueba `reset --soft/--mixed/--hard` observando `git ls-files -s` |
| **2 · Avanzado** (2 semanas) | `rebase -i` (squash, fixup, dividir un commit), `--onto`, bisect sobre un bug sembrado, provoca y recupera desastres con reflog, escribe tus hooks `pre-commit` y `commit-msg` |
| **3 · Experto** (continuo) | Implementa Myers en tu lenguaje y compáralo con `git diff --minimal`; simula un merge criss-cross y examina `merge-base --all`; clona un repo grande con `--filter=blob:none --sparse` y mide `time git status` con y sin fsmonitor/commit-graph; redacta un *runbook* de catástrofes para tu equipo |

**Laboratorio de bisect (200 commits, bug en el 137):**

```bash
git init bug-lab && cd bug-lab
for i in $(seq 1 200); do
  echo "linea $i" >> datos.txt
  [ $i -eq 137 ] && echo 'BUG' >> datos.txt
  git add . && git commit -qm "commit $i"
done
git bisect start HEAD $(git rev-list --max-parents=0 HEAD)
git bisect run sh -c '! grep -q BUG datos.txt'     # termina en ~8 pasos señalando el commit 137
```

### 9.4 Mapa mental final

```
Objetos inmutables (blob · tree · commit · tag) ──hash──▶ Merkle DAG
        ▲                                                   │
   referencias móviles (ramas, tags, HEAD) ◀────────────────┘
        │
   diff (Myers / histogram) ──▶ merge de 3 vías (base = LCA del DAG) ──▶ conflictos
        │
   rebase = cherry-pick masivo (hashes nuevos) · bisect = búsqueda binaria · reflog = diario de refs
        │
   hooks + CI = gobernanza · branching + flags = flujo de entrega · sparse/partial/commit-graph = escala
```

### 9.5 Autoevaluación

1. ¿Por qué cambiar el mensaje de un commit cambia los hashes de todos sus descendientes?
2. ¿Qué compara `git diff`, `git diff --staged` y `git diff HEAD`?
3. ¿Cuál es la complejidad de Myers y de qué depende?
4. ¿Por qué un merge criss-cross tiene dos merge bases y qué hace `recursive` al respecto?
5. ¿Qué diferencia hay entre `-X ours` y `-s ours`?
6. ¿Cuántas pruebas necesita `bisect` con 20 000 commits?
7. ¿Por qué `--force-with-lease` puede dejar de proteger si tu IDE hace `fetch` automático?
8. ¿Por qué revertir un merge impide volver a fusionar la misma rama sin más?
9. ¿Qué hooks se pueden omitir y cuáles no?
10. ¿Cuándo conviene un subtree en lugar de un submódulo?

**Respuestas breves:** (1) El mensaje forma parte del contenido hasheado; al cambiar el hash, los hijos, que contienen el hash de su padre, cambian en cascada. (2) Working tree vs. índice; índice vs. HEAD; working tree vs. HEAD. (3) O(N·D), esperado O(N + D²): depende del tamaño de los archivos y de cuánto difieren. (4) Porque dos commits no son ancestros uno del otro y ambos son «mejores» ancestros comunes; `recursive` fusiona esas bases en un ancestro virtual. (5) `-X ours` resuelve solo los hunks en conflicto a tu favor; `-s ours` descarta todo el contenido del otro lado y solo registra el merge. (6) ⌈log₂ 20 000⌉ = 15. (7) El fetch actualiza tu referencia remota y el *lease* cree que estás al día; usa `--force-if-includes` o un SHA esperado explícito. (8) Los commits de la rama ya son ancestros de `main`, así que el merge base los considera integrados; hay que revertir el revert o recrear la rama con hashes nuevos. (9) Los del cliente se omiten con `--no-verify`; los del servidor no. (10) Cuando quieres un solo repo transparente para quien clona, con pocas contribuciones de vuelta al upstream.

### 9.6 Recursos para profundizar

- *Pro Git* (Scott Chacon y Ben Straub), gratuito en git-scm.com; el capítulo «Git Internals» complementa las secciones 1 y 2.
- Páginas de manual: `git help rebase`, `gitrevisions`, `githooks`, `gitattributes`, `gitformat-pack`, `gitformat-commit-graph`.
- E. Myers (1986), *An O(ND) Difference Algorithm and Its Variations*, Algorithmica 1.
- Notas de cada versión de Git y las «Highlights from Git» del blog de GitHub, para seguir novedades como ort, reftable o Scalar.
- Conventional Commits (conventionalcommits.org), trunkbaseddevelopment.com, el artículo de Martin Fowler sobre *Feature Toggles* y la investigación DORA (dora.dev).

*Fin de la guía.*
