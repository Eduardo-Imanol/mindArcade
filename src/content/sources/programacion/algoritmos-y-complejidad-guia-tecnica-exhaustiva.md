# Algoritmos y Complejidad: guía técnica exhaustiva

*Nivel intermedio → experto · Teoría agnóstica de lenguaje · Código de referencia en Dart 3 (con notas para Go, Python, TypeScript, C++ y Rust)*

## 0. Mapa de la guía

Cada tema sigue el mismo esquema: definición formal, análisis de costo, mecánica interna, código de referencia, casos de uso y trade-offs.

1. Fundamentos: algoritmo, corrección, modelos de cómputo, tamaño de entrada
2. Análisis asintótico: O, Ω, Θ, o, ω; propiedades, límites y jerarquía de crecimiento
3. Tipos de análisis: peor/mejor/promedio/esperado, amortizado, probabilístico, espacial y más allá de Big-O
4. Recurrencias: sustitución, árbol de recursión, Teorema Maestro, Akra–Bazzi
5. Algoritmos de búsqueda: lineal, binaria, `lower_bound`/`upper_bound`, sobre la respuesta, interpolación, exponencial, Eytzinger y otras
6. Ordenación por comparación: cota inferior, Bubble, Insertion, Selection, Shell, Merge, Quick, Heap, Introsort, Timsort
7. Selección: quickselect, mediana de medianas, top-k
8. Ordenación lineal: Counting, Radix, Bucket
9. Ordenación según el dataset: casi ordenado, duplicados, RAM limitada, externa, streaming, paralela, objetos
10. Rendimiento real: caché, predicción de saltos, benchmarking y pruebas
11. Guía de decisión y trade-offs
12. Ejercicios resueltos y plan de estudio
13. Lecturas recomendadas

**Convenciones del código:** Dart 3 con null safety, genéricos y `Comparator<T>`; los rangos son semiabiertos `[lo, hi)` salvo que se indique lo contrario. El código es didáctico: prioriza el invariante sobre la validación exhaustiva de errores. En producción usa primero `List.sort` (no estable) y `mergeSort` de `package:collection` (estable); implementar a mano solo se justifica cuando necesitas una garantía o un costo que la librería no ofrece. **Nota de verificación:** la lógica de cada algoritmo de esta guía se contrastó con ports de referencia y pruebas aleatorias contra el resultado esperado (incluyendo estabilidad y casos límite); el código Dart en sí no se compiló en el entorno donde se redactó, así que ejecútalo con tus propias pruebas antes de depender de él.

---

## 1. Fundamentos

### 1.1 Qué es un algoritmo y qué significa «correcto»

Un **algoritmo** es un procedimiento finito y no ambiguo que transforma una entrada en una salida cumpliendo una especificación (precondición → postcondición). Dos propiedades se demuestran por separado:

- **Corrección parcial:** si el algoritmo termina, la salida cumple la postcondición.
- **Terminación:** el algoritmo termina para toda entrada válida. Se demuestra con una **función variante**: una cantidad entera no negativa que decrece estrictamente en cada iteración (en la búsqueda binaria, `hi − lo`).

La herramienta central para demostrar corrección de bucles es el **invariante de bucle**: una proposición I que cumple tres obligaciones.

1. **Inicialización:** I es verdadera antes de la primera iteración.
2. **Mantenimiento:** si I es verdadera antes de una iteración, lo sigue siendo después.
3. **Terminación:** al salir del bucle, I junto con la condición de salida implican la postcondición.

Ejemplo (insertion sort): *al inicio de la iteración i, `a[lo..i)` contiene los mismos elementos que al principio, ordenados.* Inicialización: `a[lo..lo+1)` tiene un elemento. Mantenimiento: insertar `a[i]` en su lugar conserva el orden. Terminación: con i = hi el invariante dice que todo el arreglo está ordenado. Escribir el invariante *antes* del código es la forma más fiable de evitar errores de índice (off-by-one) en búsquedas y particiones.

### 1.2 Modelos de cómputo

El costo de un algoritmo solo tiene sentido respecto a un modelo que fija qué operaciones cuestan una unidad.

| Modelo | Operación unitaria | Útil para |
| --- | --- | --- |
| **Word-RAM** | Aritmética, comparación y acceso por dirección sobre palabras de w ≥ log n bits | Análisis estándar de algoritmos y estructuras |
| **Árbol de decisión (comparaciones)** | Una comparación entre dos elementos; nada más se puede hacer con las claves | Cotas inferiores de ordenación y búsqueda |
| **Memoria externa (Aggarwal–Vitter)** | Transferencia de un bloque de B palabras entre disco y una memoria de M palabras | Ordenación externa, B-trees, bases de datos |
| **Cache-oblivious** | Igual que memoria externa, pero el algoritmo no conoce B ni M | Algoritmos portables entre niveles de caché |
| **PRAM / fork-join** | Procesadores que acceden a una memoria compartida; se mide trabajo T₁ y profundidad T∞ | Algoritmos paralelos |

Dos precisiones que importan a nivel experto:

- **Costo unitario vs costo en bits.** Si los números crecen con n (factoriales, Fibonacci grandes, claves de miles de bits), sumar o multiplicar ya no es O(1); multiplicar dos números de n bits cuesta O(n²) con el método escolar y O(n^1.585) con Karatsuba.
- **Word-RAM y ordenación.** En word-RAM se puede indexar un arreglo con una clave, lo cual es una bifurcación de k vías en O(1). Por eso la ordenación de enteros escapa a la cota Ω(n log n) de las comparaciones (sección 8). Hay resultados teóricos aún más fuertes (Han–Thorup: O(n√(log log n)) esperado), pero con constantes que no los hacen prácticos.

### 1.3 Tamaño de entrada y complejidad pseudo-polinomial

La complejidad se expresa en función del **tamaño de la entrada**, que es el número de bits para representarla, no necesariamente el valor numérico.

- Probar si N es primo dividiendo hasta √N cuesta O(√N) operaciones, que parece sublineal; pero N ocupa n = log₂ N bits, así que el costo es O(2^(n/2)): **exponencial en el tamaño de la entrada**.
- La mochila 0/1 se resuelve en O(n·W) con programación dinámica. Es **pseudo-polinomial**: polinomial en el valor W, exponencial en sus log W bits. El problema sigue siendo NP-difícil.

Regla práctica: cuando la entrada contiene números, aclara si la complejidad se mide en cantidad de elementos, en valor o en bits.

### 1.4 Dimensiones del costo

Un algoritmo se evalúa en varias dimensiones que no siempre coinciden:

- **Tiempo:** número de operaciones elementales. En ordenación se separan **comparaciones** y **movimientos/escrituras** porque su costo relativo cambia (comparar strings largas es caro; escribir en flash es caro).
- **Espacio:** memoria **auxiliar** (sin contar la entrada) y total. La **pila de recursión cuenta**.
- **Accesos a memoria y jerarquía de caché:** el factor dominante en datasets grandes.
- **Transferencias de E/S:** en memoria externa.
- **Latencia vs rendimiento:** el peor caso de una operación individual vs el costo medio por operación.

---

## 2. Análisis asintótico

### 2.1 Definiciones formales

Sean f, g : ℕ → ℝ≥0 (funciones de costo no negativas). Las cinco notaciones son **conjuntos de funciones**:

- **O(g)** (cota superior): f ∈ O(g) ⇔ ∃ c > 0, ∃ n₀ tal que ∀ n ≥ n₀: f(n) ≤ c·g(n).
- **Ω(g)** (cota inferior): f ∈ Ω(g) ⇔ ∃ c > 0, ∃ n₀ tal que ∀ n ≥ n₀: f(n) ≥ c·g(n).
- **Θ(g)** (cota ajustada): f ∈ Θ(g) ⇔ f ∈ O(g) y f ∈ Ω(g); equivalentemente, ∃ c₁, c₂ > 0, n₀ tal que ∀ n ≥ n₀: c₁·g(n) ≤ f(n) ≤ c₂·g(n).
- **o(g)** (cota superior estricta): f ∈ o(g) ⇔ **∀** c > 0, ∃ n₀ tal que ∀ n ≥ n₀: f(n) < c·g(n). Aquí el cuantificador de c es universal: f crece estrictamente más despacio que g.
- **ω(g)** (cota inferior estricta): f ∈ ω(g) ⇔ ∀ c > 0, ∃ n₀ tal que ∀ n ≥ n₀: f(n) > c·g(n).

La diferencia entre O y o es el cuantificador sobre c: en O basta **una** constante; en o se exige que **toda** constante sea superada. Por eso 2n ∈ O(n) pero 2n ∉ o(n), mientras que n ∈ o(n²).

**Criterio por límites** (cuando el límite existe):

| lim f(n)/g(n) | Conclusión |
| --- | --- |
| 0 | f ∈ o(g) (y por tanto O(g)) |
| L con 0 < L < ∞ | f ∈ Θ(g) |
| ∞ | f ∈ ω(g) (y por tanto Ω(g)) |

Cuando el límite no existe hay que usar límite superior e inferior: f ∈ O(g) ⇔ limsup f/g < ∞, y f ∈ Ω(g) ⇔ liminf f/g > 0. Ejemplo: f(n) = n·(2 + sen n) ∈ Θ(n), pero f(n)/n oscila y no tiene límite.

**Abuso de notación.** Se escribe «f(n) = O(g(n))» aunque lo correcto es «f ∈ O(g)». En ecuaciones como T(n) = 2T(n/2) + O(n), O(n) representa *alguna* función anónima de ese conjunto. Esa lectura es la que permite resolver recurrencias (sección 4).

### 2.2 Demostraciones modelo

**(a) 3n² + 5n + 7 ∈ Θ(n²).** Para n ≥ 1: 3n² ≤ 3n² + 5n + 7 ≤ 3n² + 5n² + 7n² = 15n². Constantes: c₁ = 3, c₂ = 15, n₀ = 1.

**(b) n² ∉ O(n).** Por contradicción: si n² ≤ c·n para todo n ≥ n₀, entonces n ≤ c para todo n ≥ n₀, falso para n > c.

**(c) log₂(n!) ∈ Θ(n log n).** Cota superior: n! ≤ nⁿ ⇒ log n! ≤ n log n. Cota inferior: los n/2 factores mayores de n! son cada uno ≥ n/2, así que n! ≥ (n/2)^(n/2) y log n! ≥ (n/2)·log(n/2) = Ω(n log n). Con Stirling, la forma exacta es **log₂(n!) = n log₂ n − n log₂ e + O(log n)**, es decir, n log₂ n − 1.443n + O(log n). Este resultado es la base de la cota inferior de la ordenación (sección 6.2).

**(d) La base del logaritmo no importa, la del exponente sí.** log_a n = log_b n / log_b a, que es una constante multiplicativa: Θ(log₂ n) = Θ(log₁₀ n). Pero 2ⁿ ∉ Θ(3ⁿ), y 2^(2n) = 4ⁿ ∉ O(2ⁿ). Y n^(log₂ 3) ≠ n^(log₃ 2): los exponentes cuentan.

### 2.3 Propiedades

- **Reflexividad y transitividad** de O, Ω, Θ, o, ω; **simetría** de Θ; **simetría traspuesta:** f ∈ O(g) ⇔ g ∈ Ω(f), y f ∈ o(g) ⇔ g ∈ ω(f).
- **Suma:** O(f) + O(g) = O(max(f, g)). Una secuencia de fases cuesta lo que cuesta la más cara.
- **Producto:** O(f)·O(g) = O(f·g). Bucles anidados multiplican.
- **Polinomios:** un polinomio de grado d con coeficiente líder positivo es Θ(n^d).
- **Orden parcial, no total:** existen funciones incomparables. f(n) = n^(1 + sen n) no es O(n) ni Ω(n). En la práctica los costos de algoritmos «bien portados» sí son comparables, pero no es un teorema.
- **Constantes ocultas y n₀.** Una cota asintótica dice cómo escala el costo, no cuál es menor para un n concreto. Existen algoritmos «galácticos» (multiplicación de matrices tipo Coppersmith–Winograd) con mejor exponente y constantes tan grandes que nunca superan al método práctico en entradas reales.

### 2.4 Jerarquía de crecimiento y magnitudes

Orden creciente (cada una es o() de la siguiente):

1 ≺ log\* n ≺ log log n ≺ log n ≺ log² n ≺ n^ε ≺ √n ≺ n ≺ n log n ≺ n² ≺ n³ ≺ 2ⁿ ≺ n! ≺ nⁿ

Tamaño máximo de n que cabe en un presupuesto de ≈10⁸ operaciones simples (orden de magnitud de un segundo):

| Complejidad | n máximo aproximado |
| --- | --- |
| O(log n) o O(1) | prácticamente ilimitado |
| O(n) | ~10⁸ |
| O(n log n) | ~4–5·10⁶ |
| O(n√n) | ~2·10⁵ |
| O(n²) | ~10⁴ |
| O(n³) | ~460 |
| O(2ⁿ) | ~26 |
| O(n!) | ~11 |

Con n = 10⁶: log₂ n ≈ 20; n log n ≈ 2·10⁷ (decenas de ms); n² = 10¹² (del orden de 15–20 minutos a 10⁹ ops/s). Esta tabla es la primera herramienta para descartar diseños en un problema con restricciones dadas.

**Sumas que aparecen constantemente:**

| Suma | Valor |
| --- | --- |
| Σ_{i=1}^{n} i | n(n+1)/2 = Θ(n²) |
| Σ_{i=1}^{n} i^k | Θ(n^(k+1)) |
| Σ_{i=0}^{k} rⁱ (r ≠ 1) | (r^(k+1) − 1)/(r − 1): dominada por el último término si r > 1, por el primero si r < 1 |
| Σ_{i=0}^{∞} i/2ⁱ | 2 (por eso construir un heap es Θ(n)) |
| Hₙ = Σ_{i=1}^{n} 1/i | ln n + γ + o(1) = Θ(log n) (γ ≈ 0.5772) |
| Σ_{i=1}^{n} log i | log(n!) = Θ(n log n) |

### 2.5 Variantes de la notación que conviene dominar

- **Õ (soft-O):** oculta factores polilogarítmicos, Õ(f) = O(f·log^k f).
- **Varias variables.** Para grafos, O(V + E) y O(E log V) tienen dos parámetros; la definición exige la desigualdad para todos los valores suficientemente grandes de *ambos*. No se puede simplificar sin conocer su relación (E puede ser Θ(V) o Θ(V²)).
- **Sensible a la salida (output-sensitive):** la complejidad depende del tamaño de la respuesta h, como la envolvente convexa de Chan, O(n log h).
- **Parametrizada:** O(f(k)·n^c) con k un parámetro estructural pequeño.
- **Problema vs algoritmo.** Un algoritmo tiene una cota superior (lo que garantiza). Un problema tiene una cota inferior (lo que ningún algoritmo del modelo puede mejorar). Cuando coinciden, el algoritmo es **óptimo**: merge sort y heap sort son óptimos en el modelo de comparaciones porque ordenar exige Ω(n log n).

### 2.6 Dónde encaja la teoría de la complejidad computacional

Los resultados de esta guía son de **análisis de algoritmos concretos**. Un nivel arriba está la clasificación de problemas: **P** (decidibles en tiempo polinomial), **NP** (solución verificable en tiempo polinomial), **NP-completo** (los más difíciles de NP; si uno está en P, todos lo están) y **NP-difícil**. Los teoremas de jerarquía de tiempo y espacio garantizan que más recursos permiten resolver estrictamente más problemas. La **hipótesis del tiempo exponencial (ETH)** se usa hoy para demostrar que ciertos algoritmos polinomiales no se pueden mejorar sustancialmente. Ordenar, buscar y seleccionar están en P y su estudio es el de las constantes y los exponentes finos.

---

## 3. Tipos de análisis

### 3.1 Peor caso, mejor caso, caso promedio y esperado

Para un algoritmo con costo T(x) sobre la entrada x de tamaño n:

- **Peor caso:** T_peor(n) = max_{|x|=n} T(x). Es una garantía.
- **Mejor caso:** T_mejor(n) = min_{|x|=n} T(x). Casi siempre irrelevante como garantía.
- **Caso promedio:** T_prom(n) = Σ_x p(x)·T(x) para una distribución de entradas p. Depende de un supuesto sobre los datos (p. ej., permutaciones uniformes).
- **Caso esperado:** esperanza sobre los números aleatorios que el *propio algoritmo* genera (quicksort con pivote aleatorio). No supone nada de los datos: es una garantía probabilística por entrada.

**Error conceptual habitual: confundir cota con caso.** O, Ω y Θ describen *funciones*; peor/mejor/promedio describen *cuál función*. Se puede dar una cota Θ para cada caso: insertion sort es Θ(n) en el mejor caso y Θ(n²) en el peor. Decir «insertion sort es O(n²)» es cierto (cota superior del peor caso) pero poco informativo; decir «en el mejor caso es Ω(n)» es legítimo.

**Ejemplo: búsqueda lineal exitosa.** Si el objetivo está en cualquiera de las n posiciones con probabilidad 1/n, el número esperado de comparaciones es Σ_{i=1}^{n} i/n = (n+1)/2 = Θ(n).

**Ejemplo (variables indicadoras): comparaciones esperadas de quicksort aleatorizado.** Sean z₁ < … < z_n los elementos ordenados. Sea X_ij el indicador de que z_i y z_j se comparan alguna vez. Dos elementos se comparan solo si uno de ellos es el primer pivote elegido entre {z_i, …, z_j}, lo cual ocurre con probabilidad 2/(j − i + 1). Por linealidad de la esperanza:

E[comparaciones] = Σ_{i<j} 2/(j−i+1) = 2(n+1)·Hₙ − 4n ≈ 2n ln n ≈ 1.386·n·log₂ n.

(Con d = j − i, hay n − d pares a distancia d: Σ_{d=1}^{n−1} (n−d)·2/(d+1) = 2(n+1)(Hₙ − 1) − 2(n−1) = 2(n+1)Hₙ − 4n.) Quicksort aleatorizado hace, en promedio, aproximadamente un 39 % más comparaciones que el mínimo teórico n log₂ n, y lo compensa con su baja constante de movimientos y su localidad.

### 3.2 Análisis amortizado

El análisis amortizado acota el costo **total** de una secuencia de n operaciones en el **peor caso**, y reparte ese total entre las operaciones. Es una garantía determinista (no depende de probabilidades) sobre la secuencia completa, aunque una operación individual pueda ser cara. Hay tres métodos equivalentes.

**Método agregado:** costo total de n operaciones / n.

**Método contable (créditos):** se cobra a cada operación un costo amortizado ĉ; si ĉ excede el costo real, la diferencia se guarda como crédito en elementos concretos de la estructura, y los créditos pagan operaciones posteriores caras. El saldo nunca debe ser negativo.

**Método del potencial:** se define una función Φ ≥ 0 sobre el estado de la estructura, con Φ(estado inicial) = 0. El costo amortizado de la operación i es

ĉ_i = c_i + Φ(D_i) − Φ(D_{i−1})

y la suma de costos amortizados acota a la de costos reales: Σ ĉ_i = Σ c_i + Φ(D_n) − Φ(D_0) ≥ Σ c_i.

**Ejemplo 1: contador binario de k bits, n incrementos.** Un incremento voltea los t unos finales a 0 y un 0 a 1: costo real t + 1.

- *Agregado:* el bit i se voltea una vez cada 2ⁱ incrementos, así que el total es Σ_i ⌊n/2ⁱ⌋ < 2n. Costo amortizado ≤ 2.
- *Potencial:* Φ = número de unos. ΔΦ = 1 − t. Entonces ĉ = (t + 1) + (1 − t) = **2**.

**Ejemplo 2: arreglo dinámico con duplicación.** Con Φ = 2·size − capacity: un push sin redimensionar cuesta 1 y sube Φ en 2, de modo que ĉ = 3. El push que redimensiona con size = capacity = c cuesta c + 1 (copiar c elementos y escribir uno), Φ pasa de c a 2, de modo que ĉ = (c + 1) + (2 − c) = 3. Todas las operaciones push son O(1) amortizado.

Detalles que un experto debe conocer:

- **El factor de crecimiento debe ser geométrico.** Con factor g > 1 el total de copias en n pushes es ≤ n·g/(g−1) (con g = 2, ≤ 2n; con g = 1.5, ≤ 3n). Con crecimiento *aditivo* (capacidad += k) el costo total es Θ(n²/k): O(n) por push, no amortizado constante.
- **Política de reducción.** Si encoges a la mitad cuando size = capacity/2, una secuencia alternada push/pop alrededor del umbral cuesta Θ(n) en *cada* operación. Se encoge cuando size ≤ capacity/4 (y se reduce a la mitad); el potencial de CLRS Φ = 2·size − capacity (si α ≥ 1/2) o capacity/2 − size (si α < 1/2) demuestra O(1) amortizado para ambas.

**Ejemplo 3: cola con dos pilas.** `enqueue` empuja en la pila de entrada; `dequeue` saca de la de salida y, si está vacía, vuelca toda la de entrada (costo k). Con Φ = tamaño de la pila de entrada, el volcado de k elementos tiene ĉ = k + (−k) = 0 y el resto de operaciones tienen ĉ = O(1). Todas son O(1) amortizado.

**Otras aplicaciones clásicas:** `multipop` en pilas; rehash de tablas hash; Union-Find con compresión de rutas y unión por rango (α(n) amortizado, la inversa de la función de Ackermann); splay trees (O(log n) amortizado); heaps de Fibonacci (decrease-key en O(1) amortizado).

**Advertencias de ingeniería:**

- **Amortizado no es latencia.** La operación que redimensiona cuesta O(n) y aparece en tu percentil 99 o 99.9. En sistemas de tiempo real o con SLA estrictos se preasigna capacidad o se usa redimensionado incremental.
- **Amortizado no resiste la persistencia.** Si puedes volver a usar una versión antigua de la estructura, un adversario repite una operación cara sobre el mismo estado y la amortización se rompe (por eso Okasaki diseña colas persistentes con evaluación perezosa).
- **Amortizado ≠ esperado.** El primero es determinista sobre secuencias; el segundo promedia sobre azar interno.

### 3.3 Análisis probabilístico y algoritmos aleatorizados

- **Las variables indicadoras y la linealidad de la esperanza** (ejemplo anterior) resuelven la mayoría de análisis esperados sin necesitar independencia.
- **Las-Vegas:** siempre correcto, tiempo aleatorio (quicksort aleatorizado, quickselect). **Monte Carlo:** tiempo fijo, resultado correcto con alta probabilidad (filtros de Bloom, test de Miller–Rabin).
- **Con alta probabilidad (w.h.p.):** probabilidad ≥ 1 − 1/n^c. Quicksort aleatorizado termina en O(n log n) con probabilidad ≥ 1 − 1/n^c, no solo en esperanza; por eso el riesgo de degradación práctica es despreciable.
- **Aleatorizar elimina al adversario, no a la mala suerte.** Una entrada ya no puede ser «mala» para el algoritmo, pero el resultado de una ejecución concreta puede serlo con probabilidad minúscula.
- **Derandomización práctica:** si el generador de números aleatorios es predecible (semilla fija expuesta), el atacante reconstruye la entrada adversaria. En servicios expuestos se usa semilla impredecible o se combina con un fallback determinista (introsort, sección 6.10).

### 3.4 Complejidad espacial

- **Espacio auxiliar** es la memoria adicional a la entrada. «In-place» se usa con dos significados: *estricto* (O(1) extra) y *liberal* (O(log n) extra, permitiendo la pila de recursión). Heap sort es in-place estricto; quicksort es in-place liberal.
- **La pila de recursión cuenta.** Quicksort con pivote mala puede llegar a profundidad Θ(n) (desbordamiento de pila); recursando siempre en la partición menor y iterando sobre la mayor, la profundidad es ≤ log₂ n (sección 6.8).
- **Intercambio tiempo/espacio:** merge sort gana estabilidad y un peor caso n log n a cambio de O(n) extra; heap sort gana O(1) extra a cambio de mala localidad; counting sort gana tiempo lineal a cambio de O(k) extra.
- **Streaming y sublineal:** cuando la entrada no cabe en memoria, se diseñan algoritmos de un solo paso con espacio o(n) (contadores, sketches, cuantiles aproximados).

### 3.5 Más allá de Big-O: lo que el análisis asintótico oculta

Big-O ignora constantes y la jerarquía de memoria, y en la práctica ambas dominan:

- **Localidad de caché.** Un acceso a RAM cuesta ~60–100 ns frente a ~1 ns en L1; recorrer un arreglo secuencialmente aprovecha líneas de 64 B y el prefetcher. En el **modelo de memoria externa**, ordenar N elementos cuesta Θ((N/B)·log_{M/B}(N/B)) transferencias de bloque, y buscar con un B-tree cuesta Θ(log_B N).
- **Predicción de saltos.** Un salto mal predicho cuesta ~15–20 ciclos. Una comparación sobre datos aleatorios es impredecible (50 % de acierto), lo que puede dominar el tiempo de quicksort y de la búsqueda binaria clásica.
- **Paralelismo a nivel de instrucciones y SIMD.** Búsqueda lineal vectorizada (`memchr`) procesa 16–64 bytes por instrucción; supera a la búsqueda binaria hasta decenas o cientos de elementos.
- **Constantes y factores bajos.** Quicksort y merge sort son ambos Θ(n log n), pero quicksort típicamente es varias veces más rápido en arreglos de tipos primitivos por su localidad y menor movimiento de datos.

La conclusión operativa: **el análisis asintótico dice qué algoritmos descartar; la medición decide entre los que quedan** (sección 10).

---

## 4. Resolución de recurrencias

### 4.1 Por qué aparecen

Un algoritmo de **divide y vencerás** divide un problema de tamaño n en a subproblemas de tamaño ≈ n/b, los resuelve recursivamente y combina las soluciones con costo f(n):

**T(n) = a·T(n/b) + f(n)**, con T(n) = Θ(1) para n pequeño.

Resolver la recurrencia es obtener una forma cerrada asintótica de T. Existen cuatro técnicas, de más general a más mecánica: sustitución, árbol de recursión, Teorema Maestro y Akra–Bazzi.

### 4.2 Método de sustitución (inducción)

Se **adivina** la forma de la solución y se **demuestra por inducción** con constantes a determinar.

**Ejemplo.** T(n) = 2T(⌊n/2⌋) + n. Hipótesis: T(n) ≤ c·n·log₂ n para n ≥ 2. Paso inductivo (suponiéndola cierta para ⌊n/2⌋):

T(n) ≤ 2·c·⌊n/2⌋·log₂⌊n/2⌋ + n ≤ c·n·log₂(n/2) + n = c·n·log₂ n − c·n + n ≤ c·n·log₂ n, siempre que c ≥ 1.

Faltan los casos base (T(2), T(3)), que se resuelven eligiendo c lo bastante grande y n₀ = 2.

**Trampa 1: la «falsa demostración» de O(n).** Suponer T(n) ≤ c·n y concluir T(n) ≤ 2c⌊n/2⌋ + n ≤ cn + n = O(n) es *inválido*: la hipótesis inductiva exige llegar exactamente a ≤ cn, no a cn + n. Se debe demostrar la forma exacta de la hipótesis.

**Trampa 2: la hipótesis demasiado débil.** T(n) = 2T(⌊n/2⌋) + 1. Con T(n) ≤ cn la inducción da cn + 1 > cn y falla, aunque T(n) = Θ(n) es verdad. La solución es **fortalecer la hipótesis restando un término de menor orden**: T(n) ≤ cn − d. Entonces T(n) ≤ 2(c⌊n/2⌋ − d) + 1 ≤ cn − 2d + 1 ≤ cn − d si d ≥ 1.

**Cambio de variable.** T(n) = 2T(√n) + log₂ n. Sea m = log₂ n y S(m) = T(2^m): S(m) = 2S(m/2) + m, que por el Teorema Maestro (caso 2) es Θ(m log m). Entonces T(n) = Θ(log n · log log n).

### 4.3 Árbol de recursión

Se dibuja el árbol de llamadas, se calcula el costo por nivel y se suman los niveles. Sirve para *obtener* la hipótesis que luego se demuestra con sustitución, y es la base del Teorema Maestro.

**Merge sort, T(n) = 2T(n/2) + cn.** Nivel i: 2ⁱ subproblemas de tamaño n/2ⁱ, costo por nivel 2ⁱ·c·n/2ⁱ = cn. Hay log₂ n + 1 niveles. Total: Θ(n log n).

**T(n) = 3T(n/4) + cn².** Nivel i: 3ⁱ subproblemas de tamaño n/4ⁱ y costo por nivel c·n²·(3/16)ⁱ, una serie geométrica decreciente dominada por la raíz: Σ ≤ cn²/(1 − 3/16) = (16/13)cn². Las hojas son 3^(log₄ n) = n^(log₄ 3) ≈ n^0.79 = o(n²). Total: Θ(n²).

**Forma general.** En T(n) = aT(n/b) + f(n) hay log_b n niveles; el nivel j cuesta aʲ·f(n/bʲ) y hay a^(log_b n) = n^(log_b a) hojas. Entonces

T(n) = Θ(n^(log_b a)) + Σ_{j=0}^{log_b n − 1} aʲ·f(n/bʲ).

El primer término es el costo de las hojas; la suma es el costo de los nodos internos. La competencia entre ambos da los tres casos del Teorema Maestro.

### 4.4 Teorema Maestro

Sea T(n) = a·T(n/b) + f(n) con a ≥ 1, b > 1 constantes y f asintóticamente positiva (los pisos y techos en n/b no cambian el resultado). Sea **p = log_b a** el *exponente crítico*: las hojas aportan Θ(nᵖ).

| Caso | Condición | Resultado |
| --- | --- | --- |
| 1 (domina el trabajo en las hojas) | f(n) = O(n^(p−ε)) para algún ε > 0 | T(n) = Θ(nᵖ) |
| 2 (trabajo balanceado por nivel) | f(n) = Θ(nᵖ·logᵏ n), k ≥ 0 | T(n) = Θ(nᵖ·log^(k+1) n) |
| 3 (domina la raíz) | f(n) = Ω(n^(p+ε)) para algún ε > 0 **y** a·f(n/b) ≤ c·f(n) para algún c < 1 y n grande | T(n) = Θ(f(n)) |

**Intuición.** Si f crece polinomialmente más despacio que nᵖ, las hojas dominan (la serie de niveles es geométrica creciente). Si f ≈ nᵖ, todos los niveles cuestan lo mismo y se multiplica por el número de niveles (log n). Si f crece polinomialmente más rápido, la raíz domina (serie geométrica decreciente). La **condición de regularidad** del caso 3 garantiza que los niveles decrecen de verdad; se cumple automáticamente para f(n) = n^c·logᵏ n con c > p.

**Extensión del caso 2 para k < 0:** si f(n) = Θ(nᵖ / log n) (k = −1), T(n) = Θ(nᵖ log log n); si k < −1, T(n) = Θ(nᵖ).

**Ejemplos resueltos**

| Algoritmo / recurrencia | a, b, f(n) | p | Caso | Solución |
| --- | --- | --- | --- | --- |
| Búsqueda binaria: T(n) = T(n/2) + 1 | 1, 2, 1 | 0 | 2 (k = 0) | Θ(log n) |
| Merge sort: T(n) = 2T(n/2) + n | 2, 2, n | 1 | 2 (k = 0) | Θ(n log n) |
| Karatsuba: T(n) = 3T(n/2) + n | 3, 2, n | log₂ 3 ≈ 1.585 | 1 | Θ(n^1.585) |
| Strassen: T(n) = 7T(n/2) + n² | 7, 2, n² | log₂ 7 ≈ 2.807 | 1 | Θ(n^2.807) |
| T(n) = 2T(n/2) + n² | 2, 2, n² | 1 | 3 (regularidad: 2(n/2)² = n²/2 ≤ ½·n²) | Θ(n²) |
| Quickselect esperado: T(n) = T(n/2) + n | 1, 2, n | 0 | 3 (regularidad: n/2 ≤ ½·n) | Θ(n) |
| Multiplicación de matrices ingenua D&C: T(n) = 8T(n/2) + n² | 8, 2, n² | 3 | 1 | Θ(n³) |
| T(n) = 2T(n/2) + n/log n | 2, 2, n/log n | 1 | 2 extendido (k = −1) | Θ(n log log n) |

**Casos en que el Teorema Maestro NO aplica**

- **a no constante o a < 1:** T(n) = 2ⁿ·T(n/2) + nⁿ; T(n) = 0.5·T(n/2) + n.
- **f en el «hueco» entre casos:** T(n) = 2T(n/2) + n·log log n. Aquí f/nᵖ = log log n no es Θ(logᵏ n) para ningún k entero ni crece como nᵋ. Con árbol de recursión: cada uno de los log n niveles cuesta ≈ n·log log n, de modo que T(n) = Θ(n·log n·log log n).
- **Subproblemas de tamaños distintos:** T(n) = T(n/3) + T(2n/3) + n. Use árbol o Akra–Bazzi (solución Θ(n log n)).
- **Reducción por resta, no por división:** T(n) = T(n−1) + n (quicksort en el peor caso) no es de la forma n/b; se resuelve telescopando: T(n) = Σ_{i=1}^{n} i = Θ(n²).
- **Fibonacci ingenuo:** T(n) = T(n−1) + T(n−2) + 1. Es una recurrencia lineal homogénea: la ecuación característica x² = x + 1 tiene raíces φ = (1+√5)/2 ≈ 1.618 y ψ = (1−√5)/2, de donde T(n) = Θ(φⁿ).

### 4.5 Teorema de Akra–Bazzi

Generaliza el Teorema Maestro a subproblemas de tamaños distintos. Si

T(x) = g(x) + Σ_{i=1}^{k} a_i·T(b_i·x + h_i(x)), con a_i > 0, 0 < b_i < 1, |h_i(x)| = O(x/log² x), g polinomialmente acotada,

sea **p** el único real con Σ a_i·b_iᵖ = 1. Entonces

T(x) = Θ( xᵖ · (1 + ∫₁ˣ g(u)/u^(p+1) du ) ).

**Ejemplo 1: mediana de medianas (selección determinista).** T(n) = T(n/5) + T(7n/10) + n. Como 1/5 + 7/10 = 9/10 < 1, p < 1. Con g(u) = u: ∫₁ˣ u^(−p) du = Θ(x^(1−p)), así que T(x) = Θ(xᵖ·x^(1−p)) = Θ(x). **Selección en tiempo lineal.**

**Ejemplo 2: T(n) = T(n/2) + T(n/3) + n.** p resuelve (1/2)ᵖ + (1/3)ᵖ = 1, p ≈ 0.788 < 1; de nuevo T(n) = Θ(n).

**Ejemplo 3: T(n) = T(n/3) + T(2n/3) + n.** p = 1 (1/3 + 2/3 = 1), ∫₁ˣ u/u² du = ln x, así que T(x) = Θ(x log x).

**Por qué la mediana de medianas usa grupos de 5.** Con grupos de 3 la recurrencia es T(n) ≤ T(n/3) + T(2n/3) + O(n) = Θ(n log n); con grupos de 5, 1/5 + 7/10 < 1 y sale lineal. Con grupos de 7 también (1/7 + 5/7 = 6/7 < 1), pero la constante crece.

### 4.6 Tabla de recurrencias de algoritmos clásicos

| Algoritmo | Recurrencia | Solución |
| --- | --- | --- |
| Búsqueda binaria | T(n) = T(n/2) + Θ(1) | Θ(log n) |
| Potencia por cuadrados | T(n) = T(n/2) + Θ(1) | Θ(log n) multiplicaciones |
| Merge sort | T(n) = 2T(n/2) + Θ(n) | Θ(n log n) |
| Quicksort, mejor caso/pivote mediana | T(n) = 2T(n/2) + Θ(n) | Θ(n log n) |
| Quicksort, peor caso | T(n) = T(n−1) + Θ(n) | Θ(n²) |
| Quicksort, promedio | T(n) = (1/n)·Σ_{k=0}^{n−1}[T(k) + T(n−1−k)] + Θ(n) | Θ(n log n) (≈ 2n ln n comparaciones) |
| Quickselect esperado (modelo: el pivote parte por la mitad) | T(n) = T(n/2) + Θ(n) | Θ(n) |
| Construcción de heap (Floyd) | T(n) = 2T(n/2) + Θ(log n) (equivale a Σ h·n/2^(h+1)) | Θ(n) (caso 1) |
| Karatsuba | T(n) = 3T(n/2) + Θ(n) | Θ(n^(log₂ 3)) |
| Strassen | T(n) = 7T(n/2) + Θ(n²) | Θ(n^(log₂ 7)) |
| Subarreglo de suma máxima (D&C) | T(n) = 2T(n/2) + Θ(n) | Θ(n log n) (existe Θ(n) con Kadane) |
| Par de puntos más cercano | T(n) = 2T(n/2) + Θ(n) | Θ(n log n) |
| FFT | T(n) = 2T(n/2) + Θ(n) | Θ(n log n) |
| Selección por mediana de medianas | T(n) = T(n/5) + T(7n/10) + Θ(n) | Θ(n) |
| Fibonacci ingenuo | T(n) = T(n−1) + T(n−2) + Θ(1) | Θ(φⁿ) |

### 4.7 Código: clasificador del Teorema Maestro

Para recurrencias T(n) = a·T(n/b) + Θ(n^c · logᵏ n), que cubren la gran mayoría de casos prácticos:

```dart
import 'dart:math' as math;

/// Resuelve T(n) = a·T(n/b) + Θ(n^c · log^k n) con a ≥ 1, b > 1.
String masterTheorem(num a, num b, num c, {int k = 0}) {
  final p = math.log(a) / math.log(b); // exponente crítico log_b(a)
  const eps = 1e-12;                    // tolerancia para comparar reales
  final ps = p.toStringAsFixed(3);

  if (c < p - eps) {
    return 'Caso 1: Θ(n^$ps)';          // domina el trabajo en las hojas
  }
  if ((c - p).abs() <= eps) {
    if (k > -1) return 'Caso 2: Θ(n^$ps · log^${k + 1} n)';
    if (k == -1) return 'Caso 2 ext.: Θ(n^$ps · log log n)';
    return 'Caso 2 ext.: Θ(n^$ps)';     // k < -1
  }
  // c > p: la regularidad a·f(n/b) ≤ c'·f(n) con c' = a/b^c < 1 se cumple.
  return 'Caso 3: Θ(n^$c · log^$k n)';
}

void main() {
  print(masterTheorem(2, 2, 1));          // merge sort → Caso 2: Θ(n^1.000 · log^1 n)
  print(masterTheorem(1, 2, 0));          // búsqueda binaria → Θ(log n)
  print(masterTheorem(3, 2, 1));          // Karatsuba → Θ(n^1.585)
  print(masterTheorem(7, 2, 2));          // Strassen → Θ(n^2.807)
  print(masterTheorem(2, 2, 1, k: -1));   // n/log n → Θ(n log log n)
}
```

Nota: la tolerancia `eps` evita errores de punto flotante al comparar c con log_b a (por ejemplo, log(8)/log(2) puede dar 2.9999999999999996). Para recurrencias con a o b racionales exactos conviene comparar con aritmética exacta.

### 4.8 Procedimiento recomendado

1. ¿Tiene la forma aT(n/b) + f(n) con a, b constantes? → **Teorema Maestro**.
2. ¿Varios subproblemas de tamaños distintos? → **Akra–Bazzi** (o árbol de recursión).
3. ¿Reduce n restando una constante (T(n−1), T(n−2))? → **telescopado** o **ecuación característica**.
4. ¿Forma extraña (√n, log n en el argumento)? → **cambio de variable** y luego (1).
5. Siempre que adivines una forma cerrada por árbol, **demuéstrala por sustitución**.

---

## 5. Algoritmos de búsqueda

### 5.1 Modelo y cotas inferiores

Buscar un valor x en una colección: devolver su posición o indicar que no está.

- **Sin estructura (arreglo sin ordenar):** Ω(n) comparaciones en el peor caso. *Argumento del adversario:* si el algoritmo termina sin haber mirado una posición i, el adversario coloca ahí el objetivo (o lo quita) y el algoritmo se equivoca. La búsqueda lineal es óptima.
- **Arreglo ordenado, modelo de comparaciones:** Ω(log n). *Argumento teórico-informacional:* hay n + 1 respuestas posibles (n posiciones y «ausente»); cada comparación tiene dos resultados, y un árbol binario con n + 1 hojas tiene altura ≥ ⌈log₂(n+1)⌉. **La búsqueda binaria es óptima** en este modelo.
- **Salir de la cota:** con estructuras que explotan más información (tablas hash: O(1) esperado; interpolación: O(log log n) esperado con datos uniformes) se evade Ω(log n), a cambio de suposiciones adicionales.

### 5.2 Búsqueda lineal

**Mecánica.** Recorrer secuencialmente hasta encontrar el objetivo o agotar los elementos. Costo: mejor caso 1 comparación, peor n, promedio (n+1)/2 si el objetivo existe y está uniformemente distribuido; Θ(n) tiempo, O(1) espacio. No exige orden ni acceso aleatorio (funciona en listas enlazadas y flujos).

**Optimizaciones**

- **Centinela.** El bucle ingenuo hace dos comprobaciones por elemento (límite e igualdad). Colocando el objetivo como último elemento (guardando el original) se elimina la comprobación del límite: una comparación por elemento. Es una micro-optimización que hoy ayuda sobre todo en bucles muy ajustados; exige que el arreglo sea mutable y no sea compartido entre hilos.
- **Desenrollado de bucle y SIMD.** Comparar 16–64 bytes por instrucción (`memchr`, `strchr` de libc, `std::find` vectorizado) da factores de 10× o más sobre el bucle escalar. Es la razón de que la búsqueda lineal gane a la binaria para arreglos de unas decenas de elementos (un umbral típico es 16–64, según el tipo y el hardware).
- **Listas auto-organizadas.** Con acceso sesgado (distribuciones tipo Zipf), reordenar tras cada acceso reduce el costo medio. *Move-to-front* es aproximadamente 2-competitivo (Sleator–Tarjan: su costo no pasa del doble del de cualquier otra política); *transposición* intercambia con el vecino anterior.
- **Cortar antes.** Si el arreglo está ordenado, se puede abortar al superar el objetivo (peor caso sigue siendo n, pero la búsqueda de un ausente cuesta la mitad en promedio).

```dart
/// Búsqueda lineal clásica. Devuelve el índice o -1.
int linearSearch<T>(List<T> a, T target) {
  for (var i = 0; i < a.length; i++) {
    if (a[i] == target) return i;
  }
  return -1;
}

/// Búsqueda con centinela: 1 comparación por elemento en el bucle caliente.
/// Muta temporalmente el último elemento (no es seguro con concurrencia).
int sentinelSearch<T>(List<T> a, T target) {
  final n = a.length;
  if (n == 0) return -1;
  final last = a[n - 1];
  a[n - 1] = target;                       // centinela: el bucle siempre termina
  var i = 0;
  while (a[i] != target) {
    i++;
  }
  a[n - 1] = last;                         // restaurar
  return (i < n - 1 || last == target) ? i : -1;
}
```

### 5.3 Búsqueda binaria clásica

**Precondición:** acceso aleatorio O(1) y arreglo ordenado según el mismo comparador con el que se busca.

**Mecánica.** Mantener un intervalo candidato y descartar la mitad en cada paso comparando con el elemento central. Intervalo cerrado `[lo, hi]`: mientras `lo ≤ hi`, `mid = lo + (hi − lo)/2`; si `a[mid] == x` terminar; si `a[mid] < x` entonces `lo = mid + 1`; si no `hi = mid − 1`. Hace como máximo ⌊log₂ n⌋ + 1 iteraciones. Θ(log n) en el peor caso y en el promedio, Θ(1) en el mejor, O(1) de espacio.

**Puntos que fallan en la práctica**

- **Desbordamiento de `lo + hi`.** `(lo + hi) / 2` desborda cuando lo + hi supera el máximo del entero. Este error vivió años en la implementación de referencia de Java y en libros de texto. Escribe siempre `lo + ((hi − lo) >> 1)`. En Dart nativo `int` es de 64 bits (el riesgo es teórico), pero en web (dart2js) los enteros son `double` de JavaScript con precisión exacta solo hasta 2⁵³.
- **Bucle infinito.** Si al descartar la mitad izquierda se hace `lo = mid` en lugar de `mid + 1` (o `hi = mid` en un intervalo cerrado), el intervalo puede dejar de encogerse. La función variante `hi − lo` debe decrecer en todas las ramas.
- **Cerrado vs semiabierto.** Mezclar las convenciones es la fuente principal de errores de índice. Recomendación: adoptar **siempre el intervalo semiabierto `[lo, hi)`** y escribir todas las variantes como una sola primitiva (5.4).

```dart
/// Búsqueda binaria con intervalo cerrado. Devuelve un índice con a[i] == x, o -1.
/// Con duplicados, devuelve cualquiera de ellos.
int binarySearch<T>(List<T> a, T x, Comparator<T> cmp) {
  var lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    final mid = lo + ((hi - lo) >> 1);     // sin desbordamiento
    final c = cmp(a[mid], x);
    if (c == 0) return mid;
    if (c < 0) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return -1;
}
```

### 5.4 `lower_bound` y `upper_bound`: la primitiva correcta

Con duplicados, «encontrar x» es ambiguo. Las dos definiciones precisas son:

- **lower_bound(x)** = min { i : a[i] ≥ x } (n si ninguno): primera posición donde se *podría insertar* x manteniendo el orden, antes de los iguales.
- **upper_bound(x)** = min { i : a[i] > x } (n si ninguno): primera posición *después* de todos los iguales a x.

A partir de ellas se derivan todas las consultas de un arreglo ordenado:

| Consulta | Expresión |
| --- | --- |
| ¿Existe x? | `i = lower_bound(x); i < n && a[i] == x` |
| Primera aparición | `lower_bound(x)` (si existe) |
| Última aparición | `upper_bound(x) − 1` (si existe) |
| Cantidad de copias de x | `upper_bound(x) − lower_bound(x)` |
| Elementos estrictamente menores que x | `lower_bound(x)` |
| Elementos ≤ x | `upper_bound(x)` |
| Punto de inserción estable (después de iguales) | `upper_bound(x)` |
| Elementos en el rango [x, y] | `upper_bound(y) − lower_bound(x)` |

Equivalentes en lenguajes: C++ `std::lower_bound`/`upper_bound`/`equal_range`; Python `bisect_left`/`bisect_right`; Go `sort.Search`/`slices.BinarySearch`; Rust `partition_point`; Java `Arrays.binarySearch` (devuelve `−(punto de inserción) − 1` si no está).

**Generalización: búsqueda del primer índice que cumple un predicado monótono.** Si `pred(i)` es falso hasta cierto punto y verdadero desde ahí, el primer índice verdadero se encuentra con una sola función. `lower_bound` es `pred(i) = a[i] ≥ x` y `upper_bound` es `pred(i) = a[i] > x`. Invariante (con centinelas conceptuales `pred(lo − 1) = falso` y `pred(hi) = verdadero`): la respuesta está en `[lo, hi]`.

```dart
/// Primer índice i en [lo, hi) con pred(i) verdadero, o hi si ninguno.
/// Requiere que pred sea monótono (falso...falso verdadero...verdadero).
int partitionPoint(int lo, int hi, bool Function(int) pred) {
  while (lo < hi) {
    final mid = lo + ((hi - lo) >> 1);
    if (pred(mid)) {
      hi = mid;          // la respuesta está en [lo, mid]
    } else {
      lo = mid + 1;      // la respuesta está en [mid+1, hi]
    }
  }
  return lo;
}

/// Primer i en [lo, hi) con a[i] >= x.
int lowerBound<T>(List<T> a, T x, Comparator<T> cmp, [int lo = 0, int? hi]) {
  var l = lo, h = hi ?? a.length;
  while (l < h) {
    final m = l + ((h - l) >> 1);
    if (cmp(a[m], x) < 0) {
      l = m + 1;
    } else {
      h = m;
    }
  }
  return l;
}

/// Primer i en [lo, hi) con a[i] > x.
int upperBound<T>(List<T> a, T x, Comparator<T> cmp, [int lo = 0, int? hi]) {
  var l = lo, h = hi ?? a.length;
  while (l < h) {
    final m = l + ((h - l) >> 1);
    if (cmp(a[m], x) <= 0) {
      l = m + 1;
    } else {
      h = m;
    }
  }
  return l;
}

/// Cantidad de elementos iguales a x, en O(log n).
int countEqual<T>(List<T> a, T x, Comparator<T> cmp) =>
    upperBound(a, x, cmp) - lowerBound(a, x, cmp);
```

**Por qué esta forma es más robusta.** Un solo bucle `while (l < h)`, sin rama de «encontrado», con invariante «a[0..l) < x ≤ a[h..n)». Hace como máximo ⌊log₂ n⌋ + 1 iteraciones y no tiene salida anticipada, así que el costo por consulta es casi constante; eso la hace buena candidata a una versión sin ramas (5.6).

### 5.5 Búsqueda binaria sobre la respuesta (bisección de un predicado monótono)

Muchos problemas de optimización «minimiza el máximo» o «maximiza el mínimo» se reducen a una búsqueda binaria sobre el **espacio de respuestas**, no sobre un arreglo: si se sabe decidir en O(f) si una respuesta candidata v es factible, y la factibilidad es monótona en v, la mejor respuesta se halla en O(f · log(rango)).

**Ejemplo: capacidad mínima de un camión para enviar paquetes (con orden fijo) en a lo sumo D días.** Factible(cap) es monótono: si cap sirve, cualquier capacidad mayor también. El rango es [max(pesos), sum(pesos)].

```dart
/// Capacidad mínima para enviar todos los paquetes, en orden, en ≤ days días.
int shipWithinDays(List<int> weights, int days) {
  bool feasible(int cap) {
    var need = 1, load = 0;
    for (final w in weights) {
      if (load + w > cap) {          // abrir un nuevo día
        need++;
        load = 0;
      }
      load += w;
    }
    return need <= days;
  }

  var lo = weights.reduce((a, b) => a > b ? a : b);   // al menos el paquete mayor
  var hi = weights.reduce((a, b) => a + b);           // todo en un día
  // primer cap en [lo, hi] con feasible(cap) verdadero
  return lo + partitionPoint(0, hi - lo + 1, (d) => feasible(lo + d));
}
```

**Con dominio real** (por ejemplo, calcular √x o resolver f(x) = 0 con f monótona) no se compara con una tolerancia ε en el bucle: se ejecuta un **número fijo de iteraciones** (≈ 60–100 reduce el intervalo hasta la resolución del `double`), porque `while (hi − lo > eps)` puede no terminar si eps es menor que el espaciado de los reales en esa magnitud. Para la raíz cuadrada o ecuaciones suaves, **Newton–Raphson** converge cuadráticamente y suele ser preferible cuando se dispone de la derivada.

**Otras variantes del mismo patrón:** búsqueda en un arreglo **rotado** (`pred(i) = a[i] < a[0]` es monótono si los valores son distintos y el arreglo es una rotación; con duplicados el peor caso degrada a O(n)); **pico** en un arreglo bitónico (`pred(i) = a[i] > a[i+1]`); **raíz entera** de un número; **k-ésimo menor en la tabla de multiplicación**; **mediana de dos arreglos ordenados** en O(log min(m, n)).

### 5.6 Optimizaciones de hardware para la búsqueda binaria

La búsqueda binaria hace log₂ n pasos, pero en arreglos grandes cada paso es un **fallo de caché** (el salto es largo) y cada comparación es un **salto impredecible** (50 % de acierto). El costo real es dominado por esos dos efectos, no por las comparaciones.

**(a) Versión sin ramas (branchless).** Se sustituye la bifurcación por una selección aritmética o `cmov`, de modo que el procesador no especule y no haya penalización por mala predicción:

```dart
/// lower_bound sin ramas sobre List<int>. En C/C++/Rust el compilador emite cmov;
/// en Dart es ilustrativo (la VM no garantiza la instrucción).
int lowerBoundBranchless(List<int> a, int x) {
  var n = a.length;
  if (n == 0) return 0;
  var base = 0;
  while (n > 1) {
    final half = n >> 1;
    // en C: base += (a[base + half - 1] < x) * half;
    if (a[base + half - 1] < x) base += half;
    n -= half;
  }
  return base + (a[base] < x ? 1 : 0);
}
```
El bucle ejecuta exactamente ⌈log₂ n⌉ iteraciones con un cuerpo de longitud constante, lo que permite además **prefetch** de las dos posibles posiciones siguientes. Con datos que caben en caché suele ser notablemente más rápido que la versión con ramas.

**(b) Distribución Eytzinger.** Almacenar el arreglo ordenado en el orden **por niveles (BFS) de un árbol binario de búsqueda implícito**: la raíz en el índice 1, los hijos de k en 2k y 2k+1. Los primeros niveles del árbol (los más consultados) quedan contiguos en memoria y en las mismas líneas de caché; los hijos de un nodo están adyacentes, así que se pueden precargar. En arreglos mayores que la caché L2/L3, esta disposición suele ofrecer aceleraciones de varios × sobre la binaria clásica (el factor concreto depende del hardware y del tamaño; hay que medirlo).

```dart
/// Construye la disposición Eytzinger (índices 1..n; el 0 queda sin usar)
/// a partir de un arreglo ordenado, con un recorrido en orden del árbol implícito.
List<int> buildEytzinger(List<int> sorted) {
  final n = sorted.length;
  final e = List<int>.filled(n + 1, 0);
  var i = 0;
  void fill(int k) {
    if (k > n) return;
    fill(2 * k);
    e[k] = sorted[i++];
    fill(2 * k + 1);
  }
  fill(1);
  return e;
}

/// lower_bound sobre la disposición Eytzinger.
/// Devuelve el índice en e (1..n) del menor elemento >= x, o 0 si no existe.
int eytzingerLowerBound(List<int> e, int x) {
  final n = e.length - 1;
  var k = 1;
  while (k <= n) {
    k = 2 * k + (e[k] < x ? 1 : 0);        // izquierda = 0, derecha = 1
  }
  // El último giro a la izquierda marca la respuesta: eliminar los unos finales
  // y el cero que los precede.
  while ((k & 1) == 1) {
    k >>= 1;
  }
  return k >> 1;
}
```
La recuperación al final es correcta porque la secuencia de bits de k describe el camino recorrido (0 = izquierda, 1 = derecha) y el candidato a lower_bound es el último nodo desde el cual se fue a la izquierda. Si nunca se fue a la izquierda, k queda en 0 y no hay elemento ≥ x.

**(c) Disposiciones por bloques (S-tree / B-tree implícito).** Se generaliza a nodos de B claves que ocupan una línea de caché de 64 B (16 enteros de 32 bits) y se comparan con una sola instrucción SIMD. Para n grande esto puede superar a Eytzinger (de nuevo: mide en tu hardware). Es la lógica del B+ tree de las bases de datos llevada a memoria.

### 5.7 Búsqueda por interpolación

**Idea.** En una guía telefónica nadie abre por la mitad para buscar «Zúñiga»: se estima la posición según el valor. Si las claves están uniformemente distribuidas, se estima la posición por interpolación lineal entre los extremos del intervalo actual:

pos = lo + ⌊ (x − a[lo]) · (hi − lo) / (a[hi] − a[lo]) ⌋

y se compara `a[pos]` con x, estrechando el intervalo como en la búsqueda binaria.

**Complejidad.** Con claves uniformes e independientes, **O(log log n) comparaciones esperadas** (resultado clásico de Perl–Itai–Avni y Yao–Yao). En el peor caso, con distribuciones muy sesgadas (por ejemplo, claves de crecimiento exponencial) **degrada a O(n)**: cada estimación descarta un solo elemento.

**Trampas de implementación**

- **División por cero** si `a[hi] == a[lo]`.
- **Desbordamiento del producto** `(x − a[lo]) · (hi − lo)` en enteros de 64 bits: se calcula con `double` (como abajo) o con enteros de 128 bits. La resta `x − a[lo]` también puede desbordar si el rango de los valores es del orden de 2⁶³.
- **Condición de entrada** `x ∈ [a[lo], a[hi]]`: garantiza que `pos` caiga dentro del intervalo.
- **Distribución no uniforme:** si se conoce la CDF aproximada, se interpola con la CDF en lugar de con una recta (idea de los **índices aprendidos**).

```dart
/// Búsqueda por interpolación en List<int> ordenada. Devuelve un índice o -1.
int interpolationSearch(List<int> a, int x) {
  var lo = 0, hi = a.length - 1;
  while (lo <= hi && x >= a[lo] && x <= a[hi]) {
    if (a[hi] == a[lo]) return lo;                  // todos iguales y x == a[lo]
    // En double para evitar desbordar el producto en enteros de 64 bits.
    final pos = lo + (((x - a[lo]) / (a[hi] - a[lo])) * (hi - lo)).floor();
    if (a[pos] == x) return pos;
    if (a[pos] < x) {
      lo = pos + 1;
    } else {
      hi = pos - 1;
    }
  }
  return -1;
}

/// Variante híbrida: alterna una sonda por interpolación con una sonda de bisección.
/// Garantiza O(log n) en el peor caso (≤ 2·⌈log₂ n⌉ sondas) y conserva el
/// comportamiento O(log log n) esperado con datos uniformes.
int hybridInterpolationSearch(List<int> a, int x) {
  var lo = 0, hi = a.length - 1;
  var useInterpolation = true;
  while (lo <= hi && x >= a[lo] && x <= a[hi]) {
    int pos;
    if (useInterpolation && a[hi] != a[lo]) {
      pos = lo + (((x - a[lo]) / (a[hi] - a[lo])) * (hi - lo)).floor();
    } else {
      pos = lo + ((hi - lo) >> 1);
    }
    useInterpolation = !useInterpolation;
    if (a[pos] == x) return pos;
    if (a[pos] < x) {
      lo = pos + 1;
    } else {
      hi = pos - 1;
    }
  }
  return -1;
}
```

**Cuándo usarla.** Arreglos grandes (≳ 10⁵–10⁶) de claves numéricas aproximadamente uniformes (marcas de tiempo regulares, IDs casi secuenciales), donde cada sonda cuesta un fallo de caché o una lectura de disco. En arreglos pequeños o con distribución desconocida, la binaria (o su versión sin ramas) es más segura; el cálculo en coma flotante de cada paso es caro y su ganancia se reduce.

### 5.8 Búsqueda exponencial (galloping)

**Idea.** Encontrar primero un intervalo que contenga al objetivo duplicando el índice (1, 2, 4, 8, …) y luego aplicar búsqueda binaria dentro de él.

**Complejidad.** Si el objetivo está en la posición p, la fase de duplicación toma ⌈log₂ p⌉ pasos y la binaria otros ⌈log₂ p⌉: **O(log p)**, no O(log n). Es un algoritmo **adaptativo a la salida**.

**Cuándo gana a la binaria clásica**

- **Arreglos de tamaño desconocido o infinitos** (streams con acceso por índice, listas con tope no conocido).
- **El objetivo suele estar cerca del principio** (búsquedas consecutivas con claves crecientes: se reanuda desde la última posición).
- **Fusión de dos listas de tamaños muy distintos** (m ≪ n): buscar cada elemento de la corta en la larga con galloping cuesta O(m·log(n/m)), mejor que O(m + n) del merge lineal cuando m es pequeño. **Es el «modo galloping» de Timsort.**
- **Intersección de conjuntos ordenados** (motores de búsqueda, índices invertidos) y consultas de rango adaptativas.

```dart
/// lower_bound con búsqueda exponencial: O(log p), p = resultado.
int exponentialLowerBound(List<int> a, int x) {
  final n = a.length;
  if (n == 0 || a[0] >= x) return 0;
  var bound = 1;                                   // invariante: a[bound ~/ 2] < x
  while (bound < n && a[bound] < x) {
    bound <<= 1;
  }
  // La respuesta está en (bound/2, min(bound, n)]. Buscar en [bound/2+1, min(bound,n)).
  final lo = (bound >> 1) + 1;
  final hi = bound < n ? bound : n;
  return lowerBound<int>(a, x, (p, q) => p.compareTo(q), lo, hi);
}
```

### 5.9 Otras búsquedas que conviene conocer

- **Búsqueda ternaria.** Sirve para encontrar el máximo/mínimo de una función **unimodal** (no estrictamente creciente seguida de decreciente), dividiendo el intervalo en tercios y descartando uno. **No es mejor que la binaria para buscar en arreglos ordenados:** hace 2 comparaciones por paso con log₃ n pasos, es decir 2·log₃ n ≈ 1.26·log₂ n > log₂ n. Para funciones, la búsqueda por **sección áurea** reutiliza una de las dos evaluaciones por paso (útil si evaluar f es caro).
- **Búsqueda por saltos (jump search).** Saltar bloques de √n y luego recorrer linealmente un bloque: Θ(√n). Solo tiene sentido cuando retroceder es caro o imposible (cinta, flujos con salto hacia delante).
- **Búsqueda de Fibonacci.** Divide el intervalo según los números de Fibonacci usando solo sumas y restas; útil históricamente en hardware sin división rápida y cuando el acceso a posiciones cercanas es más barato.
- **Búsqueda k-aria.** Comparar k − 1 claves por paso (con SIMD) reduce los pasos a log_k n; es la base de los S-trees y de los nodos de B-tree.
- **Búsqueda en matriz ordenada por filas y columnas (m × n).** Empezar en la esquina superior derecha y descartar una fila o columna en cada paso: **O(m + n)**.
- **Cascada fraccionaria (fractional cascading).** Para buscar el mismo valor en k listas ordenadas en O(log n + k) en lugar de O(k log n), enlazando muestras entre listas.
- **Tablas hash.** O(1) esperado para igualdad exacta; no sirven para rangos, mínimos ni vecinos.

### 5.10 Resumen de búsquedas

| Algoritmo | Precondición | Mejor | Promedio | Peor | Espacio | Notas |
| --- | --- | --- | --- | --- | --- | --- |
| Lineal | Ninguna | O(1) | O(n) | O(n) | O(1) | Óptima sin orden; gana en n pequeño |
| Binaria | Ordenado, acceso aleatorio | O(1) | O(log n) | O(log n) | O(1) | Óptima por comparaciones |
| `lower_bound`/`upper_bound` | Ordenado | O(log n) | O(log n) | O(log n) | O(1) | Primitiva para duplicados e inserción |
| Sobre la respuesta | Predicado monótono | — | — | O(f · log R) | O(1) | R = tamaño del rango de respuestas |
| Interpolación | Ordenado, claves numéricas | O(1) | O(log log n) uniforme | O(n) | O(1) | Híbrida: O(log n) garantizado |
| Exponencial | Ordenado | O(1) | O(log p) | O(log p) | O(1) | Tamaño desconocido; objetivo cercano |
| Eytzinger / B-tree implícito | Ordenado, reestructurado | — | O(log n) | O(log n) | O(n) | 2×–varios× más rápida en memoria grande |
| Ternaria | Función unimodal | — | O(log n) | O(log n) | O(1) | No usar para arreglos ordenados |
| Por saltos | Ordenado | O(1) | O(√n) | O(√n) | O(1) | Solo si retroceder es caro |
| Matriz ordenada | Filas y columnas ordenadas | O(1) | O(m + n) | O(m + n) | O(1) | Escalera desde una esquina |

### 5.11 Trade-offs y criterio de elección

| Situación | Elección |
| --- | --- |
| Arreglo pequeño (≲ 16–64 elementos) o sin ordenar, una sola consulta | Lineal |
| Muchas consultas sobre datos estáticos | Ordenar una vez (O(n log n)) y usar binaria; o tabla hash si solo hay igualdad |
| Datos ordenados con duplicados, o necesito la posición de inserción/conteo | `lower_bound` / `upper_bound` |
| Datos estáticos enormes y búsqueda en el camino crítico | Distribución Eytzinger o S-tree; binaria sin ramas |
| Claves numéricas casi uniformes y datos grandes | Interpolación híbrida |
| Tamaño desconocido, o resultados cercanos al inicio, o fusionar listas muy desiguales | Exponencial / galloping |
| El problema pide «el mínimo/máximo v tal que...» | Bisección sobre la respuesta |
| Datos dinámicos con inserciones | Árbol balanceado, skip list o B-tree (la binaria sobre arreglo cuesta O(n) por inserción) |
| Datos en disco | B+ tree: log_B n lecturas de página |

---

## 6. Algoritmos de ordenación basados en comparación

### 6.1 Propiedades que definen un algoritmo de ordenación

- **Estabilidad.** Un algoritmo es *estable* si elementos con claves iguales conservan su orden relativo original: si i < j y clave(a[i]) = clave(a[j]), entonces a[i] aparece antes que a[j] en la salida. Importa al ordenar por varios criterios: ordenar por el criterio secundario y luego, de forma estable, por el principal, deja el orden compuesto correcto. Un algoritmo inestable se puede volver estable *decorando* cada elemento con su índice original y desempatando por él (costo O(n) de memoria extra).
- **In-place vs out-of-place.** *In-place* usa memoria auxiliar O(1) (estricto) u O(log n) (liberal, permitiendo la pila de recursión). *Out-of-place* necesita O(n).
- **Adaptividad.** Un algoritmo es *adaptativo* si su costo depende del grado de desorden de la entrada (número de inversiones, número de runs ascendentes), no solo de n. Insertion sort cuesta Θ(n + I), con I = número de inversiones.
- **Online.** Puede ordenar a medida que llegan los elementos (insertion sort).
- **Costo en comparaciones vs movimientos.** Con claves caras de comparar (cadenas largas, comparadores con E/S) interesa minimizar comparaciones (merge sort, inserción binaria); con elementos caros de mover o escrituras costosas (flash) interesa minimizar escrituras (selection sort, cycle sort).

**Inversión:** par (i, j) con i < j y a[i] > a[j]. El número de inversiones I va de 0 (ordenado) a n(n−1)/2 (orden inverso) y vale n(n−1)/4 en promedio para permutaciones uniformes. Todo algoritmo que solo intercambia elementos adyacentes necesita al menos I intercambios, de ahí el Θ(n²) de bubble e insertion sort en promedio.

### 6.2 Cota inferior Ω(n log n)

**Teorema.** Todo algoritmo de ordenación que solo obtiene información comparando pares de elementos necesita Ω(n log n) comparaciones en el peor caso.

**Demostración (árbol de decisión).** Cualquier algoritmo de este tipo se modela como un árbol binario: cada nodo interno es una comparación `a_i ≤ a_j`, cada hoja es una permutación que el algoritmo declara como la ordenación. Para ser correcto, debe haber al menos una hoja por cada una de las n! permutaciones posibles de la entrada. Un árbol binario de altura h tiene a lo sumo 2ʰ hojas, así que 2ʰ ≥ n! y

h ≥ log₂(n!) = n·log₂ n − n·log₂ e + O(log n) = Ω(n log n).

La altura del árbol es el número de comparaciones del peor caso. ∎

**Consecuencias**

- **También vale en el caso promedio:** la profundidad media de las hojas de un árbol binario con n! hojas es ≥ log₂(n!). Y para algoritmos aleatorizados (por el principio de Yao).
- **Merge sort y heap sort son óptimos asintóticamente** en este modelo. Quicksort lo es en esperanza.
- **Valores exactos pequeños:** el mínimo de comparaciones necesarias para n = 1…8 es 0, 1, 3, 5, 7, 10, 13, 16. Para n = 5 hacen falta ⌈log₂ 120⌉ = 7, y el algoritmo de **Ford–Johnson (merge insertion)** lo logra. Es casi óptimo en comparaciones, pero impráctico por la complejidad de los movimientos.
- **Cómo escapar:** la cota se aplica solo a algoritmos *basados en comparaciones*. Con claves enteras y acceso por índice (counting, radix, bucket; sección 8) se ordena en tiempo lineal bajo supuestos adicionales.

### 6.3 Utilidades comunes

```dart
void _swap<T>(List<T> a, int i, int j) {
  final t = a[i];
  a[i] = a[j];
  a[j] = t;
}
```

Todas las funciones de esta sección operan sobre `List<T>` con `Comparator<T>` (un valor negativo, cero o positivo). Los rangos son `[lo, hi)`. El contrato del comparador exige un **orden total consistente**: antisimétrico, transitivo y que trate de igual forma los empates; si no, los algoritmos pueden entrar en bucles, fallar o dar resultados incorrectos (ver 9.7).

### 6.4 Bubble sort

**Mecánica.** Recorre el arreglo comparando pares adyacentes e intercambiándolos si están en mal orden; tras cada pasada el mayor elemento no ordenado «burbujea» hasta su posición final. **Invariante:** tras la pasada k, los k mayores elementos están en su lugar definitivo.

**Análisis.**

- Comparaciones: n(n−1)/2 en la versión simple; con *salida anticipada* (se detiene si una pasada no intercambia) el mejor caso es **n − 1 comparaciones, Θ(n)**.
- Intercambios: exactamente I (número de inversiones): n(n−1)/4 en promedio. Es lo que lo hace lento: cada intercambio es una lectura y dos escrituras.
- Peor y promedio Θ(n²); espacio O(1); **estable**; adaptativo en su forma optimizada.

**Cuello de botella.** Los elementos pequeños cerca del final («tortugas») retroceden solo una posición por pasada, mientras que los grandes al inicio («conejos») avanzan rápido. De ahí las variantes **cocktail shaker** (recorre en ambos sentidos) y **comb sort** (compara con una brecha que se reduce por un factor ≈ 1.3, eliminando tortugas temprano). Bubble sort no tiene uso práctico; sirve para enseñar invariantes y como ejemplo de red de ordenación (odd-even transposition sort es paralelizable en n rondas).

```dart
/// Bubble sort con límite adaptativo: lo posterior a la última permutación ya está ordenado.
void bubbleSort<T>(List<T> a, Comparator<T> cmp) {
  var n = a.length;
  while (n > 1) {
    var lastSwap = 0;
    for (var i = 1; i < n; i++) {
      if (cmp(a[i - 1], a[i]) > 0) {
        _swap(a, i - 1, i);
        lastSwap = i;
      }
    }
    n = lastSwap;   // si no hubo intercambios, n = 0 y el bucle termina
  }
}
```

### 6.5 Insertion sort y Shell sort

**Mecánica.** Mantiene un prefijo ordenado `a[lo..i)` y, para cada nuevo elemento, **desplaza** a la derecha los mayores y lo coloca en el hueco. Usar desplazamientos en lugar de intercambios reduce las escrituras de 3 por paso a 1.

**Análisis.**

- Comparaciones y movimientos: Θ(n + I). Mejor caso (ordenado) **Θ(n)**; peor caso (inverso) Θ(n²) con n(n−1)/2 desplazamientos; promedio ≈ n²/4.
- Espacio O(1); **estable** (si el bucle usa `> 0` estricto); **adaptativo** y **online**.

**Por qué se sigue usando.** Tiene la constante más baja de los algoritmos cuadráticos, un bucle interno muy corto, acceso secuencial y comportamiento Θ(n) en datos casi ordenados. Todas las ordenaciones de librería (introsort, Timsort, pdqsort, merge sort híbrido) cambian a insertion sort para subarreglos de ≈ 16–32 elementos.

**Inserción binaria.** Buscar la posición con búsqueda binaria reduce las comparaciones a O(n log n), pero los desplazamientos siguen siendo O(n²) (aunque un `memmove` es muy rápido). Conviene cuando las comparaciones son caras. Timsort la usa para extender runs cortos.

**Shell sort.** Generaliza insertion sort ordenando primero elementos separados por una brecha h, que se reduce hasta 1. Cada pasada con brecha h deja el arreglo *h-ordenado*, y la pasada final con h = 1 encuentra un arreglo casi ordenado, donde insertion sort cuesta casi n. Complejidad según la secuencia de brechas: Shell original (n/2, n/4, …) peor caso Θ(n²); Hibbard (2ᵏ − 1) Θ(n^1.5); Sedgewick Θ(n^(4/3)); Pratt (números 3-suaves) Θ(n log² n); la secuencia de **Ciura** (1, 4, 10, 23, 57, 132, 301, 701, y luego ×2.25) es empírica y excelente en la práctica. In-place, **inestable**, adaptativo parcial. Es la elección típica cuando no se dispone de recursión ni memoria dinámica (sistemas embebidos, núcleos).

```dart
/// Insertion sort sobre [lo, hi). Estable y adaptativo.
void insertionSort<T>(List<T> a, Comparator<T> cmp, [int lo = 0, int? hi]) {
  final end = hi ?? a.length;
  for (var i = lo + 1; i < end; i++) {
    final x = a[i];
    var j = i - 1;
    while (j >= lo && cmp(a[j], x) > 0) {   // '>' estricto → estable
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = x;
  }
}

/// Inserción binaria: O(n log n) comparaciones, O(n²) movimientos (con memmove).
void binaryInsertionSort<T>(List<T> a, Comparator<T> cmp, [int lo = 0, int? hi]) {
  final end = hi ?? a.length;
  for (var i = lo + 1; i < end; i++) {
    final x = a[i];
    var l = lo, h = i;
    while (l < h) {                          // upper_bound en a[lo..i) → estable
      final m = l + ((h - l) >> 1);
      if (cmp(a[m], x) <= 0) {
        l = m + 1;
      } else {
        h = m;
      }
    }
    a.setRange(l + 1, i + 1, a, l);          // desplaza a[l..i) una posición
    a[l] = x;
  }
}

/// Shell sort con la secuencia de Ciura extendida (×2.25). Inestable.
void shellSort<T>(List<T> a, Comparator<T> cmp) {
  final n = a.length;
  final gaps = <int>[1, 4, 10, 23, 57, 132, 301, 701];
  while (gaps.last * 9 ~/ 4 < n) {
    gaps.add(gaps.last * 9 ~/ 4);
  }
  for (var g = gaps.length - 1; g >= 0; g--) {
    final h = gaps[g];
    if (h >= n) continue;
    for (var i = h; i < n; i++) {
      final x = a[i];
      var j = i;
      while (j >= h && cmp(a[j - h], x) > 0) {
        a[j] = a[j - h];
        j -= h;
      }
      a[j] = x;
    }
  }
}
```

### 6.6 Selection sort

**Mecánica.** En cada paso i busca el mínimo de `a[i..n)` y lo intercambia con `a[i]`. **Invariante:** `a[0..i)` contiene los i menores elementos en su orden final.

**Análisis.**

- Comparaciones: **siempre** n(n−1)/2, independientemente de la entrada; **no adaptativo** (el mejor caso también es Θ(n²)).
- Intercambios: como máximo **n − 1**, el mínimo posible entre los algoritmos de intercambio. Esa es su única virtud: cuando una **escritura** cuesta mucho más que una lectura (memoria flash/EEPROM con ciclos limitados), selection sort (y el aún más económico *cycle sort*, que escribe cada elemento a lo sumo una vez) es razonable.
- **Inestable:** el intercambio a larga distancia puede saltarse elementos iguales. Se vuelve estable si en lugar de intercambiar se *desplaza* (con un costo cuadrático en movimientos).
- Es la base conceptual de **heap sort**: selection sort donde «buscar el máximo» cuesta O(log n) gracias a un heap.

```dart
void selectionSort<T>(List<T> a, Comparator<T> cmp) {
  final n = a.length;
  for (var i = 0; i < n - 1; i++) {
    var m = i;
    for (var j = i + 1; j < n; j++) {
      if (cmp(a[j], a[m]) < 0) m = j;
    }
    if (m != i) _swap(a, i, m);
  }
}
```

### 6.7 Merge sort

**Mecánica.** Divide el arreglo en dos mitades, las ordena recursivamente y las **fusiona** en una sola lista ordenada: dos punteros recorren las mitades y siempre se copia el menor de los dos elementos actuales. Para que sea **estable**, ante un empate se toma el de la mitad **izquierda**.

**Análisis.**

- Recurrencia T(n) = 2T(n/2) + Θ(n) ⇒ **Θ(n log n) en el mejor, promedio y peor caso** (Teorema Maestro, caso 2).
- Comparaciones: entre ≈ ½·n log₂ n (mejor caso) y n⌈log₂ n⌉ − 2^⌈log₂ n⌉ + 1 (peor caso exacto), muy cerca de la cota teórica ⌈log₂ n!⌉; es el algoritmo con **menos comparaciones** entre los prácticos. Quicksort hace ≈ 1.39·n log₂ n en promedio.
- Espacio: **O(n) auxiliar** en la versión estándar; Θ(log n) de pila.
- **Estable**, no adaptativo en su forma básica, aunque admite varias mejoras que lo hacen adaptativo.

**Cuellos de botella y optimizaciones**

1. **Subarreglos pequeños:** cambiar a insertion sort por debajo de ≈ 16–32 elementos elimina la mayor parte de la sobrecarga de recursión.
2. **Omitir la fusión si ya está ordenado:** si `a[mid−1] ≤ a[mid]`, ambas mitades ya forman una secuencia ordenada. Hace que la entrada ya ordenada cueste Θ(n).
3. **Buffer de media longitud:** solo se copia la mitad **izquierda** a un buffer auxiliar de n/2 elementos y se fusiona de vuelta sobre el arreglo original (la escritura nunca adelanta a la lectura de la mitad derecha).
4. **Buffers alternados (ping-pong):** en la versión *bottom-up* se alterna entre el arreglo y un buffer en cada nivel, evitando copiar de vuelta.
5. **Natural merge sort:** detectar los *runs* ascendentes ya existentes y fusionarlos de a pares, para costo Θ(n log r), con r el número de runs (es la base de Timsort).
6. **Fusión in-place:** existen fusiones estables con O(1) de espacio (SymMerge, block merge de WikiSort/GrailSort), pero con constantes altas y gran complejidad de implementación.
7. **Listas enlazadas:** merge sort es el algoritmo natural (sin acceso aleatorio, O(1) de espacio extra con relinking, estable, Θ(n log n)).
8. **Paralelismo:** las dos mitades son independientes; la fusión se paraleliza particionando por *merge path*. Trabajo Θ(n log n), profundidad Θ(log² n) con la fusión paralela.
9. **E/S externa:** la fusión secuencial es ideal para disco; es la base de la ordenación externa (9.4).

```dart
/// Merge sort estable con buffer de n/2 y corte a inserción para rangos pequeños.
void mergeSort<T>(List<T> a, Comparator<T> cmp) {
  final n = a.length;
  if (n < 2) return;
  final buf = List<T>.filled(n ~/ 2 + 1, a[0]);   // a[0] solo como relleno inicial
  _msort(a, buf, 0, n, cmp);
}

void _msort<T>(List<T> a, List<T> buf, int lo, int hi, Comparator<T> cmp) {
  if (hi - lo <= 24) {
    insertionSort(a, cmp, lo, hi);
    return;
  }
  final mid = lo + ((hi - lo) >> 1);
  _msort(a, buf, lo, mid, cmp);
  _msort(a, buf, mid, hi, cmp);
  if (cmp(a[mid - 1], a[mid]) <= 0) return;       // ya ordenado: omitir la fusión
  _merge(a, buf, lo, mid, hi, cmp);
}

/// Fusiona a[lo..mid) y a[mid..hi) copiando solo la mitad izquierda al buffer.
void _merge<T>(List<T> a, List<T> buf, int lo, int mid, int hi, Comparator<T> cmp) {
  final len = mid - lo;
  buf.setRange(0, len, a, lo);                    // copia de la mitad izquierda
  var i = 0, j = mid, k = lo;
  while (i < len && j < hi) {
    if (cmp(buf[i], a[j]) <= 0) {                 // '<=' → toma la izquierda: estable
      a[k++] = buf[i++];
    } else {
      a[k++] = a[j++];
    }
  }
  while (i < len) {
    a[k++] = buf[i++];                            // el resto de la derecha ya está en su sitio
  }
}
```

**Por qué la escritura no pisa datos sin leer.** Mientras quedan elementos en el buffer (i < len), el índice de escritura es k = lo + i + (j − mid) y siempre k ≤ j; la igualdad solo se alcanza cuando el buffer se agota, y entonces lo que queda de la derecha ya está en su lugar.

**Aplicación clásica: contar inversiones en O(n log n).** Durante la fusión, cada vez que se toma un elemento de la mitad derecha antes de que se agote la izquierda, ese elemento forma una inversión con **todos** los elementos restantes de la izquierda. Sirve para medir cuán desordenado está un arreglo (y es la base de la distancia de Kendall-tau):

```dart
/// Número de pares (i < j) con a[i] > a[j]. No modifica la entrada.
int countInversions(List<int> a) {
  final b = List<int>.of(a);
  final tmp = List<int>.filled(a.length, 0);
  int rec(int lo, int hi) {
    if (hi - lo < 2) return 0;
    final mid = (lo + hi) >> 1;
    var inv = rec(lo, mid) + rec(mid, hi);
    var i = lo, j = mid, k = lo;
    while (i < mid && j < hi) {
      if (b[i] <= b[j]) {
        tmp[k++] = b[i++];
      } else {
        tmp[k++] = b[j++];
        inv += mid - i;                           // b[j] < todos los b[i..mid)
      }
    }
    while (i < mid) {
      tmp[k++] = b[i++];
    }
    while (j < hi) {
      tmp[k++] = b[j++];
    }
    for (var t = lo; t < hi; t++) {
      b[t] = tmp[t];
    }
    return inv;
  }
  return rec(0, b.length);
}
```

**Natural merge sort (detecta runs).** Costo Θ(n log r), mejor caso Θ(n) en entradas ya ordenadas, y estable:

```dart
void naturalMergeSort<T>(List<T> a, Comparator<T> cmp) {
  final n = a.length;
  if (n < 2) return;
  var src = a;
  var dst = List<T>.of(a);
  // 1) Fronteras de runs ascendentes (no estrictos: conserva estabilidad).
  var bounds = <int>[0];
  for (var i = 1; i < n; i++) {
    if (cmp(src[i - 1], src[i]) > 0) bounds.add(i);
  }
  bounds.add(n);
  // 2) Fusionar runs adyacentes de a pares hasta que quede uno.
  while (bounds.length > 2) {
    final next = <int>[0];
    var r = 0;
    for (; r + 2 < bounds.length; r += 2) {
      _mergeInto(src, dst, bounds[r], bounds[r + 1], bounds[r + 2], cmp);
      next.add(bounds[r + 2]);
    }
    if (r + 1 < bounds.length) {                   // run huérfano: se copia tal cual
      dst.setRange(bounds[r], bounds[r + 1], src, bounds[r]);
      next.add(bounds[r + 1]);
    }
    bounds = next;
    final t = src;
    src = dst;
    dst = t;
  }
  if (!identical(src, a)) a.setRange(0, n, src);
}

void _mergeInto<T>(List<T> src, List<T> dst, int lo, int mid, int hi, Comparator<T> cmp) {
  var i = lo, j = mid, k = lo;
  while (i < mid && j < hi) {
    dst[k++] = cmp(src[i], src[j]) <= 0 ? src[i++] : src[j++];
  }
  while (i < mid) {
    dst[k++] = src[i++];
  }
  while (j < hi) {
    dst[k++] = src[j++];
  }
}
```

**K-way merge con heap.** Fusionar k listas ordenadas con un heap mínimo cuesta O(N log k) para N elementos totales; es la pieza central de la ordenación externa (sección 9.4) y de las lecturas de un LSM-tree.

### 6.8 Quicksort

**Mecánica.** Elige un **pivote**, **particiona** el arreglo de modo que lo menor quede a un lado y lo mayor al otro, y ordena recursivamente cada parte. La partición hace todo el trabajo: no hay fase de combinación.

**Análisis.**

- **Mejor caso** (pivote ≈ mediana): T(n) = 2T(n/2) + Θ(n) = Θ(n log n).
- **Peor caso** (pivote siempre el mínimo o el máximo): T(n) = T(n−1) + Θ(n) = **Θ(n²)**. Ocurre con pivote fijo en el primer/último elemento sobre una entrada ya ordenada, o con muchos duplicados y una partición de dos vías mal diseñada.
- **Promedio / esperado con pivote aleatorio:** ≈ **2n ln n ≈ 1.39·n log₂ n comparaciones** (3.1) y ≈ n ln n / 3 intercambios con Hoare. Con *probabilidad alta* termina en O(n log n).
- **Espacio:** O(log n) si se recursa en la partición **menor** y se itera sobre la mayor (la pila nunca pasa de log₂ n); O(n) en el peor caso si no se hace.
- **Inestable**, in-place, no adaptativo (salvo variantes como pdqsort).

**Por qué gana a merge sort en la práctica.** Trabaja in-place con recorridos secuenciales muy amigables a la caché, mueve menos datos (no copia a un buffer en cada nivel) y su bucle interno es mínimo. Su debilidad: en datos aleatorios, cada comparación contra el pivote es un salto impredecible (≈ 50 % de fallos de predicción), y ese costo es hoy el cuello de botella dominante (se ataca con particiones sin ramas, ver abajo).

#### Estrategias de partición

**Lomuto.** Pivote = último elemento. Un índice `i` marca el límite de los menores; `j` recorre. Es simple y fácil de demostrar, pero hace **≈ n/2 intercambios** de media (frente a ≈ n/6 de Hoare), no es estable y **degrada a Θ(n²) con muchos duplicados** (con `<`, todos los iguales caen en un lado). Sirve para enseñar y para entrevistas.

```dart
/// Partición de Lomuto sobre [lo, hi] (hi inclusive). Devuelve la posición final del pivote.
int lomutoPartition<T>(List<T> a, int lo, int hi, Comparator<T> cmp) {
  final pivot = a[hi];
  var i = lo;
  for (var j = lo; j < hi; j++) {
    if (cmp(a[j], pivot) < 0) {
      _swap(a, i, j);
      i++;
    }
  }
  _swap(a, i, hi);
  return i;
}

void quickSortLomuto<T>(List<T> a, Comparator<T> cmp, [int lo = 0, int? hi]) {
  final h = hi ?? a.length - 1;
  if (lo >= h) return;
  final p = lomutoPartition(a, lo, h, cmp);
  quickSortLomuto(a, cmp, lo, p - 1);
  quickSortLomuto(a, cmp, p + 1, h);
}
```

**Hoare (la original, 1961).** Dos índices avanzan uno hacia el otro: `i` desde la izquierda hasta encontrar un elemento ≥ pivote, `j` desde la derecha hasta encontrar un elemento ≤ pivote; si no se han cruzado, se intercambian. **Se detienen en los iguales**, de modo que con muchos duplicados genera particiones balanceadas (a costa de intercambiar iguales). Devuelve `j` tal que `a[lo..j] ≤ pivote ≤ a[j+1..hi]`; el pivote **no** queda necesariamente en su posición final, y se recursa en `[lo, j]` y `[j+1, hi]`.

*Detalle de corrección:* la versión del código requiere que `lo ≤ j < hi` al retornar (si no, la recursión no progresa). Se garantiza usando como valor de pivote el elemento **del medio** (`mid < hi` cuando hay ≥ 2 elementos), o la mediana de tres colocada en el medio. Usar como pivote el último elemento con esta formulación puede provocar un bucle infinito.

**Partición de 3 vías (Dijkstra, bandera holandesa).** Divide en `< pivote`, `= pivote`, `> pivote`. Los iguales al pivote **no se vuelven a visitar**. Con k claves distintas y muchos duplicados, el costo baja a O(n·k) y, en general, a O(n·H) con H la entropía de la distribución de claves (óptimo, Sedgewick–Wegner). Es la solución estándar al problema de los duplicados (y el problema clásico «sort colors» de entrevistas).

**Otras:** *Bentley–McIlroy* (3 vías con intercambios de iguales a los extremos, más eficiente que Dijkstra en la práctica), **quicksort de doble pivote** (Yaroslavskiy; usado por `Arrays.sort` de Java para primitivos y, según la implementación actual del SDK, por `List.sort` de Dart: ≈ 1.9·n ln n comparaciones frente a 2·n ln n, y mejor patrón de acceso a caché) y particiones **sin ramas** (*BlockQuicksort*, Edelkamp–Weiß): se calculan en bloques los índices de los elementos a intercambiar con aritmética en lugar de saltos, evitando las malas predicciones.

#### Selección del pivote

| Estrategia | Comparaciones esperadas | Comentario |
| --- | --- | --- |
| Primero/último | 2n ln n en datos aleatorios; **Θ(n²) en datos ordenados** | Inaceptable en producción |
| Aleatorio | 2n ln n ≈ 1.39 n log₂ n | Sin entradas «malas»; requiere un RNG decente |
| Mediana de 3 (primero, medio, último) | (12/7) n ln n ≈ 1.19 n log₂ n | Evita el caso ordenado/inverso; vulnerable a entradas adversarias |
| Ninther (mediana de 3 medianas de 3) | ≈ 1.1 n log₂ n (orden de magnitud) | Se usa para n grandes (pdqsort y derivados) |
| Mediana de medianas (BFPRT) | Peor caso O(n log n) garantizado | Constantes altas; se usa como último recurso |
| Muestra de 2^k − 1 elementos | → n log₂ n cuando la muestra crece | Base de *samplesort* |

**Vulnerabilidad adversaria.** Para cualquier regla determinista de pivote (incluida la mediana de 3) existe una entrada que fuerza Θ(n²) (*A killer adversary for quicksort*, McIlroy, 1999). Se previene con **aleatorización** o con el **fallback a heap sort** de introsort (6.10). Es el análogo en ordenación del *hash flooding*.

#### Control de la profundidad de recursión

Se **recursa en la partición más pequeña** y se **itera sobre la más grande** (el `while` hace la eliminación manual de la recursión de cola). Como la partición menor tiene ≤ n/2 elementos, la pila nunca excede ⌊log₂ n⌋ marcos, aun en el peor caso de tiempo. Dart no garantiza la eliminación de recursión de cola, así que hay que hacerlo a mano.

```dart
/// Ordena a[lo], a[mid], a[hi] entre sí (3 comparaciones); deja la mediana en a[mid].
void _medianOfThree<T>(List<T> a, int i, int j, int k, Comparator<T> cmp) {
  if (cmp(a[j], a[i]) < 0) _swap(a, i, j);
  if (cmp(a[k], a[j]) < 0) {
    _swap(a, j, k);
    if (cmp(a[j], a[i]) < 0) _swap(a, i, j);
  }
}

/// Partición de Hoare sobre [lo, hi] (hi inclusive) usando el VALOR del pivote.
/// Devuelve j con lo <= j < hi: a[lo..j] <= pivot <= a[j+1..hi].
/// Requiere que el pivote sea el valor de a[mid] con mid = lo + (hi-lo)/2 (mid < hi).
int _hoare<T>(List<T> a, int lo, int hi, T pivot, Comparator<T> cmp) {
  var i = lo - 1, j = hi + 1;
  while (true) {
    do {
      i++;
    } while (cmp(a[i], pivot) < 0);
    do {
      j--;
    } while (cmp(a[j], pivot) > 0);
    if (i >= j) return j;
    _swap(a, i, j);
  }
}

/// Quicksort práctico: mediana de tres, Hoare, corte a inserción y pila O(log n).
void quickSort<T>(List<T> a, Comparator<T> cmp) {
  _qs(a, 0, a.length - 1, cmp);
}

void _qs<T>(List<T> a, int lo, int hi, Comparator<T> cmp) {   // [lo, hi] inclusive
  while (hi - lo + 1 > 24) {
    final mid = lo + ((hi - lo) >> 1);
    _medianOfThree(a, lo, mid, hi, cmp);
    final p = _hoare(a, lo, hi, a[mid], cmp);
    if (p - lo < hi - p) {                  // recursar en la menor, iterar en la mayor
      _qs(a, lo, p, cmp);
      lo = p + 1;
    } else {
      _qs(a, p + 1, hi, cmp);
      hi = p;
    }
  }
  insertionSort(a, cmp, lo, hi + 1);
}
```

```dart
import 'dart:math';

/// Partición de 3 vías sobre [lo, hi] con el valor `pivot`.
/// Devuelve (lt, gt): a[lo..lt) < pivot, a[lt..gt] == pivot, a(gt..hi] > pivot.
(int, int) _partition3<T>(List<T> a, int lo, int hi, T pivot, Comparator<T> cmp) {
  var lt = lo, i = lo, gt = hi;
  while (i <= gt) {
    final c = cmp(a[i], pivot);
    if (c < 0) {
      _swap(a, lt++, i++);
    } else if (c > 0) {
      _swap(a, i, gt--);
    } else {
      i++;
    }
  }
  return (lt, gt);
}

/// Quicksort de 3 vías con pivote aleatorio: O(n·H) con muchos duplicados.
void quickSort3Way<T>(List<T> a, Comparator<T> cmp, [Random? rnd]) {
  _qs3(a, 0, a.length - 1, cmp, rnd ?? Random());
}

void _qs3<T>(List<T> a, int lo, int hi, Comparator<T> cmp, Random rnd) {
  while (hi > lo) {
    if (hi - lo + 1 <= 24) {
      insertionSort(a, cmp, lo, hi + 1);
      return;
    }
    final pivot = a[lo + rnd.nextInt(hi - lo + 1)];
    final (lt, gt) = _partition3(a, lo, hi, pivot, cmp);
    if (lt - lo < hi - gt) {
      _qs3(a, lo, lt - 1, cmp, rnd);
      lo = gt + 1;
    } else {
      _qs3(a, gt + 1, hi, cmp, rnd);
      hi = lt - 1;
    }
  }
}
```

**Invariante de la partición de 3 vías:** `a[lo..lt) < pivote`, `a[lt..i) == pivote`, `a(gt..hi] > pivote`, y la región `a[i..gt]` aún sin clasificar. Si `a[i] < pivote` se intercambia con el primer igual (`lt++`, `i++`); si es mayor se manda al final sin avanzar `i` (el elemento recibido es nuevo); si es igual, solo se avanza `i`.

### 6.9 Heap sort

**Mecánica.** (1) Convierte el arreglo en un **max-heap** (árbol binario completo, almacenado en el propio arreglo, con `a[padre] ≥ a[hijo]`); (2) intercambia la raíz (el máximo) con el último elemento del heap, reduce el tamaño del heap en uno y restablece el invariante con `siftDown`; repite hasta vaciarlo.

**Análisis.**

- **Construcción del heap** (Floyd, de abajo hacia arriba, hundiendo cada nodo interno): **Θ(n)**, porque un nodo a altura h cuesta O(h) y hay ≤ ⌈n/2^(h+1)⌉ nodos a esa altura: Σ h·n/2^(h+1) = O(n·Σ h/2ʰ) = O(n).
- **Extracciones:** n − 1 veces Θ(log n) ⇒ Θ(n log n). Total **Θ(n log n) en todos los casos**, con ≈ 2n log₂ n comparaciones con el `siftDown` estándar.
- **In-place estricto (O(1))**, **inestable**, no adaptativo.

**Cuellos de botella.** Es la mejor garantía de peor caso con memoria O(1), pero en la práctica es 2–5× más lento que quicksort/merge sort en arreglos grandes porque (a) los accesos `a[i]` → `a[2i+1]` saltan lejos en memoria (mala localidad de caché), (b) los saltos de comparación son impredecibles, y (c) hace ≈ 2n log n comparaciones. Se usa como **red de seguridad de introsort** y en entornos que prohíben recursión y memoria dinámica (el núcleo de Linux ordena con heap sort).

**Optimizaciones.** *Bottom-up heapsort de Floyd:* hundir la raíz hasta una hoja siguiendo siempre el hijo mayor (1 comparación por nivel en lugar de 2) y luego **subir** el elemento hasta su sitio. Reduce las comparaciones a ≈ n log₂ n + O(n). *Weak-heap sort* baja a ≈ n log₂ n − 0.9n. *Smoothsort* (Dijkstra) es adaptativo: Θ(n) en entradas casi ordenadas.

```dart
/// Heap sort in-place sobre [lo, hi). Θ(n log n) en todos los casos, O(1) de espacio.
void heapSort<T>(List<T> a, Comparator<T> cmp, [int lo = 0, int? hi]) {
  final end = hi ?? a.length;
  final n = end - lo;
  if (n < 2) return;
  for (var i = (n >> 1) - 1; i >= 0; i--) {
    _siftDown(a, lo, i, n, cmp);            // construir el heap en Θ(n)
  }
  for (var m = n - 1; m > 0; m--) {
    _swap(a, lo, lo + m);                   // el máximo pasa a su posición final
    _siftDown(a, lo, 0, m, cmp);
  }
}

/// Hunde el elemento en la posición i dentro de un heap de tamaño n (base = desplazamiento).
void _siftDown<T>(List<T> a, int base, int i, int n, Comparator<T> cmp) {
  final x = a[base + i];
  while (true) {
    var c = 2 * i + 1;
    if (c >= n) break;
    if (c + 1 < n && cmp(a[base + c + 1], a[base + c]) > 0) c++;   // hijo mayor
    if (cmp(a[base + c], x) <= 0) break;
    a[base + i] = a[base + c];              // subir el hijo (sin intercambio completo)
    i = c;
  }
  a[base + i] = x;
}

/// Variante de Floyd: baja hasta una hoja sin comparar con x, luego sube. ≈ n log n comparaciones.
void _siftDownFloyd<T>(List<T> a, int base, int i, int n, Comparator<T> cmp) {
  final x = a[base + i];
  var j = i;
  while (true) {                            // 1) camino de hijos mayores hasta una hoja
    var c = 2 * j + 1;
    if (c >= n) break;
    if (c + 1 < n && cmp(a[base + c + 1], a[base + c]) > 0) c++;
    a[base + j] = a[base + c];
    j = c;
  }
  while (j > i) {                           // 2) subir x hasta su posición
    final parent = (j - 1) >> 1;
    if (cmp(a[base + parent], x) >= 0) break;
    a[base + j] = a[base + parent];
    j = parent;
  }
  a[base + j] = x;
}
```

### 6.10 Introsort (Musser, 1997)

**Idea.** Combinar lo mejor de tres mundos: quicksort (rápido en promedio), heap sort (peor caso garantizado) e insertion sort (constante baja en rangos pequeños). Se ejecuta quicksort con un **límite de profundidad 2·⌊log₂ n⌋**; si una rama lo supera (señal de particiones desbalanceadas) se cambia a heap sort en ese subrango; los subrangos pequeños se terminan con insertion sort.

**Garantías:** **Θ(n log n) en el peor caso**, comportamiento de quicksort en el caso típico, O(log n) de pila, inestable. Es la base de `std::sort` en libstdc++ (GCC).

```dart
void introSort<T>(List<T> a, Comparator<T> cmp) {
  final n = a.length;
  if (n < 2) return;
  _intro(a, 0, n, 2 * (n.bitLength - 1), cmp);   // límite = 2·⌊log2 n⌋
}

void _intro<T>(List<T> a, int lo, int hi, int depth, Comparator<T> cmp) {   // [lo, hi)
  while (hi - lo > 24) {
    if (depth == 0) {
      heapSort(a, cmp, lo, hi);                  // red de seguridad: peor caso garantizado
      return;
    }
    depth--;
    final mid = lo + ((hi - lo) >> 1);
    _medianOfThree(a, lo, mid, hi - 1, cmp);
    final p = _hoare(a, lo, hi - 1, a[mid], cmp);   // particiones [lo, p+1) y [p+1, hi)
    if (p + 1 - lo < hi - (p + 1)) {
      _intro(a, lo, p + 1, depth, cmp);
      lo = p + 1;
    } else {
      _intro(a, p + 1, hi, depth, cmp);
      hi = p + 1;
    }
  }
  insertionSort(a, cmp, lo, hi);
}
```

**pdqsort (pattern-defeating quicksort, Orson Peters).** Evoluciona introsort con: mediana de tres o ninther según el tamaño; detección de particiones que ya estaban ordenadas (intenta insertion sort parcial y termina en Θ(n) para entradas ordenadas o casi); tratamiento de elementos iguales al pivote anterior (O(n·k) con k claves distintas); *aleatorización dirigida* de patrones tras particiones desbalanceadas, y fallback a heap sort. Es el algoritmo de `sort.Sort`/`slices.Sort` de Go (≥ 1.19), de `sort_unstable` de Rust (hasta la versión 1.80) y de Boost.Sort. Las variantes recientes (ipnsort en Rust, ips4o, vqsort con SIMD) siguen esta línea.

### 6.11 Timsort y Powersort (ordenación estable adaptativa)

**Timsort** (Tim Peters, 2002; Python `list.sort`, `Arrays.sort(Object[])` de Java, V8, Android) es un **merge sort híbrido adaptativo** diseñado para datos reales, que casi siempre contienen runs ya ordenados.

1. **Detecta runs naturales:** secuencias no decrecientes o *estrictamente* decrecientes (estas se invierten in situ; ser estricto preserva la estabilidad).
2. **Extiende runs cortos** hasta un tamaño mínimo `minrun` (entre 32 y 64, calculado para que n/minrun sea casi una potencia de 2) con inserción binaria.
3. **Apila los runs** y los fusiona manteniendo invariantes de tamaño sobre la pila (cada run mayor que la suma de los dos siguientes, aproximadamente) para que las fusiones estén balanceadas. *Dato histórico:* en 2015 la verificación formal de estos invariantes descubrió un error que permitía desbordar la pila de runs en las implementaciones de Python y OpenJDK.
4. **Modo galloping:** durante una fusión, si un run «gana» muchas veces seguidas, cambia a búsqueda exponencial para saltar bloques (5.8). Esto da Θ(n) para fusionar runs que ya están casi concatenados.
5. **Fusión con buffer auxiliar del run menor** (≤ n/2).

**Complejidad:** mejor caso **Θ(n)** (ya ordenado o inverso), peor caso Θ(n log n), adaptativo a los runs: **O(n + n·log r)**; **estable**; memoria auxiliar ≤ n/2. **Powersort** (Munro–Wild) sustituye la política de fusión de los runs por una que es provablemente casi óptima respecto a la entropía de las longitudes de los runs; **CPython la adoptó en la versión 3.11**. La ordenación estable de Rust pasó a `driftsort` en la 1.81.

### 6.12 Tabla comparativa de ordenación por comparación

| Algoritmo | Mejor | Promedio | Peor | Espacio aux. | Estable | In-place | Adaptativo | Nota |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bubble (optimizado) | n | n² | n² | O(1) | Sí | Sí | Sí | Solo didáctico |
| Selection | n² | n² | n² | O(1) | No | Sí | No | Mínimo de escrituras (n − 1) |
| Insertion | n | n² | n² | O(1) | Sí | Sí | Sí | Mejor para n pequeño o casi ordenado |
| Shell (Ciura) | n log n | ~n^1.2–n^1.3 empírico | n^(4/3)–n² según brechas | O(1) | No | Sí | Parcial | Sin recursión ni memoria dinámica |
| Merge | n log n | n log n | n log n | O(n) | Sí | No | No (sí si natural) | Menos comparaciones; ideal para listas y disco |
| Quick (mediana de 3) | n log n | n log n (≈1.19–1.39 n log₂ n) | n² | O(log n) | No | Sí (liberal) | No | Más rápido en la práctica con tipos primitivos |
| Heap | n log n\* | n log n | n log n | O(1) | No | Sí | No | \*Θ(n) si todas las claves son iguales |
| Introsort | n log n | n log n | n log n | O(log n) | No | Sí (liberal) | No | Peor caso garantizado |
| Timsort/Powersort | n | n log n | n log n | O(n) (≤ n/2) | Sí | No | Sí | Estándar para objetos y datos reales |

---

## 7. Selección: k-ésimo elemento y top-k

**Problema.** Dado un arreglo de n elementos y un rango k, hallar el k-ésimo menor sin ordenar todo el arreglo. Casos particulares: mínimo/máximo (n − 1 comparaciones, óptimo), **mediana** (k = n/2) y **top-k**. Ordenar resuelve el problema en O(n log n); se puede hacer en **Θ(n)**.

### 7.1 Quickselect (Hoare, 1961)

Como quicksort pero tras cada partición se recursa **solo en el lado que contiene al índice k**. La recurrencia esperada es T(n) = T(n/2) + Θ(n) (el pivote aleatorio parte «en promedio» por la mitad), lo que da **Θ(n) esperado**; con pivote aleatorio las comparaciones esperadas son ≈ 2n para extremos y ≈ 3.39n (= 2n(1 + ln 2)) para la mediana. **Peor caso Θ(n²)**, evitable con la mediana de medianas o con introselect (quickselect con fallback). Es in-place y deja como efecto lateral `a[0..k) ≤ a[k] ≤ a(k..n)`, lo cual resuelve gratuitamente el «k menores sin ordenar».

```dart
import 'dart:math';

/// k-ésimo menor (k = 0 es el mínimo). Reordena `a` en el proceso. Θ(n) esperado.
T quickSelect<T>(List<T> a, int k, Comparator<T> cmp, [Random? rnd]) {
  RangeError.checkValidIndex(k, a, 'k');
  final r = rnd ?? Random();
  var lo = 0, hi = a.length - 1;
  while (lo < hi) {
    final mid = lo + ((hi - lo) >> 1);
    _swap(a, mid, lo + r.nextInt(hi - lo + 1));   // pivote aleatorio al centro
    final p = _hoare(a, lo, hi, a[mid], cmp);
    if (k <= p) {
      hi = p;
    } else {
      lo = p + 1;
    }
  }
  return a[k];
}

/// Los k menores elementos, ordenados. O(n + k log k).
List<T> smallestK<T>(List<T> a, int k, Comparator<T> cmp) {
  final b = List<T>.of(a);
  if (k >= b.length) return b..sort(cmp);
  if (k <= 0) return <T>[];
  quickSelect(b, k - 1, cmp);                     // b[0..k) son los k menores
  return b.sublist(0, k)..sort(cmp);
}
```

### 7.2 Mediana de medianas (BFPRT, 1973): selección determinista en Θ(n)

**Idea (Blum–Floyd–Pratt–Rivest–Tarjan).** Elegir un pivote **garantizado** bueno: (1) dividir en grupos de 5; (2) hallar la mediana de cada grupo (O(1) por grupo); (3) hallar recursivamente la mediana de esas ⌈n/5⌉ medianas, que será el pivote; (4) particionar y recursar en un lado.

**Garantía.** La mediana de medianas es mayor o igual que ≈ 3n/10 elementos y menor o igual que ≈ 3n/10, así que cada lado tiene a lo sumo ≈ 7n/10 elementos. Recurrencia: T(n) ≤ T(n/5) + T(7n/10) + O(n). Como 1/5 + 7/10 < 1, por Akra–Bazzi **T(n) = Θ(n)** en el *peor caso* (4.5). Con grupos de 3 sería Θ(n log n). La constante es grande (decenas de n), por lo que en la práctica se usa solo como fallback.

```dart
/// k-ésimo menor en Θ(n) de peor caso (mediana de medianas). No modifica la entrada.
T medianOfMediansSelect<T>(List<T> a, int k, Comparator<T> cmp) {
  RangeError.checkValidIndex(k, a, 'k');
  final b = List<T>.of(a);
  return _bfprt(b, 0, b.length - 1, k, cmp);
}

T _bfprt<T>(List<T> a, int lo, int hi, int k, Comparator<T> cmp) {
  while (true) {
    if (hi - lo + 1 <= 10) {
      insertionSort(a, cmp, lo, hi + 1);
      return a[k];
    }
    // 1) Mediana de cada grupo de 5, movida al frente del rango.
    var m = lo;
    for (var g = lo; g <= hi; g += 5) {
      final end = (g + 4 < hi) ? g + 4 : hi;
      insertionSort(a, cmp, g, end + 1);
      _swap(a, m++, g + ((end - g) >> 1));
    }
    // 2) Pivote = mediana de las medianas (recursivo sobre a[lo..m-1]).
    final cnt = m - lo;
    final pivot = _bfprt(a, lo, m - 1, lo + (cnt - 1) ~/ 2, cmp);
    // 3) Partición de 3 vías y descenso hacia el lado que contiene a k.
    final (lt, gt) = _partition3(a, lo, hi, pivot, cmp);
    if (k < lt) {
      hi = lt - 1;
    } else if (k > gt) {
      lo = gt + 1;
    } else {
      return a[k];
    }
  }
}
```

### 7.3 Top-k con heap y en streaming

- **Heap acotado de tamaño k:** recorrer los datos manteniendo un min-heap con los k mayores vistos; cada elemento nuevo se compara con la raíz y, si es mayor, la reemplaza. **O(n log k)** tiempo y **O(k) espacio**, en **un solo paso** (funciona en streaming). Si k es pequeño frente a n (p. ej., top-10 de millones), es excelente.
- **Quickselect:** O(n) esperado pero necesita todos los datos en memoria y los modifica.
- **Dos heaps para la mediana móvil:** un max-heap para la mitad inferior y un min-heap para la superior; la mediana se obtiene en O(1) y cada inserción cuesta O(log n).
- **Cuantiles aproximados en flujos:** cuando ni siquiera caben los elementos (o k es enorme), se usan sketches (Greenwald–Khanna, t-digest, KLL) con espacio sublineal y error acotado.

| Método | Tiempo | Espacio | Online | Notas |
| --- | --- | --- | --- | --- |
| Ordenar y tomar k | O(n log n) | O(1)–O(n) | No | Simple; obtiene todo el orden |
| Quickselect | O(n) esperado | O(1) | No | Modifica la entrada |
| BFPRT | O(n) peor caso | O(n) o O(1) | No | Constantes altas |
| Heap acotado | O(n log k) | O(k) | Sí | Mejor para k pequeño o streaming |

---

## 8. Algoritmos de ordenación lineal (no basados en comparaciones)

### 8.1 Cómo rompen la barrera de Ω(n log n)

La cota inferior de 6.2 se apoya en una sola hipótesis: **la única información que el algoritmo obtiene sobre las claves es el resultado de compararlas por pares**. Cada comparación tiene dos salidas, así que distinguir n! permutaciones exige log₂(n!) comparaciones.

Los algoritmos lineales **no comparan claves entre sí**. Usan la **estructura numérica** de la clave: una clave entera `c` en `[0, k)` se usa como **índice de un arreglo** (acceso O(1) en el modelo word-RAM). Una sola operación `count[c]++` es una bifurcación de **k vías**, no de 2, y por eso un árbol de decisión de 2 salidas deja de ser el modelo correcto. La contrapartida son restricciones sobre el tipo de clave (enteros o transformables a enteros de rango acotado) y memoria extra.

| | Comparaciones | Lineales |
| --- | --- | --- |
| Información usada | Orden entre pares | Valor numérico de la clave |
| Cota | Ω(n log n) | Θ(n + k), Θ(d·(n + b)), Θ(n) esperado |
| Generalidad | Cualquier orden total | Enteros / claves de ancho acotado |
| Memoria | O(1)–O(n) | O(n + k) |

### 8.2 Counting sort

**Entrada:** n elementos con claves enteras en `[0, k)`.

**Mecánica en tres fases:**

1. **Histograma:** `count[c]` = número de elementos con clave c. Θ(n).
2. **Suma de prefijos:** transformar `count` de modo que `count[c]` sea la posición **inicial** de los elementos con clave c en la salida. Θ(k).
3. **Colocación:** recorrer la entrada de izquierda a derecha y poner cada elemento en `out[count[clave]++]`. Θ(n). Como los iguales se colocan en orden de aparición, **es estable**.

**Análisis.** Tiempo **Θ(n + k)**; espacio **Θ(n + k)** (el arreglo de salida más el de contadores); estable; **no in-place**. Es lineal cuando k = O(n).

**Restricciones**

- k debe ser pequeño frente a n² o similar; con k = 10⁹ y n = 10³ el arreglo de contadores es inviable y el algoritmo es **peor** que cualquiera por comparaciones.
- Claves negativas: se resta el mínimo (offset).
- Solo ordena claves enteras o mapeables a enteros pequeños (bytes, caracteres ASCII, años, edades, códigos).
- Es el *subrutina estable* que necesita radix sort.

```dart
/// Counting sort estable por clave entera en [0, k). Devuelve una lista nueva. Θ(n + k).
List<T> countingSortBy<T>(List<T> a, int Function(T) key, int k) {
  if (a.isEmpty) return <T>[];
  final count = List<int>.filled(k + 1, 0);
  for (final x in a) {
    count[key(x) + 1]++;                       // histograma desplazado una posición
  }
  for (var i = 0; i < k; i++) {
    count[i + 1] += count[i];                  // count[c] = posición inicial de la clave c
  }
  final out = List<T>.filled(a.length, a[0]);  // a[0] solo como relleno inicial
  for (final x in a) {
    out[count[key(x)]++] = x;                  // hacia delante con posiciones iniciales → estable
  }
  return out;
}
```

### 8.3 Radix sort

**Idea.** Ordenar por **dígitos**, usando una ordenación estable por dígito (counting sort).

- **LSD (least significant digit first):** ordena por el dígito menos significativo y avanza hacia el más significativo. Su corrección se apoya en la **estabilidad**: tras ordenar por el dígito i, los elementos con igual dígito i conservan el orden previo, que ya estaba ordenado por los dígitos menores.
- **MSD (most significant digit first):** particiona por el dígito más significativo y recursa en cada bucket. Es adecuado para claves de longitud variable (cadenas) porque puede detenerse en cuanto un bucket tiene un elemento; no necesita estabilidad para ser correcto.

**Análisis (LSD).** Para claves de w bits y dígitos de r bits (base b = 2ʳ), hay d = ⌈w/r⌉ pasadas, cada una Θ(n + b):

**T = Θ(d·(n + b)) = Θ((w/r)·(n + 2ʳ))**.

Elegir r ≈ log₂ n minimiza el costo: T = Θ(n·w/log n), que es **lineal si w = O(log n)** (claves de tamaño polinomial en n). Espacio Θ(n + b).

**Elección práctica de r (enteros de 32 bits):**

| Dígito | Pasadas | Contadores | Comentario |
| --- | --- | --- | --- |
| 8 bits | 4 | 256 | Contadores en L1; el más usado |
| 11 bits | 3 | 2048 | Menos pasadas, buenos contadores |
| 16 bits | 2 | 65 536 | Contadores en L2 (256 KB con 4 B); riesgo de fallos de TLB al dispersar |

**Optimizaciones**

- **Un solo recorrido para todos los histogramas** (se leen los datos una vez y se llenan los d histogramas a la vez).
- **Omitir pasadas triviales:** si todos los elementos comparten el mismo dígito en una pasada, esa pasada es la identidad.
- **Buffers alternados** (ping-pong) sin copiar de vuelta.
- **Enteros con signo:** se invierte el bit de signo (`x ^ 0x80000000`) para que el orden sin signo coincida con el orden con signo.
- **Flotantes IEEE-754:** reinterpretar los bits como entero sin signo; si el signo es 1, invertir **todos** los bits, si no, invertir solo el bit de signo. El orden entero resultante coincide con el orden numérico (con −0 < +0 y NaN en los extremos).
- **MSD in-place (American flag sort):** particiona in-place por dígito; inestable, O(1) de espacio extra aparte de los contadores.
- **Cadenas:** *MSD radix* o **quicksort multiclave de Bentley–Sedgewick** (ternario por carácter): O(n log n + D) con D la suma de los largos de los prefijos distintivos. Se usa en ordenación de strings, diccionarios y sufijos.

**Cuándo gana a quicksort.** Con enteros de ancho fijo y n grande (≳ 10⁵–10⁶) suele ser varias veces más rápido que la ordenación por comparaciones, porque cada pasada es un recorrido secuencial más una dispersión de escritura sin saltos impredecibles. Con n pequeño o claves largas/variables pierde. Los resultados concretos dependen del hardware: **mide**.

```dart
import 'dart:typed_data';

/// Radix sort LSD de 8 bits para enteros sin signo de 32 bits.
/// Devuelve una lista nueva; no modifica la entrada. Θ(4·(n + 256)).
Uint32List radixSortU32(Uint32List input) {
  final n = input.length;
  if (n == 0) return Uint32List(0);
  var src = Uint32List.fromList(input);
  var dst = Uint32List(n);
  final counts = List<Uint32List>.generate(4, (_) => Uint32List(256));
  for (var i = 0; i < n; i++) {                 // un único recorrido para los 4 histogramas
    final v = src[i];
    counts[0][v & 0xFF]++;
    counts[1][(v >> 8) & 0xFF]++;
    counts[2][(v >> 16) & 0xFF]++;
    counts[3][(v >> 24) & 0xFF]++;
  }
  for (var pass = 0; pass < 4; pass++) {
    final shift = 8 * pass;
    final c = counts[pass];
    if (c[(src[0] >> shift) & 0xFF] == n) continue;   // todos comparten el dígito: identidad
    var sum = 0;
    for (var d = 0; d < 256; d++) {             // prefijos → posición inicial de cada dígito
      final t = c[d];
      c[d] = sum;
      sum += t;
    }
    for (var i = 0; i < n; i++) {
      final v = src[i];
      dst[c[(v >> shift) & 0xFF]++] = v;        // estable
    }
    final t = src;
    src = dst;
    dst = t;
  }
  return src;
}

/// Enteros con signo de 32 bits: invertir el bit de signo para mapear al orden sin signo.
Int32List radixSortI32(Int32List a) {
  final u = Uint32List(a.length);
  for (var i = 0; i < a.length; i++) {
    u[i] = (a[i] ^ 0x80000000) & 0xFFFFFFFF;
  }
  final s = radixSortU32(u);
  final out = Int32List(a.length);
  for (var i = 0; i < s.length; i++) {
    out[i] = s[i] ^ 0x80000000;                 // al guardar en Int32List se trunca a 32 bits con signo
  }
  return out;
}
```

En web (dart2js) los operadores de bits trabajan sobre 32 bits y la aritmética sobre `double`: verifica los desplazamientos con valores ≥ 2³¹ si compilas a JavaScript.

### 8.4 Bucket sort

**Idea.** Repartir los n elementos en m *buckets* según su valor (bucket = ⌊x·m⌋ para valores en [0, 1)), ordenar cada bucket (típicamente con insertion sort) y concatenar.

**Análisis.** Si las claves son **independientes y uniformes** en el intervalo y m = n, el número de elementos por bucket sigue una binomial de media 1; el costo esperado es Θ(n + Σ E[nᵢ²]), con E[nᵢ²] = 2 − 1/n, de donde Σ E[nᵢ²] = 2n − 1 = Θ(n). **Tiempo esperado Θ(n)**, espacio Θ(n + m), estable si el orden dentro de los buckets lo es.

**Restricciones y peor caso**

- **Distribución uniforme.** Si todos los valores caen en un bucket, el costo es el de la ordenación del bucket: Θ(n²) con insertion sort, Θ(n log n) si el bucket se ordena con merge sort.
- **Rango conocido** (mínimo y máximo) para mapear valores a buckets.
- **Variantes para distribuciones no uniformes:** buckets adaptativos por histograma o muestreo (*sample sort*, el equivalente paralelo/GPU), *flashsort* (clasificación in-place por la distribución estimada) y MSD radix (que es un bucket sort donde la distribución se supone uniforme sobre los dígitos).

```dart
/// Bucket sort para double en [0, 1). Θ(n) esperado con datos uniformes.
void bucketSortUnit(List<double> a) {
  final n = a.length;
  if (n < 2) return;
  final buckets = List<List<double>>.generate(n, (_) => <double>[]);
  for (final x in a) {
    final i = (x * n).floor();
    buckets[i < n ? i : n - 1].add(x);          // x·n puede redondear a n cuando x ≈ 1
  }
  var k = 0;
  for (final b in buckets) {
    insertionSort<double>(b, (p, q) => p.compareTo(q));
    for (final x in b) {
      a[k++] = x;
    }
  }
}
```

Para un rango arbitrario [mín, máx]: `i = ((x − mín) / (máx − mín) · (m − 1)).floor()`.

### 8.5 Comparación y criterios

| Algoritmo | Tiempo | Espacio | Estable | Restricción |
| --- | --- | --- | --- | --- |
| Counting | Θ(n + k) | Θ(n + k) | Sí | Claves enteras en [0, k) con k = O(n) |
| Radix LSD | Θ(d·(n + b)) | Θ(n + b) | Sí | Claves de ancho fijo o acotado |
| Radix MSD / American flag | Θ(n·d) peor; sublineal en d si hay prefijos distintivos | O(b·d) (in-place posible) | MSD con buffer: sí; in-place: no | Cadenas y claves de longitud variable |
| Bucket | Θ(n) esperado; Θ(n²) peor | Θ(n + m) | Sí (con inner estable) | Distribución ≈ uniforme y rango conocido |
| Pigeonhole | Θ(n + k) | Θ(k) | No | Variante de counting para claves sin satélite |

**Más allá:** en word-RAM se conocen algoritmos de ordenación de enteros con tiempo o(n log n) para cualquier w (Han: O(n log log n) determinista; Han–Thorup: O(n√(log log n)) aleatorizado). Son resultados teóricos con constantes que no los hacen competitivos.

---

## 9. Ordenación según las características del dataset

### 9.1 Datos casi ordenados

El desorden se mide de varias formas, y distintos algoritmos son adaptativos a distintas medidas:

| Medida de desorden | Significado | Algoritmos adaptativos |
| --- | --- | --- |
| **Inv** | Número de inversiones | Insertion sort: Θ(n + Inv); Shell sort parcialmente |
| **Runs** (r) | Número de subsecuencias ascendentes maximales | Natural merge sort, Timsort, Powersort: O(n + n·log r) |
| **Rem** | Mínimo de elementos a quitar para quedar ordenado | Algoritmos basados en la subsecuencia creciente más larga |
| **Osc** | Oscilaciones / máximos locales | Variantes de heap adaptativo |

Reglas prácticas:

- **Pocos elementos fuera de lugar (típico en datos que se actualizan):** insertion sort (si Inv es O(n)) o Timsort.
- **Datos ordenados + un bloque nuevo al final (logs, series de tiempo):** ordenar solo el bloque nuevo y **fusionarlo** (O(m log m + n)), o Timsort.
- **Datos ya ordenados o invertidos:** Timsort y pdqsort los detectan en Θ(n).
- No conviene «comprobar si está ordenado» como paso previo universal (O(n) extra en el caso normal): los adaptativos ya lo hacen implícitamente.

### 9.2 Duplicados masivos

- **Quicksort de 2 vías mal diseñado (Lomuto):** Θ(n²) con todas las claves iguales. **Hoare** se mantiene en n log n, pero intercambia iguales innecesariamente.
- **3 vías (Dijkstra, Bentley–McIlroy), pdqsort:** **O(n·H)**, con H la entropía de la distribución de claves; con k claves distintas, O(n log k). Es la solución general y robusta.
- **Pocas claves distintas y acotadas:** counting sort/radix: Θ(n + k).
- **Alternativa por contadores con hash:** contar frecuencias con una tabla hash (O(n)), ordenar solo las d claves distintas (O(d log d)) y reconstruir: O(n + d log d). Excelente si d ≪ n y las claves no son enteros pequeños.
- **Heap sort:** inmune a los duplicados en tiempo (Θ(n log n)), pero no los explota; con todas las claves iguales llega a Θ(n).

### 9.3 Distribuciones uniformes y conocidas

- Valores reales uniformes: **bucket sort** (Θ(n) esperado), o interpolación para buscar.
- Enteros de ancho fijo: **radix**.
- Distribuciones no uniformes pero estimables: **sample sort** (muestrear, elegir splitters, repartir en buckets balanceados, ordenar cada uno), base de las ordenaciones paralelas y en GPU, y de *ips4o*.

### 9.4 Memoria RAM limitada y ordenación externa

**Caso 1: cabe en RAM pero sin copia extra.** Heap sort (O(1)), quicksort/introsort (O(log n)), insertion/Shell para n pequeño, o *merge in-place* (block merge: estable, O(1) extra, pero mucho más complejo y lento).

**Caso 2: no cabe en RAM (ordenación externa).** Modelo de memoria externa con memoria M y bloque B. Algoritmo estándar, **external merge sort**:

1. **Formación de runs:** leer M elementos, ordenarlos en memoria (introsort/radix) y escribirlos a disco como un run. Resultan ⌈N/M⌉ runs. Con *replacement selection* (heap de selección) los runs miden ≈ **2M** de longitud media sobre datos aleatorios.
2. **Fusión k-aria:** fusionar k runs a la vez con un heap (o árbol de perdedores) de k elementos, con k buffers de entrada y uno de salida. Con M/B bloques disponibles, k ≈ M/B − 1.
3. Repetir hasta tener un solo run: número de pasadas de fusión = ⌈log_k(N/M)⌉.

**Costo total:** **Θ((N/B)·log_{M/B}(N/B))** transferencias de bloque, óptimo en el modelo de memoria externa.

**Ejemplo numérico.** Ordenar 100 GB con 4 GB de RAM: ⌈100/4⌉ = 25 runs. Si se pueden mantener 25 buffers de entrada más uno de salida, **una sola pasada de fusión 25-aria** basta: el dato se lee y se escribe 2 veces en total (una al formar runs, una al fusionar), es decir, ≈ 4N de E/S frente a muchas pasadas de una fusión binaria (⌈log₂ 25⌉ = 5 pasadas de fusión ⇒ ≈ 12N).

```dart
/// Fusión k-aria de listas ya ordenadas con un heap de k elementos: O(N log k).
/// Estable: ante empates gana la lista de menor índice.
List<T> kWayMerge<T>(List<List<T>> runs, Comparator<T> cmp) {
  final pos = List<int>.filled(runs.length, 0);
  final heap = <int>[];                          // índices de runs; raíz = run con menor elemento actual
  bool less(int x, int y) {
    final c = cmp(runs[x][pos[x]], runs[y][pos[y]]);
    return c != 0 ? c < 0 : x < y;               // empate → run más antigua
  }
  void siftDown(int i) {
    final n = heap.length;
    while (true) {
      var c = 2 * i + 1;
      if (c >= n) break;
      if (c + 1 < n && less(heap[c + 1], heap[c])) c++;
      if (!less(heap[c], heap[i])) break;
      final t = heap[i];
      heap[i] = heap[c];
      heap[c] = t;
      i = c;
    }
  }

  for (var r = 0; r < runs.length; r++) {
    if (runs[r].isNotEmpty) heap.add(r);
  }
  for (var i = (heap.length >> 1) - 1; i >= 0; i--) {
    siftDown(i);
  }
  final out = <T>[];
  while (heap.isNotEmpty) {
    final r = heap[0];
    out.add(runs[r][pos[r]++]);
    if (pos[r] == runs[r].length) {
      heap[0] = heap.last;                       // run agotada: sale del heap
      heap.removeLast();
    }
    if (heap.isNotEmpty) siftDown(0);
  }
  return out;
}
```

En una implementación real los `runs` son **archivos leídos por bloques**; el esqueleto del algoritmo es el mismo. Es también lo que hacen las bases de datos (ordenación de resultados con `ORDER BY` que exceden `work_mem`), MapReduce/Spark en su fase *shuffle* y los **LSM-trees** al compactar SSTables.

### 9.5 Streaming y ordenación en línea

- **Mantener ordenado a medida que llegan datos:** inserción en una estructura ordenada: insertion sort sobre arreglo (O(n) por inserción), árbol balanceado/skip list (O(log n)), B-tree (disco).
- **Top-k y mediana móvil:** heaps (7.3).
- **Ordenación de un flujo que no cabe en memoria:** ordenación externa por runs + fusión (9.4).
- **Resúmenes aproximados:** cuantiles con t-digest/KLL en espacio sublineal cuando el orden exacto no es necesario.
- **Ventanas deslizantes:** deque monótona (máximo móvil en O(n) total) o dos heaps con eliminación perezosa.

### 9.6 Hardware y paralelismo

- **Merge sort paralelo:** dividir en p partes, ordenar en paralelo, fusionar con *merge path* (partición equilibrada de la fusión). Trabajo O(n log n), profundidad O(log² n) con fusión paralela.
- **Sample sort:** el esquema de elección en memoria distribuida y GPU: pocos pasos de comunicación.
- **Redes de ordenación (bitonic, odd-even merge):** secuencias fijas de comparaciones independientes de los datos, O(n log² n) comparadores; ideales para SIMD y GPU porque no tienen ramas.
- **SIMD:** ordenación de bloques pequeños con redes de ordenación vectorizadas (AVX2/AVX-512/NEON) más fusión; librerías como `vqsort` y `x86-simd-sort` logran grandes aceleraciones sobre `std::sort` en enteros y flotantes.
- **Radix en GPU:** CUB/Thrust ordenan miles de millones de claves por segundo.
- **En Dart:** `Isolate.run` permite ordenar partes en paralelo, pero copiar listas entre isolates cuesta; usa `TransferableTypedData` o listas tipadas para minimizar la copia, y solo compensa para n grande.

### 9.7 Ordenar objetos: claves, comparadores y trampas

- **Extraer la clave una vez** (transformación de Schwartzian / *decorate-sort-undecorate*): si la clave es cara de calcular, calcularla n veces (no n log n veces dentro del comparador) y ordenar los pares.
- **Orden por múltiples criterios:** o bien un comparador compuesto (primero A, desempate por B), o bien ordenaciones estables sucesivas empezando por el criterio menos significativo.
- **Contrato del comparador.** Debe ser un orden total consistente: `cmp(a,b) = −cmp(b,a)`, transitivo y reflexivo (`cmp(a,a) = 0`). Violarlo produce desde resultados erróneos hasta excepciones (la de TimSort en Java «Comparison method violates its general contract!»).
- **Nunca restar para comparar** (`a − b`): desborda con enteros grandes y es incorrecto con `double`. Usa `a < b ? −1 : (a > b ? 1 : 0)` o `compareTo`.
- **Flotantes:** `NaN` no es comparable (rompe el orden total); `−0.0` y `0.0` son iguales por `==` pero distinguibles. Usa un orden total explícito (el `totalOrder` de IEEE-754) si el dataset puede contener `NaN`.
- **Cadenas:** el orden por unidades de código UTF-16 no coincide con el orden alfabético humano (acentos, mayúsculas, configuración regional). Para orden lingüístico se necesita una colación (ICU); para búsquedas y claves de índice, normalizar (NFC) antes de comparar.
- **Estabilidad en la librería de Dart:** `List.sort` no está especificada como estable (la implementación actual no lo es); para ordenación estable usa `mergeSort` de `package:collection` o decora con el índice original.

---

## 10. Rendimiento real: caché, saltos y medición

### 10.1 Qué domina el tiempo en la práctica

| Factor | Orden de magnitud | Efecto en búsqueda y ordenación |
| --- | --- | --- |
| Acierto en L1 / L2 / L3 | ≈ 1 ns / 3–5 ns / 10–40 ns | Los recorridos secuenciales viven en L1 |
| Acceso a RAM | ≈ 60–100 ns | Cada paso de una búsqueda binaria sobre un arreglo grande es un fallo de caché |
| Salto mal predicho | ≈ 15–20 ciclos | Una comparación sobre datos aleatorios acierta ~50 %: domina quicksort y la búsqueda binaria |
| Línea de caché | 64 B | 16 `int` de 32 bits por transferencia; el patrón de acceso importa más que el conteo de operaciones |
| Página / TLB | 4 KB (típico) | Dispersar a decenas de miles de buckets (radix de 16 bits) provoca fallos de TLB |

**Consecuencias de diseño**

- **Preferir recorridos secuenciales** (merge, partición, radix de pocos bits) sobre accesos aleatorios (heap sort, listas enlazadas).
- **Reducir saltos impredecibles:** búsqueda binaria sin ramas, partición por bloques, redes de ordenación para bloques pequeños, `cmov`.
- **Mover menos datos:** ordenar índices o punteros cuando los elementos son grandes; ordenar claves y valores por separado cuando solo se necesita un campo.
- **Usar estructuras contiguas y tipadas:** `Int32List`/`Float64List` en Dart evitan el boxing y la indirección de `List<int>`/`List<double>`.

### 10.2 Modelo de memoria externa y algoritmos cache-oblivious

En el **modelo de Aggarwal–Vitter** (memoria de tamaño M, bloques de tamaño B) el costo es el número de bloques transferidos:

| Operación | Transferencias de bloque |
| --- | --- |
| Recorrer N elementos | Θ(N/B) |
| Buscar en un arreglo ordenado (binaria) | Θ(log₂(N/B)) |
| Buscar en un B-tree | Θ(log_B N) |
| Ordenar | Θ((N/B)·log_{M/B}(N/B)) |

Los algoritmos **cache-oblivious** (Frigo, Leiserson, Prokop, Ramachandran, 1999) alcanzan estas cotas **sin conocer B ni M**, y por tanto son óptimos en *todos* los niveles de la jerarquía a la vez. *Funnelsort* ordena con la cota óptima; las disposiciones **van Emde Boas** de un árbol binario logran Θ(log_B N) en búsquedas sin parámetros. En la práctica se prefieren los algoritmos *cache-aware* con bloques afinados (B-trees, S-trees, radix con r bits ajustado a la caché).

### 10.3 Cómo medir con rigor

1. **Calentamiento (warm-up).** La VM de Dart en modo JIT compila durante la ejecución; las primeras iteraciones no son representativas. Para medir lo que se despliega, usa compilación AOT (`dart compile exe`) y descarta las primeras repeticiones.
2. **Repeticiones y mediana.** Reporta la **mediana** (o percentiles) de varias repeticiones, no el mínimo ni la media, que son sensibles a ruido del sistema.
3. **Copias frescas.** Ordenar un arreglo ya ordenado en la repetición siguiente falsea el resultado: copia los datos antes de cada repetición, fuera del cronómetro.
4. **Variar la distribución de los datos**, no solo datos aleatorios: ordenados, inversos, pocas claves distintas, «tubo de órgano» (sube y baja), diente de sierra, casi ordenados. Un algoritmo puede ganar en una y perder estrepitosamente en otra.
5. **Variar el tamaño** (10², 10³, …, 10⁷): los puntos de cruce entre algoritmos (insertion vs merge, lineal vs binaria, comparaciones vs radix) dependen de n.
6. **Variar el tipo de elemento:** enteros, `double`, objetos con clave entera, cadenas. En objetos, el costo de la indirección y del comparador domina.
7. **Contar operaciones además del tiempo:** comparaciones y movimientos explican *por qué* un algoritmo es rápido o lento y son independientes del hardware.
8. **Verificar la corrección dentro del banco:** un algoritmo rápido pero incorrecto no es un resultado.

```dart
import 'dart:math';

enum Dist { random, sorted, reversed, fewUnique, organPipe, sawtooth, nearlySorted }

List<int> makeData(Dist d, int n, Random r) {
  if (n == 0) return <int>[];
  switch (d) {
    case Dist.random:
      return List<int>.generate(n, (_) => r.nextInt(1 << 30));
    case Dist.sorted:
      return List<int>.generate(n, (i) => i);
    case Dist.reversed:
      return List<int>.generate(n, (i) => n - i);
    case Dist.fewUnique:
      return List<int>.generate(n, (_) => r.nextInt(8));
    case Dist.organPipe:
      return List<int>.generate(n, (i) => i < n ~/ 2 ? i : n - i);
    case Dist.sawtooth:
      return List<int>.generate(n, (i) => i % 1000);
    case Dist.nearlySorted:
      final a = List<int>.generate(n, (i) => i);
      for (var s = 0; s < n ~/ 100 + 1; s++) {      // ~1 % de intercambios aleatorios
        final i = r.nextInt(n), j = r.nextInt(n);
        final t = a[i];
        a[i] = a[j];
        a[j] = t;
      }
      return a;
  }
}

/// Comparador que cuenta sus invocaciones.
class Counter {
  int comparisons = 0;
  int call(int a, int b) {
    comparisons++;
    return a < b ? -1 : (a > b ? 1 : 0);
  }
}

/// Mediana (ms) de `reps` ejecuciones sobre copias frescas, tras `warmup` descartadas.
double benchmark(void Function(List<int>) sorter, List<int> data,
    {int warmup = 3, int reps = 11}) {
  final times = <int>[];
  for (var i = 0; i < warmup + reps; i++) {
    final copy = List<int>.of(data);                // copia fuera del cronómetro
    final sw = Stopwatch()..start();
    sorter(copy);
    sw.stop();
    if (i >= warmup) times.add(sw.elapsedMicroseconds);
  }
  times.sort();
  return times[times.length ~/ 2] / 1000.0;
}

bool sameAsReference(void Function(List<int>) sorter, List<int> data) {
  final a = List<int>.of(data);
  final ref = List<int>.of(data)..sort();
  sorter(a);
  for (var i = 0; i < a.length; i++) {
    if (a[i] != ref[i]) return false;
  }
  return true;
}

void main() {
  final r = Random(42);
  int byInt(int a, int b) => a < b ? -1 : (a > b ? 1 : 0);
  final contenders = <String, void Function(List<int>)>{
    'introSort': (a) => introSort<int>(a, byInt),
    'mergeSort': (a) => mergeSort<int>(a, byInt),
    'heapSort': (a) => heapSort<int>(a, byInt),
    'List.sort': (a) => a.sort(),
  };
  for (final n in [1000, 100000, 1000000]) {
    for (final d in Dist.values) {
      final data = makeData(d, n, r);
      final row = StringBuffer('n=$n ${d.name.padRight(12)}');
      contenders.forEach((name, f) {
        assert(sameAsReference(f, data), '$name falla en $d');
        row.write(' $name=${benchmark(f, data).toStringAsFixed(1)}ms');
      });
      print(row);
    }
  }
}
```

**Prueba de estabilidad y pruebas aleatorias (property-based).** La corrección de una ordenación se verifica con tres propiedades sobre muchas entradas aleatorias de tamaños 0, 1, 2, 3, … y distintas distribuciones: (1) la salida está ordenada, (2) es una permutación de la entrada, (3) si el algoritmo se declara estable, los empates conservan el orden original.

```dart
class Rec {
  final int key, idx;
  Rec(this.key, this.idx);
}

bool checkStable(void Function(List<Rec>, Comparator<Rec>) sort, int n, Random r) {
  final a = List<Rec>.generate(n, (i) => Rec(r.nextInt(10), i));   // muchas claves repetidas
  sort(a, (x, y) => x.key.compareTo(y.key));
  for (var i = 1; i < n; i++) {
    if (a[i - 1].key > a[i].key) return false;                       // desordenado
    if (a[i - 1].key == a[i].key && a[i - 1].idx > a[i].idx) {
      return false;                                                   // empate reordenado: inestable
    }
  }
  return true;
}
```

### 10.4 Notas específicas de Dart

- **Listas tipadas** (`Int32List`, `Float64List`, `Uint8List`) almacenan valores crudos y contiguos; en `List<double>` cada `double` es un objeto en el heap. Para radix y búsquedas intensivas, la diferencia es grande.
- **Comparadores genéricos.** Una llamada a `Comparator<T>` es una llamada a closure que el compilador no suele poder inlinear. Para el camino caliente con `int`/`double`, especializa el algoritmo (usar `<` directamente) o usa `List.sort()` sin comparador para tipos `Comparable` primitivos.
- **AOT vs JIT.** El rendimiento de producción es el de `dart compile exe`; mide con ese modo.
- **`setRange` y `List.of`** usan copias eficientes (equivalentes a `memmove`/`memcpy`): úsalos en lugar de bucles de copia.
- **Validación de límites.** Dart comprueba los índices en cada acceso; en bucles calientes sobre listas tipadas el costo es pequeño pero no nulo, y no puede desactivarse.
- **Web (dart2js).** Los enteros son `double` de JavaScript (exactos hasta 2⁵³) y los operadores de bits son de 32 bits; verifica los algoritmos que dependen de desbordamiento o desplazamientos grandes.

---

## 11. Guía de decisión y trade-offs

### 11.1 Elegir un algoritmo de ordenación

| Situación | Elección | Por qué |
| --- | --- | --- |
| n ≲ 16–32 | Insertion sort | Constante mínima; es el caso base de todos los algoritmos híbridos |
| Propósito general con objetos y estabilidad requerida | Timsort / merge sort | Estable, Θ(n log n) garantizado, adaptativo |
| Propósito general sin necesidad de estabilidad, tipos primitivos | pdqsort / introsort | Más rápido en promedio, in-place, sin peor caso cuadrático |
| Peor caso garantizado y memoria O(1) | Heap sort | La única que da ambas garantías con código simple |
| Enteros de ancho fijo, n grande | Radix LSD | Θ(n·d), varias veces más rápido que comparaciones |
| Enteros en rango pequeño (k ≈ n) | Counting sort | Θ(n + k), estable |
| Reales uniformes | Bucket sort | Θ(n) esperado |
| Cadenas | MSD radix / quicksort multiclave | Aprovecha prefijos comunes |
| Casi ordenado o con runs | Timsort, insertion sort, natural merge | Θ(n + n log r) / Θ(n + Inv) |
| Muchos duplicados | Quicksort 3 vías / pdqsort / counting | O(n·H) |
| Comparaciones muy caras | Merge sort, inserción binaria, Ford–Johnson | Mínimo de comparaciones |
| Escrituras muy caras | Selection sort / cycle sort | n − 1 intercambios (o una escritura por elemento) |
| Lista enlazada | Merge sort | Sin acceso aleatorio, O(1) extra, estable |
| No cabe en RAM | Ordenación externa (runs + fusión k-aria) | Θ((N/B)·log_{M/B}(N/B)) E/S |
| Streaming / solo top-k | Heap acotado, sketches de cuantiles | O(n log k), O(k) espacio |
| Solo necesito el k-ésimo o la mediana | Quickselect / introselect | Θ(n) esperado, sin ordenar todo |
| Paralelo / GPU / SIMD | Sample sort, merge path, redes de ordenación, radix GPU | Poca divergencia y comunicación |
| Datos hostiles (entrada controlada por un atacante) | Introsort/pdqsort con aleatorización, o merge sort | Evita la degradación cuadrática |

### 11.2 Elegir un algoritmo de búsqueda

| Situación | Elección |
| --- | --- |
| Colección pequeña o sin ordenar, una consulta | Lineal |
| Muchas consultas de igualdad exacta | Tabla hash |
| Muchas consultas sobre un arreglo estático ordenado | `lower_bound` (binaria); Eytzinger/S-tree en el camino crítico |
| Duplicados, conteo, rangos | `lower_bound` / `upper_bound` |
| Claves numéricas ≈ uniformes, datos grandes | Interpolación híbrida |
| Tamaño desconocido o objetivo cerca del inicio | Exponencial |
| Fusión/intersección de listas de tamaños muy distintos | Galloping |
| «Mínimo valor tal que...» | Bisección sobre la respuesta |
| Datos dinámicos | Árbol balanceado, skip list, B-tree (no arreglo ordenado) |
| Datos en disco | B+ tree |

### 11.3 Los ejes de trade-off que atraviesan todo

- **Peor caso vs caso típico:** introsort y heap sort garantizan; quicksort puro rinde más en promedio.
- **Estabilidad vs memoria:** ordenar de forma estable casi siempre cuesta O(n) de memoria (merge/Timsort), salvo algoritmos estables in-place muy complejos.
- **Comparaciones vs movimientos vs localidad:** merge sort minimiza comparaciones, selection minimiza escrituras, quicksort minimiza movimientos y maximiza localidad, radix elimina comparaciones.
- **Generalidad vs velocidad:** las ordenaciones por comparación sirven para cualquier orden total; las lineales exigen estructura numérica.
- **Determinismo vs aleatorización:** aleatorizar elimina entradas adversarias pero introduce varianza y dependencia del generador.
- **Asintótico vs constantes:** el algoritmo O(n log n) con constante baja gana al O(n) con constante alta para n moderado.
- **Tiempo vs espacio:** counting y radix compran tiempo con memoria; heap sort compra memoria con tiempo.
- **Simplicidad vs rendimiento:** un `List.sort` correcto, probado y mantenido vence casi siempre a una implementación propia, salvo que se necesite una garantía concreta (estabilidad, peor caso, memoria, dominio de claves enteras).

### 11.4 Errores frecuentes

1. **`(lo + hi) / 2`** que desborda; usa `lo + ((hi − lo) >> 1)`.
2. **Intervalos mezclados** (cerrado y semiabierto) en búsqueda binaria; unifica con `[lo, hi)` y una primitiva (`lower_bound`).
3. **Bucle infinito** por `lo = mid` o `hi = mid` en la rama equivocada.
4. **Buscar un valor con duplicados** esperando «el primero» o «el último» y obtener uno cualquiera: usa `lower_bound`/`upper_bound − 1`.
5. **Comparar flotantes con `==`** en una búsqueda por bisección sobre reales: usa un número fijo de iteraciones.
6. **Comparador inconsistente o `a − b`:** desbordamiento, `NaN`, orden no transitivo.
7. **Suponer que `List.sort` es estable** (en Dart no lo es).
8. **Quicksort con Lomuto o pivote fijo** sobre datos con duplicados u ordenados: Θ(n²) y posible desbordamiento de pila.
9. **Recursión sin recursar en la partición menor:** pila O(n) en el peor caso.
10. **Counting sort con k enorme:** memoria y tiempo Θ(k) dominan.
11. **Benchmark solo con datos aleatorios**, sin calentamiento o ordenando datos ya ordenados.
12. **Confundir amortizado con latencia** en sistemas con requisitos de tiempo real.
13. **Elegir O(n²) «porque n es pequeño»** y encontrarse n = 10⁵ en producción.
14. **Ordenar para encontrar el máximo o el k-ésimo:** O(n log n) donde bastaba O(n).
15. **Olvidar que la pila de recursión también consume memoria** al evaluar el espacio de un algoritmo.

---

## 12. Ejercicios resueltos y plan de estudio

### 12.1 Ejercicios resueltos

**1. ¿2^(n+1) ∈ O(2ⁿ)? ¿2^(2n) ∈ O(2ⁿ)?** Sí al primero: 2^(n+1) = 2·2ⁿ, c = 2. No al segundo: 2^(2n)/2ⁿ = 2ⁿ → ∞, ninguna constante lo acota.

**2. T(n) = 4T(n/2) + n² log n.** a = 4, b = 2, p = 2; f = n²·log¹ n ⇒ caso 2 con k = 1 ⇒ **Θ(n² log² n)**.

**3. T(n) = 2T(n/4) + √n.** p = log₄ 2 = 1/2; f = n^(1/2) ⇒ caso 2 con k = 0 ⇒ **Θ(√n · log n)**.

**4. T(n) = T(n−1) + log n.** Telescopando, T(n) = Σ_{i=1}^{n} log i = log(n!) = **Θ(n log n)**.

**5. Amortizado.** Una operación i cuesta i si i es potencia de 2 y 1 en otro caso. Costo total de n operaciones ≤ n + Σ_{j=0}^{⌊log n⌋} 2ʲ < n + 2n = 3n ⇒ **O(1) amortizado**.

**6. Sort colors (bandera holandesa).** Ordenar un arreglo de 0, 1 y 2 en un solo recorrido y O(1) de espacio: es `_partition3` con pivote 1, **Θ(n)**.

**7. ¿Por qué se puede ordenar n enteros en [0, n²) en Θ(n) si counting sort con k = n² cuesta Θ(n²)?** Con **radix sort en base n**: dos dígitos (la clave se escribe como a·n + b, con a, b ∈ [0, n)), dos pasadas de counting sort de Θ(n + n) cada una ⇒ **Θ(n)**.

**8. Raíz cuadrada entera por bisección.** ⌊√x⌋ es (el menor m con m² > x) − 1; el predicado `m*m > x` es monótono:

```dart
int isqrt(int x) => partitionPoint(0, x + 2, (m) => m * m > x) - 1;   // x ≥ 0
```

**9. Mediana de dos arreglos ordenados en O(log min(m, n)).** Se busca la partición de a (con índice i) y de b (con índice j = ⌈(m+n)/2⌉ − i) tal que todo lo de la izquierda sea ≤ todo lo de la derecha. El predicado `a[i] ≥ b[j−1]` es monótono en i, así que el primer i que lo cumple se halla por bisección sobre el arreglo más corto, con centinelas ±∞ en los bordes:

```dart
import 'dart:math';

double medianOfTwoSorted(List<int> a, List<int> b) {
  if (a.length > b.length) return medianOfTwoSorted(b, a);   // buscar sobre el más corto
  final m = a.length, n = b.length;
  if (m + n == 0) throw ArgumentError('ambas listas están vacías');
  final half = (m + n + 1) >> 1;
  const inf = 1 << 62;
  int at(List<int> x, int i) => i < 0 ? -inf : (i >= x.length ? inf : x[i]);
  final i = partitionPoint(0, m + 1, (i) => at(a, i) >= at(b, half - i - 1));
  final j = half - i;
  final maxLeft = max(at(a, i - 1), at(b, j - 1));
  if ((m + n).isOdd) return maxLeft.toDouble();
  final minRight = min(at(a, i), at(b, j));
  return (maxLeft + minRight) / 2;
}
```

**10. Cota inferior del máximo.** Hallar el máximo de n elementos por comparaciones exige **n − 1**: cada elemento salvo el máximo debe «perder» al menos una comparación (de lo contrario no se sabría que no es el máximo), y cada comparación produce un solo perdedor.

### 12.2 Plan de estudio para llegar a nivel experto

**Fase 1: fundamentos sólidos (2–3 semanas).**
- Demuestra a mano 10 afirmaciones O/Ω/Θ/o y resuelve 15 recurrencias (maestro, árbol, sustitución).
- Implementa `lower_bound`/`upper_bound` y 10 problemas de bisección sobre la respuesta; escribe el invariante *antes* del código.
- Implementa insertion, merge, quick (Hoare y 3 vías) y heap sort sin mirar; prueba contra `List.sort` con pruebas aleatorias.

**Fase 2: ingeniería de rendimiento (3–4 semanas).**
- Construye el banco de pruebas de 10.3 y compara 6+ algoritmos en 7 distribuciones y 5 tamaños; grafica comparaciones, movimientos y tiempo.
- Implementa introsort y mide el efecto del corte a inserción, del tipo de pivote y de la recursión en la menor.
- Implementa radix LSD (enteros con signo y `double`) y localiza el punto de cruce con quicksort.
- Implementa la búsqueda binaria sin ramas y Eytzinger; mide en arreglos de 10³ a 10⁸ elementos.

**Fase 3: algoritmos avanzados (4–6 semanas).**
- Quickselect, BFPRT y top-k con heap; compara constantes reales.
- Natural merge sort → Timsort simplificado (con galloping) → compara con Powersort.
- Ordenación externa: genera un archivo mayor que la RAM, forma runs y fusiona con k-way merge.
- Estudia las cotas inferiores (árbol de decisión, adversario) y el análisis amortizado por potencial.

**Fase 4: profundidad teórica y práctica (continuo).**
- Lee los artículos de pdqsort, BlockQuicksort, Powersort y el error de Timsort de 2015 (sección 13).
- Reimplementa los algoritmos clave en un segundo lenguaje (Go, Rust o C++) y compara cómo cambian las constantes.
- Resuelve problemas de optimización (LeetCode medios/difíciles de bisección, ventanas, selección, inversiones, intervalos) y de concursos (Codeforces) con enfoque en elegir la técnica correcta antes de escribir código.

**Criterio de dominio:** puedes (a) demostrar la corrección y la complejidad de cada algoritmo de esta guía, (b) elegir el algoritmo adecuado para un dataset dado y justificar la decisión con números, y (c) detectar en un código ajeno un error de índice, un comparador inconsistente o una complejidad oculta.

---

## 13. Lecturas recomendadas

**Libros**
- Cormen, Leiserson, Rivest, Stein: *Introduction to Algorithms* (CLRS): análisis, recurrencias, ordenación, selección, amortizado.
- Knuth: *The Art of Computer Programming*, vol. 3: *Sorting and Searching*: la referencia definitiva sobre ordenación y búsqueda.
- Sedgewick, Wayne: *Algorithms*: ordenación y búsqueda con análisis práctico.
- Skiena: *The Algorithm Design Manual*: diseño y modelado de problemas.
- Kleinberg, Tardos: *Algorithm Design*; Dasgupta, Papadimitriou, Vazirani: *Algorithms*: diseño y teoría.
- Okasaki: *Purely Functional Data Structures*: amortizado y persistencia.
- Motwani, Raghavan: *Randomized Algorithms*: análisis probabilístico.

**Artículos y recursos**
- Bentley, McIlroy: *Engineering a Sort Function* (1993).
- McIlroy: *A Killer Adversary for Quicksort* (1999).
- Musser: *Introspective Sorting and Selection Algorithms* (1997).
- Blum, Floyd, Pratt, Rivest, Tarjan: *Time Bounds for Selection* (1973).
- Akra, Bazzi: *On the solution of linear recurrence equations* (1998).
- Aggarwal, Vitter: *The Input/Output Complexity of Sorting and Related Problems* (1988).
- Frigo, Leiserson, Prokop, Ramachandran: *Cache-Oblivious Algorithms* (1999).
- Edelkamp, Weiß: *BlockQuicksort: How Branch Mispredictions don't affect Quicksort* (2016).
- Peters: *Pattern-defeating Quicksort* (2021).
- Munro, Wild: *Nearly-Optimal Mergesorts: Fast, Practical Sorting Methods That Optimally Adapt to Existing Runs* (2018).
- de Gouw, de Boer, Bubel, Hähnle, Rot, Steinhöfel: *OpenJDK's java.utils.Collection.sort() is broken* (2015).
- Khuong, Morin: *Array Layouts for Comparison-Based Searching* (2015).
- Van Sandt, Chronis, Patel: *Efficiently Searching In-Memory Sorted Arrays: Revenge of the Interpolation Search?* (SIGMOD 2019).
- Bloch: *Nearly All Binary Searches and Mergesorts are Broken* (2006).
- *Algorithms for Modern Hardware* (Sergey Slotin, en.algorithmica.org/hpc): búsqueda binaria sin ramas, Eytzinger y S-trees con mediciones.
