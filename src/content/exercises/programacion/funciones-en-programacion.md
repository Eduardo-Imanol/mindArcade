# Funciones en Programación — Ejercicios

Tema: funciones-en-programacion

## Mazo 1

### E: suma-basica
- Cartas: que-es-una-funcion-en-dart, que-indica-el-tipo-de-retorno-de-una-funcion
- Prompt: Ordena, completa o escribe una función que reciba dos números y devuelva su suma.
- Lenguaje: javascript

Solución:
```js
function sumar(a, b) {
  return a + b;
}
```

Starter:
```js
function sumar(a, b) {
  // tu código
}
```

Plantilla:
```js
function sumar({{a}}, {{b}}) {
  return {{op}};
}
```

Blanks:
- a = a
- b = b
- op = a + b | b + a

Función: sumar

Casos:
- [2, 3] → 5
- [-1, 1] → 0

### E: mayor-de-edad
- Cartas: que-hace-el-operador-flecha
- Prompt: Ordena, completa o escribe una función flecha que indique si una edad es mayor o igual a 18.
- Lenguaje: javascript

Solución:
```js
const esMayorDeEdad = (edad) => {
  return edad >= 18;
};
```

Starter:
```js
const esMayorDeEdad = (edad) => {
  return false;
};
```

Plantilla:
```js
const esMayorDeEdad = ({{parametro}}) => {
  return {{condicion}};
};
```

Blanks:
- parametro = edad
- condicion = edad >= 18

Función: esMayorDeEdad

Casos:
- [18] → true
- [17] → false

### E: saludo-con-defecto
- Cartas: que-son-los-parametros-posicionales-opcionales
- Prompt: Ordena, completa o escribe una función que salude y use "mundo" cuando no reciba nombre.
- Lenguaje: javascript

Solución:
```js
function saludar(nombre = 'mundo') {
  return 'Hola, ' + nombre + '!';
}
```

Starter:
```js
function saludar(nombre) {
  return 'Hola!';
}
```

Plantilla:
```js
function saludar(nombre = {{defecto}}) {
  return {{saludo}};
}
```

Blanks:
- defecto = 'mundo'
- saludo = 'Hola, ' + nombre + '!'

Función: saludar

Casos:
- [] → "Hola, mundo!"
- ["Ana"] → "Hola, Ana!"

### E: area-rectangulo
- Cartas: que-son-los-parametros-nombrados, para-que-sirve-required-en-un-parametro-nombrado
- Prompt: Ordena, completa o escribe una función que reciba un objeto con ancho y alto, y devuelva el área.
- Lenguaje: javascript

Solución:
```js
function areaRectangulo({ ancho, alto }) {
  return ancho * alto;
}
```

Starter:
```js
function areaRectangulo(opciones) {
  return 0;
}
```

Plantilla:
```js
function areaRectangulo({{parametros}}) {
  return {{operacion}};
}
```

Blanks:
- parametros = { ancho, alto }
- operacion = ancho * alto

Función: areaRectangulo

Casos:
- [{"ancho":2,"alto":3}] → 6
- [{"ancho":5,"alto":4}] → 20

### E: mensaje-con-scope
- Cartas: que-es-el-scope-lexico
- Prompt: Ordena, completa o escribe una función que use una constante local para construir un mensaje.
- Lenguaje: javascript

Solución:
```js
function construirMensaje(nombre) {
  const prefijo = 'Hola';
  return prefijo + ', ' + nombre;
}
```

Starter:
```js
function construirMensaje(nombre) {
  return nombre;
}
```

Plantilla:
```js
function construirMensaje(nombre) {
  const prefijo = {{prefijo}};
  return {{mensaje}};
}
```

Blanks:
- prefijo = 'Hola'
- mensaje = prefijo + ', ' + nombre

Función: construirMensaje

Casos:
- ["Ana"] → "Hola, Ana"
- ["Luis"] → "Hola, Luis"

### E: main-iniciar
- Cartas: que-significa-que-main-sea-el-punto-de-entrada, que-indica-el-tipo-de-retorno-de-una-funcion
- Prompt: Ordena, completa o escribe la función main, punto de entrada, que devuelva el resultado de iniciar.
- Lenguaje: javascript

Solución:
```js
function main() {
  return iniciar();
}
function iniciar() {
  return 'listo';
}
```

Starter:
```js
function main() {
  return '';
}
function iniciar() {
  return 'listo';
}
```

Plantilla:
```js
function main() {
  return {{llamada}};
}
function iniciar() {
  return 'listo';
}
```

Blanks:
- llamada = iniciar()

Función: main

Casos:
- [] → "listo"

## Mazo 2

### E: acumular-closure
- Cartas: que-es-un-closure, un-closure-captura-valores-o-variables
- Prompt: Ordena, completa o escribe una función que use un closure para acumular la suma de una lista.
- Lenguaje: javascript

Solución:
```js
function acumular(valores) {
  let total = 0;
  const sumar = (valor) => {
    total += valor;
    return total;
  };
  return valores.map(sumar);
}
```

Starter:
```js
function acumular(valores) {
  return valores;
}
```

Plantilla:
```js
function acumular(valores) {
  let total = {{inicial}};
  const sumar = (valor) => {
    total += valor;
    return total;
  };
  return valores.map(sumar);
}
```

Blanks:
- inicial = 0

Función: acumular

Casos:
- [ [1, 2, 3] ] → [1, 3, 6]
- [ [] ] → []

### E: fibonacci-memo
- Cartas: que-es-la-memoizacion-con-closure, que-es-un-closure, que-necesita-toda-funcion-recursiva
- Prompt: Ordena, completa o escribe una función recursiva que use una caché en un closure para calcular Fibonacci.
- Lenguaje: javascript

Solución:
```js
function fibonacci(n) {
  const cache = {};
  function calcular(valor) {
    if (valor in cache) {
      return cache[valor];
    }
    if (valor <= 1) {
      return valor;
    }
    const resultado = calcular(valor - 1) + calcular(valor - 2);
    cache[valor] = resultado;
    return resultado;
  }
  return calcular(n);
}
```

Starter:
```js
function fibonacci(n) {
  if (n <= 1) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```

Plantilla:
```js
function fibonacci(n) {
  const cache = {};
  function calcular(valor) {
    if (valor in cache) {
      return {{guardado}};
    }
    if (valor <= 1) {
      return valor;
    }
    const resultado = calcular(valor - 1) + calcular(valor - 2);
    cache[valor] = {{calculo}};
    return resultado;
  }
  return calcular(n);
}
```

Blanks:
- guardado = cache[valor]
- calculo = resultado

Función: fibonacci

Casos:
- [10] → 55
- [0] → 0

### E: sumar-todos
- Cartas: que-es-una-funcion-anonima-o-lambda, que-es-una-funcion-de-orden-superior
- Prompt: Ordena, completa o escribe una función que sume una lista con una función anónima.
- Lenguaje: javascript

Solución:
```js
function sumarTodos(numeros) {
  return numeros.reduce((total, valor) => total + valor, 0);
}
```

Starter:
```js
function sumarTodos(numeros) {
  return 0;
}
```

Plantilla:
```js
function sumarTodos(numeros) {
  return numeros.{{metodo}}((total, valor) => total + valor, 0);
}
```

Blanks:
- metodo = reduce

Función: sumarTodos

Casos:
- [ [1, 2, 3] ] → 6
- [ [] ] → 0

### E: duplicar-todos
- Cartas: que-es-un-tear-off, que-es-una-funcion-de-orden-superior
- Prompt: Ordena, completa o escribe una función que pase una función guardada directamente a map.
- Lenguaje: javascript

Solución:
```js
function duplicarTodos(numeros) {
  const duplicar = (valor) => valor * 2;
  return numeros.map(duplicar);
}
```

Starter:
```js
function duplicarTodos(numeros) {
  return numeros;
}
```

Plantilla:
```js
function duplicarTodos(numeros) {
  const duplicar = (valor) => valor * {{factor}};
  return numeros.{{metodo}}(duplicar);
}
```

Blanks:
- factor = 2
- metodo = map

Función: duplicarTodos

Casos:
- [ [1, 2, 3] ] → [2, 4, 6]
- [ [] ] → []

### E: factorial-recursivo
- Cartas: que-necesita-toda-funcion-recursiva
- Prompt: Ordena, completa o escribe una función recursiva con caso base para calcular el factorial.
- Lenguaje: javascript

Solución:
```js
function factorial(n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}
```

Starter:
```js
function factorial(n) {
  return 1;
}
```

Plantilla:
```js
function factorial(n) {
  if (n {{comparacion}} 1) {
    return {{casoBase}};
  }
  return n * factorial(n - 1);
}
```

Blanks:
- comparacion = <=
- casoBase = 1

Función: factorial

Casos:
- [5] → 120
- [0] → 1

### E: contar-pares
- Cartas: que-es-una-funcion-anonima-o-lambda, que-es-una-funcion-de-orden-superior
- Prompt: Ordena, completa o escribe una función que cuente los pares con una lambda y filter.
- Lenguaje: javascript

Solución:
```js
function contarPares(numeros) {
  const esPar = (valor) => valor % 2 === 0;
  return numeros.filter(esPar).length;
}
```

Starter:
```js
function contarPares(numeros) {
  return 0;
}
```

Plantilla:
```js
function contarPares(numeros) {
  const esPar = (valor) => valor {{operador}} 2 === 0;
  return numeros.{{metodo}}(esPar).length;
}
```

Blanks:
- operador = %
- metodo = filter

Función: contarPares

Casos:
- [ [1, 2, 3, 4] ] → 2
- [ [] ] → 0

## Mazo 3

### E: normalizar-texto
- Cartas: que-hace-return-en-una-funcion-void, que-es-un-tipo-anulable-en-dart
- Prompt: Ordena, completa o escribe una función que devuelva null si el texto está vacío y el texto limpio si no.
- Lenguaje: javascript

Solución:
```js
function normalizarTexto(texto) {
  if (texto.trim() === '') {
    return null;
  }
  return texto.trim();
}
```

Starter:
```js
function normalizarTexto(texto) {
  return texto;
}
```

Plantilla:
```js
function normalizarTexto(texto) {
  if (texto.trim() === {{vacio}}) {
    return {{sinValor}};
  }
  return texto.trim();
}
```

Blanks:
- vacio = ''
- sinValor = null

Función: normalizarTexto

Casos:
- ["  hola  "] → "hola"
- ["   "] → null

### E: clasificar-numero
- Cartas: que-restricciones-tiene-el-operador-flecha
- Prompt: Ordena, completa o escribe una función flecha de una sola expresión que clasifique un número.
- Lenguaje: javascript

Solución:
```js
const clasificarNumero = (numero) => numero > 0 ? 'positivo' : 'negativo';
```

Starter:
```js
const clasificarNumero = (numero) => 'negativo';
```

Plantilla:
```js
const clasificarNumero = ({{parametro}}) => {{condicion}};
```

Blanks:
- parametro = numero
- condicion = numero > 0 ? 'positivo' : 'negativo'

Función: clasificarNumero

Casos:
- [3] → "positivo"
- [-1] → "negativo"
- [0] → "negativo"

### E: min-max
- Cartas: como-se-retornan-multiples-valores-en-dart-3
- Prompt: Ordena, completa o escribe una función que devuelva el mínimo y el máximo como una tupla.
- Lenguaje: javascript

Solución:
```js
function minMax(numeros) {
  let minimo = numeros[0];
  let maximo = numeros[0];
  for (const numero of numeros) {
    if (numero < minimo) {
      minimo = numero;
    }
    if (numero > maximo) {
      maximo = numero;
    }
  }
  return [minimo, maximo];
}
```

Starter:
```js
function minMax(numeros) {
  return [];
}
```

Plantilla:
```js
function minMax(numeros) {
  let minimo = {{inicial}};
  let maximo = {{inicial}};
  for (const numero of numeros) {
    if (numero < minimo) {
      minimo = numero;
    }
    if (numero > maximo) {
      maximo = numero;
    }
  }
  return {{retorno}};
}
```

Blanks:
- inicial = numeros[0]
- retorno = [minimo, maximo]

Función: minMax

Casos:
- [ [3, 1, 5] ] → [1, 5]
- [ [7] ] → [7, 7]

### E: estadisticas-record
- Cartas: que-son-los-records-nombrados
- Prompt: Ordena, completa o escribe una función que devuelva un objeto con total y cantidad.
- Lenguaje: javascript

Solución:
```js
function estadisticas(numeros) {
  const total = numeros.reduce((suma, valor) => suma + valor, 0);
  return { total, cantidad: numeros.length };
}
```

Starter:
```js
function estadisticas(numeros) {
  return {};
}
```

Plantilla:
```js
function estadisticas(numeros) {
  const total = numeros.reduce((suma, valor) => suma + valor, 0);
  return { total, cantidad: {{campo}} };
}
```

Blanks:
- campo = numeros.length

Función: estadisticas

Casos:
- [ [1, 2, 3] ] → {"total":6,"cantidad":3}
- [ [] ] → {"total":0,"cantidad":0}

### E: agregar-con-defecto
- Cartas: como-se-pasa-un-valor-no-constante-como-defecto, que-restriccion-tienen-los-valores-por-defecto-de-un-paramet
- Prompt: Ordena, completa o escribe una función que asigne una lista vacía cuando el valor recibido es nulo.
- Lenguaje: javascript

Solución:
```js
function agregar(valores, nuevo) {
  valores ??= [];
  valores.push(nuevo);
  return valores;
}
```

Starter:
```js
function agregar(valores, nuevo) {
  return valores;
}
```

Plantilla:
```js
function agregar(valores, nuevo) {
  valores {{operador}} [];
  valores.push(nuevo);
  return valores;
}
```

Blanks:
- operador = ??=

Función: agregar

Casos:
- [ [1], 2 ] → [1, 2]
- [ null, 3 ] → [3]

### E: duplicar-primero
- Cartas: como-se-comporta-una-lista-al-pasarla-a-una-funcion
- Prompt: Ordena, completa o escribe una función que duplique el primer elemento de la lista recibida.
- Lenguaje: javascript

Solución:
```js
function duplicarPrimero(lista) {
  lista[0] = lista[0] * 2;
  return lista;
}
```

Starter:
```js
function duplicarPrimero(lista) {
  return lista;
}
```

Plantilla:
```js
function duplicarPrimero(lista) {
  lista[0] = {{operacion}};
  return lista;
}
```

Blanks:
- operacion = lista[0] * 2

Función: duplicarPrimero

Casos:
- [ [2, 3] ] → [4, 3]
- [ [5] ] → [10]

## Mazo 4

### E: operacion-callback
- Cartas: que-es-un-parametro-de-funcion-o-callback
- Prompt: Ordena, completa o escribe una función que reciba un callback para transformar los números pares.
- Lenguaje: javascript

Solución:
```js
function transformar(numeros, operacion) {
  const resultado = [];
  for (const numero of numeros) {
    resultado.push(operacion(numero));
  }
  return resultado;
}

function duplicarPares(numeros) {
  const pares = numeros.filter((valor) => valor % 2 === 0);
  return transformar(pares, (valor) => valor * 2);
}
```

Starter:
```js
function transformar(numeros, operacion) {
  return numeros;
}

function duplicarPares(numeros) {
  return numeros;
}
```

Plantilla:
```js
function transformar(numeros, operacion) {
  const resultado = [];
  for (const numero of numeros) {
    resultado.push({{llamada}});
  }
  return resultado;
}

function duplicarPares(numeros) {
  const pares = numeros.filter((valor) => {{condicion}});
  return transformar(pares, (valor) => valor * 2);
}
```

Blanks:
- llamada = operacion(numero)
- condicion = valor % 2 === 0

Función: duplicarPares

Casos:
- [ [1, 2, 3, 4] ] → [4, 8]
- [ [] ] → []

### E: perro-con-super
- Cartas: que-es-un-superparametro, que-es-un-initializing-formal-this-nombre
- Prompt: Ordena, completa o escribe una clase que reenvíe el nombre con super y asigne la raza con this.
- Lenguaje: javascript

Solución:
```js
class Animal {
  constructor(nombre) {
    this.nombre = nombre;
  }
}

class Perro extends Animal {
  constructor(nombre, raza) {
    super(nombre);
    this.raza = raza;
  }

  describir() {
    return this.nombre + ' (' + this.raza + ')';
  }
}

function describirPerro(nombre, raza) {
  const perro = new Perro(nombre, raza);
  return perro.describir();
}
```

Starter:
```js
class Animal {
  constructor(nombre) {
    this.nombre = nombre;
  }
}

class Perro extends Animal {
  constructor(nombre, raza) {
    super(nombre);
    this.raza = '';
  }

  describir() {
    return this.nombre;
  }
}

function describirPerro(nombre, raza) {
  const perro = new Perro(nombre, raza);
  return perro.describir();
}
```

Plantilla:
```js
class Animal {
  constructor(nombre) {
    this.nombre = nombre;
  }
}

class Perro extends Animal {
  constructor(nombre, raza) {
    {{llamadaSuper}};
    {{asignarRaza}};
  }

  describir() {
    return this.nombre + ' (' + this.raza + ')';
  }
}

function describirPerro(nombre, raza) {
  const perro = new Perro(nombre, raza);
  return perro.describir();
}
```

Blanks:
- llamadaSuper = super(nombre)
- asignarRaza = this.raza = raza

Función: describirPerro

Casos:
- ["Toby", "Beagle"] → "Toby (Beagle)"
- ["Luna", "Poodle"] → "Luna (Poodle)"

### E: leer-con-rest-y-let
- Cartas: como-se-simulan-argumentos-de-numero-variable-en-dart, como-captura-la-variable-de-un-for-una-closure-en-dart
- Prompt: Ordena, completa o escribe una función que reciba varios valores y los lea desde closures creados en un for con let.
- Lenguaje: javascript

Solución:
```js
function leerValores(...valores) {
  const lectores = [];
  for (let i = 0; i < valores.length; i += 1) {
    lectores.push(() => valores[i]);
  }
  return lectores.map((leer) => leer());
}
```

Starter:
```js
function leerValores(...valores) {
  return valores;
}
```

Plantilla:
```js
function leerValores(...valores) {
  const lectores = [];
  for (let i = 0; i < valores.length; i += 1) {
    lectores.push({{lector}});
  }
  return lectores.{{metodo}}((leer) => leer());
}
```

Blanks:
- lector = () => valores[i]
- metodo = map

Función: leerValores

Casos:
- [3, 5, 7] → [3, 5, 7]
- [] → []

### E: primero-generico
- Cartas: que-son-los-parametros-genericos
- Prompt: Ordena, completa o escribe una función que devuelva el primer elemento de cualquier lista, sin importar su tipo.
- Lenguaje: javascript

Solución:
```js
function primero(lista) {
  if (lista.length === 0) {
    return null;
  }
  return lista[0];
}
```

Starter:
```js
function primero(lista) {
  return null;
}
```

Plantilla:
```js
function primero(lista) {
  if ({{condicion}}) {
    return {{vacio}};
  }
  return lista[0];
}
```

Blanks:
- condicion = lista.length === 0
- vacio = null

Función: primero

Casos:
- [ [7, 8] ] → 7
- [ ["a", "b"] ] → "a"
- [ [] ] → null

### E: precio-con-scope
- Cartas: se-pueden-declarar-los-parametros-como-final, cuales-son-los-niveles-de-scope-en-dart
- Prompt: Ordena, completa o escribe una función que use constantes locales y un bloque if para calcular el total con impuesto.
- Lenguaje: javascript

Solución:
```js
function totalConImpuesto(precio, tasa) {
  const base = precio;
  let total = base;
  if (tasa > 0) {
    const impuesto = base * tasa;
    total = base + impuesto;
  }
  return total;
}
```

Starter:
```js
function totalConImpuesto(precio, tasa) {
  return precio;
}
```

Plantilla:
```js
function totalConImpuesto(precio, tasa) {
  const base = {{base}};
  let total = base;
  if ({{condicion}}) {
    const impuesto = {{impuesto}};
    total = base + impuesto;
  }
  return total;
}
```

Blanks:
- base = precio
- condicion = tasa > 0
- impuesto = base * tasa

Función: totalConImpuesto

Casos:
- [100, 0.2] → 120
- [100, 0] → 100

### E: etiqueta-con-shadowing
- Cartas: que-es-el-shadowing, que-significa-que-un-identificador-empiece-con
- Prompt: Ordena, completa o escribe una función con un helper privado y una variable interna que oculta a la externa.
- Lenguaje: javascript

Solución:
```js
function _limpiar(texto) {
  return texto.trim().toLowerCase();
}

function etiqueta(texto) {
  const resultado = 'exterior';
  if (_limpiar(texto)) {
    const resultado = _limpiar(texto);
    return resultado;
  }
  return resultado;
}
```

Starter:
```js
function _limpiar(texto) {
  return texto;
}

function etiqueta(texto) {
  return texto;
}
```

Plantilla:
```js
function _limpiar(texto) {
  return texto.{{metodo1}}().{{metodo2}}();
}

function etiqueta(texto) {
  const resultado = 'exterior';
  if ({{condicion}}) {
    const resultado = _limpiar(texto);
    return resultado;
  }
  return resultado;
}
```

Blanks:
- metodo1 = trim
- metodo2 = toLowerCase
- condicion = _limpiar(texto)

Función: etiqueta

Casos:
- ["  Hola "] → "hola"
- ["   "] → "exterior"

## Mazo 5

### E: contadores-independientes
- Cartas: por-que-c1-y-c2-del-contador-devuelven-valores-independiente, que-es-una-fabrica-de-funciones
- Prompt: Ordena, completa o escribe una fábrica de contadores y comprueba que dos contadores no comparten estado.
- Lenguaje: javascript

Solución:
```js
function crearContador() {
  let cuenta = 0;
  return () => {
    cuenta += 1;
    return cuenta;
  };
}

function contarIndependientes() {
  const c1 = crearContador();
  const c2 = crearContador();
  c1();
  return [c1(), c2()];
}
```

Starter:
```js
function crearContador() {
  let cuenta = 0;
  return () => cuenta;
}

function contarIndependientes() {
  const c1 = crearContador();
  const c2 = crearContador();
  return [c1(), c2()];
}
```

Plantilla:
```js
function crearContador() {
  let cuenta = 0;
  return () => {
    cuenta {{incremento}} 1;
    return {{retorno}};
  };
}

function contarIndependientes() {
  const c1 = crearContador();
  const c2 = crearContador();
  {{llamada}};
  return [c1(), c2()];
}
```

Blanks:
- incremento = +=
- retorno = cuenta
- llamada = c1()

Función: contarIndependientes

Casos:
- [] → [2, 1]

### E: saldo-con-closure
- Cartas: como-se-encapsula-estado-privado-con-closures, por-que-un-closure-puede-causar-fugas-de-memoria
- Prompt: Ordena, completa o escribe una cuenta cuyo saldo solo se modifique mediante closures.
- Lenguaje: javascript

Solución:
```js
function crearCuenta(inicial) {
  let saldo = inicial;
  return {
    depositar(monto) {
      saldo += monto;
      return saldo;
    },
    consultar() {
      return saldo;
    },
  };
}

function saldoFinal(inicial, deposito) {
  const cuenta = crearCuenta(inicial);
  cuenta.depositar(deposito);
  return cuenta.consultar();
}
```

Starter:
```js
function crearCuenta(inicial) {
  return {
    depositar(monto) {
      return inicial;
    },
    consultar() {
      return inicial;
    },
  };
}

function saldoFinal(inicial, deposito) {
  const cuenta = crearCuenta(inicial);
  cuenta.depositar(deposito);
  return cuenta.consultar();
}
```

Plantilla:
```js
function crearCuenta(inicial) {
  let saldo = {{inicial}};
  return {
    depositar(monto) {
      saldo {{operacion}} monto;
      return saldo;
    },
    consultar() {
      return {{consulta}};
    },
  };
}

function saldoFinal(inicial, deposito) {
  const cuenta = crearCuenta(inicial);
  cuenta.depositar(deposito);
  return cuenta.consultar();
}
```

Blanks:
- inicial = inicial
- operacion = +=
- consulta = saldo

Función: saldoFinal

Casos:
- [100, 50] → 150
- [0, 10] → 10

### E: dobles-perezosos
- Cartas: que-metodos-de-coleccion-reciben-funciones-anonimas, que-significa-que-map-y-where-sean-perezosos
- Prompt: Ordena, completa o escribe un generador perezoso que produzca dobles y consuma solo los primeros.
- Lenguaje: javascript

Solución:
```js
function* dobles(numeros) {
  for (const valor of numeros) {
    yield valor * 2;
  }
}

function primerosDobles(numeros, cantidad) {
  const resultado = [];
  for (const valor of dobles(numeros)) {
    resultado.push(valor);
    if (resultado.length === cantidad) {
      break;
    }
  }
  return resultado;
}
```

Starter:
```js
function* dobles(numeros) {
  for (const valor of numeros) {
    yield valor;
  }
}

function primerosDobles(numeros, cantidad) {
  return numeros;
}
```

Plantilla:
```js
function* dobles(numeros) {
  for (const valor of numeros) {
    yield {{doble}};
  }
}

function primerosDobles(numeros, cantidad) {
  const resultado = [];
  for (const valor of dobles(numeros)) {
    resultado.push(valor);
    if (resultado.length === cantidad) {
      {{salida}};
    }
  }
  return resultado;
}
```

Blanks:
- doble = valor * 2
- salida = break

Función: primerosDobles

Casos:
- [ [1, 2, 3], 2 ] → [2, 4]
- [ [], 3 ] → []

### E: configuracion-iife
- Cartas: que-es-una-iife
- Prompt: Ordena, completa o escribe una IIFE que cree la configuración y una función que lea sus vidas.
- Lenguaje: javascript

Solución:
```js
const configuracion = (() => {
  return { modo: 'arcade', vidas: 3 };
})();

function leerVidas() {
  return configuracion.vidas;
}
```

Starter:
```js
const configuracion = { modo: 'arcade', vidas: 0 };

function leerVidas() {
  return configuracion.vidas;
}
```

Plantilla:
```js
const configuracion = (() => {
  return { modo: 'arcade', vidas: {{vidas}} };
})();

function leerVidas() {
  return {{lectura}};
}
```

Blanks:
- vidas = 3
- lectura = configuracion.vidas

Función: leerVidas

Casos:
- [] → 3

### E: doblar-con-referencia
- Cartas: que-tipos-de-tear-offs-admite-dart, que-es-un-typedef
- Prompt: Ordena, completa o escribe una función que pase una función existente como referencia, sin envolverla en una lambda.
- Lenguaje: javascript

Solución:
```js
function doblar(valor) {
  return valor * 2;
}

function aplicarDosVeces(operacion, valor) {
  return operacion(operacion(valor));
}

function doblarDosVeces(valor) {
  return aplicarDosVeces(doblar, valor);
}
```

Starter:
```js
function doblar(valor) {
  return valor;
}

function aplicarDosVeces(operacion, valor) {
  return valor;
}

function doblarDosVeces(valor) {
  return valor;
}
```

Plantilla:
```js
function doblar(valor) {
  return valor * {{factor}};
}

function aplicarDosVeces(operacion, valor) {
  return {{aplicacion}};
}

function doblarDosVeces(valor) {
  return aplicarDosVeces({{referencia}}, valor);
}
```

Blanks:
- factor = 2
- aplicacion = operacion(operacion(valor))
- referencia = doblar

Función: doblarDosVeces

Casos:
- [3] → 12
- [0] → 0

### E: mensaje-perezoso
- Cartas: que-hace-la-palabra-clave-late
- Prompt: Ordena, completa o escribe una función que inicialice un mensaje solo la primera vez que se usa.
- Lenguaje: javascript

Solución:
```js
function crearMensaje() {
  let mensaje;
  let calculos = 0;
  return () => {
    if (mensaje === undefined) {
      mensaje = 'listo';
      calculos += 1;
    }
    return mensaje + ':' + calculos;
  };
}

function mensajePerezoso() {
  const leer = crearMensaje();
  leer();
  return leer();
}
```

Starter:
```js
function crearMensaje() {
  let mensaje = 'listo';
  return () => mensaje;
}

function mensajePerezoso() {
  const leer = crearMensaje();
  return leer();
}
```

Plantilla:
```js
function crearMensaje() {
  let mensaje;
  let calculos = 0;
  return () => {
    if (mensaje === {{vacio}}) {
      mensaje = {{inicial}};
      calculos += 1;
    }
    return {{salida}};
  };
}

function mensajePerezoso() {
  const leer = crearMensaje();
  leer();
  return leer();
}
```

Blanks:
- vacio = undefined
- inicial = 'listo'
- salida = mensaje + ':' + calculos

Función: mensajePerezoso

Casos:
- [] → "listo:1"

## Mazo 6

### E: despachar-operacion
- Cartas: que-es-un-mapa-de-funciones
- Prompt: Ordena, completa o escribe un mapa de funciones que despache la operación pedida.
- Lenguaje: javascript

Solución:
```js
const operaciones = {
  sumar: (a, b) => a + b,
  multiplicar: (a, b) => a * b,
};

function despachar(operacion, a, b) {
  return operaciones[operacion](a, b);
}
```

Starter:
```js
const operaciones = {};

function despachar(operacion, a, b) {
  return 0;
}
```

Plantilla:
```js
const operaciones = {
  sumar: (a, b) => {{suma}},
  multiplicar: (a, b) => {{producto}},
};

function despachar(operacion, a, b) {
  return {{despacho}};
}
```

Blanks:
- suma = a + b
- producto = a * b
- despacho = operaciones[operacion](a, b)

Función: despachar

Casos:
- ["sumar", 2, 3] → 5
- ["multiplicar", 2, 3] → 6

### E: componer-funciones
- Cartas: que-es-la-composicion-de-funciones
- Prompt: Ordena, completa o escribe una composición que aplique primero el doble y después sume uno.
- Lenguaje: javascript

Solución:
```js
function componer(f, g) {
  return (valor) => f(g(valor));
}

function dobleYSumaUno(valor) {
  const operacion = componer((x) => x + 1, (x) => x * 2);
  return operacion(valor);
}
```

Starter:
```js
function componer(f, g) {
  return (valor) => valor;
}

function dobleYSumaUno(valor) {
  return valor;
}
```

Plantilla:
```js
function componer(f, g) {
  return (valor) => {{composicion}};
}

function dobleYSumaUno(valor) {
  const operacion = componer((x) => x + 1, {{doble}});
  return {{aplicacion}};
}
```

Blanks:
- composicion = f(g(valor))
- doble = (x) => x * 2
- aplicacion = operacion(valor)

Función: dobleYSumaUno

Casos:
- [3] → 7
- [0] → 1

### E: suma-curry
- Cartas: que-es-el-currying
- Prompt: Ordena, completa o escribe una función curry que sume dos números en dos llamadas.
- Lenguaje: javascript

Solución:
```js
function sumaCurry(a) {
  return (b) => a + b;
}

function sumarEnDosLlamadas(a, b) {
  return sumaCurry(a)(b);
}
```

Starter:
```js
function sumaCurry(a) {
  return (b) => b;
}

function sumarEnDosLlamadas(a, b) {
  return 0;
}
```

Plantilla:
```js
function sumaCurry(a) {
  return (b) => {{suma}};
}

function sumarEnDosLlamadas(a, b) {
  return {{llamadas}};
}
```

Blanks:
- suma = a + b
- llamadas = sumaCurry(a)(b)

Función: sumarEnDosLlamadas

Casos:
- [2, 3] → 5
- [-1, 1] → 0

### E: contar-pares-anidada
- Cartas: que-es-una-funcion-local-o-anidada
- Prompt: Ordena, completa o escribe una función con una función local que cuente los pares hasta un límite.
- Lenguaje: javascript

Solución:
```js
function contarParesHasta(limite) {
  function esPar(valor) {
    return valor % 2 === 0;
  }
  let total = 0;
  for (let valor = 0; valor <= limite; valor += 1) {
    if (esPar(valor)) {
      total += 1;
    }
  }
  return total;
}
```

Starter:
```js
function contarParesHasta(limite) {
  return 0;
}
```

Plantilla:
```js
function contarParesHasta(limite) {
  function esPar(valor) {
    return valor {{operador}} 2 === 0;
  }
  let total = 0;
  for (let valor = 0; valor <= limite; valor += 1) {
    if ({{condicion}}) {
      total += 1;
    }
  }
  return {{retorno}};
}
```

Blanks:
- operador = %
- condicion = esPar(valor)
- retorno = total

Función: contarParesHasta

Casos:
- [6] → 4
- [-1] → 0

### E: factorial-cola
- Cartas: que-es-la-recursion-de-cola-con-acumulador, que-ocurre-si-una-recursion-nunca-alcanza-su-caso-base
- Prompt: Ordena, completa o escribe un factorial recursivo de cola con acumulador.
- Lenguaje: javascript

Solución:
```js
function factorialCola(n, acumulador) {
  if (n <= 1) {
    return acumulador;
  }
  return factorialCola(n - 1, acumulador * n);
}

function factorial(n) {
  return factorialCola(n, 1);
}
```

Starter:
```js
function factorialCola(n, acumulador) {
  return acumulador;
}

function factorial(n) {
  return factorialCola(n, 1);
}
```

Plantilla:
```js
function factorialCola(n, acumulador) {
  if (n <= 1) {
    return {{casoBase}};
  }
  return factorialCola({{siguiente}}, {{nuevoAcumulador}});
}

function factorial(n) {
  return factorialCola(n, {{inicial}});
}
```

Blanks:
- casoBase = acumulador
- siguiente = n - 1
- nuevoAcumulador = acumulador * n
- inicial = 1

Función: factorial

Casos:
- [5] → 120
- [0] → 1

### E: contar-nodos-arbol
- Cartas: como-se-recorre-un-arbol-recursivamente, que-ocurre-si-una-recursion-nunca-alcanza-su-caso-base
- Prompt: Ordena, completa o escribe una función recursiva que cuente los nodos de un árbol binario.
- Lenguaje: javascript

Solución:
```js
function contarNodos(arbol) {
  if (arbol === null) {
    return 0;
  }
  return 1 + contarNodos(arbol.izquierdo) + contarNodos(arbol.derecho);
}
```

Starter:
```js
function contarNodos(arbol) {
  return 0;
}
```

Plantilla:
```js
function contarNodos(arbol) {
  if (arbol === {{vacio}}) {
    return 0;
  }
  return 1 + contarNodos({{izquierdo}}) + contarNodos({{derecho}});
}
```

Blanks:
- vacio = null
- izquierdo = arbol.izquierdo
- derecho = arbol.derecho

Función: contarNodos

Casos:
- [{"valor":1,"izquierdo":null,"derecho":null}] → 1
- [{"valor":1,"izquierdo":{"valor":2,"izquierdo":null,"derecho":null},"derecho":null}] → 2

## Mazo 7

### E: permutaciones-backtracking
- Cartas: que-es-el-backtracking-en-recursion
- Prompt: Ordena, completa o escribe un generador de permutaciones con backtracking.
- Lenguaje: javascript

Solución:
```js
function permutaciones(valores) {
  const resultado = [];
  function explorar(actual, restantes) {
    if (restantes.length === 0) {
      resultado.push(actual);
      return;
    }
    for (let i = 0; i < restantes.length; i += 1) {
      const siguiente = restantes.slice();
      siguiente.splice(i, 1);
      explorar(actual.concat(restantes[i]), siguiente);
    }
  }
  explorar([], valores);
  return resultado;
}
```

Starter:
```js
function permutaciones(valores) {
  return [];
}
```

Plantilla:
```js
function permutaciones(valores) {
  const resultado = [];
  function explorar(actual, restantes) {
    if (restantes.length === 0) {
      resultado.push({{actual}});
      {{salida}};
    }
    for (let i = 0; i < restantes.length; i += 1) {
      const siguiente = restantes.slice();
      siguiente.splice(i, 1);
      explorar({{siguienteActual}}, siguiente);
    }
  }
  explorar([], valores);
  return {{retorno}};
}
```

Blanks:
- actual = actual
- salida = return
- siguienteActual = actual.concat(restantes[i])
- retorno = resultado

Función: permutaciones

Casos:
- [[1, 2]] → [[1, 2], [2, 1]]
- [[]] → [[]]

### E: lambda-recursiva
- Cartas: puede-una-lambda-referirse-a-si-misma
- Prompt: Ordena, completa o escribe una lambda que se referencie a sí misma mediante una variable.
- Lenguaje: javascript

Solución:
```js
function factorial(n) {
  let calcular;
  calcular = (valor) => {
    if (valor <= 1) {
      return 1;
    }
    return valor * calcular(valor - 1);
  };
  return calcular(n);
}
```

Starter:
```js
function factorial(n) {
  let calcular;
  calcular = (valor) => valor;
  return calcular(n);
}
```

Plantilla:
```js
function factorial(n) {
  let calcular;
  calcular = (valor) => {
    if (valor <= 1) {
      return {{casoBase}};
    }
    return valor * {{recursiva}};
  };
  return {{llamada}};
}
```

Blanks:
- casoBase = 1
- recursiva = calcular(valor - 1)
- llamada = calcular(n)

Función: factorial

Casos:
- [5] → 120
- [1] → 1

### E: par-impar-mutua
- Cartas: que-es-la-recursion-mutua
- Prompt: Ordena, completa o escribe dos funciones mutuas que comprueben si un número es par.
- Lenguaje: javascript

Solución:
```js
function esPar(n) {
  if (n === 0) {
    return true;
  }
  return esImpar(n - 1);
}

function esImpar(n) {
  if (n === 0) {
    return false;
  }
  return esPar(n - 1);
}
```

Starter:
```js
function esPar(n) {
  return false;
}

function esImpar(n) {
  return true;
}
```

Plantilla:
```js
function esPar(n) {
  if (n === 0) {
    return {{basePar}};
  }
  return {{llamadaImpar}};
}

function esImpar(n) {
  if (n === 0) {
    return {{baseImpar}};
  }
  return {{llamadaPar}};
}
```

Blanks:
- basePar = true
- llamadaImpar = esImpar(n - 1)
- baseImpar = false
- llamadaPar = esPar(n - 1)

Función: esPar

Casos:
- [4] → true
- [5] → false

### E: cierre-garantizado
- Cartas: que-bloque-se-ejecuta-siempre-en-try-catch
- Prompt: Ordena, completa o escribe una función que registre el cierre aunque la tarea falle.
- Lenguaje: javascript

Solución:
```js
function ejecutarTarea(falla) {
  const pasos = [];
  try {
    if (falla) {
      throw new Error('fallo');
    }
    pasos.push('ok');
  } catch (error) {
    pasos.push('error');
  } finally {
    pasos.push('cerrado');
  }
  return pasos;
}
```

Starter:
```js
function ejecutarTarea(falla) {
  return [];
}
```

Plantilla:
```js
function ejecutarTarea(falla) {
  const pasos = [];
  try {
    if (falla) {
      {{lanzar}};
    }
    pasos.push('ok');
  } catch (error) {
    pasos.push({{error}});
  } finally {
    pasos.push({{cierre}});
  }
  return {{retorno}};
}
```

Blanks:
- lanzar = throw new Error('fallo')
- error = 'error'
- cierre = 'cerrado'
- retorno = pasos

Función: ejecutarTarea

Casos:
- [false] → ["ok", "cerrado"]
- [true] → ["error", "cerrado"]

### E: delegar-generador
- Cartas: que-hace-yield-en-un-generador-sync
- Prompt: Ordena, completa o escribe un generador que delegue en otro con yield*.
- Lenguaje: javascript

Solución:
```js
function* primeros() {
  yield 1;
  yield 2;
}

function* serie() {
  yield 0;
  yield* primeros();
}

function recolectar() {
  return [...serie()];
}
```

Starter:
```js
function* primeros() {
  yield 1;
}

function* serie() {
  yield 0;
}

function recolectar() {
  return [...serie()];
}
```

Plantilla:
```js
function* primeros() {
  yield 1;
  yield {{segundo}};
}

function* serie() {
  yield 0;
  {{delegar}};
}

function recolectar() {
  return {{retorno}};
}
```

Blanks:
- segundo = 2
- delegar = yield* primeros()
- retorno = [...serie()]

Función: recolectar

Casos:
- [] → [0, 1, 2]

### E: termometro-getters
- Cartas: que-son-los-getters-y-setters
- Prompt: Ordena, completa o escribe un objeto con getters y setters para convertir temperatura.
- Lenguaje: javascript

Solución:
```js
function crearTermometro(celsius) {
  let grados = celsius;
  return {
    get celsius() {
      return grados;
    },
    get fahrenheit() {
      return (grados * 9) / 5 + 32;
    },
    set fahrenheit(valor) {
      grados = ((valor - 32) * 5) / 9;
    },
  };
}

function convertirAFahrenheit(celsius) {
  const termometro = crearTermometro(celsius);
  return termometro.fahrenheit;
}
```

Starter:
```js
function crearTermometro(celsius) {
  return {
    get fahrenheit() {
      return 0;
    },
  };
}

function convertirAFahrenheit(celsius) {
  const termometro = crearTermometro(celsius);
  return termometro.fahrenheit;
}
```

Plantilla:
```js
function crearTermometro(celsius) {
  let grados = {{inicial}};
  return {
    get celsius() {
      return {{lectura}};
    },
    get fahrenheit() {
      return {{formula}};
    },
    set fahrenheit(valor) {
      grados = {{reverso}};
    },
  };
}

function convertirAFahrenheit(celsius) {
  const termometro = crearTermometro(celsius);
  return {{salida}};
}
```

Blanks:
- inicial = celsius
- lectura = grados
- formula = (grados * 9) / 5 + 32
- reverso = ((valor - 32) * 5) / 9
- salida = termometro.fahrenheit

Función: convertirAFahrenheit

Casos:
- [0] → 32
- [100] → 212
- [-40] → -40

## Mazo 8

### E: cuadrado-estatico
- Cartas: que-es-un-metodo-estatico
- Prompt: Ordena, completa o escribe una clase con método estático y una función que lo use.
- Lenguaje: javascript

Solución:
```js
class Mate {
  static cuadrado(valor) {
    return valor * valor;
  }
}

function cuadrado(valor) {
  return Mate.cuadrado(valor);
}
```

Starter:
```js
class Mate {
  static cuadrado(valor) {
    return 0;
  }
}

function cuadrado(valor) {
  return valor;
}
```

Plantilla:
```js
class Mate {
  static cuadrado(valor) {
    return {{calculo}};
  }
}

function cuadrado(valor) {
  return {{llamada}};
}
```

Blanks:
- calculo = valor * valor
- llamada = Mate.cuadrado(valor)

Función: cuadrado

Casos:
- [4] → 16
- [0] → 0

### E: instancia-unica
- Cartas: para-que-sirve-un-constructor-factory
- Prompt: Ordena, completa o escribe una fábrica que devuelva siempre la misma instancia para un nombre.
- Lenguaje: javascript

Solución:
```js
const instancias = {};

function crearInstancia(nombre) {
  if (!instancias[nombre]) {
    instancias[nombre] = { nombre };
  }
  return instancias[nombre];
}

function mismaInstancia(nombre) {
  return crearInstancia(nombre) === crearInstancia(nombre);
}
```

Starter:
```js
const instancias = {};

function crearInstancia(nombre) {
  return { nombre };
}

function mismaInstancia(nombre) {
  return false;
}
```

Plantilla:
```js
const instancias = {};

function crearInstancia(nombre) {
  if ({{condicion}}) {
    instancias[nombre] = { nombre };
  }
  return {{retorno}};
}

function mismaInstancia(nombre) {
  return {{comparacion}};
}
```

Blanks:
- condicion = !instancias[nombre]
- retorno = instancias[nombre]
- comparacion = crearInstancia(nombre) === crearInstancia(nombre)

Función: mismaInstancia

Casos:
- ["a"] → true
- ["b"] → true

### E: suma-flexible
- Cartas: soporta-dart-la-sobrecarga-de-metodos
- Prompt: Ordena, completa o escribe una alternativa a la sobrecarga: una suma con parámetro opcional.
- Lenguaje: javascript

Solución:
```js
function sumar(a, b = 0) {
  return a + b;
}

function sumarLista(valores) {
  return valores.reduce((total, valor) => sumar(total, valor), 0);
}
```

Starter:
```js
function sumar(a, b) {
  return a;
}

function sumarLista(valores) {
  return 0;
}
```

Plantilla:
```js
function sumar(a, b = {{defecto}}) {
  return {{suma}};
}

function sumarLista(valores) {
  return valores.{{metodo}}((total, valor) => {{acumular}}, 0);
}
```

Blanks:
- defecto = 0
- suma = a + b
- metodo = reduce
- acumular = sumar(total, valor)

Función: sumarLista

Casos:
- [[1, 2, 3]] → 6
- [[]] → 0

### E: sumar-puntos
- Cartas: que-es-la-sobrecarga-de-operadores
- Prompt: Ordena, completa o escribe una función que sume dos puntos coordenada a coordenada.
- Lenguaje: javascript

Solución:
```js
function sumarPuntos(primero, segundo) {
  return {
    x: primero.x + segundo.x,
    y: primero.y + segundo.y,
  };
}
```

Starter:
```js
function sumarPuntos(primero, segundo) {
  return { x: 0, y: 0 };
}
```

Plantilla:
```js
function sumarPuntos(primero, segundo) {
  return {
    x: {{x}},
    y: {{y}},
  };
}
```

Blanks:
- x = primero.x + segundo.x
- y = primero.y + segundo.y

Función: sumarPuntos

Casos:
- [{"x":1,"y":2},{"x":3,"y":4}] → {"x":4,"y":6}
- [{"x":-1,"y":0},{"x":1,"y":0}] → {"x":0,"y":0}

### E: multiplicador-invocable
- Cartas: que-es-un-objeto-invocable
- Prompt: Ordena, completa o escribe una fábrica que devuelva una función invocable como un objeto multiplicador.
- Lenguaje: javascript

Solución:
```js
function crearMultiplicador(factor) {
  return (valor) => valor * factor;
}

function multiplicarPorTres(valor) {
  const porTres = crearMultiplicador(3);
  return porTres(valor);
}
```

Starter:
```js
function crearMultiplicador(factor) {
  return (valor) => valor;
}

function multiplicarPorTres(valor) {
  return valor;
}
```

Plantilla:
```js
function crearMultiplicador(factor) {
  return (valor) => {{producto}};
}

function multiplicarPorTres(valor) {
  const porTres = crearMultiplicador({{factor}});
  return {{llamada}};
}
```

Blanks:
- producto = valor * factor
- factor = 3
- llamada = porTres(valor)

Función: multiplicarPorTres

Casos:
- [5] → 15
- [0] → 0

### E: longitud-extension
- Cartas: que-es-un-extension-method
- Prompt: Ordena, completa o escribe una función que añada longitud útil a un texto, como una extensión.
- Lenguaje: javascript

Solución:
```js
function longitudUtil(texto) {
  const limpio = texto.trim();
  return limpio.length;
}
```

Starter:
```js
function longitudUtil(texto) {
  return 0;
}
```

Plantilla:
```js
function longitudUtil(texto) {
  const limpio = texto.{{limpieza}}();
  return {{longitud}};
}
```

Blanks:
- limpieza = trim
- longitud = limpio.length

Función: longitudUtil

Casos:
- [" hola "] → 4
- [""] → 0

## Mazo 9

### E: agrupar-por-longitud
- Cartas: que-hace-una-funcion-generica-como-agruparpor
- Prompt: Ordena, completa o escribe una función genérica que agrupe palabras por su longitud.
- Lenguaje: javascript

Solución:
```js
function agruparPor(items, clave) {
  const grupos = {};
  for (const item of items) {
    const llave = clave(item);
    if (!grupos[llave]) {
      grupos[llave] = [];
    }
    grupos[llave].push(item);
  }
  return grupos;
}

function agruparPorLongitud(palabras) {
  return agruparPor(palabras, (palabra) => palabra.length);
}
```

Starter:
```js
function agruparPor(items, clave) {
  return {};
}

function agruparPorLongitud(palabras) {
  return {};
}
```

Plantilla:
```js
function agruparPor(items, clave) {
  const grupos = {};
  for (const item of items) {
    const llave = {{clave}};
    if ({{condicion}}) {
      grupos[llave] = [];
    }
    grupos[llave].push({{empuje}});
  }
  return grupos;
}

function agruparPorLongitud(palabras) {
  return {{llamada}};
}
```

Blanks:
- clave = clave(item)
- condicion = !grupos[llave]
- empuje = item
- llamada = agruparPor(palabras, (palabra) => palabra.length)

Función: agruparPorLongitud

Casos:
- [["a","bb","c"]] → {"1":["a","c"],"2":["bb"]}
- [[]] → {}

### E: longitudes-con-mapear
- Cartas: se-pueden-escribir-extensiones-genericas
- Prompt: Ordena, completa o escribe una función genérica que transforme cada palabra en su longitud.
- Lenguaje: javascript

Solución:
```js
function mapear(items, transformar) {
  const resultado = [];
  for (const item of items) {
    resultado.push(transformar(item));
  }
  return resultado;
}

function longitudesDePalabras(palabras) {
  return mapear(palabras, (palabra) => palabra.length);
}
```

Starter:
```js
function mapear(items, transformar) {
  return [];
}

function longitudesDePalabras(palabras) {
  return [];
}
```

Plantilla:
```js
function mapear(items, transformar) {
  const resultado = [];
  for (const item of items) {
    resultado.{{metodo}}({{transformado}});
  }
  return resultado;
}

function longitudesDePalabras(palabras) {
  return mapear(palabras, {{transformar}});
}
```

Blanks:
- metodo = push
- transformado = transformar(item)
- transformar = (palabra) => palabra.length

Función: longitudesDePalabras

Casos:
- [["hola","sol"]] → [4,3]
- [[]] → []

### E: clasificar-con-guardas
- Cartas: que-es-el-pattern-matching-con-switch-en-funciones-dart-3, que-hace-la-guarda-when-en-un-patron
- Prompt: Ordena, completa o escribe una clasificación con guardas para números negativos, cero y positivos.
- Lenguaje: javascript

Solución:
```js
function clasificarNumero(valor) {
  if (valor < 0) {
    return 'negativo';
  }
  if (valor === 0) {
    return 'cero';
  }
  return 'positivo';
}

function clasificarLista(valores) {
  return valores.map((valor) => clasificarNumero(valor));
}
```

Starter:
```js
function clasificarNumero(valor) {
  return 'positivo';
}

function clasificarLista(valores) {
  return [];
}
```

Plantilla:
```js
function clasificarNumero(valor) {
  if ({{negativo}}) {
    return 'negativo';
  }
  if ({{cero}}) {
    return 'cero';
  }
  return 'positivo';
}

function clasificarLista(valores) {
  return valores.map((valor) => {{llamada}});
}
```

Blanks:
- negativo = valor < 0
- cero = valor === 0
- llamada = clasificarNumero(valor)

Función: clasificarLista

Casos:
- [[-2,0,5]] → ["negativo","cero","positivo"]
- [[1]] → ["positivo"]

### E: dividir-seguro
- Cartas: que-hace-throw-dentro-de-una-funcion, que-es-el-tipo-never
- Prompt: Ordena, completa o escribe una división que lance un error y otra que lo capture.
- Lenguaje: javascript

Solución:
```js
function dividir(a, b) {
  if (b === 0) {
    throw new Error('No se puede dividir entre cero');
  }
  return a / b;
}

function dividirSeguro(a, b) {
  try {
    return dividir(a, b);
  } catch {
    return null;
  }
}
```

Starter:
```js
function dividir(a, b) {
  return a / b;
}

function dividirSeguro(a, b) {
  return null;
}
```

Plantilla:
```js
function dividir(a, b) {
  if ({{cero}}) {
    {{error}};
  }
  return a / b;
}

function dividirSeguro(a, b) {
  try {
    return {{intento}};
  } catch {
    return null;
  }
}
```

Blanks:
- cero = b === 0
- error = throw new Error('No se puede dividir entre cero')
- intento = dividir(a, b)

Función: dividirSeguro

Casos:
- [6,2] → 3
- [1,0] → null

### E: promedio-valido
- Cartas: cuando-se-ejecuta-assert
- Prompt: Ordena, completa o escribe un promedio que valide cada valor con assert.
- Lenguaje: javascript

Solución:
```js
function validarValor(valor) {
  console.assert(valor >= 0, 'El valor no puede ser negativo');
  return valor;
}

function promedio(valores) {
  if (valores.length === 0) {
    return 0;
  }
  const total = valores.reduce((suma, valor) => suma + validarValor(valor), 0);
  return total / valores.length;
}
```

Starter:
```js
function validarValor(valor) {
  return valor;
}

function promedio(valores) {
  return 0;
}
```

Plantilla:
```js
function validarValor(valor) {
  console.{{metodo}}({{condicion}}, 'El valor no puede ser negativo');
  return valor;
}

function promedio(valores) {
  if ({{vacio}}) {
    return 0;
  }
  const total = valores.reduce((suma, valor) => suma + {{validado}}, 0);
  return {{resultado}};
}
```

Blanks:
- metodo = assert
- condicion = valor >= 0
- vacio = valores.length === 0
- validado = validarValor(valor)
- resultado = total / valores.length

Función: promedio

Casos:
- [[2,4]] → 3
- [[]] → 0

### E: tarea-en-aislado
- Cartas: por-que-existen-los-isolates-en-dart, que-restriccion-tiene-la-funcion-enviada-a-un-isolate, cuando-conviene-usar-parametros-nombrados-con-required
- Prompt: Ordena, completa o escribe una tarea que reciba datos transferibles y exija un id.
- Lenguaje: javascript

Solución:
```js
function crearTarea({ id, valor, prioridad = 1 }) {
  if (!id) {
    throw new Error('id es obligatorio');
  }
  return { id, valor: valor * prioridad };
}

function ejecutarEnAislado(tarea) {
  return crearTarea(tarea);
}
```

Starter:
```js
function crearTarea(tarea) {
  return tarea;
}

function ejecutarEnAislado(tarea) {
  return tarea;
}
```

Plantilla:
```js
function crearTarea({ id, valor, prioridad = {{defecto}} }) {
  if ({{obligatorio}}) {
    throw new Error('id es obligatorio');
  }
  return { id, valor: {{calculo}} };
}

function ejecutarEnAislado(tarea) {
  return {{llamada}};
}
```

Blanks:
- defecto = 1
- obligatorio = !id
- calculo = valor * prioridad
- llamada = crearTarea(tarea)

Función: ejecutarEnAislado

Casos:
- [{"id":"a","valor":2}] → {"id":"a","valor":2}
- [{"id":"b","valor":3,"prioridad":2}] → {"id":"b","valor":6}

## Mazo 10

### E: suma-pura
- Cartas: que-es-una-funcion-pura
- Prompt: Ordena, completa o escribe una suma pura aplicada a una lista de valores.
- Lenguaje: javascript

Solución:
```js
function sumarPuro(a, b) {
  return a + b;
}

function sumarLista(valores) {
  return valores.reduce((total, valor) => sumarPuro(total, valor), 0);
}
```

Starter:
```js
function sumarPuro(a, b) {
  return 0;
}

function sumarLista(valores) {
  return 0;
}
```

Plantilla:
```js
function sumarPuro(a, b) {
  return {{suma}};
}

function sumarLista(valores) {
  return valores.reduce((total, valor) => {{acumular}}, 0);
}
```

Blanks:
- suma = a + b
- acumular = sumarPuro(total, valor)

Función: sumarLista

Casos:
- [[1,2,3]] → 6
- [[]] → 0

### E: esperar-resultado
- Cartas: que-recomienda-la-practica-sobre-await-en-funciones-async
- Prompt: Ordena, completa o escribe el resultado de esperar una operación asíncrona ya resuelta.
- Lenguaje: javascript

Solución:
```js
function resolver(valor) {
  return { ok: true, valor };
}

function esperarDoble(resultado) {
  if (!resultado.ok) {
    return 0;
  }
  return resultado.valor * 2;
}
```

Starter:
```js
function resolver(valor) {
  return { ok: false, valor };
}

function esperarDoble(resultado) {
  return 0;
}
```

Plantilla:
```js
function resolver(valor) {
  return { ok: {{exito}}, valor };
}

function esperarDoble(resultado) {
  if ({{fallo}}) {
    return 0;
  }
  return {{doble}};
}
```

Blanks:
- exito = true
- fallo = !resultado.ok
- doble = resultado.valor * 2

Función: esperarDoble

Casos:
- [{"ok":true,"valor":4}] → 8
- [{"ok":false,"valor":4}] → 0

### E: sumar-seguro
- Cartas: por-que-declarar-los-tipos-en-las-funciones-publicas
- Prompt: Ordena, completa o escribe una suma que exija enteros y devuelva null si no lo son.
- Lenguaje: javascript

Solución:
```js
function sumarEnteros(a, b) {
  if (!(Number.isInteger(a) && Number.isInteger(b))) {
    throw new Error('Se esperaban enteros');
  }
  return a + b;
}

function sumarSeguro(a, b) {
  try {
    return sumarEnteros(a, b);
  } catch {
    return null;
  }
}
```

Starter:
```js
function sumarEnteros(a, b) {
  return a + b;
}

function sumarSeguro(a, b) {
  return null;
}
```

Plantilla:
```js
function sumarEnteros(a, b) {
  if ({{validacion}}) {
    throw new Error('Se esperaban enteros');
  }
  return {{suma}};
}

function sumarSeguro(a, b) {
  try {
    return {{intento}};
  } catch {
    return null;
  }
}
```

Blanks:
- validacion = !(Number.isInteger(a) && Number.isInteger(b))
- suma = a + b
- intento = sumarEnteros(a, b)

Función: sumarSeguro

Casos:
- [2,3] → 5
- [2.5,1] → null

### E: doblar-y-sumar
- Cartas: cuando-conviene-usar-en-vez-de-llaves
- Prompt: Ordena, completa o escribe una composición con funciones flecha de una y varias líneas.
- Lenguaje: javascript

Solución:
```js
const doblar = (valor) => valor * 2;

const sumarUno = (valor) => {
  return valor + 1;
};

function doblarYSumar(valor) {
  return sumarUno(doblar(valor));
}
```

Starter:
```js
const doblar = (valor) => valor;

const sumarUno = (valor) => {
  return valor;
};

function doblarYSumar(valor) {
  return valor;
}
```

Plantilla:
```js
const doblar = (valor) => {{doble}};

const sumarUno = (valor) => {
  return {{suma}};
};

function doblarYSumar(valor) {
  return {{composicion}};
}
```

Blanks:
- doble = valor * 2
- suma = valor + 1
- composicion = sumarUno(doblar(valor))

Función: doblarYSumar

Casos:
- [3] → 7
- [0] → 1

### E: validador-fluido
- Cartas: que-patron-permite-encadenar-metodos-como-validador-agregar
- Prompt: Ordena, completa o escribe un validador que encadene reglas devolviendo this.
- Lenguaje: javascript

Solución:
```js
function crearValidador() {
  const reglas = [];
  return {
    agregar(regla) {
      reglas.push(regla);
      return this;
    },
    validar(valor) {
      return reglas.every((regla) => regla(valor));
    },
  };
}

function validarTexto(valor) {
  return crearValidador()
    .agregar((texto) => texto.length >= 3)
    .agregar((texto) => texto.includes('@'))
    .validar(valor);
}
```

Starter:
```js
function crearValidador() {
  return {
    agregar(regla) {
      return this;
    },
    validar(valor) {
      return false;
    },
  };
}

function validarTexto(valor) {
  return false;
}
```

Plantilla:
```js
function crearValidador() {
  const reglas = [];
  return {
    agregar(regla) {
      reglas.{{metodo}}(regla);
      return {{retorno}};
    },
    validar(valor) {
      return reglas.{{cada}}((regla) => regla(valor));
    },
  };
}

function validarTexto(valor) {
  return crearValidador()
    .agregar((texto) => texto.length >= 3)
    .agregar((texto) => {{incluye}})
    .validar(valor);
}
```

Blanks:
- metodo = push
- retorno = this
- cada = every
- incluye = texto.includes('@')

Función: validarTexto

Casos:
- ["a@b"] → true
- ["ab"] → false

### E: validador-proyecto
- Cartas: que-conceptos-combina-el-mini-proyecto-validador
- Prompt: Ordena, completa o escribe un validador invocable que combine closure, reglas y encadenamiento.
- Lenguaje: javascript

Solución:
```js
function crearValidador(minimo) {
  const reglas = [];
  const validador = (valor) => reglas.every((regla) => regla(valor));
  validador.agregar = (regla) => {
    reglas.push(regla);
    return validador;
  };
  validador.minimo = minimo;
  return validador;
}

function validarNombre(nombre) {
  const validador = crearValidador(3);
  return validador
    .agregar((valor) => valor.length >= validador.minimo)
    .agregar((valor) => valor.trim() === valor)(nombre);
}
```

Starter:
```js
function crearValidador(minimo) {
  const validador = () => false;
  validador.minimo = minimo;
  return validador;
}

function validarNombre(nombre) {
  return false;
}
```

Plantilla:
```js
function crearValidador(minimo) {
  const reglas = [];
  const validador = (valor) => reglas.{{cada}}((regla) => regla(valor));
  validador.agregar = (regla) => {
    reglas.{{metodo}}(regla);
    return validador;
  };
  validador.minimo = {{minimo}};
  return validador;
}

function validarNombre(nombre) {
  const validador = crearValidador(3);
  return validador
    .agregar((valor) => valor.length >= validador.minimo)
    .agregar((valor) => {{sinEspacios}})(nombre);
}
```

Blanks:
- cada = every
- metodo = push
- minimo = minimo
- sinEspacios = valor.trim() === valor

Función: validarNombre

Casos:
- ["Ana"] → true
- [" Al"] → false
