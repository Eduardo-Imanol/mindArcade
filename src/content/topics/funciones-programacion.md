# Funciones en Programación

Una función es un bloque de código con nombre que recibe datos, hace algo y puede devolver un resultado; en Dart son objetos de primera clase que se guardan, pasan y devuelven.

- Q: ¿Qué es una función en Dart? | A: Bloque de código con nombre que recibe datos, hace algo y puede devolver un resultado | E: easy | I: asset:funciones-programacion/que-es-una-funcion-en-dart.svg
- Q: ¿Por qué las funciones son objetos en Dart? | A: Porque son instancias de la clase Function: se guardan en variables, se pasan y se devuelven | E: easy | I: asset:funciones-programacion/por-que-las-funciones-son-objetos-en-dart.svg
- Q: ¿Qué significa que main() sea el punto de entrada? | A: Que todo programa Dart empieza a ejecutarse en la función main() | E: easy | I: asset:funciones-programacion/que-significa-que-main-sea-el-punto-de-entrada.svg
- Q: ¿Qué indica el tipo de retorno de una función? | A: El tipo del valor que devuelve con return; void significa que no devuelve valor | E: easy | I: asset:funciones-programacion/que-indica-el-tipo-de-retorno-de-una-funcion.svg
- Q: ¿Qué hace el operador flecha =>? | A: Define una función de una sola expresión: equivale a { return expr; } | E: easy | I: asset:funciones-programacion/que-hace-el-operador-flecha.svg
- Q: ¿Qué son los parámetros posicionales opcionales? | A: Parámetros entre [ ] que deben ser nulables o tener valor por defecto | E: hard | I: asset:funciones-programacion/que-son-los-parametros-posicionales-opcionales.svg
- Q: ¿Qué son los parámetros nombrados? | A: Parámetros entre { } que se pasan por nombre y son opcionales, salvo que lleven required | E: easy | I: asset:funciones-programacion/que-son-los-parametros-nombrados.svg
- Q: ¿Para qué sirve required en un parámetro nombrado? | A: Obliga a pasar ese argumento por nombre; es el estándar en Flutter y en APIs legibles | E: easy | I: asset:funciones-programacion/para-que-sirve-required-en-un-parametro-nombrado.svg
- Q: ¿Se pueden combinar [ ] y { } en la misma función? | A: No: se elige un solo tipo de opcionales y los posicionales van primero | E: hard | I: asset:funciones-programacion/se-pueden-combinar-y-en-la-misma-funcion.svg
- Q: ¿Qué es el scope léxico? | A: Que una variable es visible según dónde está escrita en el código, no según cómo se ejecuta | E: hard | I: asset:funciones-programacion/que-es-el-scope-lexico.svg
- Q: ¿Qué es un closure? | A: Una función que captura variables de su scope exterior y las mantiene vivas | E: hard | I: asset:funciones-programacion/que-es-un-closure.svg
- Q: ¿Un closure captura valores o variables? | A: Variables: si la variable externa cambia, el closure ve el valor actual | E: hard | I: asset:funciones-programacion/un-closure-captura-valores-o-variables.svg
- Q: ¿Qué es una función anónima o lambda? | A: Una función sin nombre, normalmente asignada a una variable o pasada como argumento | E: easy | I: asset:funciones-programacion/que-es-una-funcion-anonima-o-lambda.svg
- Q: ¿Qué es un tear-off? | A: Pasar una función existente directamente en vez de envolverla en una lambda trivial | E: hard | I: asset:funciones-programacion/que-es-un-tear-off.svg
- Q: ¿Qué es una función de orden superior? | A: Una función que recibe otra función como parámetro o la devuelve como resultado | E: easy | I: asset:funciones-programacion/que-es-una-funcion-de-orden-superior.svg
- Q: ¿Qué necesita toda función recursiva? | A: Un caso base que detenga las llamadas y un caso recursivo que se acerque a él | E: easy | I: asset:funciones-programacion/que-necesita-toda-funcion-recursiva.svg
- Q: ¿Qué devuelve siempre una función async? | A: Un Future, aunque no se use await dentro de ella | E: easy | I: asset:funciones-programacion/que-devuelve-siempre-una-funcion-async.svg
- Q: ¿Qué diferencia hay entre sync* y async*? | A: sync* genera un Iterable perezoso con yield; async* genera un Stream | E: hard | I: asset:funciones-programacion/que-diferencia-hay-entre-sync-y-async.svg
- Q: ¿Qué es la memoización con closure? | A: Guardar resultados en una caché capturada por closure para no recalcular | E: hard | I: asset:funciones-programacion/que-es-la-memoizacion-con-closure.svg
- Q: ¿Cuál es la buena práctica sobre Function sin tipo? | A: Evitarla: usar typedef o el tipo concreto int Function(int) para no perder seguridad de tipos | E: hard | I: asset:funciones-programacion/cual-es-la-buena-practica-sobre-function-sin-tipo.svg
