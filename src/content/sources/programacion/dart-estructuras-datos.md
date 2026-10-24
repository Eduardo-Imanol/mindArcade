# Estructuras de Datos: guía técnica exhaustiva

*Nivel intermedio → experto · Teoría agnóstica de lenguaje · Código de referencia en Dart 3 (con notas para Go, Python, TypeScript y C++)*

## 0. Mapa de la guía

Cada estructura se trata con el mismo esquema: definición formal, complejidad, implementación interna y memoria, casos de uso, código y trade-offs.

1. Fundamentos (TAD, análisis de costo, memoria)
2. Primitivos y arreglos
3. Listas enlazadas (simples, dobles, circulares)
4. Pilas
5. Colas, deques y buffers circulares
6. Colas de prioridad y heaps
7. Tablas hash y diccionarios
8. Conjuntos
9. Estructuras probabilísticas, hashing consistente y caches LRU
10. Árboles de búsqueda: BST, AVL, rojinegros, B/B+, splay, treap, skip list
11. Tries y estructuras para cadenas
12. Estructuras especializadas: segment tree, Fenwick, union-find, kd-tree, R-tree, rope, LSM
13. Grafos
14. Estructuras persistentes
15. Estructuras concurrentes
16. Guía de decisión y trade-offs

**Convenciones del código:** Dart 3 con null safety, genéricos y `Comparator<T>`. El código es didáctico: prioriza la claridad del invariante sobre la validación exhaustiva de errores. En producción, usa primero `dart:collection` y `package:collection`; implementar las estructuras a mano solo se justifica cuando necesitas un invariante o un costo que la librería no ofrece.

---

## 1. Fundamentos

### 1.1 TAD vs estructura de datos

Un **tipo abstracto de datos (TAD)** es una tripleta (D, O, A): un dominio de valores D, un conjunto de operaciones O y axiomas A que fijan su comportamiento sin decir nada de la representación. Ejemplo, la pila: top(push(s, x)) = x; pop(push(s, x)) = s; isEmpty(empty) = true.

Una **estructura de datos** es una implementación concreta de un TAD: una representación en memoria más los algoritmos que cumplen el contrato con ciertas cotas de costo. Un mismo TAD admite muchas estructuras (la cola de prioridad puede ser un heap binario, un pairing heap, un árbol balanceado o un arreglo ordenado). Elegir estructura es, en esencia, elegir qué operaciones se abaratan y cuáles se encarecen.

Dos conceptos para razonar con rigor:

- **Invariante de representación I(r):** propiedad que toda representación válida r cumple. En un heap mínimo: A\[⌊(i−1)/2⌋\] ≤ A\[i\] para todo i > 0. Cada operación pública debe asumir I al entrar y restablecerla al salir.
- **Función de abstracción AF(r):** asigna a cada representación válida el valor abstracto que representa. Dos representaciones distintas pueden tener el mismo valor abstracto (dos árboles AVL con formas diferentes pueden representar el mismo conjunto).

### 1.2 Modelo de costo y tipos de análisis

**Modelo.** Se usa el modelo word-RAM: la memoria es un arreglo de palabras de w ≥ log n bits y las operaciones aritméticas, comparaciones y accesos por dirección cuestan O(1). Notación: O(f) cota superior asintótica, Ω(f) cota inferior, Θ(f) ambas.

**Tipos de análisis** (no los mezcles al comparar estructuras):

| Análisis | Qué promedia | Ejemplo |
| --- | --- | --- |
| Peor caso | Nada: la peor entrada | Búsqueda en un BST degenerado: O(n) |
| Caso promedio | Sobre una distribución de entradas | Quicksort con entrada uniforme |
| Esperado | Sobre los dados internos del algoritmo | Treap, skip list, hashing universal |
| Amortizado | Sobre una secuencia de operaciones (garantía determinista) | push en arreglo dinámico: O(1) |

**Análisis amortizado.** Tres métodos equivalentes: agregado (costo total / n), contable (créditos por operación) y potencial. Con el método del potencial, el costo amortizado es ĉ = c + Φ(después) − Φ(antes). Para un arreglo dinámico con duplicación, Φ = 2·size − capacity: un push normal cuesta 1 y sube Φ en 2 (ĉ = 3); el push que duplica con size = capacity = c cuesta c + 1 pero Φ baja de c a 2, así que ĉ = 3 también. Resultado: O(1) amortizado.

**Advertencia de ingeniería:** amortizado no es latencia. Ese push que redimensiona cuesta O(n) y aparece en tu percentil 99. Soluciones habituales: preasignar capacidad, redimensionado incremental (Redis hace rehash incremental; el map de Go evacúa buckets de forma gradual) o estructuras que crecen por segmentos sin copiar todo.

**Lo que Big-O oculta:** constantes y la jerarquía de memoria. Órdenes de magnitud típicos: L1 ≈ 1 ns, L2 ≈ 3–5 ns, L3 ≈ 10–40 ns, RAM ≈ 60–100 ns, SSD NVMe ≈ 10–100 µs. La línea de caché es de 64 B y la página de una base de datos de 8–16 KB. En el **modelo de memoria externa** (Aggarwal–Vitter) el costo es el número de bloques transferidos, y por eso los B-trees con O(log\_B n) accesos dominan en disco, y también ganan en RAM frente a los árboles binarios cuando los datos exceden la caché.

### 1.3 Memoria: contigua vs enlazada, GC y boxing

- **Localidad espacial y temporal.** Los accesos secuenciales aprovechan líneas de caché y el prefetcher de hardware. El *pointer chasing* (seguir punteros) serializa las latencias: cada carga depende de la anterior y no hay paralelismo a nivel de memoria. Por eso un arreglo recorrido linealmente puede ser 10–100× más rápido que una lista con el mismo Big-O.
- **Dart (VM nativa).** Los enteros pequeños se guardan como *Smi* (inmediatos, sin alocar); los `double` en un `List<double>` son objetos *boxed* en el heap; los enteros fuera del rango Smi se encajonan. Las listas tipadas de `dart:typed_data` (`Uint8List`, `Int32List`, `Float64List`) almacenan valores crudos y contiguos, sin boxing. En web (dart2js) los números son los `double` de JavaScript: los enteros solo son exactos hasta 2^53.
- **Recolectores de basura.** Dart y V8 usan GC generacional (alocar objetos pequeños es barato, pero retener millones de nodos encarece el marcado); Go usa mark-sweep concurrente no generacional y no móvil; en C++ la gestión es manual (RAII, `unique_ptr`, allocators de arena o pool). Cada nodo de una estructura enlazada en un lenguaje con GC cuesta del orden de 16–32 B de cabecera y campos, frente a 4–8 B por elemento en un arreglo tipado.
- **Patrón árbol-en-arreglos.** Guardar los nodos en arreglos paralelos e indexarlos con enteros (`Int32List left, right; Float64List key`) elimina la presión sobre el GC, mejora la localidad, permite serializar y usar `memcpy`. Es la base de CSR para grafos, de los árboles de compiladores y de motores de juegos.

---

## 2. Tipos primitivos y arreglos

### 2.1 Primitivos como estructuras

Un tipo primitivo es la unidad que el hardware manipula directamente. Conviene conocer su representación porque define sus errores:

- **Enteros en complemento a dos** de n bits: rango \[−2^(n−1), 2^(n−1)−1\]. El desbordamiento envuelve (en la VM de Dart `int` es de 64 bits y envuelve; `BigInt` ofrece precisión arbitraria a costo mayor).
- **IEEE 754 binary64 (`double`):** 1 bit de signo, 11 de exponente, 52 de mantisa. Consecuencias: 0.1 + 0.2 ≠ 0.3, NaN ≠ NaN, la suma no es asociativa. **Los importes monetarios se guardan como enteros en la unidad mínima (centavos) o con un tipo decimal, nunca como `double`.**
- **Cadenas:** en Dart, `String` es una secuencia inmutable de unidades de código UTF-16. Un carácter visible (grafema) puede ocupar varias unidades: usa `runes` para puntos de código o `package:characters` para grafemas. Como son inmutables, concatenar en un bucle es O(n²); usa `StringBuffer` (O(n) total).
- **Bitmasks:** un entero de 64 bits es un conjunto de hasta 64 elementos con unión (`|`), intersección (`&`), diferencia (`& ~`), pertenencia (`>> i & 1`) y cardinalidad (`popcount`), todo en O(1).

### 2.2 Arreglo estático

**Definición matemática:** una función total a: {0, …, n−1} → V. **Computacional:** n celdas contiguas del mismo tamaño s; la dirección del elemento i es base + i·s, por lo que el acceso es una multiplicación y una suma (O(1), sin recorrer nada).

- **Matrices:** en orden *row-major* (C, Go, Dart con listas planas) addr(i, j) = base + (i·cols + j)·s. Recorrer por filas es secuencial; por columnas salta `cols·s` bytes y puede ser un orden de magnitud más lento por fallos de caché. Fortran y MATLAB usan *column-major*.
- **AoS vs SoA:** un arreglo de structs (AoS) es cómodo; una struct de arreglos (SoA) es mejor cuando el bucle caliente toca un solo campo (vectorización SIMD, menos bytes de caché desperdiciados).
- **Insertar/eliminar en medio:** O(n) por corrimiento (un `memmove`, muy rápido en la práctica).

### 2.3 Arreglo dinámico (vector, `List` growable)

Mantiene un buffer con capacidad ≥ tamaño; cuando se llena, aloca uno mayor (factor g) y copia. Dart: `List<T>` growable; Go: slices con `append`; Python: `list`; C++: `std::vector`; TypeScript: `Array`.

| Operación | Peor caso | Amortizado | Nota |
| --- | --- | --- | --- |
| Acceso a\[i\] | O(1) | O(1) |  |
| push al final | O(n) | O(1) | copia al crecer |
| pop del final | O(1) | O(1) | con shrink a cap/4 |
| Insertar en i | O(n) | O(n) | corrimiento |
| Eliminar en i | O(n) | O(n) | corrimiento |
| Búsqueda lineal | O(n) |  |  |
| Búsqueda binaria (ordenado) | O(log n) |  |  |
| Espacio | O(n) |  | hasta g× el tamaño real |

**Detalles de implementación:**

- **Factor de crecimiento:** g = 2 es simple, pero con g < φ ≈ 1.618 los bloques liberados anteriormente suman suficiente espacio para reutilizarse (argumento detrás de `fbvector` de Folly y del 1.5 de MSVC). La VM de Dart crece aproximadamente al doble; no es parte de la especificación.
- **Política de reducción:** encoge cuando size ≤ cap/4 (no cap/2), para evitar *thrashing* al oscilar alrededor del umbral.
- **Fuga lógica:** al hacer pop, anula la celda (`null`) si el lenguaje usa GC; si no, el buffer retiene el objeto.
- **Invalidación:** en C++ y Go, crecer invalida punteros y slices previos que apunten al buffer viejo.

```dart
class DynamicArray<T> {
  List<T?> _buf;
  int _length = 0;

  DynamicArray([int initialCapacity = 4])
      : _buf = List<T?>.filled(initialCapacity < 1 ? 1 : initialCapacity, null);

  int get length => _length;
  int get capacity => _buf.length;

  void _check(int i) {
    if (i < 0 || i >= _length) throw RangeError.index(i, this, 'index', null, _length);
  }

  T operator [](int i) {
    _check(i);
    return _buf[i] as T;
  }

  void operator []=(int i, T v) {
    _check(i);
    _buf[i] = v;
  }

  void add(T v) {
    if (_length == _buf.length) _resize(_buf.length * 2); // O(n) ocasional
    _buf[_length++] = v;                                  // O(1) amortizado
  }

  T removeLast() {
    if (_length == 0) throw StateError('arreglo vacío');
    final v = _buf[--_length] as T;
    _buf[_length] = null; // evita retener la referencia
    if (_length > 0 && _length <= _buf.length ~/ 4) _resize(_buf.length ~/ 2);
    return v;
  }

  void insert(int i, T v) {
    if (i < 0 || i > _length) throw RangeError.range(i, 0, _length);
    if (_length == _buf.length) _resize(_buf.length * 2);
    for (var k = _length; k > i; k--) {
      _buf[k] = _buf[k - 1]; // corrimiento O(n)
    }
    _buf[i] = v;
    _length++;
  }

  void _resize(int newCap) {
    final nb = List<T?>.filled(newCap, null);
    for (var k = 0; k < _length; k++) {
      nb[k] = _buf[k];
    }
    _buf = nb;
  }
}
```

### 2.4 Variantes y compañeros del arreglo

- **Listas tipadas (`dart:typed_data`):** `Float64List(1000000)` ocupa 8 MB contiguos sin boxing; sumar sus elementos es muy superior a sumar un `List<double>`. Úsalas para señal, imagen, buffers binarios y como base de estructuras compactas.
- **Bitset / `BoolList`:** 1 bit por elemento (8× menos memoria que un `bool` por byte) y operaciones de conjunto por palabras (64 elementos por instrucción).
- **Gap buffer:** un arreglo con un hueco móvil en el cursor; insertar cerca del cursor es O(1) amortizado. Lo usan Emacs y editores simples (ver también *rope* y *piece table*, sección 12).
- **Arreglos dispersos:** cuando casi todo es cero, usa mapas hash o formatos CSR/COO.
- **Búsqueda binaria:** sobre un arreglo ordenado ofrece O(log n) con excelente localidad. Un arreglo ordenado con búsqueda binaria suele vencer a un árbol balanceado para datos mayormente estáticos.

---

## 3. Listas enlazadas

### 3.1 Definición

**Matemática:** un tipo inductivo, List(T) = Nil | Cons(T, List(T)). Esa definición recursiva es la que permite razonar por inducción estructural y es la base de las listas persistentes (sección 14).

**Computacional:** nodos alocados dinámicamente, cada uno con un valor y uno o dos punteros. Variantes: **simple** (`next`), **doble** (`prev` y `next`) y **circular** (el último nodo apunta al primero). Un **nodo centinela** (dummy) elimina los casos especiales de lista vacía y extremos.

### 3.2 Complejidad

| Operación | Simple (solo head) | Simple (head + tail) | Doble (head + tail) |
| --- | --- | --- | --- |
| Insertar al inicio | O(1) | O(1) | O(1) |
| Insertar al final | O(n) | O(1) | O(1) |
| Eliminar el primero | O(1) | O(1) | O(1) |
| Eliminar el último | O(n) | O(n) | O(1) |
| Insertar/eliminar dado un nodo | O(n)\* | O(n)\* | O(1) |
| Acceso por índice / búsqueda | O(n) | O(n) | O(n) |
| Espacio | n·(v + p) | n·(v + p) | n·(v + 2p) |

\*Hace falta el predecesor. El truco de copiar el valor del siguiente y borrar el siguiente falla en el último nodo e invalida referencias externas a nodos.

### 3.3 Implementación interna y memoria

- **Un `malloc` por nodo:** cabecera del allocator (típicamente 8–16 B) más campos. Un nodo de lista con un `int` puede ocupar 32 B para 8 B de dato útil. Los nodos quedan dispersos en el heap: cada salto es potencialmente un fallo de caché.
- **Listas intrusivas:** el nodo vive *dentro* del elemento (`list_head` del kernel de Linux; en Dart, `LinkedList<E extends LinkedListEntry<E>>`). Quitan la alocación extra, permiten que un objeto pertenezca a varias listas y dan eliminación O(1) con solo el puntero al elemento.
- **Lista desenrollada (*unrolled*):** cada nodo guarda un arreglo de k elementos; reduce punteros y mejora la localidad (k típico: 16–64).
- **Lista XOR:** guarda `prev XOR next` en un solo campo, ahorrando un puntero; incompatible con GC y con lenguajes memory-safe.
- **Circular con puntero solo a la cola:** da O(1) para `addFirst`, `addLast` y `removeFirst` con un único puntero. Aplicaciones: planificación *round-robin*, el problema de Josephus, ciclos de iteración.
- **Free lists:** las listas enlazadas implementan allocators de pool: los bloques libres forman una lista cuyo *next* vive en el propio bloque libre.

### 3.4 Código: lista simple, inversión y detección de ciclos

```dart
class _Node<T> {
  T value;
  _Node<T>? next;
  _Node(this.value, [this.next]);
}

class SinglyLinkedList<T> {
  _Node<T>? _head, _tail;
  int _size = 0;
  int get length => _size;

  void addFirst(T v) {
    final n = _Node<T>(v, _head);
    _head = n;
    _tail ??= n;
    _size++;
  }

  void addLast(T v) {
    final n = _Node<T>(v);
    if (_tail == null) {
      _head = _tail = n;
    } else {
      _tail!.next = n;
      _tail = n;
    }
    _size++;
  }

  T removeFirst() {
    final h = _head ?? (throw StateError('lista vacía'));
    _head = h.next;
    if (_head == null) _tail = null;
    _size--;
    return h.value;
  }

  /// Inversión in-place: O(n) tiempo, O(1) espacio.
  void reverse() {
    _Node<T>? prev, cur = _head;
    _tail = _head;
    while (cur != null) {
      final nxt = cur.next;
      cur.next = prev;
      prev = cur;
      cur = nxt;
    }
    _head = prev;
  }
}

/// Floyd (tortuga y liebre): O(n) tiempo, O(1) espacio.
bool hasCycle<T>(_Node<T>? head) {
  var slow = head, fast = head;
  while (fast != null && fast.next != null) {
    slow = slow!.next;
    fast = fast.next!.next;
    if (identical(slow, fast)) return true;
  }
  return false;
}
```

**Lista doble con centinela y manejadores de nodo** (base del caché LRU de la sección 9):

```dart
class DNode<T> {
  T? value; // null solo en el centinela
  late DNode<T> prev, next;
  DNode([this.value]);
}

class DoublyLinkedList<T> {
  final DNode<T> _sentinel = DNode<T>();
  int _size = 0;

  DoublyLinkedList() {
    _sentinel.prev = _sentinel.next = _sentinel; // anillo vacío
  }

  int get length => _size;
  bool get isEmpty => _size == 0;

  DNode<T> addAfter(DNode<T> at, T v) {
    final n = DNode<T>(v)
      ..prev = at
      ..next = at.next;
    at.next.prev = n;
    at.next = n;
    _size++;
    return n; // manejador para unlink en O(1)
  }

  DNode<T> addFirst(T v) => addAfter(_sentinel, v);
  DNode<T> addLast(T v) => addAfter(_sentinel.prev, v);

  T unlink(DNode<T> n) {
    n.prev.next = n.next;
    n.next.prev = n.prev;
    _size--;
    return n.value as T;
  }

  T removeLast() => unlink(_sentinel.prev);
  void moveToFront(DNode<T> n) {
    final v = unlink(n);
    addFirst(v);
  }
}
```

### 3.5 Casos de uso reales

Caches LRU (hash + lista doble), listas de adyacencia dinámicas, *free lists* de allocators, colas de tareas del kernel, historiales de navegación (lista doble), representación de polinomios dispersos, encadenamiento de colisiones en tablas hash, y algoritmos *lock-free* donde un CAS sobre un único puntero basta (sección 15).

### 3.6 Trade-offs: arreglo vs lista enlazada

El consejo clásico de Stroustrup: para insertar y eliminar en posiciones aleatorias, un `vector` suele ganar a una `list` incluso con n grande, porque localizar la posición cuesta O(n) en ambas y el arreglo lo hace con localidad perfecta, mientras que el corrimiento es un `memmove`.

**Una lista gana cuando:** necesitas referencias o iteradores estables ante inserciones, `splice` y *merge* en O(1), un mismo elemento en varias listas (intrusivas), elementos enormes que no quieres mover, o algoritmos concurrentes basados en CAS de un puntero.

**Una lista pierde cuando:** el recorrido domina, la memoria importa (overhead por nodo), o el lenguaje tiene GC (más objetos que marcar). En la práctica, un arreglo dinámico o un buffer circular reemplaza a la mayoría de las listas que se escriben por costumbre.

---

## 4. Pilas (Stacks)

### 4.1 Definición

**Matemática:** una secuencia finita s = (x₁, …, xₙ) con acceso exclusivo por un extremo (LIFO: *last in, first out*). Operaciones: push, pop, peek, isEmpty. Axiomas: peek(push(s, x)) = x; pop(push(s, x)) = s.

**Computacional:** un arreglo dinámico donde el tope es el índice `length - 1`, o una lista simple donde el tope es la cabeza.

| Operación | Pila sobre arreglo | Pila sobre lista simple |
| --- | --- | --- |
| push | O(1) amortizado | O(1) peor caso |
| pop | O(1) | O(1) |
| peek | O(1) | O(1) |
| Búsqueda | O(n) | O(n) |
| Espacio | O(n), contiguo | O(n) + un puntero por nodo |

### 4.2 Implementación y memoria

- **La pila de llamadas es una pila de hardware:** cada invocación apila un *frame* (parámetros, dirección de retorno, variables locales) y el registro *stack pointer* se mueve. Es contigua y su tamaño es limitado (del orden de 1–8 MB por hilo, según plataforma), por eso la recursión profunda lanza *stack overflow*. Go evita el límite fijo con pilas de goroutines que crecen copiándose a un bloque mayor; la VM de Dart limita la profundidad por isolate.
- **Recursión → pila explícita:** convertir un recorrido recursivo a iterativo con una pila propia mueve los frames al heap, elimina el desbordamiento y permite pausar, reanudar o limitar el recorrido.
- **Pila sobre arreglo** es el valor por defecto: localidad perfecta y sin alocaciones por elemento. **Sobre lista** solo cuando necesitas peor caso O(1) sin redimensionados, compartir colas entre versiones (pilas persistentes, sección 14) o un push lock-free por CAS (pila de Treiber, sección 15).

### 4.3 Casos de uso y patrones

- **Parsing y evaluación:** paréntesis balanceados, conversión infija→postfija (algoritmo *shunting-yard*), evaluación de RPN, parsers LR, máquinas virtuales de bytecode (la JVM y la VM de Dart operan con pilas de operandos).
- **DFS iterativo**, backtracking, resolución de laberintos.
- **Undo/redo:** dos pilas (deshacer y rehacer); una acción nueva vacía la de rehacer.
- **Pila monótona:** mantiene los índices en orden creciente o decreciente de valor; resuelve *siguiente elemento mayor*, *rango de precios* y *mayor rectángulo en un histograma* en O(n) total, porque cada elemento entra y sale una sola vez.

```dart
class Stack<T> {
  final List<T> _items = [];

  void push(T x) => _items.add(x);

  T pop() {
    if (_items.isEmpty) throw StateError('pila vacía');
    return _items.removeLast();
  }

  T get peek => _items.isEmpty ? throw StateError('pila vacía') : _items.last;
  bool get isEmpty => _items.isEmpty;
  int get length => _items.length;
}

bool balanced(String s) {
  const pairs = {')': '(', ']': '[', '}': '{'};
  final st = <String>[];
  for (final ch in s.split('')) {
    if (pairs.containsValue(ch)) {
      st.add(ch);
    } else if (pairs.containsKey(ch)) {
      if (st.isEmpty || st.removeLast() != pairs[ch]) return false;
    }
  }
  return st.isEmpty;
}

/// Siguiente elemento mayor: O(n) total (cada índice entra y sale una vez).
List<int> nextGreater(List<int> a) {
  final res = List<int>.filled(a.length, -1);
  final st = <int>[]; // índices con valores decrecientes
  for (var i = 0; i < a.length; i++) {
    while (st.isNotEmpty && a[st.last] < a[i]) {
      res[st.removeLast()] = a[i];
    }
    st.add(i);
  }
  return res;
}
```

### 4.4 Trade-offs

La pila es la estructura con el contrato más estrecho y por eso la más fácil de optimizar: un `List` sirve en el 95 % de los casos. Una pila de capacidad fija (arreglo preasignado) es apropiada en sistemas embebidos o de latencia estricta. Si tu algoritmo necesita acceder al medio, buscar o iterar en orden de inserción *y* extraer por el tope, probablemente quieres un deque o una lista doble.

---

## 5. Colas, deques y buffers circulares

### 5.1 Definición

**Matemática:** una secuencia con inserción por un extremo y extracción por el otro (FIFO). Axiomas: front(enqueue(empty, x)) = x; si q no está vacía, front(enqueue(q, x)) = front(q) y dequeue(enqueue(q, x)) = enqueue(dequeue(q), x). Un **deque** (*double-ended queue*) permite insertar y extraer por ambos extremos.

**Trampa clásica:** en Dart, `List.removeAt(0)` es O(n) (corre todos los elementos). Una cola sobre `List` con `removeAt(0)` convierte BFS en O(V·E) en lugar de O(V+E). Usa `ListQueue` o un buffer circular.

| Operación | Buffer circular | Lista con head+tail | Dos pilas |
| --- | --- | --- | --- |
| enqueue | O(1) amortizado | O(1) | O(1) |
| dequeue | O(1) | O(1) | O(1) amortizado |
| peek | O(1) | O(1) | O(1) amortizado |
| Espacio | O(n), contiguo | O(n) + punteros | O(n) |

### 5.2 Implementaciones y memoria

- **Buffer circular (ring buffer):** arreglo de capacidad c, índice `head` y contador `size`. El elemento i-ésimo está en `(head + i) mod c`. Si c es potencia de 2, el módulo se calcula con una máscara: `(head + i) & (c - 1)`, mucho más barata que una división. Es exactamente lo que hace `ListQueue` de Dart (capacidad potencia de 2, crece duplicando).
- **Lista enlazada con head y tail:** peor caso O(1) sin copias, pero un nodo por elemento. Es lo que hace `DoubleLinkedQueue`.
- **Cola con dos pilas** (entrada y salida): al vaciarse la de salida se vuelca la de entrada invirtiendo el orden. Cada elemento se mueve a lo sumo una vez, por lo que es O(1) amortizado. Es la base de las colas funcionales (*banker's queue*, Okasaki) y de las colas persistentes; ojo: el análisis amortizado se rompe si reutilizas versiones antiguas sin *laziness* (sección 14).
- **Deque por bloques:** `std::deque` de C++ guarda un arreglo de punteros a bloques de tamaño fijo; permite acceso aleatorio O(1) con dos indirecciones y no invalida referencias al crecer por los extremos.
- **Buffer circular acotado en concurrencia:** una cola SPSC (un productor, un consumidor) se implementa sin locks con dos índices atómicos (`head` solo lo escribe el consumidor y `tail` solo el productor). Hay que evitar el *false sharing* separando ambos índices en líneas de caché distintas (padding de 64 B). El LMAX Disruptor generaliza esta idea; los canales de Go son un buffer circular protegido por un mutex más colas de espera.

```dart
class RingQueue<T> {
  List<T?> _buf = List<T?>.filled(8, null); // capacidad: potencia de 2
  int _head = 0, _size = 0;

  int get length => _size;
  bool get isEmpty => _size == 0;

  void enqueue(T x) {
    if (_size == _buf.length) _grow();
    _buf[(_head + _size) & (_buf.length - 1)] = x; // módulo con máscara
    _size++;
  }

  T dequeue() {
    if (_size == 0) throw StateError('cola vacía');
    final x = _buf[_head] as T;
    _buf[_head] = null; // no retener referencias
    _head = (_head + 1) & (_buf.length - 1);
    _size--;
    return x;
  }

  T get peek => _size == 0 ? throw StateError('cola vacía') : _buf[_head] as T;

  void _grow() {
    final nb = List<T?>.filled(_buf.length * 2, null);
    for (var i = 0; i < _size; i++) {
      nb[i] = _buf[(_head + i) & (_buf.length - 1)]; // desenrolla el anillo
    }
    _buf = nb;
    _head = 0;
  }
}
```

**Deque monótono: máximo de ventana deslizante en O(n)** (cada índice entra y sale una vez):

```dart
import 'dart:collection';

List<int> slidingMax(List<int> a, int k) {
  final dq = ListQueue<int>(); // índices con valores decrecientes
  final out = <int>[];
  for (var i = 0; i < a.length; i++) {
    while (dq.isNotEmpty && a[dq.last] <= a[i]) {
      dq.removeLast();
    }
    dq.addLast(i);
    if (dq.first <= i - k) dq.removeFirst(); // salió de la ventana
    if (i >= k - 1) out.add(a[dq.first]);
  }
  return out;
}
```

### 5.3 Casos de uso reales

- **BFS** y recorridos por niveles; planificadores *round-robin*; buffers de I/O y de red; productores/consumidores.
- **Event loop de Dart:** cada isolate tiene una cola de microtareas (se vacía primero) y una cola de eventos; entender que son colas FIFO explica el orden de ejecución de `Future.microtask`, `Future` y `Timer`.
- **Logs y brokers de mensajes:** Kafka es un log append-only particionado (una cola con lectores que mantienen su offset); RabbitMQ y SQS son colas con acuse de recibo.
- **Backpressure:** una cola *no acotada* entre un productor rápido y un consumidor lento es una fuga de memoria diferida. Diseña colas acotadas con política explícita (bloquear, descartar el más viejo o rechazar).

### 5.4 Trade-offs

El buffer circular es el valor por defecto (localidad, sin alocaciones por elemento, capacidad acotada natural). Elige lista enlazada solo si necesitas peor caso O(1) estricto sin redimensionado o eliminar elementos arbitrarios por manejador. El deque por bloques es un buen compromiso cuando el volumen es grande y no quieres copias masivas.

---

## 6. Colas de prioridad y heaps

### 6.1 Definición

**TAD cola de prioridad:** un multiconjunto S sobre un orden total, con `insert(x)`, `peekMin()`, `extractMin()` y opcionalmente `decreaseKey`, `merge` y `delete`. Es un TAD; el **heap** es una familia de estructuras que lo implementa.

**Propiedad de heap (min-heap):** para todo nodo v distinto de la raíz, clave(padre(v)) ≤ clave(v). Solo hay orden entre ancestros y descendientes, no entre hermanos: por eso un heap **no** soporta búsqueda ni iteración ordenada eficiente.

### 6.2 Heap binario

**Representación:** un árbol binario *casi completo* guardado en un arreglo, sin punteros. Con índices desde 0: padre(i) = ⌊(i−1)/2⌋, hijos 2i+1 y 2i+2. Altura ⌊log₂ n⌋.

- **Sift-up (insertar):** coloca el elemento al final y lo sube mientras sea menor que su padre. O(log n) en el peor caso; **O(1) en promedio para entradas aleatorias**, porque la mayoría de los elementos nuevos se quedan cerca de las hojas.
- **Sift-down (extraer):** reemplaza la raíz por el último elemento y lo baja intercambiándolo con el hijo menor. O(log n).
- **Construcción de Floyd:** aplicar sift-down desde el último nodo interno hacia la raíz cuesta **O(n)**, no O(n log n): Σₕ ⌈n/2^(h+1)⌉·O(h) = O(n), porque la mayoría de los nodos están cerca de las hojas.
- **Heapsort:** build-heap + n extracciones, O(n log n) *in-place* y no estable.
- **decreaseKey / delete arbitrario:** requiere conocer la posición del elemento; se logra con un mapa `elemento → índice` actualizado en cada intercambio (*indexed priority queue*). Una alternativa muy usada es la *eliminación perezosa*: insertar el elemento actualizado y descartar los obsoletos al extraerlos.
- **Estabilidad:** un heap no es estable. Para FIFO entre prioridades iguales añade un contador de secuencia como desempate.

```dart
class MinHeap<T> {
  final List<T> _a = [];
  final Comparator<T> _cmp;
  MinHeap(this._cmp);

  int get length => _a.length;
  bool get isEmpty => _a.isEmpty;
  T get peek => _a.isEmpty ? throw StateError('heap vacío') : _a[0];

  void push(T x) {
    _a.add(x);
    _siftUp(_a.length - 1);
  }

  T pop() {
    if (_a.isEmpty) throw StateError('heap vacío');
    final top = _a[0];
    final last = _a.removeLast();
    if (_a.isNotEmpty) {
      _a[0] = last;
      _siftDown(0);
    }
    return top;
  }

  void _siftUp(int i) {
    final x = _a[i];
    while (i > 0) {
      final p = (i - 1) >> 1;
      if (_cmp(x, _a[p]) >= 0) break;
      _a[i] = _a[p]; // baja el padre; evita un swap completo
      i = p;
    }
    _a[i] = x;
  }

  void _siftDown(int i) {
    final n = _a.length;
    final x = _a[i];
    while (true) {
      var c = 2 * i + 1;
      if (c >= n) break;
      if (c + 1 < n && _cmp(_a[c + 1], _a[c]) < 0) c++; // hijo menor
      if (_cmp(_a[c], x) >= 0) break;
      _a[i] = _a[c];
      i = c;
    }
    _a[i] = x;
  }

  /// Construcción de Floyd: O(n).
  factory MinHeap.from(Iterable<T> items, Comparator<T> cmp) {
    final h = MinHeap<T>(cmp).._a.addAll(items);
    for (var i = (h._a.length >> 1) - 1; i >= 0; i--) {
      h._siftDown(i);
    }
    return h;
  }
}
```

### 6.3 La familia de heaps

| Heap | insert | peekMin | extractMin | decreaseKey | merge |
| --- | --- | --- | --- | --- | --- |
| Binario (arreglo) | O(log n) | O(1) | O(log n) | O(log n)\* | O(n) |
| d-ario | O(log\_d n) | O(1) | O(d·log\_d n) | O(log\_d n)\* | O(n) |
| Binomial | O(1) amortizado | O(1) con puntero | O(log n) | O(log n) | O(log n) |
| Fibonacci | O(1) | O(1) | O(log n) amortizado | O(1) amortizado | O(1) |
| Pairing | O(1) | O(1) | O(log n) amortizado | cota exacta abierta\*\* | O(1) |

\*Con mapa de posiciones. \*\*Se conoce O(log n) amortizado; la cota exacta sigue siendo un problema abierto de la teoría.

- **d-ario:** con d = 4 el árbol es más bajo (menos saltos) y los hijos caben en una línea de caché; suele superar al binario en la práctica. El runtime de Go usa un heap 4-ario para sus timers.
- **Binomial:** colección de árboles binomiales (uno por bit de n); la fusión es como sumar números binarios.
- **Fibonacci:** bosque con marcado de nodos y consolidación perezosa; da Dijkstra en O(E + V log V), óptimo teórico. En la práctica sus constantes y su mala localidad lo hacen perder frente a un heap binario o 4-ario salvo grafos enormes y densos.
- **Pairing heap:** muy simple y muy rápido en la práctica; es la elección típica cuando se necesita merge y decreaseKey con buen rendimiento real.
- **Colas de cubetas (Dial, radix heap, calendar queue):** si las prioridades son enteros acotados y monótonas (típico en Dijkstra con pesos enteros pequeños), superan a cualquier heap comparativo.

### 6.4 Casos de uso reales

- **Dijkstra, Prim, A\*:** la cola de prioridad es el motor del algoritmo (sección 13).
- **Top-K en flujo:** un min-heap de tamaño k mantiene los k mayores en O(n log k) con O(k) de memoria.
- **Mezcla de k listas ordenadas:** O(N log k), base del *external merge sort* y de la fase de compactación en LSM trees.
- **Mediana en flujo:** un max-heap para la mitad inferior y un min-heap para la superior.
- **Planificación y simulación por eventos:** timers (el siguiente evento es el mínimo), planificadores por prioridad, compresión de Huffman.
- **Librerías:** Dart `PriorityQueue` (`package:collection`, heap binario); Python `heapq` (min-heap sobre lista); C++ `std::priority_queue` (max-heap); Java `PriorityQueue`; Go `container/heap` (interfaz).

### 6.5 Trade-offs

Un heap da el mínimo en O(1) y lo extrae en O(log n) con memoria compacta y excelente localidad, pero **no** permite buscar un elemento arbitrario, iterar en orden ni consultar el sucesor. Si además necesitas rangos, predecesor/sucesor o eliminación por clave, usa un árbol balanceado (más constantes, más memoria). Si las prioridades son enteros acotados, usa cubetas. Si la cola se vacía casi siempre en orden de llegada, una cola FIFO simple es más rápida y más justa.

---

## 7. Tablas hash y diccionarios

### 7.1 Definición

**Matemática:** un **diccionario** (mapa, arreglo asociativo) es una función parcial finita K ⇀ V con las operaciones `put`, `get`, `remove` y `containsKey`. Una **tabla hash** lo implementa con un arreglo T de m ranuras y una función h: U → {0, …, m−1}. Como |U| ≫ m, por el principio del palomar las colisiones (h(x) = h(y) con x ≠ y) son inevitables. El **factor de carga** es α = n/m.

**Hashing uniforme simple (SUHA):** el supuesto idealizado de que cada clave cae en cada ranura con probabilidad 1/m, independientemente. No es verificable en la práctica; lo que sí se puede garantizar es el **hashing universal**: una familia H es universal si para x ≠ y, Pr\_{h∈H}\[h(x) = h(y)\] ≤ 1/m. Ejemplo de Carter–Wegman: h\_{a,b}(x) = ((a·x + b) mod p) mod m, con p primo mayor que |U|, a ∈ \[1, p−1\] y b ∈ \[0, p−1\], elegidos al azar. Da costo esperado O(1 + α) para *cualquier* conjunto de claves (frente a un adversario que no ve la semilla).

**Funciones hash en la práctica:** FNV-1a, MurmurHash3, xxHash y wyhash (rápidas, no criptográficas); **SipHash** (resistente a *HashDoS*; es el hash por defecto de Python para cadenas y de `HashMap` en Rust); AES-NI en el map de Go. **HashDoS:** un atacante fabrica claves que colisionan para degradar la tabla a O(n) por operación y O(n²) en total. Mitigaciones: semilla aleatoria por proceso, SipHash, y *treeification* (Java convierte un bucket con 8 o más nodos en árbol rojinegro si la tabla tiene al menos 64 ranuras).

**Contrato en Dart:** si `a == b` entonces `a.hashCode == b.hashCode`; ambos deben ser estables mientras el objeto sea clave. Mutar un campo que participa en `==` y `hashCode` después de insertar la clave deja el elemento "perdido" en la tabla. Los *records* de Dart tienen igualdad y hash estructurales automáticamente; las clases necesitan `==` y `hashCode` explícitos:

```dart
class Point {
  final int x, y;
  const Point(this.x, this.y);

  @override
  bool operator ==(Object o) => o is Point && o.x == x && o.y == y;

  @override
  int get hashCode => Object.hash(x, y); // combina los campos
}
```

### 7.2 Resolución de colisiones

**a) Encadenamiento separado.** Cada ranura apunta a una colección (lista o árbol). Costo esperado: Θ(1 + α) en búsqueda fallida y Θ(1 + α/2) en la exitosa; α puede superar 1. El borrado es trivial. Contras: un nodo por elemento (memoria y fallos de caché).

**b) Direccionamiento abierto.** Todos los elementos viven en el propio arreglo (α ≤ 1). La secuencia de sondeo decide dónde buscar tras una colisión:

- **Lineal:** h(x) + i. Excelente localidad (secuencial) pero sufre *clustering primario*: las rachas ocupadas se fusionan. Según Knuth, el número esperado de sondeos es ≈ ½(1 + 1/(1−α)²) en búsqueda fallida y ≈ ½(1 + 1/(1−α)) en la exitosa. Con α = 0.5 son 2.5 y 1.5; con α = 0.9 son 50.5 y 5.5. Por eso se mantiene α por debajo de \~0.75 (o se usan variantes que toleran más).
- **Cuadrático:** h(x) + c₁·i + c₂·i². Reduce el clustering primario, deja el secundario.
- **Doble hash:** h₁(x) + i·h₂(x), con h₂ coprimo con m (m primo, o m potencia de 2 y h₂ impar). Mejor distribución, peor localidad.
- **Borrado:** con *tombstones* (lápidas) la tabla se llena de marcas y hay que rehacerla; con sondeo lineal es posible el **borrado por desplazamiento hacia atrás** (*backward shift*), que no deja basura (código abajo).

**c) Robin Hood.** Al insertar, si el elemento que sondea ha viajado más lejos de su ranura natural que el residente, intercambian lugares ("quita al rico para dar al pobre"). Reduce la varianza de longitud de sondeo y permite cortar búsquedas fallidas temprano.

**d) Cuckoo hashing.** Dos funciones h₁ y h₂ y dos tablas: cada clave está en T₁\[h₁(x)\] o en T₂\[h₂(x)\]. La búsqueda es O(1) en el *peor caso* (dos accesos). Al insertar se expulsa al ocupante a su otra casa, en cadena; un ciclo obliga a rehacer con nuevas funciones. Con una ranura por celda soporta α ≈ 50 %; con buckets de 4 ranuras supera el 90 %. Es la base de los *cuckoo filters*.

**e) Hopscotch.** Cada ranura tiene un mapa de bits (vecindad de 32 o 64) que garantiza que las claves están cerca de su ranura natural; conviene en concurrencia.

**f) Swiss tables** (Abseil `flat_hash_map`, `hashbrown` de Rust, y el `map` de Go desde la versión 1.24): un arreglo de bytes de control (1 byte por ranura: vacía, borrada o 7 bits del hash) junto a las ranuras. Se compara un grupo de 16 bytes de control a la vez con SIMD, y solo se compara la clave completa donde coinciden los 7 bits. Reduce drásticamente las comparaciones de claves; factor de carga máximo típico de 7/8.

**g) Hashing perfecto (FKS, CHD, `gperf`).** Para conjuntos estáticos (palabras reservadas de un compilador, tablas de símbolos fijas): dos niveles de tablas dan O(n) de espacio y O(1) de búsqueda en el peor caso.

**Redimensionado.** Al superar un umbral de α se duplica la tabla y se reinsertan todos los elementos (O(n), O(1) amortizado). Para evitar un pico de latencia se usa **rehash incremental**: Redis mantiene dos tablas y migra un bucket por operación. Tamaños de potencia de 2 permiten máscara en vez de módulo (requieren un buen mezclado de bits); tamaños primos toleran hashes mediocres a costa de una división.

| Operación | Esperado (buen hash, α acotado) | Peor caso |
| --- | --- | --- |
| put | O(1) amortizado | O(n) |
| get | O(1) | O(n); O(log n) con treeify |
| remove | O(1) | O(n) |
| Iterar | O(n + m) | O(n + m) |
| Mínimo, rango, sucesor | No soportado (O(n)) | O(n) |
| Espacio | O(n) | O(n) |

### 7.3 Implementación en lenguajes reales

- **Diccionario compacto** (Python 3.6+, y la implementación actual de `LinkedHashMap` en la VM de Dart, según el SDK): una pequeña tabla de índices que apunta a un arreglo denso de entradas (clave, valor) en orden de inserción. Da iteración ordenada por inserción, menor memoria y recorrido rápido sobre un arreglo contiguo. Los borrados dejan huecos que se compactan al redimensionar.
- **Dart:** el literal `{}` crea un `LinkedHashMap` (orden de inserción); `HashMap` no garantiza orden; `SplayTreeMap` ordena por clave (sección 10). **Go:** orden de iteración deliberadamente aleatorio. **JavaScript/TypeScript:** `Map` conserva el orden de inserción.

**Mapa con direccionamiento abierto (sondeo lineal + borrado por desplazamiento hacia atrás):**

```dart
class _Entry<K, V> {
  final K key;
  V value;
  _Entry(this.key, this.value);
}

class OpenAddressingMap<K, V> {
  List<_Entry<K, V>?> _t = List.filled(8, null); // capacidad: potencia de 2
  int _n = 0;

  int get length => _n;
  int get _mask => _t.length - 1;

  // El hashCode puede tener poca entropía en los bits bajos: se mezcla.
  int _home(K key) {
    var h = key.hashCode;
    h ^= h >>> 16;
    h *= 0x45d9f3b;
    h ^= h >>> 16;
    return h & _mask;
  }

  // Índice de la clave, o de la primera ranura libre del sondeo.
  int _find(K key) {
    var i = _home(key);
    while (true) {
      final e = _t[i];
      if (e == null || e.key == key) return i;
      i = (i + 1) & _mask;
    }
  }

  V? operator [](K key) => _t[_find(key)]?.value;
  bool containsKey(K key) => _t[_find(key)] != null;

  void operator []=(K key, V value) {
    if ((_n + 1) * 4 > _t.length * 3) _resize(_t.length * 2); // α máx = 0.75
    final i = _find(key);
    final e = _t[i];
    if (e != null) {
      e.value = value;
      return;
    }
    _t[i] = _Entry<K, V>(key, value);
    _n++;
  }

  V? remove(K key) {
    var i = _find(key);
    final e = _t[i];
    if (e == null) return null;
    _t[i] = null;
    _n--;
    var j = i;
    while (true) {
      j = (j + 1) & _mask;
      final f = _t[j];
      if (f == null) break;
      final k = _home(f.key);
      // ¿k está en el intervalo cíclico (i, j]? Si no, f puede retroceder a i.
      final inRange = i <= j ? (i < k && k <= j) : (i < k || k <= j);
      if (!inRange) {
        _t[i] = f;
        _t[j] = null;
        i = j;
      }
    }
    return e.value;
  }

  void _resize(int cap) {
    final old = _t;
    _t = List.filled(cap, null);
    for (final e in old) {
      if (e != null) _t[_find(e.key)] = e;
    }
  }
}
```

### 7.4 Casos de uso reales

Conteo de frecuencias, memoización, deduplicación, índices en memoria, tablas de símbolos de compiladores, *string interning*, **hash join** en bases de datos (construir una tabla hash con la relación pequeña y sondear con la grande), sharding y enrutamiento, detección de ciclos y de duplicados, cachés.

### 7.5 Trade-offs

- **Hash vs árbol:** el hash gana en búsqueda puntual (O(1) esperado), pierde en todo lo que implique orden: rangos, mínimo, sucesor, iteración ordenada.
- **Peor caso:** si un adversario controla las claves necesitas semilla aleatoria o SipHash; si necesitas garantías duras de latencia, un árbol balanceado (O(log n) estricto) o cuckoo.
- **Memoria y caché:** el direccionamiento abierto con almacenamiento plano (clave y valor en arreglos contiguos) supera al encadenamiento por localidad; pero con valores grandes conviene guardar índices o punteros.
- **Claves largas:** hashear y comparar una cadena cuesta O(L); con claves enormes, un trie (sección 11) puede compartir prefijos.
- **n muy pequeño (< 16–32):** un escaneo lineal sobre un arreglo suele ser más rápido que cualquier tabla hash.
- **Latencia de redimensionado:** presupuesta capacidad inicial (`HashMap` de Java y `make(map, n)` de Go la aceptan) o usa rehash incremental.

---

## 8. Conjuntos (Sets)

### 8.1 Definición

**Matemática:** un subconjunto finito S ⊆ U, sin duplicados. Operaciones: `add`, `remove`, `contains` y las del álgebra de conjuntos (unión, intersección, diferencia, diferencia simétrica, ⊆). **Computacional:** un diccionario sin valores, o un bitmap sobre el universo, o un arreglo ordenado, según el universo y la densidad.

| Operación | HashSet | TreeSet (balanceado) | Bitset (universo U) | Arreglo ordenado |
| --- | --- | --- | --- | --- |
| add | O(1) | O(log n) | O(1) | O(n) |
| contains | O(1) | O(log n) | O(1) | O(log n) |
| remove | O(1) | O(log n) | O(1) | O(n) |
| Unión A ∪ B | O(\|A\| + \|B\|) | O(\|A\| + \|B\|) por mezcla | O(U/w) | O(\|A\| + \|B\|) |
| Intersección | O(mín(\|A\|, \|B\|)) | O(\|A\| + \|B\|) | O(U/w) | O(\|A\| + \|B\|) o galloping |
| Iteración ordenada | No | O(n) | O(U/w + n) | O(n) |
| Predecesor/sucesor | No | O(log n) | O(U/w) | O(log n) |

(w = tamaño de palabra, típicamente 64.)

### 8.2 Implementaciones y cuándo usarlas

- **HashSet:** el valor por defecto. Dart: el literal `{...}` es un `LinkedHashSet` (orden de inserción); `HashSet` sin orden; `HashSet.identity()` compara por identidad; `HashSet(equals:, hashCode:)` admite igualdad personalizada. Go: `map[T]struct{}` (el valor vacío ocupa 0 bytes). Python: `set` y `frozenset` (hashable).
- **TreeSet:** necesario para consultas de orden (`floor`, `ceiling`, rangos). Dart: `SplayTreeSet`; C++: `std::set`; Java: `TreeSet`.
- **Bitset:** si el universo son enteros densos y acotados (IDs, píxeles, permisos), es la opción más rápida y compacta: 1 bit por elemento y operaciones de conjunto de 64 elementos por instrucción.
- **Arreglo ordenado:** para conjuntos casi estáticos y consultas por mezcla (intersección de listas de posteo en motores de búsqueda, con *galloping search* cuando los tamaños son muy distintos).
- **Roaring bitmaps:** híbrido por bloques de 2¹⁶ valores (arreglo, bitmap o runs según densidad). Es el estándar en Lucene, Spark, ClickHouse y Druid.
- **Union-Find** (sección 12) cuando lo que mantienes es una *partición* en conjuntos disjuntos con unión dinámica.

```dart
import 'dart:typed_data';

class BitSet {
  final int size;
  final Uint32List _w;
  BitSet(this.size) : _w = Uint32List((size + 31) >> 5);

  bool contains(int i) => ((_w[i >> 5] >> (i & 31)) & 1) == 1;
  void add(int i) => _w[i >> 5] |= (1 << (i & 31));
  void remove(int i) => _w[i >> 5] &= ~(1 << (i & 31));

  BitSet union(BitSet o) {
    final r = BitSet(size);
    for (var k = 0; k < _w.length; k++) {
      r._w[k] = _w[k] | o._w[k]; // 32 elementos por operación
    }
    return r;
  }

  BitSet intersection(BitSet o) {
    final r = BitSet(size);
    for (var k = 0; k < _w.length; k++) {
      r._w[k] = _w[k] & o._w[k];
    }
    return r;
  }

  int get count {
    var c = 0;
    for (var x in _w) {
      // popcount por SWAR
      x = x - ((x >> 1) & 0x55555555);
      x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
      x = (x + (x >> 4)) & 0x0F0F0F0F;
      c += ((x * 0x01010101) & 0xFFFFFFFF) >> 24;
    }
    return c;
  }
}
```

### 8.3 Trade-offs

Elige por la **pregunta que vas a hacer**: ¿solo pertenencia? HashSet. ¿Orden, rangos o vecinos? TreeSet o arreglo ordenado. ¿Universo denso pequeño? Bitset. ¿Muchas operaciones masivas de conjuntos sobre IDs enteros? Roaring. ¿Miles de millones de elementos y puedes tolerar falsos positivos? Bloom (siguiente sección). Los conjuntos de objetos mutables son una trampa: la misma advertencia de `hashCode` de las tablas hash aplica.

---

## 9. Estructuras probabilísticas, hashing consistente y cachés

### 9.1 Filtro de Bloom

**Definición:** un arreglo de m bits y k funciones hash. `add(x)` activa los k bits h₁(x), …, hₖ(x). `mightContain(x)` responde "posiblemente presente" si los k bits están activos y "definitivamente ausente" si alguno está apagado. **No hay falsos negativos**, solo falsos positivos.

**Matemática:** tras n inserciones, la tasa de falsos positivos es p ≈ (1 − e^(−kn/m))^k. El k óptimo es (m/n)·ln 2, con lo que p ≈ 2^(−k). Dimensionado: m = −n·ln p / (ln 2)². Para p = 1 % se necesitan ≈ 9.6 bits por elemento y k ≈ 7, sin importar el tamaño de los elementos.

**Complejidad:** add y consulta O(k) = O(1); espacio O(m). No admite borrado (apagar un bit puede afectar a otras claves): el *counting Bloom filter* usa contadores de 4 bits; el **cuckoo filter** admite borrado y gana en espacio cuando p < 3 %; los **XOR/ribbon filters** son estáticos y más compactos aún. El **Bloom por bloques** limita los k accesos a una sola línea de caché de 64 B.

**Usos:** los LSM trees lo usan para evitar leer SSTables que no contienen la clave (Cassandra, RocksDB, HBase); cachés de CDN (no almacenar objetos vistos una sola vez); *joins* distribuidos; listas de navegación segura.

```dart
import 'dart:math' as math;
import 'dart:typed_data';

int _fmix32(int h) {
  h &= 0xFFFFFFFF;
  h ^= h >> 16;
  h = (h * 0x85ebca6b) & 0xFFFFFFFF;
  h ^= h >> 13;
  h = (h * 0xc2b2ae35) & 0xFFFFFFFF;
  h ^= h >> 16;
  return h;
}

class BloomFilter {
  final int m, k;
  final Uint8List _bits;

  BloomFilter._(this.m, this.k) : _bits = Uint8List((m + 7) >> 3);

  factory BloomFilter.forCapacity(int n, double p) {
    final m = (-n * math.log(p) / (math.ln2 * math.ln2)).ceil();
    final k = math.max(1, (m / n * math.ln2).round());
    return BloomFilter._(m, k);
  }

  // Doble hashing (Kirsch–Mitzenmacher): g_i(x) = h1(x) + i·h2(x).
  Iterable<int> _indexes(Object item) sync* {
    final h1 = _fmix32(item.hashCode);
    final h2 = _fmix32(item.hashCode ^ 0x9e3779b9) | 1;
    for (var i = 0; i < k; i++) {
      yield (h1 + i * h2) % m;
    }
  }

  void add(Object item) {
    for (final b in _indexes(item)) {
      _bits[b >> 3] |= 1 << (b & 7);
    }
  }

  bool mightContain(Object item) {
    for (final b in _indexes(item)) {
      if ((_bits[b >> 3] & (1 << (b & 7))) == 0) return false;
    }
    return true;
  }
}
```

### 9.2 Otras estructuras probabilísticas

- **Count-Min Sketch:** matriz de d filas por w columnas de contadores; cada actualización incrementa una celda por fila (una hash por fila); la estimación es el *mínimo* de las d celdas. Solo sobreestima: con w = ⌈e/ε⌉ y d = ⌈ln(1/δ)⌉ el error es ≤ ε·N con probabilidad ≥ 1 − δ. Se usa para frecuencias y *heavy hitters* en flujos.
- **HyperLogLog:** estima la cardinalidad de un multiconjunto con m registros pequeños; el error relativo estándar es ≈ 1.04/√m. Con m = 2¹⁴ (≈ 12 KB) el error es ≈ 0.8 %. Redis `PFCOUNT` y BigQuery `APPROX_COUNT_DISTINCT` lo usan; se pueden fusionar sketches con un máximo por registro.
- **MinHash y LSH:** estiman similitud de Jaccard y permiten búsqueda aproximada de vecinos.

### 9.3 Hashing consistente

**Problema:** repartir claves entre N nodos con `hash(clave) mod N` reasigna casi todas las claves al cambiar N. **Solución:** mapear nodos y claves a un anillo de 2³² posiciones; cada clave pertenece al primer nodo que se encuentra en sentido horario. Al añadir o quitar un nodo solo se mueven ≈ K/N claves. Con pocos nodos el reparto es desigual, por lo que cada nodo físico se coloca en el anillo varias veces (100–500 **nodos virtuales**). Implementación: arreglo ordenado de puntos del anillo con búsqueda binaria, O(log(V·N)) por consulta.

Variantes: **rendezvous hashing (HRW):** para cada nodo calcula hash(clave, nodo) y elige el máximo (O(N), sin estado); **jump consistent hash** (Google): O(ln N) sin memoria, pero los nodos son buckets numerados; **Maglev** (balanceador de Google). Usos: Dynamo, Cassandra, clientes de memcached, CDNs, balanceadores de carga.

### 9.4 Caché LRU (hash + lista doble)

Un LRU (*least recently used*) con get y put en **O(1)** combina un mapa hash `clave → nodo` con una lista doble ordenada por uso: `get` mueve el nodo al frente; `put` inserta al frente y, si se supera la capacidad, expulsa el último. En Dart, un `LinkedHashMap` ya contiene ambas estructuras:

```dart
class LruCache<K, V> {
  final int capacity;
  final Map<K, V> _map = <K, V>{}; // LinkedHashMap: orden de inserción
  LruCache(this.capacity);

  V? get(K key) {
    if (!_map.containsKey(key)) return null;
    final v = _map.remove(key) as V; // lo saca...
    _map[key] = v;                   // ...y lo reinserta como el más reciente
    return v;
  }

  void put(K key, V value) {
    _map.remove(key);
    _map[key] = value;
    if (_map.length > capacity) {
      _map.remove(_map.keys.first); // expulsa el menos reciente
    }
  }
}
```

(La versión con `DoublyLinkedList` de la sección 3 es el equivalente explícito, útil en lenguajes cuyo mapa no conserva el orden.)

**Otras políticas:** LFU (frecuencia), FIFO, **CLOCK** (aproximación de LRU con un anillo y un bit de referencia; se usa en reemplazo de páginas del SO), 2Q, ARC, y **W-TinyLFU** (Caffeine) que combina un sketch de frecuencias con LRU. LRU sufre *scan pollution*: un recorrido secuencial grande desaloja el conjunto caliente. En concurrencia, un LRU exacto exige un lock global sobre la lista; se mitiga con particionado (*sharding*), registro de accesos en buffers o LRU aproximado por muestreo (Redis).

---

## 10. Árboles de búsqueda

### 10.1 Fundamentos de árboles

**Definición matemática:** un árbol es un grafo no dirigido, conexo y acíclico. Con n nodos tiene exactamente n−1 aristas y existe un único camino entre cualquier par de nodos. Un **árbol enraizado** admite la definición recursiva T = ∅ | (v, T₁, …, T\_k). Un árbol **binario** restringe k ≤ 2. El número de formas de árboles binarios con n nodos es el número de Catalan Cₙ = (2n)!/((n+1)!·n!).

**Terminología:** profundidad de un nodo (aristas desde la raíz), altura h del árbol (profundidad máxima), grado (número de hijos), hoja (sin hijos). Un árbol binario perfecto de altura h tiene 2^(h+1) − 1 nodos; la altura mínima con n nodos es ⌊log₂ n⌋ y la máxima n − 1 (una lista).

**Recorridos (O(n)):** preorden, inorden y postorden (DFS, recursivos o con pila explícita) y por niveles (BFS con cola). El recorrido de **Morris** hace inorden en O(1) de espacio extra modificando temporalmente punteros (*threading*). El inorden de un BST produce las claves en orden ascendente.

**Representaciones:** nodos con punteros (general); arreglo con índices (para árboles completos, como el heap); *first-child / next-sibling* para árboles n-arios; arreglos paralelos con índices enteros (sin presión sobre el GC).

**Por qué importa la altura:** casi toda operación de un árbol de búsqueda cuesta O(h). El objetivo de AVL, rojinegros, B-trees, treaps, etc. es acotar h.

### 10.2 Árbol binario de búsqueda (BST)

**Invariante:** para todo nodo x, todas las claves del subárbol izquierdo son menores que x.clave y todas las del derecho, mayores (sin duplicados).

- **Búsqueda, inserción y borrado:** O(h). Sin balanceo, h ∈ \[⌊log₂ n⌋, n−1\]. Con inserciones en orden aleatorio, la profundidad esperada de un nodo es ≈ 2 ln n ≈ 1.39 log₂ n y la altura esperada ≈ 4.31 ln n (Devroye). Con entrada ordenada se degenera en lista: O(n) por operación.
- **Borrado, tres casos:** hoja (se quita); un hijo (se reemplaza por su hijo); dos hijos (se copia la clave del *sucesor inorden*, el mínimo del subárbol derecho, y se elimina ese nodo).
- **Consultas de orden:** mínimo, máximo, sucesor, predecesor, `floor`, `ceiling` en O(h); rangos en O(h + k) con k resultados; **rank/select** en O(h) si cada nodo guarda el tamaño de su subárbol (*order-statistic tree*).

```dart
class _BstNode<K extends Comparable<K>> {
  K key;
  _BstNode<K>? left, right;
  _BstNode(this.key);
}

class BinarySearchTree<K extends Comparable<K>> {
  _BstNode<K>? _root;
  int _size = 0;
  int get length => _size;

  bool contains(K key) {
    var n = _root;
    while (n != null) {
      final c = key.compareTo(n.key);
      if (c == 0) return true;
      n = c < 0 ? n.left : n.right;
    }
    return false;
  }

  void insert(K key) => _root = _insert(_root, key);

  _BstNode<K> _insert(_BstNode<K>? n, K key) {
    if (n == null) {
      _size++;
      return _BstNode<K>(key);
    }
    final c = key.compareTo(n.key);
    if (c < 0) {
      n.left = _insert(n.left, key);
    } else if (c > 0) {
      n.right = _insert(n.right, key);
    }
    return n;
  }

  void remove(K key) => _root = _remove(_root, key);

  _BstNode<K>? _remove(_BstNode<K>? n, K key) {
    if (n == null) return null;
    final c = key.compareTo(n.key);
    if (c < 0) {
      n.left = _remove(n.left, key);
    } else if (c > 0) {
      n.right = _remove(n.right, key);
    } else {
      _size--;
      if (n.left == null) return n.right;
      if (n.right == null) return n.left;
      var s = n.right!; // sucesor inorden: mínimo del subárbol derecho
      while (s.left != null) {
        s = s.left!;
      }
      n.key = s.key;
      n.right = _removeMin(n.right!);
    }
    return n;
  }

  _BstNode<K>? _removeMin(_BstNode<K> n) {
    if (n.left == null) return n.right;
    n.left = _removeMin(n.left!);
    return n;
  }

  /// Inorden iterativo con pila explícita: O(n) tiempo, O(h) espacio.
  Iterable<K> get inOrder sync* {
    final st = <_BstNode<K>>[];
    var n = _root;
    while (n != null || st.isNotEmpty) {
      while (n != null) {
        st.add(n);
        n = n.left;
      }
      n = st.removeLast();
      yield n.key;
      n = n.right;
    }
  }
}
```

**Trade-off:** un BST sin balancear solo es aceptable si las claves llegan en orden aleatorio y no hay un adversario. Con entrada ordenada (IDs autoincrementales, timestamps) es el peor caso garantizado.

### 10.3 Árbol AVL

**Invariante:** para todo nodo, |altura(izq) − altura(der)| ≤ 1. Cada nodo guarda su altura (o un factor de balance de 2 bits).

**Cota de altura:** el AVL más desbalanceado de altura h tiene N(h) = N(h−1) + N(h−2) + 1 nodos (árboles de Fibonacci), de donde h ≤ 1.4405·log₂(n+2) − 0.3277. Búsqueda, inserción y borrado son O(log n) en el **peor caso**.

**Rotaciones (O(1)):** cuatro casos según dónde ocurre el desbalance, con h el nodo desbalanceado:

| Caso | Condición | Solución |
| --- | --- | --- |
| LL | h pesado a la izquierda; hijo izquierdo pesado a la izquierda o equilibrado | rotación simple a la derecha |
| LR | h pesado a la izquierda; hijo izquierdo pesado a la derecha | rotación izquierda del hijo, luego derecha de h |
| RR | simétrico a LL | rotación simple a la izquierda |
| RL | simétrico a LR | rotación derecha del hijo, luego izquierda de h |

La **inserción** necesita a lo sumo **una** rotación (simple o doble) para restablecer el invariante. El **borrado** puede requerir hasta O(log n) rotaciones (una por nivel, en el peor caso).

```dart
class _AvlNode<K extends Comparable<K>> {
  K key;
  int height = 1;
  _AvlNode<K>? left, right;
  _AvlNode(this.key);
}

class AvlTree<K extends Comparable<K>> {
  _AvlNode<K>? _root;

  int get height => _h(_root);
  int _h(_AvlNode<K>? n) => n?.height ?? 0;
  int _balance(_AvlNode<K> n) => _h(n.left) - _h(n.right);

  void _update(_AvlNode<K> n) {
    final hl = _h(n.left), hr = _h(n.right);
    n.height = 1 + (hl > hr ? hl : hr);
  }

  _AvlNode<K> _rotateRight(_AvlNode<K> y) {
    final x = y.left!;
    y.left = x.right;
    x.right = y;
    _update(y);
    _update(x);
    return x; // nueva raíz del subárbol
  }

  _AvlNode<K> _rotateLeft(_AvlNode<K> x) {
    final y = x.right!;
    x.right = y.left;
    y.left = x;
    _update(x);
    _update(y);
    return y;
  }

  _AvlNode<K> _rebalance(_AvlNode<K> n) {
    _update(n);
    final b = _balance(n);
    if (b > 1) {
      if (_balance(n.left!) < 0) n.left = _rotateLeft(n.left!); // caso LR
      return _rotateRight(n); // caso LL
    }
    if (b < -1) {
      if (_balance(n.right!) > 0) n.right = _rotateRight(n.right!); // caso RL
      return _rotateLeft(n); // caso RR
    }
    return n;
  }

  void insert(K key) => _root = _insert(_root, key);

  _AvlNode<K> _insert(_AvlNode<K>? n, K key) {
    if (n == null) return _AvlNode<K>(key);
    final c = key.compareTo(n.key);
    if (c < 0) {
      n.left = _insert(n.left, key);
    } else if (c > 0) {
      n.right = _insert(n.right, key);
    } else {
      return n; // sin duplicados
    }
    return _rebalance(n); // restablece el invariante al regresar
  }
}
```

Prueba rápida: insertar 1…1 000 000 en orden en un BST da altura 1 000 000; en este AVL da altura 20 (⌈log₂ 10⁶⌉).

**Trade-offs:** el AVL es el árbol *más estrictamente balanceado* (altura ≤ 1.44 log₂ n frente a ≤ 2 log₂ n del rojinegro), así que las **búsquedas son más rápidas**, pero mantiene más información por nodo y rebalancea más en inserciones y borrados. Es la mejor opción en cargas con mucha lectura y pocas modificaciones. OCaml usa una variante de AVL (diferencia de alturas ≤ 2) en su `Map`.

### 10.4 Árbol rojinegro (red-black)

**Propiedades** (cada nodo tiene un bit de color):

1. Cada nodo es rojo o negro.
2. La raíz es negra.
3. Las hojas *nil* (centinelas) son negras.
4. Un nodo rojo no tiene hijos rojos.
5. Todos los caminos de un nodo a sus hojas descendientes tienen el mismo número de nodos negros (altura negra).

**Consecuencia:** la altura es ≤ 2·log₂(n+1). Las propiedades 4 y 5 hacen que el camino más largo (alternando rojo y negro) sea a lo sumo el doble del más corto (todo negro).

**Equivalencia con árboles 2-3-4:** un nodo negro con 0, 1 o 2 hijos rojos representa un nodo de 2, 3 o 4 hijos de un B-tree de orden 4. Dividir un nodo de 4 equivale a un *recoloreo*; así se entiende por qué las operaciones son tan locales.

**Costos:** O(log n) en peor caso. La inserción necesita ≤ 2 rotaciones; el borrado ≤ 3; los recoloreos son O(log n) en el peor caso pero O(1) amortizados. Menos rotaciones que AVL hace al rojinegro más barato en cargas con **muchas modificaciones**.

**Dónde vive:** `std::map` y `std::set` de C++ (en las implementaciones comunes), `TreeMap`/`TreeSet` de Java, y el `rbtree` del kernel de Linux (timers de alta resolución, epoll, planificador). Dart no lo incluye (su `SplayTreeMap` es otra cosa, ver 10.6).

**Código:** el *left-leaning red-black tree* de Sedgewick (equivalente a un árbol 2-3) reduce la inserción a tres comprobaciones locales. El borrado es considerablemente más largo y se omite aquí.

```dart
class _RbNode<K extends Comparable<K>, V> {
  K key;
  V value;
  bool red = true; // los nodos nuevos son rojos
  _RbNode<K, V>? left, right;
  _RbNode(this.key, this.value);
}

class LeftLeaningRedBlackMap<K extends Comparable<K>, V> {
  _RbNode<K, V>? _root;

  bool _isRed(_RbNode<K, V>? n) => n != null && n.red;

  _RbNode<K, V> _rotateLeft(_RbNode<K, V> h) {
    final x = h.right!;
    h.right = x.left;
    x.left = h;
    x.red = h.red;
    h.red = true;
    return x;
  }

  _RbNode<K, V> _rotateRight(_RbNode<K, V> h) {
    final x = h.left!;
    h.left = x.right;
    x.right = h;
    x.red = h.red;
    h.red = true;
    return x;
  }

  void _flipColors(_RbNode<K, V> h) { // divide un nodo-4 temporal
    h.red = !h.red;
    h.left!.red = !h.left!.red;
    h.right!.red = !h.right!.red;
  }

  void put(K key, V value) {
    _root = _put(_root, key, value);
    _root!.red = false; // propiedad 2: la raíz es negra
  }

  _RbNode<K, V> _put(_RbNode<K, V>? h, K key, V value) {
    if (h == null) return _RbNode<K, V>(key, value);
    final c = key.compareTo(h.key);
    if (c < 0) {
      h.left = _put(h.left, key, value);
    } else if (c > 0) {
      h.right = _put(h.right, key, value);
    } else {
      h.value = value;
    }
    // Restaura el invariante al regresar (tres casos):
    if (_isRed(h.right) && !_isRed(h.left)) h = _rotateLeft(h);
    if (_isRed(h.left) && _isRed(h.left!.left)) h = _rotateRight(h);
    if (_isRed(h.left) && _isRed(h.right)) _flipColors(h);
    return h;
  }

  V? get(K key) {
    var n = _root;
    while (n != null) {
      final c = key.compareTo(n.key);
      if (c == 0) return n.value;
      n = c < 0 ? n.left : n.right;
    }
    return null;
  }
}
```

**AVL vs rojinegro, en una línea:** AVL para leer mucho (árbol más bajo), rojinegro para escribir mucho (menos rotaciones). En RAM y con datos grandes, ambos pierden frente a un B-tree por localidad de caché (siguiente sección).

### 10.5 B-trees y B+ trees

**Motivación:** la unidad de transferencia entre niveles de memoria es el bloque (línea de caché de 64 B, página de disco de 4–16 KB). Un árbol binario desperdicia cada lectura trayendo un nodo de 24 B. Un B-tree hace que **un nodo sea una página** con cientos de claves, de modo que la altura es mínima: con un fan-out de \~500, cuatro niveles direccionan 500⁴ ≈ 6×10¹⁰ claves.

**Definición (CLRS, grado mínimo t ≥ 2):**

- Todas las hojas están a la misma profundidad.
- Todo nodo, salvo la raíz, tiene entre t−1 y 2t−1 claves; la raíz tiene al menos 1.
- Un nodo interno con k claves tiene k+1 hijos, y las claves separan los rangos de los hijos.
- Altura: h ≤ log\_t((n+1)/2).

(Knuth define en cambio el *orden* m como el máximo de hijos; ten presente qué convención usa cada fuente.)

**Operaciones:**

- **Búsqueda:** O(log\_t n) accesos a página; el trabajo de CPU es O(log n) si dentro del nodo se usa búsqueda binaria (O(t·log\_t n) con búsqueda lineal).
- **Inserción:** se desciende hasta la hoja. Si el nodo está lleno (2t−1 claves) se **divide** en dos de t−1 claves y la clave mediana sube al padre; la división puede propagarse hasta la raíz y es la única forma en que el árbol crece en altura. Se puede dividir *preventivamente* en el descenso (un solo pase, versión CLRS, código abajo) o de forma ascendente al desbordar.
- **Borrado:** si el nodo queda con menos de t−1 claves, **pide prestada** una clave a un hermano (rotación a través del padre) o **se fusiona** con él; la fusión puede propagarse y reducir la altura.
- **Ocupación:** ≥ 50 % por construcción; con inserciones aleatorias el promedio es ≈ ln 2 ≈ 69 %.

**B+ tree.** Es la variante que usan casi todos los motores:

- Los nodos internos guardan solo claves-guía; **todos los valores viven en las hojas**.
- Las hojas forman una **lista doblemente enlazada**, así que un *range scan* recorre hojas contiguas sin volver a subir al árbol.
- Al no guardar valores, los nodos internos caben más claves (mayor fan-out, menor altura) y toda búsqueda cuesta lo mismo (llega a una hoja).

**Variantes y técnicas:**

- **B-link tree** (Lehman–Yao): cada nodo tiene un puntero a su hermano derecho, lo que permite divisiones concurrentes con lectores sin bloquear. PostgreSQL basa su `btree` en él.
- **Copy-on-write B-tree** (LMDB, Btrfs): nunca se modifica una página, se copia el camino raíz-hoja; da snapshots y recuperación sin log.
- **Bε-tree / fractal tree:** buffers en los nodos internos que agrupan escrituras y las propagan por lotes, acercándose al rendimiento de escritura de un LSM sin perder lecturas O(log n).
- **Compresión de prefijos y truncado de sufijos** en nodos internos; **bulk loading** (construcción ascendente en O(n) a partir de datos ordenados, sin divisiones).
- **B-tree en memoria:** `absl::btree_map` y el `BTreeMap` de Rust (nodos de hasta 11 claves) superan a los rojinegros en RAM por localidad de caché y menor overhead por clave.

**Dónde vive:** índices de PostgreSQL, MySQL/InnoDB (índice agrupado B+ con páginas de 16 KB), SQLite, Oracle y SQL Server; directorios y *extents* de ext4, XFS, Btrfs, NTFS, APFS; LMDB.

```dart
class _BNode<K extends Comparable<K>> {
  final List<K> keys = [];
  final List<_BNode<K>> children = []; // vacía en una hoja
  bool get isLeaf => children.isEmpty;
}

/// B-tree (CLRS) con grado mínimo t. Permite claves duplicadas;
/// añade un contains() previo si necesitas semántica de conjunto.
class BTree<K extends Comparable<K>> {
  final int t;
  _BNode<K> _root = _BNode<K>();
  BTree({this.t = 3}) : assert(t >= 2);

  // Primer índice i tal que keys[i] >= key (búsqueda binaria dentro del nodo).
  int _lowerBound(List<K> keys, K key) {
    var lo = 0, hi = keys.length;
    while (lo < hi) {
      final mid = (lo + hi) >> 1;
      if (keys[mid].compareTo(key) < 0) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  }

  bool contains(K key) {
    var node = _root;
    while (true) {
      final i = _lowerBound(node.keys, key);
      if (i < node.keys.length && node.keys[i].compareTo(key) == 0) return true;
      if (node.isLeaf) return false;
      node = node.children[i];
    }
  }

  void insert(K key) {
    if (_root.keys.length == 2 * t - 1) {
      final s = _BNode<K>()..children.add(_root); // la raíz llena crece en altura
      _splitChild(s, 0);
      _root = s;
    }
    _insertNonFull(_root, key);
  }

  // Divide el hijo lleno parent.children[i]; la mediana sube a parent.
  void _splitChild(_BNode<K> parent, int i) {
    final y = parent.children[i];
    final z = _BNode<K>();
    final median = y.keys[t - 1];
    z.keys.addAll(y.keys.sublist(t));
    if (!y.isLeaf) {
      z.children.addAll(y.children.sublist(t));
      y.children.removeRange(t, y.children.length);
    }
    y.keys.removeRange(t - 1, y.keys.length);
    parent.keys.insert(i, median);
    parent.children.insert(i + 1, z);
  }

  void _insertNonFull(_BNode<K> node, K key) {
    var i = _lowerBound(node.keys, key);
    if (node.isLeaf) {
      node.keys.insert(i, key);
      return;
    }
    if (node.children[i].keys.length == 2 * t - 1) {
      _splitChild(node, i); // división preventiva en el descenso
      if (key.compareTo(node.keys[i]) > 0) i++;
    }
    _insertNonFull(node.children[i], key);
  }
}
```

### 10.6 Otros árboles de búsqueda

- **Splay tree** (Sleator–Tarjan): sin información de balance; cada acceso *splayea* el nodo a la raíz con rotaciones zig, zig-zig y zig-zag. Costo **amortizado** O(log n) por operación (una operación aislada puede costar O(n)). Se adapta al patrón de acceso: los elementos recientes y frecuentes quedan cerca de la raíz (*working-set property*). Contras: las lecturas **mutan** el árbol (no seguro para lectores concurrentes, peor para la caché). Es lo que usan `SplayTreeMap` y `SplayTreeSet` de Dart.
- **Treap** (Aragon–Seidel): un BST por clave y un heap por prioridad aleatoria asignada al insertar. La forma del árbol es la de un BST insertado en orden de prioridad, por lo que la altura es O(log n) *esperada*. Muy simple; `split` y `merge` en O(log n) lo hacen ideal para operaciones por rangos y para **secuencias implícitas** (editores, ropes).
- **Skip list** (Pugh): una lista ordenada con niveles; cada elemento sube al nivel siguiente con probabilidad p (1/2 o 1/4). Búsqueda, inserción y borrado O(log n) esperado; espacio esperado O(n) (≈ 1/(1−p) punteros por elemento). No necesita rotaciones, y por eso la versión **concurrente lock-free** es mucho más simple que la de un árbol balanceado (`ConcurrentSkipListMap` de Java). Se usa en las *memtables* de LevelDB/RocksDB y en los conjuntos ordenados de Redis (skip list + hash).
- **Árboles aumentados** (CLRS cap. 14): añadir un campo a cada nodo, mantenido por las rotaciones, habilita nuevas consultas. Tamaño del subárbol → *order-statistic tree* (rank y select en O(log n)); máximo del extremo superior → *interval tree*.
- **Weight-balanced trees** (`Data.Map` de Haskell, `Map` de Scala): balancean por tamaño de subárbol; **scapegoat tree**: sin metadatos por nodo, reconstruye un subárbol cuando una inserción lo desbalancea (amortizado); **AA tree**: rojinegro simplificado; **2-3 tree**: B-tree de orden 3.

### 10.7 Comparativa y guía de elección

| Estructura | Búsqueda | Inserción | Borrado | Altura / garantía | Mejor para |
| --- | --- | --- | --- | --- | --- |
| BST sin balancear | O(h) | O(h) | O(h) | hasta n−1 | claves aleatorias, simplicidad |
| AVL | O(log n) | O(log n) | O(log n) | ≤ 1.44 log₂ n, peor caso | lecturas |
| Rojinegro | O(log n) | O(log n) | O(log n) | ≤ 2 log₂ n, peor caso | escrituras mixtas |
| Splay | O(log n) amort. | O(log n) amort. | O(log n) amort. | sin garantía por operación | acceso con localidad temporal |
| Treap | O(log n) esp. | O(log n) esp. | O(log n) esp. | esperada | split/merge, secuencias |
| Skip list | O(log n) esp. | O(log n) esp. | O(log n) esp. | esperada | concurrencia, LSM |
| B-tree | O(log\_t n) E/S | O(log\_t n) | O(log\_t n) | log\_t n, peor caso | disco y RAM grande |
| B+ tree | O(log\_t n) | O(log\_t n) | O(log\_t n) | log\_t n; hojas enlazadas | rangos en disco |

**Guía:**

- **Mapa ordenado en RAM, uso general:** B-tree en memoria si existe en tu ecosistema (mejor caché); si no, rojinegro (o el que ofrezca la librería estándar).
- **Muchas lecturas y pocos cambios:** AVL, o un arreglo ordenado con búsqueda binaria si los datos son casi estáticos.
- **En disco / bases de datos:** B+ tree para lecturas y rangos; **LSM tree** (sección 12) cuando dominan las escrituras.
- **Concurrencia:** skip list, B-link tree, o árboles persistentes con copia de caminos (sección 14).
- **Dart:** `SplayTreeMap` no ofrece O(log n) en peor caso por operación; si necesitas esa garantía, usa un paquete con árboles balanceados (por ejemplo, `quiver` incluye un `AvlTreeSet`) o implementa uno propio. El "mapa ordenado" sobre `List` con `binarySearch` (en `package:collection`) es una opción real cuando hay pocas escrituras.

---

## 11. Tries y estructuras para cadenas

### 11.1 Definición

**Matemática:** un **trie** (árbol de prefijos; Fredkin, 1960) es un árbol enraizado donde cada arista está etiquetada con un símbolo de un alfabeto Σ y cada nodo corresponde a un prefijo de alguna cadena de un conjunto S ⊆ Σ\*. La ruta de la raíz a un nodo deletrea ese prefijo; un indicador marca los nodos que son palabras completas.

**Complejidad:** insertar, buscar, borrar y consultar un prefijo cuestan **O(L)**, con L la longitud de la clave y **sin depender de n**, el número de claves (con acceso O(1) al hijo). Espacio: en el peor caso O(Σ|s|) nodos (sin prefijos compartidos), multiplicado por |Σ| si cada nodo guarda un arreglo de hijos.

### 11.2 Representaciones del nodo

- **Arreglo de |Σ| punteros** (26, 256…): acceso O(1), pero cada nodo paga |Σ| punteros aunque tenga un hijo.
- **Mapa hash por nodo** (`Map<int, Node>`): flexible y adecuado para Unicode, con overhead por nodo.
- **Arreglo ordenado + búsqueda binaria**, o **bitmap + arreglo compacto** con *popcount* (la misma idea de los HAMT de la sección 14): compactos y amigables con la caché.
- **Árbol ternario de búsqueda** (Bentley–Sedgewick): cada nodo guarda un carácter y tres hijos (menor, igual, mayor). Búsqueda en O(L + log n), con muchísimo menos espacio que un trie con arreglos; un buen compromiso.
- **Unicode:** decide la unidad del trie (bytes UTF-8, unidades UTF-16, puntos de código o grafemas). Partir un `String` de Dart con `split('')` rompe los pares sustitutos; usa `runes` o `package:characters`.

### 11.3 Variantes

- **Radix tree / Patricia / trie comprimido:** colapsa las cadenas de nodos con un solo hijo en aristas etiquetadas con *cadenas*; tiene a lo sumo 2n−1 nodos para n claves. Es la estructura detrás de la **búsqueda del prefijo más largo** en tablas de enrutamiento IP, de `radix tree`/`xarray` del kernel de Linux, de `rax` en Redis, de los routers HTTP de Go (`httprouter`, `gin`) y del *Merkle Patricia Trie* de Ethereum.
- **DAWG / DAFSA:** un trie minimizado que también comparte *sufijos* (es un autómata finito determinista acíclico). Almacena diccionarios de cientos de miles de palabras en pocos cientos de KB (Scrabble, correctores).
- **Double-array trie, HAT-trie, burst trie:** representaciones compactas y amigables con la caché para diccionarios grandes.
- **Aho–Corasick:** un trie de patrones con *enlaces de fallo*; busca todos los patrones a la vez en O(|texto| + |patrones| + coincidencias). Lo usan `grep -F`, antivirus y sistemas de detección de intrusiones.
- **Árbol y arreglo de sufijos:** el árbol de sufijos (Ukkonen, O(n) de construcción) permite buscar un patrón de longitud m en O(m); el arreglo de sufijos (construcción SA-IS en O(n)) usa mucha menos memoria; el **FM-index** (transformada de Burrows–Wheeler) alimenta los alineadores de secuencias genómicas.
- **Trie binario (de bits):** claves como cadenas de bits; resuelve problemas como *máximo XOR de dos elementos* en O(n·w).

```dart
class _TrieNode {
  final Map<int, _TrieNode> children = {}; // clave: punto de código Unicode
  bool isWord = false;
}

class Trie {
  final _TrieNode _root = _TrieNode();

  void insert(String word) {
    var node = _root;
    for (final r in word.runes) {
      node = node.children.putIfAbsent(r, _TrieNode.new); // O(L) en total
    }
    node.isWord = true;
  }

  _TrieNode? _find(String prefix) {
    var node = _root;
    for (final r in prefix.runes) {
      final next = node.children[r];
      if (next == null) return null;
      node = next;
    }
    return node;
  }

  bool contains(String word) => _find(word)?.isWord ?? false;
  bool startsWith(String prefix) => _find(prefix) != null;

  /// Autocompletado: palabras con el prefijo dado. O(L + nodos visitados).
  List<String> withPrefix(String prefix, {int limit = 10}) {
    final start = _find(prefix);
    if (start == null) return const [];
    final out = <String>[];
    void dfs(_TrieNode n, List<int> path) {
      if (out.length >= limit) return;
      if (n.isWord) out.add(String.fromCharCodes(path));
      for (final e in n.children.entries) {
        path.add(e.key);
        dfs(e.value, path);
        path.removeLast();
      }
    }
    dfs(start, prefix.runes.toList());
    return out;
  }
}
```

Borrar una palabra consiste en quitar la marca `isWord` y, al volver, podar los nodos que se quedan sin hijos ni marca.

### 11.4 Casos de uso y trade-offs

Autocompletado (guardar en cada nodo las k completaciones más frecuentes para responder en O(L)), correctores ortográficos, teclados T9, enrutamiento IP y HTTP, árbol de dominios DNS, filtrado de URLs, tokenizadores (el vocabulario BPE se busca con tries) y bases de datos de palabras reservadas.

**Trie vs tabla hash:** el hash gana en búsqueda exacta con pocas claves; el trie gana cuando necesitas **prefijos**, orden lexicográfico, *longest-prefix match* o cuando las claves comparten mucho prefijo (menos memoria total). Un trie ingenuo con arreglos de 256 punteros es un devorador de memoria: comprime (radix) o usa nodos compactos.

---

## 12. Estructuras especializadas

### 12.1 Segment tree

Árbol binario sobre un arreglo que guarda en cada nodo el resultado de una operación **asociativa** (suma, mínimo, máximo, mcd) sobre un rango. Construcción O(n); actualización puntual y consulta de rango O(log n); espacio O(n) (2n en la versión iterativa, \~4n en la recursiva). Con **propagación perezosa** (*lazy propagation*) soporta actualizaciones de rango en O(log n).

```dart
class SegmentTree {
  final int n;
  final List<int> _t;

  SegmentTree(List<int> a)
      : n = a.length,
        _t = List<int>.filled(2 * a.length, 0) {
    for (var i = 0; i < n; i++) {
      _t[n + i] = a[i]; // hojas
    }
    for (var i = n - 1; i > 0; i--) {
      _t[i] = _t[2 * i] + _t[2 * i + 1];
    }
  }

  void update(int i, int v) {
    i += n;
    _t[i] = v;
    for (i >>= 1; i >= 1; i >>= 1) {
      _t[i] = _t[2 * i] + _t[2 * i + 1];
    }
  }

  /// Suma en el intervalo semiabierto [l, r).
  int query(int l, int r) {
    var res = 0;
    for (l += n, r += n; l < r; l >>= 1, r >>= 1) {
      if ((l & 1) == 1) res += _t[l++];
      if ((r & 1) == 1) res += _t[--r];
    }
    return res;
  }
}
```

### 12.2 Fenwick tree (Binary Indexed Tree)

Un arreglo de n+1 enteros donde la celda i guarda la suma de un rango cuya longitud es el bit menos significativo de i (`i & -i`). `add` y `prefixSum` cuestan O(log n); espacio exactamente n; constantes minúsculas. Solo sirve para operaciones **invertibles** (suma, XOR), porque la consulta de rango resta dos prefijos. Es la elección habitual para conteo de inversiones y frecuencias acumuladas.

```dart
class FenwickTree {
  final List<int> _bit;
  FenwickTree(int n) : _bit = List<int>.filled(n + 1, 0);

  void add(int i, int delta) { // i en [0, n)
    for (i++; i < _bit.length; i += i & -i) {
      _bit[i] += delta;
    }
  }

  int prefixSum(int i) { // suma de [0, i]
    var s = 0;
    for (i++; i > 0; i -= i & -i) {
      s += _bit[i];
    }
    return s;
  }

  int rangeSum(int l, int r) => prefixSum(r) - (l > 0 ? prefixSum(l - 1) : 0);
}
```

### 12.3 Sparse table

Para consultas de rango sobre datos **estáticos** con operaciones idempotentes (mínimo, máximo, mcd): se precalculan los resultados de todos los intervalos de longitud 2^j. Construcción y espacio O(n log n); consulta **O(1)** combinando dos intervalos solapados. Si los datos cambian, usa un segment tree.

### 12.4 Union-Find (conjuntos disjuntos, DSU)

Un bosque donde cada elemento apunta a su padre; la raíz identifica el conjunto. `find` con **compresión de caminos** y `union` **por tamaño o rango** dan un costo amortizado de O(α(n)) por operación, con α la inversa de Ackermann (menor que 5 para cualquier n físicamente concebible; Tarjan, 1975). Usos: algoritmo de Kruskal, componentes conexas, detección de ciclos en grafos no dirigidos, percolación, segmentación de imágenes, unificación de tipos en compiladores.

```dart
class UnionFind {
  final List<int> _parent, _size;
  int components;

  UnionFind(int n)
      : _parent = List<int>.generate(n, (i) => i),
        _size = List<int>.filled(n, 1),
        components = n;

  int find(int x) {
    while (_parent[x] != x) {
      _parent[x] = _parent[_parent[x]]; // path halving
      x = _parent[x];
    }
    return x;
  }

  bool union(int a, int b) {
    var ra = find(a), rb = find(b);
    if (ra == rb) return false;
    if (_size[ra] < _size[rb]) {
      final t = ra;
      ra = rb;
      rb = t;
    }
    _parent[rb] = ra; // el árbol pequeño cuelga del grande
    _size[ra] += _size[rb];
    components--;
    return true;
  }
}
```

### 12.5 Estructuras espaciales

- **Interval tree:** un BST aumentado con el máximo extremo superior del subárbol; encuentra los k intervalos que intersectan un punto o intervalo en O(log n + k).
- **k-d tree:** BST multidimensional que alterna el eje de partición por nivel. Construcción O(n log n); vecino más cercano O(log n) en promedio en pocas dimensiones, pero **degrada hacia O(n)** en dimensión alta (la *maldición de la dimensionalidad*, notable por encima de \~10–20 dimensiones).
- **R-tree** (Guttman, 1984): un B-tree de rectángulos mínimos envolventes (MBR) para objetos espaciales; consultas por ventana y vecinos en O(log n) típico, sin garantía de peor caso. Es la base de los índices GiST de PostGIS y del módulo R\*Tree de SQLite. Carga masiva con ordenamiento STR o curva de Hilbert.
- **Quadtree / octree:** subdivisión recursiva del plano en 4 (o del espacio en 8) celdas; detección de colisiones en juegos, niveles de detalle, compresión de imágenes. **BVH:** jerarquía de volúmenes envolventes, base del *ray tracing*. **Geohash, S2 y H3:** indexan el planeta con curvas de llenado de espacio, convirtiendo búsquedas espaciales en búsquedas de prefijo.
- **HNSW** (*Hierarchical Navigable Small World*): un grafo por capas para vecinos aproximados en dimensiones altas; es el índice más usado en bases de datos vectoriales y búsqueda por embeddings (`pgvector`, FAISS, Qdrant, etc.).

### 12.6 Estructuras para edición de texto

- **Gap buffer:** arreglo con un hueco en el cursor (Emacs). Inserción local O(1); mover el cursor lejos cuesta O(distancia).
- **Rope:** árbol balanceado cuyas hojas son fragmentos de texto; concatenar, dividir e indexar cuestan O(log n). Útil con textos enormes y ediciones frecuentes (editores como Zed usan una variante, el *sum tree*).
- **Piece table:** guarda el texto original y un buffer de adiciones como *piezas* enlazadas; el *undo* es barato porque nada se sobreescribe. VS Code usa un árbol rojinegro de piezas.
- **CRDTs de texto** (RGA, Yjs, Automerge): estructuras replicadas que convergen sin coordinación; base de la edición colaborativa.

### 12.7 Árbol de Merkle

Un árbol en el que cada hoja es el hash de un bloque de datos y cada nodo interno es el hash de la concatenación de sus hijos. La raíz resume todo el conjunto; probar que un bloque pertenece requiere O(log n) hashes. Usos: Git (DAG de Merkle), Bitcoin y Ethereum, reparación anti-entropía en Cassandra y Dynamo, *Certificate Transparency*, IPFS, checksums de ZFS y Btrfs.

### 12.8 LSM-tree (Log-Structured Merge-tree)

**Idea (O'Neil et al., 1996):** convertir las escrituras aleatorias en secuenciales. Las escrituras van a un log (WAL) y a una **memtable** ordenada en RAM (típicamente una skip list); al llenarse se vuelca a disco como una **SSTable** inmutable y ordenada. Un proceso de **compactación** en segundo plano fusiona SSTables (*leveled* o *size-tiered*) descartando versiones antiguas y lápidas. Una lectura consulta la memtable y luego los niveles, ayudándose de **filtros de Bloom** e índices por bloque para saltarse archivos.

**Trade-off (RUM conjecture):** no se pueden minimizar a la vez la amplificación de lectura, de escritura y de espacio. Un LSM favorece escrituras y compresión a costa de lecturas más lentas y picos de compactación; un B+ tree actualiza en el sitio (lecturas rápidas y predecibles, escrituras aleatorias más caras). LSM: LevelDB, RocksDB, Cassandra, HBase, ScyllaDB. B+: PostgreSQL, MySQL/InnoDB, SQLite.

### 12.9 Más estructuras que conviene conocer

- **van Emde Boas tree:** conjunto dinámico de enteros en un universo U con operaciones (incluido sucesor) en O(log log U), a costa de O(U) de espacio; las variantes *x-fast* e *y-fast tries* usan hashing para bajar el espacio a O(n).
- **Árbol cartesiano:** derivado de un arreglo; el mínimo de un rango es el ancestro común más bajo de sus extremos (relación RMQ ↔ LCA).
- **Estructuras sucintas** (bitvectors con *rank/select*, Elias–Fano, wavelet trees): representan datos en espacio cercano a su cota teórica soportando consultas directas; base de índices de texto compactos y de listas de posteo comprimidas.
- **Colas de cubetas y timer wheels:** para eventos con tiempos enteros acotados, O(1) por operación (los timers del kernel de Linux usan una jerarquía de ruedas).

---

## 13. Grafos

### 13.1 Definición

**Matemática:** un grafo es un par G = (V, E) con V un conjunto finito de vértices.

- **No dirigido:** E es un conjunto de pares no ordenados {u, v}. **Dirigido (dígrafo):** E ⊆ V × V, con pares ordenados (u, v).
- **Ponderado:** una función w: E → ℝ. **Multigrafo:** admite aristas paralelas; también pueden existir bucles (u, u).
- **Grado:** número de aristas incidentes (en dígrafos, grado de entrada y de salida). Lema del apretón de manos: Σ deg(v) = 2|E|.
- **Camino, ciclo, conexo**; **componentes conexas**; **componentes fuertemente conexas (SCC)** en dígrafos; **DAG** (dígrafo acíclico); **bipartito** (V se parte en dos conjuntos sin aristas internas). Un árbol es un grafo conexo y acíclico.
- **Densidad:** un grafo completo tiene |E| = |V|(|V|−1)/2 aristas (no dirigido). Se llama **disperso** si |E| = O(|V|) y **denso** si |E| = Θ(|V|²). La mayoría de los grafos reales (redes sociales, web, carreteras) son dispersos.

**Álgebra:** la **matriz de adyacencia** A ∈ {0,1}^(V×V) (o con pesos) es simétrica si el grafo es no dirigido, y la entrada (i, j) de A^k cuenta los caminos de longitud k de i a j. Notación en lo que sigue: V = |V| y E = |E|.

### 13.2 Representaciones

| Representación | Espacio | ¿Existe (u,v)? | Vecinos de u | Añadir arista | Quitar arista |
| --- | --- | --- | --- | --- | --- |
| Matriz de adyacencia | Θ(V²) | O(1) | O(V) | O(1) | O(1) |
| Lista de adyacencia (arreglos) | Θ(V + E) | O(deg u) | O(deg u) | O(1) | O(deg u) |
| Lista de adyacencia con hash sets | Θ(V + E) | O(1) esperado | O(deg u) | O(1) | O(1) |
| Lista de aristas (COO) | Θ(E) | O(E) | O(E) | O(1) | O(E) |
| CSR (Compressed Sparse Row) | Θ(V + E) | O(log deg u) si está ordenado | O(deg u), contiguo | reconstruir: O(V + E) | reconstruir |

- **Matriz de adyacencia:** gana en grafos densos y pequeños y en algoritmos de matrices (Floyd–Warshall, clausura transitiva). Es inviable para grafos dispersos grandes: 10⁵ vértices ocupan 10¹⁰ celdas (1.25 GB incluso como bitmap). En Dart, usa un `Int32List(V * V)` plano (row-major) en lugar de `List<List<int>>`.
- **Lista de adyacencia:** la opción por defecto. En un grafo no dirigido cada arista se almacena dos veces. Con IDs de vértice dispersos o no enteros, `Map<V, List<Edge>>`.
- **CSR:** dos arreglos tipados: `offsets[V+1]` y `targets[E]` (más `weights[E]` si hay pesos). Los vecinos de u son `targets[offsets[u] .. offsets[u+1])`: contiguos en memoria, con una sola alocación y sin punteros. Es inmutable (modificar implica reconstruir) pero muy compacto y amigable con la caché; es el formato de los motores de grafos grandes y de librerías de aprendizaje sobre grafos. Se construye en O(V + E) con un conteo y una suma de prefijos.
- **Grafos implícitos:** en un tablero o en un espacio de estados de un puzzle, los vecinos se *calculan* en vez de almacenarse; BFS, DFS y A\* funcionan sin materializar el grafo.
- **Bases de datos de grafos:** Neo4j usa *index-free adjacency* (cada nodo apunta directamente a sus relaciones); en SQL, una tabla de aristas con índices y consultas recursivas (`WITH RECURSIVE`).

### 13.3 Algoritmos fundamentales y complejidad

| Algoritmo | Resuelve | Complejidad | Estructura clave |
| --- | --- | --- | --- |
| BFS | alcanzabilidad; caminos mínimos sin pesos | O(V + E) | cola |
| DFS | componentes, ciclos, puntos de articulación | O(V + E) | pila / recursión |
| Orden topológico (Kahn o DFS) | ordenar un DAG | O(V + E) | cola de grado de entrada |
| Tarjan / Kosaraju | componentes fuertemente conexas | O(V + E) | pila |
| Dijkstra | caminos mínimos, pesos ≥ 0 | O((V + E) log V) con heap binario; O(V²) con arreglo; O(E + V log V) con Fibonacci | cola de prioridad |
| Bellman–Ford | pesos negativos; detecta ciclos negativos | O(V·E) | relajación repetida |
| Floyd–Warshall | todos los pares | O(V³) tiempo, O(V²) espacio | matriz |
| Kruskal | árbol de expansión mínima | O(E log E) | union-find |
| Prim | árbol de expansión mínima | O(E log V) con heap | cola de prioridad |
| A\* | camino mínimo con heurística admisible | depende de la heurística | cola de prioridad |
| Dinic | flujo máximo | O(V²·E) | BFS + DFS por niveles |
| Hopcroft–Karp | emparejamiento máximo bipartito | O(E·√V) | BFS + DFS |

**Código** (usa el `MinHeap` de la sección 6; requiere Dart 3 por los *records* y la desestructuración):

```dart
import 'dart:collection';
import 'dart:typed_data';

class Edge {
  final int to, weight;
  const Edge(this.to, this.weight);
}

class Graph {
  final int n;
  final bool directed;
  final List<List<Edge>> _adj;

  Graph(this.n, {this.directed = false})
      : _adj = List.generate(n, (_) => <Edge>[]);

  void addEdge(int u, int v, [int w = 1]) {
    _adj[u].add(Edge(v, w));
    if (!directed) _adj[v].add(Edge(u, w));
  }

  /// BFS: distancia en aristas desde src (-1 si es inalcanzable). O(V + E).
  List<int> bfs(int src) {
    final dist = List<int>.filled(n, -1);
    final q = ListQueue<int>()..add(src);
    dist[src] = 0;
    while (q.isNotEmpty) {
      final u = q.removeFirst();
      for (final e in _adj[u]) {
        if (dist[e.to] == -1) {
          dist[e.to] = dist[u] + 1;
          q.add(e.to);
        }
      }
    }
    return dist;
  }

  /// Dijkstra con heap binario y eliminación perezosa. O((V + E) log V).
  /// Requiere pesos >= 0.
  List<int> dijkstra(int src) {
    const inf = 1 << 30; // mayor que cualquier distancia posible
    final dist = List<int>.filled(n, inf);
    dist[src] = 0;
    final pq = MinHeap<(int, int)>((a, b) => a.$1.compareTo(b.$1)); // (dist, vértice)
    pq.push((0, src));
    while (pq.isNotEmpty) {
      final (d, u) = pq.pop();
      if (d > dist[u]) continue; // entrada obsoleta
      for (final e in _adj[u]) {
        final nd = d + e.weight;
        if (nd < dist[e.to]) {
          dist[e.to] = nd;
          pq.push((nd, e.to));
        }
      }
    }
    return dist;
  }

  /// Orden topológico (Kahn). Devuelve null si hay un ciclo. O(V + E).
  List<int>? topologicalSort() {
    final indeg = List<int>.filled(n, 0);
    for (var u = 0; u < n; u++) {
      for (final e in _adj[u]) {
        indeg[e.to]++;
      }
    }
    final q = ListQueue<int>();
    for (var u = 0; u < n; u++) {
      if (indeg[u] == 0) q.add(u);
    }
    final order = <int>[];
    while (q.isNotEmpty) {
      final u = q.removeFirst();
      order.add(u);
      for (final e in _adj[u]) {
        if (--indeg[e.to] == 0) q.add(e.to);
      }
    }
    return order.length == n ? order : null;
  }
}

/// Grafo inmutable en formato CSR: dos arreglos tipados, vecinos contiguos.
class CsrGraph {
  final Int32List offsets; // tamaño n + 1
  final Int32List targets; // tamaño m
  CsrGraph._(this.offsets, this.targets);

  factory CsrGraph.fromEdges(int n, List<(int, int)> edges) {
    final offsets = Int32List(n + 1);
    for (final (u, _) in edges) {
      offsets[u + 1]++;
    }
    for (var i = 0; i < n; i++) {
      offsets[i + 1] += offsets[i]; // suma de prefijos
    }
    final cursor = Int32List.fromList(offsets);
    final targets = Int32List(edges.length);
    for (final (u, v) in edges) {
      targets[cursor[u]++] = v;
    }
    return CsrGraph._(offsets, targets);
  }

  /// Vista sin copia de los vecinos de u.
  Int32List neighbors(int u) =>
      Int32List.sublistView(targets, offsets[u], offsets[u + 1]);
}
```

### 13.4 Casos de uso reales

- **Redes y rutas:** redes sociales, recomendación, mapas (los motores de rutas usan *contraction hierarchies* o ALT sobre Dijkstra bidireccional, no Dijkstra puro).
- **Dependencias:** grafos de paquetes y builds (npm, Gradle, Bazel, make) resueltos con orden topológico; orquestadores de tareas (DAGs de Airflow); detección de ciclos de dependencias.
- **Compiladores y sistemas:** grafo de flujo de control, dominadores, coloración de grafos para asignación de registros; detección de *deadlocks* como ciclos en el grafo de espera.
- **Aprendizaje automático:** el grafo computacional de una red neuronal es un DAG y la retropropagación recorre su orden topológico inverso; los grafos de conocimiento; los índices vectoriales HNSW son grafos.
- **Control de versiones:** el historial de Git es un DAG de commits.

### 13.5 Trade-offs

- **Densidad primero:** disperso → lista o CSR; denso o V pequeño (< \~2000) → matriz. Con E ≈ V², Dijkstra con arreglo O(V²) vence al heap O(E log V).
- **Mutable vs inmutable:** si el grafo cambia sin parar, listas con arreglos o hash sets; si se construye una vez y se consulta mucho, CSR (menor memoria, mejor caché, vecinos contiguos).
- **Costo de la lista de listas en Dart:** cada `List<Edge>` es un objeto y cada `Edge` otro; con millones de aristas el overhead de objetos y del GC domina. Arreglos tipados (CSR) pueden usar \~10× menos memoria.
- **Dijkstra:** con pesos enteros pequeños, una cola de cubetas (Dial) es O(V + E + C); con un destino conocido, A\* o Dijkstra bidireccional reducen el espacio explorado; con pesos negativos, Bellman–Ford o Johnson.
- **Elección del heap:** Fibonacci es óptimo en teoría pero en la práctica un heap binario o 4-ario con eliminación perezosa suele ganar.

---

## 14. Estructuras persistentes

### 14.1 Definición y niveles

Una estructura **efímera** (la mutable de siempre) destruye su versión anterior al actualizarse. Una estructura **persistente** conserva todas las versiones: una actualización produce una versión nueva y las anteriores siguen siendo válidas y consultables. Formalmente, la estructura es una familia de valores S₀, S₁, …, donde cada actualización es una función Sᵥ ↦ Sᵥ′ que no altera Sᵥ.

Niveles (Driscoll, Sarnak, Sleator y Tarjan, 1989):

- **Parcialmente persistente:** se puede *consultar* cualquier versión pero solo *actualizar* la más reciente (las versiones forman una lista).
- **Totalmente persistente:** se puede actualizar cualquier versión (las versiones forman un árbol).
- **Confluentemente persistente:** además se pueden *combinar* versiones (las versiones forman un DAG).
- **Funcional (puramente persistente):** inmutable por construcción, sin efectos; es el caso de las listas, mapas y vectores de Haskell, Clojure o Scala.

### 14.2 Técnicas

- **Copia completa:** O(n) de tiempo y espacio por actualización. Es la solución ingenua.
- **Fat node:** cada nodo guarda una lista de (versión, valor); leer cuesta O(log m) por búsqueda binaria sobre m versiones.
- **Copia de caminos (path copying):** en un árbol, una actualización copia únicamente el camino de la raíz al nodo modificado y comparte *todo lo demás* con la versión anterior (**structural sharing**). Con un árbol balanceado son **O(log n) de tiempo y de espacio nuevo por actualización**; se guarda una raíz por versión. Los árboles inmutables permiten compartir con seguridad.
- **Node copying (DSST):** para estructuras de grado acotado, da O(1) de espacio amortizado por cambio.
- **Laziness y memoización:** el análisis amortizado se rompe en estructuras persistentes (un mismo estado "caro" puede reutilizarse muchas veces). Okasaki demuestra cómo la evaluación perezosa con memoización restaura las cotas amortizadas (colas del banquero, colas de tiempo real).

### 14.3 Estructuras persistentes de uso real

- **HAMT** (*Hash Array Mapped Trie*, Bagwell): trie hash de 32 ramas; cada nodo guarda un bitmap de 32 bits y un arreglo compacto de solo los hijos presentes (se indexa con *popcount*). Costo O(log₃₂ n): con 7 niveles direccionas ≈ 3×10¹⁰ claves, por lo que se considera "prácticamente constante". Usado por los mapas y conjuntos de Clojure, Scala, Haskell (`unordered-containers`), Elixir, Immutable.js y la crate `im` de Rust.
- **Vector persistente** (Clojure, Scala): trie de 32 ramas indexado por bits del índice, con un *tail* (buffer) para que `push` sea O(1) amortizado; `get` y `set` O(log₃₂ n). Los **RRB-trees** añaden concatenación y división en O(log n).
- **Finger tree** (Hinze–Paterson): secuencia persistente con acceso a ambos extremos en O(1) amortizado y concatenación y división en O(log n); `Data.Sequence` de Haskell.
- **Árbol rojinegro persistente** (Okasaki): la inserción funcional cabe en pocas líneas con *pattern matching* y mantiene O(log n).
- **Zippers** (Huet): un cursor sobre una estructura inmutable que permite navegar y editar localmente en O(1).
- **Copy-on-write B-trees** (LMDB, Btrfs, ZFS): snapshots y *crash safety* sin log. **MVCC** en bases de datos (PostgreSQL, Datomic): versiones de filas para aislamiento por *snapshot*.
- **Merkle DAG** (Git): los objetos inmutables se direccionan por contenido, y los commits comparten árboles y blobs.
- **Estado de aplicaciones:** Redux/React, Flutter con `freezed`, `bloc` o `equatable`: actualizar produce un objeto nuevo y comparar por **identidad** (`identical`) en O(1) detecta si algo cambió.

### 14.4 Trade-offs

| Aspecto | Mutable (arreglo/lista) | Persistente (trie/árbol) |
| --- | --- | --- |
| Lectura por índice | O(1), contigua | O(log₃₂ n) (\~2–4 saltos en la práctica) |
| Actualización | O(1) en el sitio | O(log n) con copia del camino |
| Memoria | Mínima | Más (punteros, nodos copiados) y más presión sobre el GC |
| Deshacer / versiones | Hay que guardar copias | Gratis (se conserva la raíz anterior) |
| Concurrencia | Requiere locks | Compartir sin locks: la inmutabilidad elimina las carreras |
| Igualdad y diff | O(n) | O(1) por identidad, o recorrido solo de lo que difiere |

**Cuándo usarlas:** deshacer/rehacer, snapshots consistentes para lectores mientras un escritor trabaja, estado compartido entre hilos sin locks, transacciones y *time travel*. **Cuándo no:** bucles numéricos calientes y datos que se mutan masivamente (usa arreglos tipados y mutación local; puedes hacer "mutación local y publicación inmutable", como los *transients* de Clojure).

**En Dart:** `List.unmodifiable` y `List.of` *copian* (O(n)); no son persistentes. Los paquetes `built_collection` y `fast_immutable_collections` ofrecen inmutabilidad y semántica de valor, pero, según sus implementaciones actuales, producen versiones nuevas copiando el contenido; verifica en su documentación si necesitas structural sharing real.

```dart
// Lista persistente: prepend O(1), comparte la cola con la versión anterior.
sealed class PList<T> {
  const PList();
}

class Nil<T> extends PList<T> {
  const Nil();
}

class Cons<T> extends PList<T> {
  final T head;
  final PList<T> tail;
  const Cons(this.head, this.tail);
}

int length<T>(PList<T> xs) {
  var n = 0;
  var p = xs;
  while (p is Cons<T>) {
    n++;
    p = p.tail;
  }
  return n;
}

// Árbol binario de búsqueda persistente por copia de caminos.
class PNode<K extends Comparable<K>> {
  final K key;
  final PNode<K>? left, right;
  const PNode(this.key, [this.left, this.right]);
}

/// Devuelve la nueva raíz; el árbol original no cambia.
/// Copia solo el camino raíz→hoja: O(h) tiempo y O(h) nodos nuevos.
PNode<K> insert<K extends Comparable<K>>(PNode<K>? n, K key) {
  if (n == null) return PNode<K>(key);
  final c = key.compareTo(n.key);
  if (c < 0) return PNode<K>(n.key, insert(n.left, key), n.right);
  if (c > 0) return PNode<K>(n.key, n.left, insert(n.right, key));
  return n; // ya existe: se reutiliza el mismo nodo
}

void main() {
  final v0 = insert<int>(null, 5);
  final v1 = insert(v0, 3);
  final v2 = insert(v1, 8);
  // v1 sigue intacta, y v2 comparte con ella el subárbol izquierdo:
  print(identical(v2.left, v1.left)); // true
}
```

Con un árbol AVL o rojinegro en lugar de un BST simple, la misma técnica da O(log n) garantizado, porque el rebalanceo solo reescribe nodos del camino.

---

## 15. Estructuras concurrentes

### 15.1 Conceptos esenciales

**Corrección.** El criterio estándar es la **linealizabilidad** (Herlihy y Wing, 1990): cada operación parece ocurrir atómicamente en algún instante entre su invocación y su respuesta, respetando el orden en tiempo real. Es más fuerte que la consistencia secuencial. Para transacciones se habla de serializabilidad; en sistemas distribuidos se relaja a consistencia eventual (con CRDTs).

**Garantías de progreso** (de más débil a más fuerte):

- **Con bloqueo:** usa locks; sufre *deadlock*, inversión de prioridad y *lock convoying*.
- **Libre de obstrucción:** un hilo que corre solo termina.
- **Lock-free:** siempre *algún* hilo progresa (un hilo concreto puede sufrir inanición).
- **Wait-free:** *todo* hilo termina en un número acotado de pasos.

**Hardware y memoria:**

- **Atómicos y CAS:** *compare-and-swap* escribe un valor solo si el actual es el esperado; es la base de casi toda estructura lock-free. También existen LL/SC (ARM) y *fetch-and-add*.
- **Modelo de memoria:** los compiladores y CPUs reordenan accesos; las operaciones atómicas con órdenes de memoria (acquire/release/seq-cst) y las barreras restablecen el orden necesario.
- **Coherencia de caché y *false sharing*:** dos variables independientes en la misma línea de caché de 64 B hacen que dos núcleos se invaliden mutuamente; se corrige con *padding* o alineación.
- **Problema ABA:** un hilo lee A, otro cambia A→B→A, y el CAS del primero tiene éxito aunque el estado interno cambió. Soluciones: punteros etiquetados con contador, y recuperación segura de memoria con **hazard pointers**, **reclamación por épocas (EBR)** o **RCU**. Los lenguajes con GC (Go, Java, Dart) evitan el caso clásico porque un nodo no se reutiliza mientras alguien lo referencia.

### 15.2 Catálogo de técnicas

| Técnica | Idea | Ejemplos |
| --- | --- | --- |
| Lock grueso | Un mutex protege toda la estructura | Correcta y simple; escala mal |
| Lock fino | Un lock por nodo, adquiridos *hand-over-hand* | Listas y árboles con lock coupling |
| Optimista / perezosa | Recorrer sin lock, bloquear solo lo que se modifica, validar; borrado lógico antes del físico | Lazy list (Heller et al.), `contains` wait-free |
| Lock-free con CAS | Reintentar un CAS sobre uno o pocos punteros | Pila de Treiber, cola de Michael–Scott, lista de Harris |
| Particionado (*sharding / striping*) | N particiones, cada una con su lock | `ConcurrentHashMap` (Java 8+: CAS más `synchronized` en la cabeza del bucket), mapas sharded, contadores `LongAdder` |
| Lecturas sin lock sobre snapshots | Un puntero atómico a una versión inmutable; el escritor publica una nueva con CAS | RCU, persistentes (sección 14), `sync.Map` de Go (reimplementado en 1.24 sobre un hash-trie concurrente) |
| Colas acotadas | Buffer circular con índices atómicos | SPSC wait-free, MPMC de Vyukov, LMAX Disruptor, canales de Go |
| Work-stealing | Cada worker tiene un deque local; los ociosos roban del extremo opuesto con CAS | Chase–Lev; planificador de Go, `ForkJoinPool`, Tokio, Rayon |
| Skip list concurrente | Sin rotaciones, enlaces enlazables con CAS | `ConcurrentSkipListMap` de Java |
| STM | Transacciones sobre memoria con reintento automático | Clojure `ref`, Haskell STM |
| CRDTs | Estados cuyo `merge` es conmutativo, asociativo e idempotente (un semirretículo) | Contadores G/PN, OR-Set, LWW-Register, RGA, Yjs |

### 15.3 Código

**Go: pila de Treiber lock-free** (el GC elimina el ABA por reutilización de nodos):

```go
package lockfree

import "sync/atomic"

type node[T any] struct {
	val  T
	next *node[T]
}

type Stack[T any] struct {
	head atomic.Pointer[node[T]]
}

func (s *Stack[T]) Push(v T) {
	n := &node[T]{val: v}
	for {
		old := s.head.Load()
		n.next = old
		if s.head.CompareAndSwap(old, n) { // éxito: publicamos el nuevo tope
			return
		}
	}
}

func (s *Stack[T]) Pop() (T, bool) {
	for {
		old := s.head.Load()
		if old == nil {
			var zero T
			return zero, false
		}
		if s.head.CompareAndSwap(old, old.next) {
			return old.val, true
		}
	}
}
```

**Go: mapa particionado** (reduce la contención repartiéndola entre 64 locks):

```go
package shardmap

import "sync"

const nShards = 64

type shard[K comparable, V any] struct {
	mu sync.RWMutex
	m  map[K]V
}

type ShardedMap[K comparable, V any] struct {
	shards [nShards]shard[K, V]
	hash   func(K) uint64
}

func New[K comparable, V any](hash func(K) uint64) *ShardedMap[K, V] {
	s := &ShardedMap[K, V]{hash: hash}
	for i := range s.shards {
		s.shards[i].m = make(map[K]V)
	}
	return s
}

func (s *ShardedMap[K, V]) Get(k K) (V, bool) {
	sh := &s.shards[s.hash(k)%nShards]
	sh.mu.RLock()
	defer sh.mu.RUnlock()
	v, ok := sh.m[k]
	return v, ok
}

func (s *ShardedMap[K, V]) Set(k K, v V) {
	sh := &s.shards[s.hash(k)%nShards]
	sh.mu.Lock()
	sh.m[k] = v
	sh.mu.Unlock()
}
```

**Dart: el modelo de concurrencia es otro.**

- Cada **isolate** tiene su propio heap y su propio *event loop*; no hay memoria mutable compartida entre isolates. Se comunican por mensajes (`SendPort`), que se copian (salvo objetos inmutables y `TransferableTypedData` para buffers grandes). Por eso no necesitas estructuras lock-free compartidas en Dart puro: la sincronización es la **cola de mensajes**. Si bajas a hilos nativos por FFI, aplica todo lo anterior en el lado nativo.
- **Dentro de un isolate no hay data races, pero sí condiciones de carrera lógicas:** cada `await` cede el control, y otra tarea puede ejecutarse entre tu comprobación y tu modificación. La solución es serializar la sección crítica:

```dart
import 'dart:async';
import 'dart:isolate';

/// Exclusión mutua para código asíncrono dentro de UN isolate.
class AsyncMutex {
  Future<void> _tail = Future<void>.value();

  Future<T> synchronized<T>(Future<T> Function() critical) {
    final done = Completer<T>();
    final previous = _tail;
    // El siguiente solicitante espera a que este termine (con o sin error).
    _tail = done.future.then<void>((_) {}, onError: (_) {});
    previous.then((_) async {
      try {
        done.complete(await critical());
      } catch (e, s) {
        done.completeError(e, s);
      }
    });
    return done.future;
  }
}

class Inventory {
  final _lock = AsyncMutex();
  final Map<String, int> _stock = {'sku-1': 1};

  // SIN lock: dos llamadas concurrentes pasan la comprobación antes de
  // descontar y el stock termina en -1 (ambas devuelven true).
  Future<bool> buyUnsafe(String item) async {
    if ((_stock[item] ?? 0) > 0) {
      await Future<void>.delayed(const Duration(milliseconds: 5)); // E/S simulada
      _stock[item] = _stock[item]! - 1;
      return true;
    }
    return false;
  }

  // CON lock: comprobar y modificar forman una sección crítica.
  Future<bool> buy(String item) => _lock.synchronized(() => buyUnsafe(item));
}

/// Trabajo pesado en otro isolate. `data` se copia (O(n)) al isolate nuevo.
Future<int> sumInBackground(List<int> data) =>
    Isolate.run(() => data.fold<int>(0, (a, b) => a + b));
```

### 15.4 Trade-offs y buenas prácticas

- **Lock-free no es sinónimo de más rápido.** Con poca contención, un mutex bien usado suele igualar o ganar; con mucha, los reintentos de CAS y el rebote de líneas de caché también degradan. Lo que garantiza el lock-free es el progreso (sin deadlocks ni inversión de prioridad), no el rendimiento.
- **Complejidad y riesgo:** el orden de memoria, el ABA y la reclamación de memoria hacen que las estructuras lock-free propias sean fáciles de escribir mal. Usa librerías probadas.
- **Orden de preferencia práctico:** (1) eliminar el estado compartido (mensajes, confinamiento a un hilo, CSP: *share memory by communicating*); (2) datos inmutables y snapshots; (3) mutex y particionado; (4) lecturas con `RWMutex` o RCU; (5) lock-free solo con evidencia medida.
- **Verifica:** detector de carreras (`go test -race`, ThreadSanitizer), pruebas de estrés, y verificadores de linealizabilidad (Porcupine, Knossos) o *model checking* (Loom en Rust, TLA+).
- **Latencia y justicia:** las colas no acotadas ocultan sobrecarga; define límites y política de contrapresión. Los locks justos evitan inanición a costa de rendimiento.

---

## 16. Guía de decisión y trade-offs

### 16.1 Tabla maestra de complejidades

(n = elementos; L = longitud de la clave; t = grado mínimo del B-tree; V y E = vértices y aristas. «esp.» = esperado; «amort.» = amortizado.)

| Estructura | Acceso / búsqueda | Inserción | Eliminación | Espacio | Nota clave |
| --- | --- | --- | --- | --- | --- |
| Arreglo | O(1) por índice; O(n) por valor | O(n); O(1) amort. al final | O(n) | O(n) | contiguo, mejor caché |
| Lista simple | O(n) | O(1) al inicio o con tail | O(1) al inicio | O(n) | nodos dispersos |
| Lista doble | O(n) | O(1) dado el nodo | O(1) dado el nodo | O(n) | base de LRU |
| Pila | O(1) tope | O(1) | O(1) | O(n) | LIFO |
| Cola / deque | O(1) extremos | O(1) | O(1) | O(n) | buffer circular |
| Heap binario | O(1) mínimo | O(log n) | O(log n) el mínimo | O(n) | sin búsqueda ni orden |
| Tabla hash | O(1) esp. | O(1) amort. | O(1) esp. | O(n) | sin orden; peor caso O(n) |
| BST balanceado (AVL/RB) | O(log n) | O(log n) | O(log n) | O(n) | orden, rangos, vecinos |
| B / B+ tree | O(log\_t n) E/S | O(log\_t n) | O(log\_t n) | O(n) | disco y caché |
| Skip list | O(log n) esp. | O(log n) esp. | O(log n) esp. | O(n) | concurrencia sencilla |
| Trie / radix | O(L) | O(L) | O(L) | O(Σ de longitudes) | prefijos |
| Segment tree | O(log n) consulta de rango | O(log n) actualización | no aplica | O(n) | rangos con cambios |
| Fenwick tree | O(log n) prefijo | O(log n) | no aplica | O(n) | operaciones invertibles |
| Union-Find | O(α(n)) amort. | O(α(n)) unión | no aplica | O(n) | solo se une |
| Grafo, lista de adyacencia | O(deg u) arista | O(1) | O(deg u) | O(V + E) | disperso |
| Grafo, matriz | O(1) arista | O(1) | O(1) | O(V²) | denso o pequeño |
| Filtro de Bloom | O(k) | O(k) | no soportado | O(m) bits | falsos positivos, no negativos |

### 16.2 Qué necesito → qué uso

| Si lo que necesitas es… | Usa… |
| --- | --- |
| Acceso por índice e iteración rápida | `List`; `Float64List`/`Int32List` para datos numéricos |
| Insertar y extraer por los extremos | Buffer circular o `ListQueue` |
| LIFO, deshacer, DFS | Pila sobre `List` |
| FIFO, BFS | Cola (nunca `removeAt(0)`) |
| Mínimo o máximo repetidos | Heap; con `decreaseKey`, heap indexado o pairing |
| Búsqueda por clave exacta | Tabla hash |
| Orden, rangos, predecesor/sucesor | Árbol balanceado, B-tree, skip list; arreglo ordenado si casi no cambia |
| Prefijos y autocompletado | Trie o radix tree |
| Pertenencia aproximada con poca memoria | Filtro de Bloom o cuckoo |
| Frecuencias o cardinalidad aproximadas | Count-Min Sketch; HyperLogLog |
| Sumas o mínimos por rango con actualizaciones | Fenwick o segment tree; sin actualizaciones, sumas de prefijos o sparse table |
| Conectividad con uniones | Union-Find |
| Relaciones, redes, dependencias | Grafo (lista de adyacencia o CSR) |
| Caché con expulsión | Hash más lista doble (LRU), o políticas avanzadas |
| Editar textos grandes | Rope, piece table o gap buffer |
| Datos espaciales o vectores | k-d tree, R-tree, quadtree, geohash; HNSW para vectores |
| Versiones, undo, lecturas sin locks | Estructuras persistentes o snapshots inmutables |
| Varios hilos | Eliminar el estado compartido; si no, inmutabilidad, particionado y colas acotadas |
| Datos que no caben en RAM | B+ tree (lecturas y rangos) o LSM (escrituras masivas) |

### 16.3 Los ejes de trade-off que atraviesan todo

1. **Tiempo vs espacio.** Tablas hash con α bajo, índices, memoización y filtros de Bloom compran tiempo con memoria (o al revés).
2. **Asintótica vs constantes y localidad.** Un arreglo con búsqueda lineal vence a una tabla hash con n pequeño (< \~16–32); un B-tree en RAM vence a un rojinegro; el direccionamiento abierto vence al encadenamiento. Mide antes de decidir.
3. **Peor caso vs promedio, esperado o amortizado.** Para latencia (p99) o entradas adversarias, importa el peor caso: árbol balanceado o hashing con semilla aleatoria. Para throughput, amortizado y esperado suelen bastar.
4. **Lectura vs escritura.** AVL (lectura) vs rojinegro (escritura); B+ tree (lectura) vs LSM (escritura); snapshots inmutables (lectores sin locks) vs actualización en el sitio.
5. **Orden vs búsqueda puntual.** Todo lo que ordena (árboles) cuesta log n y memoria; el hash da O(1) pero ningún orden.
6. **Mutabilidad vs persistencia y concurrencia.** La mutación en el sitio es más rápida y compacta; la inmutabilidad compra versiones, seguridad concurrente e igualdad por identidad.
7. **Simplicidad vs rendimiento.** Empieza por la librería estándar; sustituye solo con un cuello de botella medido. En Dart mide en modo release/AOT (`dart compile exe`), no en JIT de depuración, y usa `package:benchmark_harness` o las DevTools.
8. **Memoria y GC.** Millones de nodos pequeños cuestan mucho en lenguajes con GC; arreglos tipados con índices (CSR, árbol-en-arreglos) reducen memoria y pausas.
9. **Disco vs RAM.** En almacenamiento externo el costo son los bloques leídos: manda el fan-out (B-trees) o convertir escrituras aleatorias en secuenciales (LSM).

### 16.4 Errores frecuentes

- Usar `List.removeAt(0)` como cola: O(n) por extracción.
- Llamar a `list.contains(x)` dentro de un bucle: O(n²). Convierte a `Set` primero.
- Concatenar `String` en un bucle: O(n²). Usa `StringBuffer`.
- Mutar una clave después de insertarla en un mapa o conjunto hash, o definir `==` sin `hashCode` coherente.
- Comparadores inconsistentes (no transitivos, o con `double` y `NaN`): rompen heaps y árboles de forma silenciosa. Un comparador debe ser un orden total.
- Confiar en un BST sin balancear con claves ordenadas. Además, el código **recursivo** de este documento se desborda con cadenas de millones de nodos; usa las versiones balanceadas o reescribe con pila explícita.
- Usar Dijkstra con pesos negativos (usa Bellman–Ford).
- Olvidar que un heap no es estable ni permite búsqueda.
- Ignorar los picos de latencia del redimensionado (arreglos y tablas hash): preasigna capacidad.
- Asumir que no hay carreras en Dart porque hay un solo hilo por isolate: cada `await` es un punto de intercalado.
- Optimizar la estructura sin medir: el cuello de botella suele ser la E/S, la alocación o la serialización.

### 16.5 Cómo consolidar el conocimiento

- **Implementa cada estructura desde cero** y escribe pruebas de propiedades: tras cada operación comprueba el *invariante de representación* (altura AVL, propiedad de heap, colores rojinegros, ocupación del B-tree).
- **Pruebas diferenciales:** compara tu implementación contra la de la librería estándar con miles de operaciones aleatorias; cualquier divergencia es un bug.
- **Mide el crecimiento:** ejecuta con n = 10³, 10⁴, 10⁵, 10⁶ y verifica la pendiente en escala log-log (O(n) tiene pendiente 1; O(n log n) algo más; O(n²) pendiente 2).
- **Visualiza:** VisuAlgo y las animaciones de la Universidad de San Francisco muestran rotaciones, divisiones y rehash paso a paso.
- **Lee el código de producción:** `dart:collection` (`ListQueue`, `LinkedHashMap`, `SplayTreeMap`), `container/heap` de Go, `hashbrown` de Rust, `java.util.concurrent`.

---

## 17. Lecturas recomendadas

**Libros**

- Cormen, Leiserson, Rivest y Stein: *Introduction to Algorithms* (CLRS). Referencia general, con pruebas.
- Sedgewick y Wayne: *Algorithms*, 4.ª ed. Muy buena para árboles, LLRB, grafos y strings.
- Knuth: *The Art of Computer Programming*, vol. 1 (estructuras fundamentales) y vol. 3 (ordenamiento y búsqueda, hashing, B-trees).
- Okasaki: *Purely Functional Data Structures*. La referencia de estructuras persistentes y amortización con laziness.
- Herlihy y Shavit: *The Art of Multiprocessor Programming*. Estructuras concurrentes y progreso.
- Kleppmann: *Designing Data-Intensive Applications*. B-trees vs LSM, replicación y particionado.
- Petrov: *Database Internals*. Páginas, B-trees, LSM y recuperación en detalle.
- Skiena: *The Algorithm Design Manual*. Catálogo práctico para elegir.

**Artículos fundacionales**

- Bloom (1970), filtros de Bloom. Tarjan (1975), Union-Find. Bentley (1975), k-d trees.
- Lehman y Yao (1981), B-link trees. Guttman (1984), R-trees. Sleator y Tarjan (1985), splay trees.
- Treiber (1986), pila lock-free. Celis (1986), Robin Hood hashing. Fredman y Tarjan (1987), heaps de Fibonacci.
- Driscoll, Sarnak, Sleator y Tarjan (1989), estructuras persistentes. Aragon y Seidel (1989), treaps.
- Pugh (1990), skip lists. Herlihy y Wing (1990), linealizabilidad.
- Karger et al. (1997), hashing consistente. Michael y Scott (1996), cola lock-free. O'Neil et al. (1996), LSM-tree.
- Bagwell (2001), *Ideal Hash Trees* (HAMT). Pagh y Rodler (2001), cuckoo hashing.
- Cormode y Muthukrishnan (2005), Count-Min Sketch. Kirsch y Mitzenmacher (2006), doble hashing en Bloom. Flajolet et al. (2007), HyperLogLog.
- Malkov y Yashunin (2016/2018), HNSW.

**Documentación y código**

- API de `dart:collection` y `package:collection` (Dart), `container/heap` y `sync` (Go), y la guía *When Should You Use Which Collection?* de la documentación de `std::collections` de Rust.
- Notas de diseño de las Swiss tables (Abseil) y el código de `hashbrown`.
- Visualizaciones: VisuAlgo y *Data Structure Visualizations* (USFCA).

---

*Fin de la guía. Si quieres profundizar, las extensiones más naturales son: borrado completo en rojinegros y B-trees, árboles de Merkle y pruebas de inclusión con código, un LSM-tree mínimo funcional, y benchmarks reales de cada estructura en Dart (JIT vs AOT).*
