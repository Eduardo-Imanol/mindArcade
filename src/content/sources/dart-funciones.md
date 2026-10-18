# Funciones en Dart: de 0 a pro

## 1. Qué es una función

Una función es un bloque de código con nombre que recibe datos (parámetros), hace algo y opcionalmente devuelve un resultado. **En Dart las funciones son objetos**: son instancias de la clase `Function`. Por eso puedes guardarlas en variables, pasarlas como argumentos y devolverlas desde otras funciones (*first-class functions*).

```dart
void saludar() {
  print('Hola');
}

void main() {
  saludar(); // llamada
}
```

Anatomía completa:

```dart
int sumar(int a, int b) {
  return a + b;
}
// tipoRetorno nombre(parámetros) { cuerpo }
```

- `main()` es el punto de entrada de todo programa Dart.
- Los tipos son opcionales (`sumar(a, b)` funciona), pero **siempre declara los tipos** en funciones públicas: es más seguro y legible.

---

## 2. Retorno

### 2.1 Tipo de retorno y `return`

```dart
double promedio(double a, double b) {
  return (a + b) / 2;
}
```

### 2.2 `void`
No devuelve valor. `return;` sirve para salir antes.

```dart
void validar(int edad) {
  if (edad < 0) return; // salida anticipada
  print('Edad válida: $edad');
}
```

### 2.3 Sin return explícito
Si una función no-void no ejecuta `return`, el analizador te da error (si el tipo no admite null). Una función sin tipo declarado que no devuelve nada retorna implícitamente `null`.

### 2.4 Retornar múltiples valores
**Con Records (Dart 3+)**, la forma moderna:

```dart
(int, int) minMax(List<int> nums) {
  return (nums.reduce((a, b) => a < b ? a : b),
          nums.reduce((a, b) => a > b ? a : b));
}

void main() {
  final (minimo, maximo) = minMax([3, 9, 1]); // desestructuración
  print('$minimo $maximo'); // 1 9
}
```

Con records nombrados:

```dart
({String nombre, int edad}) persona() => (nombre: 'Ana', edad: 30);
print(persona().nombre);
```

### 2.5 Tipo nulable

```dart
int? buscar(List<int> l, int x) {
  final i = l.indexOf(x);
  return i == -1 ? null : i;
}
```

---

## 3. Sintaxis de flecha (arrow `=>`)

Para funciones de **una sola expresión**. `=> expr` equivale a `{ return expr; }`.

```dart
int cuadrado(int x) => x * x;
void log(String m) => print('[LOG] $m');
```

Solo admite una expresión, no sentencias (`if` como sentencia, `for`, etc.). Sí admite el operador ternario, `??`, etc.

---

## 4. Parámetros (la parte más rica de Dart)

### 4.1 Posicionales obligatorios
```dart
String unir(String a, String b) => '$a $b';
unir('Hola', 'mundo');
```
El orden importa.

### 4.2 Posicionales opcionales `[ ]`
```dart
String saludo(String nombre, [String? titulo, String sufijo = '!']) {
  return 'Hola ${titulo ?? ''} $nombre$sufijo';
}

saludo('Ana');
saludo('Ana', 'Dra.');
saludo('Ana', 'Dra.', '!!!');
```
Deben ser nulables o tener valor por defecto.

### 4.3 Nombrados `{ }`
Se pasan por nombre, en cualquier orden. **Son opcionales por defecto.**

```dart
void crearUsuario({String? nombre, int edad = 18, bool activo = true}) {
  print('$nombre $edad $activo');
}

crearUsuario(edad: 25, nombre: 'Luis');
```

### 4.4 Nombrados obligatorios con `required`
```dart
void conectar({required String host, required int puerto, int timeout = 30}) {}

conectar(host: 'localhost', puerto: 8080);
```
Esto es el estándar en Flutter y en cualquier API legible: la llamada se autodocumenta.

### 4.5 Mezclar posicionales y nombrados
Los posicionales van primero.

```dart
void enviar(String mensaje, {required String para, bool urgente = false}) {}
enviar('Hola', para: 'ana@mail.com');
```
**No puedes combinar `[ ]` y `{ }` en la misma función.**

### 4.6 Valores por defecto
Deben ser **constantes de compilación** (`const`).

```dart
void f([int x = 5, List<int> l = const []]) {}
```
Si necesitas un valor no constante, usa nulable y asigna dentro:

```dart
void g([List<int>? l]) {
  l ??= [];
}
```

### 4.7 Paso por valor de referencias
En Dart todo se pasa "por valor de la referencia". Los tipos primitivos (`int`, `String`) son inmutables, así que reasignar el parámetro no afecta al original. Pero **mutar** un objeto sí:

```dart
void agregar(List<int> l) {
  l.add(99);   // afecta a la lista original
  l = [1, 2];  // solo cambia la variable local, no la original
}
```

### 4.8 Parámetros `final` y shadowing
Puedes declarar `final int x`. Los parámetros son variables locales.

### 4.9 Parámetros de función (callbacks)
```dart
void ejecutar(int Function(int) operacion, int valor) {
  print(operacion(valor));
}
ejecutar((x) => x * 2, 5); // 10
```

### 4.10 Super parámetros y parámetros de inicialización (constructores)
```dart
class Persona {
  final String nombre;
  Persona(this.nombre);          // initializing formal
}
class Estudiante extends Persona {
  Estudiante(super.nombre);      // super parameter (Dart 2.17+)
}
```

### 4.11 Parámetros genéricos
```dart
T primero<T>(List<T> l) => l.first;
primero<int>([1, 2, 3]);
primero(['a', 'b']); // T inferido como String
```

Con restricción: `T mayor<T extends Comparable<T>>(T a, T b) => a.compareTo(b) >= 0 ? a : b;`

### 4.12 Variadic (no existe, pero se simula)
Dart no tiene `...args`. Alternativas: recibir una `List`, o usar `...` (spread) al llamar:

```dart
int sumaTodos(List<int> nums) => nums.fold(0, (a, b) => a + b);
sumaTodos([1, 2, ...[3, 4]]);
```

---

## 5. Scope (ámbito)

Dart tiene **scope léxico**: lo que una variable "ve" se decide por dónde está escrita en el código, no por cómo se ejecuta.

### 5.1 Niveles
- **Global/top-level**: fuera de todo; visible en todo el archivo (y fuera, si no empieza con `_`).
- **De función**: parámetros y variables locales.
- **De bloque**: lo declarado dentro de `{ }` (`if`, `for`, etc.) vive solo ahí.

```dart
String global = 'soy global';

void main() {
  var local = 'local de main';

  void interna() {
    var deInterna = 'solo aquí';
    print(global);   // ✅
    print(local);    // ✅ (ve el scope exterior)
  }

  interna();
  // print(deInterna); ❌ error
  if (true) {
    var enBloque = 1;
  }
  // print(enBloque); ❌ error
}
```

### 5.2 Shadowing (sombreado)
Una variable interna con el mismo nombre oculta la externa:

```dart
var x = 'externa';
void f() {
  var x = 'interna';
  print(x); // interna
}
```

### 5.3 Privacidad por biblioteca
Un identificador que empieza con `_` es **privado a su archivo/biblioteca**, no a la clase:

```dart
void _ayudante() {}  // solo visible en este archivo
```

### 5.4 Variables en `for` y closures
```dart
final fs = <Function>[];
for (var i = 0; i < 3; i++) {
  fs.add(() => print(i));
}
fs.forEach((f) => f()); // 0 1 2
```
En Dart cada iteración del `for` tiene su **propia copia** de `i` (a diferencia del clásico problema de `var` en JavaScript).

### 5.5 `late` y scope
```dart
late final String config; // se inicializa después, una sola vez
late int costoso = calcular(); // inicialización perezosa (lazy)
```

---

## 6. Closures (clausuras)

Un **closure** es una función que **captura variables de su scope exterior** y las sigue usando aunque ese scope ya haya terminado de ejecutarse.

### 6.1 Ejemplo base
```dart
Function contador() {
  var cuenta = 0;
  return () {
    cuenta++;
    return cuenta;
  };
}

void main() {
  final c1 = contador();
  final c2 = contador();
  print(c1()); // 1
  print(c1()); // 2
  print(c2()); // 1  (otro closure, otra variable "cuenta")
}
```
`cuenta` sobrevive porque el closure mantiene una referencia a ella. Cada llamada a `contador()` crea un entorno nuevo.

### 6.2 Tipado correcto
```dart
int Function() contador() {
  var n = 0;
  return () => ++n;
}
```

### 6.3 Closures capturan **variables, no valores**
```dart
var x = 10;
final f = () => x;
x = 20;
print(f()); // 20, no 10
```

### 6.4 Fábricas de funciones
```dart
int Function(int) multiplicadorPor(int factor) => (n) => n * factor;

final doble = multiplicadorPor(2);
final triple = multiplicadorPor(3);
print(doble(5));  // 10
print(triple(5)); // 15
```

### 6.5 Encapsulación / estado privado
```dart
({void Function() depositar, int Function() saldo}) cuenta() {
  var _saldo = 0;
  return (
    depositar: () => _saldo += 100,
    saldo: () => _saldo,
  );
}
```
El saldo no es accesible desde fuera sin pasar por las funciones.

### 6.6 Memoización con closure
```dart
int Function(int) memoizar(int Function(int) f) {
  final cache = <int, int>{};
  return (n) => cache.putIfAbsent(n, () => f(n));
}
```

### 6.7 Cuidado: fugas de memoria
Un closure que captura un objeto grande lo mantiene vivo mientras exista el closure (típico con listeners en Flutter que no se cancelan).

---

## 7. Funciones anónimas y lambdas

### 7.1 Función anónima (sin nombre)
```dart
final saludar = (String n) {
  return 'Hola $n';
};
```

### 7.2 "Lambda" (anónima con flecha)
```dart
final cuadrado = (int x) => x * x;
```
Dart no tiene una palabra clave `lambda`: se les llama así coloquialmente a las funciones anónimas, sobre todo las de flecha.

### 7.3 Uso típico con colecciones
```dart
final nums = [1, 2, 3, 4, 5, 6];

nums.map((n) => n * 2);                  // 2,4,6,...
nums.where((n) => n.isEven);             // 2,4,6
nums.reduce((a, b) => a + b);            // 21
nums.fold(10, (acc, n) => acc + n);      // 31
nums.any((n) => n > 5);                  // true
nums.every((n) => n > 0);                // true
nums.sort((a, b) => b.compareTo(a));     // orden descendente (muta la lista)
nums.forEach((n) => print(n));
```
Nota: `map` y `where` devuelven `Iterable` **perezoso**; usa `.toList()` para materializar.

### 7.4 Invocación inmediata (IIFE)
```dart
final r = (() => 42)();
```

### 7.5 Tear-offs (referencias a funciones existentes)
En vez de `(x) => print(x)`, pasa la función directamente:

```dart
nums.forEach(print);
final convertir = int.parse;       // tear-off de función estática
final mayus = 'hola'.toUpperCase;  // tear-off de método ligado a un objeto
final crear = Persona.new;         // tear-off de constructor (Dart 2.15+)
```

---

## 8. Funciones como ciudadanos de primera clase

### 8.1 Asignar a variables
```dart
int sumar(int a, int b) => a + b;
final op = sumar;
print(op(2, 3));
```

### 8.2 Tipos de función: `typedef` y `Function`
```dart
typedef Operacion = int Function(int, int);

Operacion elegir(String s) {
  switch (s) {
    case '+': return (a, b) => a + b;
    case '*': return (a, b) => a * b;
    default: throw ArgumentError('Operador inválido');
  }
}
```

Typedef genérico:
```dart
typedef Transformador<T, R> = R Function(T);
```

Evita el tipo suelto `Function` cuando puedas: pierde seguridad de tipos. Prefiere `int Function(int)`.

### 8.3 Mapas de funciones (despacho)
```dart
final ops = <String, double Function(double, double)>{
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '/': (a, b) => a / b,
};
print(ops['+']!(3, 4));
```

### 8.4 Funciones de orden superior
Reciben o devuelven funciones:

```dart
List<R> mapear<T, R>(List<T> l, R Function(T) f) {
  final out = <R>[];
  for (final e in l) out.add(f(e));
  return out;
}
```

### 8.5 Composición
```dart
T Function(T) componer<T>(T Function(T) f, T Function(T) g) => (x) => f(g(x));
final masUnoYDoble = componer<int>((x) => x * 2, (x) => x + 1);
print(masUnoYDoble(3)); // 8
```

### 8.6 Currying y aplicación parcial
```dart
int Function(int) Function(int) sumaCurry = (a) => (b) => a + b;
print(sumaCurry(2)(3)); // 5
final sumar10 = sumaCurry(10);
```

---

## 9. Funciones locales (anidadas)

Se declaran dentro de otra función y solo existen ahí; ven las variables del contenedor.

```dart
int factorialSeguro(int n) {
  if (n < 0) throw ArgumentError('Negativo');
  int helper(int k) => k <= 1 ? 1 : k * helper(k - 1);
  return helper(n);
}
```
Útil para ocultar helpers recursivos sin contaminar el scope global.

---

## 10. Recursión

Una función que **se llama a sí misma**. Necesita **caso base** (cuándo parar) y **caso recursivo** (acercarse al base).

### 10.1 Clásicos
```dart
int factorial(int n) => n <= 1 ? 1 : n * factorial(n - 1);

int fibonacci(int n) => n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2); // O(2^n) ¡lento!

int potencia(int b, int e) => e == 0 ? 1 : b * potencia(b, e - 1);

int sumaLista(List<int> l) => l.isEmpty ? 0 : l.first + sumaLista(l.sublist(1));
```

### 10.2 Cómo se ejecuta (pila de llamadas)
`factorial(3)` → `3 * factorial(2)` → `2 * factorial(1)` → `1`. Luego se resuelve hacia atrás: 1 → 2 → 6. Cada llamada ocupa un *stack frame*. Demasiada profundidad produce **StackOverflowError**. Dart **no** garantiza optimización de recursión de cola (*tail call optimization*), así que para profundidades enormes usa iteración.

### 10.3 Recursión de cola (con acumulador)
```dart
int factorialCola(int n, [int acc = 1]) =>
    n <= 1 ? acc : factorialCola(n - 1, acc * n);
```
Más limpia conceptualmente, pero en Dart no evita el consumo de pila.

### 10.4 Fibonacci eficiente con memoización
```dart
final _memo = <int, int>{};
int fib(int n) {
  if (n < 2) return n;
  return _memo[n] ??= fib(n - 1) + fib(n - 2); // O(n)
}
```

### 10.5 Recursión sobre estructuras (árboles)
```dart
class Nodo {
  int valor;
  Nodo? izq, der;
  Nodo(this.valor, [this.izq, this.der]);
}

int altura(Nodo? n) =>
    n == null ? 0 : 1 + max(altura(n.izq), altura(n.der)); // import 'dart:math'

void inorden(Nodo? n, void Function(int) visitar) {
  if (n == null) return;
  inorden(n.izq, visitar);
  visitar(n.valor);
  inorden(n.der, visitar);
}
```

### 10.6 Backtracking / permutaciones
```dart
List<List<int>> permutaciones(List<int> l) {
  if (l.length <= 1) return [l];
  final res = <List<int>>[];
  for (var i = 0; i < l.length; i++) {
    final resto = [...l]..removeAt(i);
    for (final p in permutaciones(resto)) {
      res.add([l[i], ...p]);
    }
  }
  return res;
}
```

### 10.7 Lambda recursiva
Una lambda no puede referirse a sí misma directamente; declara antes la variable:

```dart
late int Function(int) fact;
fact = (n) => n <= 1 ? 1 : n * fact(n - 1);
```
O usa una función local con nombre (más simple).

### 10.8 Recursión mutua
```dart
bool esPar(int n) => n == 0 ? true : esImpar(n - 1);
bool esImpar(int n) => n == 0 ? false : esPar(n - 1);
```

---

## 11. Funciones asíncronas

### 11.1 `Future`, `async`, `await`
```dart
Future<String> obtenerDato() async {
  await Future.delayed(Duration(seconds: 1));
  return 'listo';
}

Future<void> main() async {
  final d = await obtenerDato();
  print(d);
}
```
- Una función `async` **siempre** devuelve un `Future`.
- `await` pausa solo esa función, sin bloquear el hilo.

### 11.2 Errores
```dart
try {
  await operacionRiesgosa();
} catch (e, stack) {
  print('Error: $e');
} finally {
  print('siempre se ejecuta');
}
```

### 11.3 Concurrencia con Futures
```dart
final results = await Future.wait([f1(), f2(), f3()]); // en paralelo
```

### 11.4 Sin `async`: `then`
```dart
obtenerDato().then((v) => print(v)).catchError((e) => print(e));
```

### 11.5 Generadores síncronos: `sync*` + `yield`
Devuelven un `Iterable` perezoso:

```dart
Iterable<int> contarHasta(int n) sync* {
  for (var i = 1; i <= n; i++) {
    yield i;
  }
}

Iterable<int> pares(int n) sync* {
  for (var i = 0; i <= n; i++) {
    if (i.isEven) yield i;
  }
}

Iterable<int> cuenta(int n) sync* {   // recursivo con yield*
  if (n > 0) {
    yield n;
    yield* cuenta(n - 1);
  }
}
```

### 11.6 Generadores asíncronos: `async*` (Streams)
```dart
Stream<int> temporizador(int n) async* {
  for (var i = 1; i <= n; i++) {
    await Future.delayed(Duration(seconds: 1));
    yield i;
  }
}

await for (final v in temporizador(3)) {
  print(v);
}
```

---

## 12. Funciones en clases

### 12.1 Métodos de instancia
```dart
class Rect {
  final double w, h;
  Rect(this.w, this.h);
  double area() => w * h;
}
```

### 12.2 Getters y setters
```dart
class Circulo {
  double radio;
  Circulo(this.radio);
  double get area => 3.1416 * radio * radio;
  set diametro(double d) => radio = d / 2;
}
```

### 12.3 Métodos estáticos
```dart
class Mate {
  static int cuadrado(int x) => x * x;
}
Mate.cuadrado(4);
```

### 12.4 Constructores (también son funciones)
```dart
class Punto {
  final double x, y;
  Punto(this.x, this.y);                          // generativo
  Punto.origen() : x = 0, y = 0;                  // nombrado
  factory Punto.desdeMapa(Map m) => Punto(m['x'], m['y']); // factory
  const Punto.constante(this.x, this.y);          // const
}
```
`factory` puede devolver instancias existentes (cachés, singletons).

### 12.5 Sobrecarga de operadores
```dart
class Vec {
  final int x, y;
  const Vec(this.x, this.y);
  Vec operator +(Vec o) => Vec(x + o.x, y + o.y);
  @override
  bool operator ==(Object o) => o is Vec && o.x == x && o.y == y;
  @override
  int get hashCode => Object.hash(x, y);
}
```
**Dart no soporta sobrecarga de métodos** (mismo nombre con distintos parámetros); usa parámetros opcionales/nombrados o nombres distintos.

### 12.6 Objetos invocables: `call()`
Una clase con método `call` se puede invocar como función:

```dart
class Multiplicador {
  final int f;
  Multiplicador(this.f);
  int call(int x) => x * f;
}
final por3 = Multiplicador(3);
print(por3(5)); // 15
```

### 12.7 Métodos abstractos, `@override`, `super`
```dart
abstract class Forma {
  double area();
}
class Cuadrado extends Forma {
  final double l;
  Cuadrado(this.l);
  @override
  double area() => l * l;
}
```

### 12.8 Extension methods
Añaden funciones a tipos existentes:

```dart
extension StringX on String {
  String capitalizar() =>
      isEmpty ? this : this[0].toUpperCase() + substring(1);
}
print('dart'.capitalizar()); // Dart
```

### 12.9 Mixins
Reutilizan métodos entre clases:

```dart
mixin Volador {
  void volar() => print('volando');
}
class Pato with Volador {}
```

---

## 13. Funciones genéricas avanzadas

```dart
T maximo<T extends Comparable<T>>(List<T> l) =>
    l.reduce((a, b) => a.compareTo(b) >= 0 ? a : b);

Map<K, List<T>> agruparPor<T, K>(Iterable<T> items, K Function(T) clave) {
  final m = <K, List<T>>{};
  for (final i in items) {
    m.putIfAbsent(clave(i), () => []).add(i);
  }
  return m;
}
```

Extension genérica:
```dart
extension IterableX<T> on Iterable<T> {
  T? primeroDonde(bool Function(T) test) {
    for (final e in this) { if (test(e)) return e; }
    return null;
  }
}
```

---

## 14. Funciones con pattern matching (Dart 3)

```dart
String describir(Object o) => switch (o) {
  int n when n < 0 => 'negativo',
  int n => 'entero $n',
  String s => 'texto de ${s.length}',
  [int a, int b] => 'par de enteros $a, $b',
  (int x, int y) => 'record $x,$y',
  _ => 'otro',
};
```

---

## 15. Aserciones, errores y excepciones en funciones

```dart
double dividir(double a, double b) {
  if (b == 0) throw ArgumentError.value(b, 'b', 'No puede ser cero');
  return a / b;
}

void f(int x) {
  assert(x > 0, 'x debe ser positivo'); // solo en modo debug
}
```

`Never` es el tipo de retorno de funciones que nunca terminan normalmente:
```dart
Never fallar(String m) => throw Exception(m);
```

---

## 16. Isolates (paralelismo real)

Dart es mono-hilo por isolate; para trabajo pesado:

```dart
final r = await Isolate.run(() => calculoPesado(1000000)); // import 'dart:isolate'
```
La función debe poder enviarse al otro isolate (no puede capturar objetos no transferibles).

---

## 17. Buenas prácticas y errores comunes

1. **Declara tipos** de parámetros y retorno.
2. Usa **nombrados + `required`** cuando hay más de 2–3 parámetros o booleanos ambiguos (`f(true, false)` es ilegible).
3. Funciones **pequeñas y con una sola responsabilidad**.
4. Prefiere **tear-offs** a lambdas triviales (`forEach(print)`).
5. Prefiere `=>` solo para expresiones simples.
6. No uses `Function` sin tipo; usa `typedef`.
7. Cuidado con closures que capturan estado mutable: pueden dar resultados sorprendentes.
8. No olvides el **caso base** en recursión; considera iteración si la profundidad es grande.
9. En `async`, **siempre** `await` los Futures (el linter `unawaited_futures` ayuda).
10. `map`/`where` son perezosos: si los iteras varias veces, se recalculan.
11. Valores por defecto: solo constantes.
12. Evita efectos secundarios ocultos; prefiere funciones puras (misma entrada → misma salida, sin modificar nada externo) cuando puedas, porque son más fáciles de probar.

---

## 18. Mini-proyecto integrador

```dart
typedef Regla<T> = bool Function(T);

class Validador<T> {
  final List<Regla<T>> _reglas = [];

  Validador<T> agregar(Regla<T> r) {
    _reglas.add(r);
    return this; // encadenamiento
  }

  bool call(T valor) => _reglas.every((r) => r(valor));
}

void main() {
  final esPasswordValido = Validador<String>()
      .agregar((s) => s.length >= 8)
      .agregar((s) => s.contains(RegExp(r'[0-9]')))
      .agregar((s) => s != s.toLowerCase());

  print(esPasswordValido('Hola1234')); // true
  print(esPasswordValido('hola'));     // false
}
```
Aquí combinas: genéricos, typedef, closures, lambdas, objeto invocable (`call`), orden superior y encadenamiento.

---

## 19. Ejercicios sugeridos (para dominarlo)

1. Escribe `contarPalabras(String texto, {bool ignorarMayus = true})`.
2. Crea una fábrica `crearSaludador(String idioma)` que devuelva un closure.
3. Implementa `mapear`, `filtrar` y `reducir` desde cero con genéricos.
4. Resuelve Torres de Hanoi recursivamente.
5. Haz `debounce` o `once(f)` (ejecuta `f` solo la primera vez) con closures.
6. Genera la secuencia de Collatz con `sync*`.
7. Implementa recorrido en profundidad (DFS) de un grafo recursivamente y luego con una pila.
8. Crea un `Future` con reintentos: `reintentar(Future<T> Function() tarea, {int veces = 3})`.
