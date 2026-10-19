// scripts/p5-art/sketches/index.mjs — registro de sketches por card id.
import * as basics from './basics.mjs';
import * as params from './params.mjs';
import * as records from './records.mjs';
import * as closures from './closures.mjs';
import * as closureState from './closure-state.mjs';
import * as higherOrder from './higher-order.mjs';
import * as collections from './collections.mjs';
import * as recursion from './recursion.mjs';
import * as asyncGen from './async-gen.mjs';
import * as asyncMod from './async.mjs';
import * as oop from './oop.mjs';
import * as oopAdvanced from './oop-advanced.mjs';
import * as typesPatterns from './types-patterns.mjs';
import * as typesGuards from './types-guards.mjs';

export const SKETCHES = {
  'que-es-una-funcion-en-dart': basics.queEsUnaFuncionEnDart,
  'por-que-las-funciones-son-objetos-en-dart': basics.porQueLasFuncionesSonObjetosEnDart,
  'que-significa-que-main-sea-el-punto-de-entrada': basics.mainEsElPuntoDeEntrada,
  'que-indica-el-tipo-de-retorno-de-una-funcion': basics.tipoDeRetorno,
  'que-hace-el-operador-flecha': basics.operadorFlecha,
  'que-restricciones-tiene-el-operador-flecha': basics.restriccionesDeLaFlecha,
  'que-hace-return-en-una-funcion-void': basics.returnEnVoid,
  'que-pasa-si-una-funcion-con-tipo-de-retorno-no-ejecuta-retur': basics.retornoSinReturn,
  'cuando-conviene-usar-en-vez-de-llaves': basics.cuandoUsarFlechaVsLlaves,

  'que-son-los-parametros-posicionales-opcionales': params.posicionalesOpcionales,
  'que-son-los-parametros-nombrados': params.parametrosNombrados,
  'para-que-sirve-required-en-un-parametro-nombrado': params.requiredEnNombrado,
  'se-pueden-combinar-y-en-la-misma-funcion': params.combinarCorchetesLlaves,
  'en-que-se-diferencian-los-posicionales-obligatorios-de-los-o': params.obligatoriosVsOpcionales,
  'que-restriccion-tienen-los-valores-por-defecto-de-un-paramet': params.valoresPorDefectoConstantes,
  'como-se-pasa-un-valor-no-constante-como-defecto': params.valorNoConstanteComoDefecto,
  'que-es-un-parametro-de-funcion-o-callback': params.parametroCallback,
  'como-se-simulan-argumentos-de-numero-variable-en-dart': params.argumentosVariables,
  'que-son-los-parametros-genericos': params.parametrosGenericos,
  'se-pueden-declarar-los-parametros-como-final': params.parametrosFinal,
  'cuando-conviene-usar-parametros-nombrados-con-required': params.cuandoNombradosRequired,

  'como-se-retornan-multiples-valores-en-dart-3': records.multiplesValoresRecords,
  'que-son-los-records-nombrados': records.recordsNombrados,
  'que-es-un-tipo-anulable-en-dart': records.tipoAnulable,
  'como-se-comporta-una-lista-al-pasarla-a-una-funcion': records.listaPorReferencia,

  'que-es-el-scope-lexico': closures.scopeLexico,
  'que-es-un-closure': closures.queEsUnClosure,
  'un-closure-captura-valores-o-variables': closures.capturaValoresOVariables,
  'cuales-son-los-niveles-de-scope-en-dart': closures.nivelesDeScope,
  'que-es-el-shadowing': closures.shadowing,
  'que-significa-que-un-identificador-empiece-con': closures.identificadorUnderscore,
  'como-captura-la-variable-de-un-for-una-closure-en-dart': closures.forCapturaVariable,
  'que-hace-la-palabra-clave-late': closures.palabraClaveLate,

  'por-que-c1-y-c2-del-contador-devuelven-valores-independiente': closureState.contadorIndependiente,
  'que-es-una-fabrica-de-funciones': closureState.fabricaDeFunciones,
  'como-se-encapsula-estado-privado-con-closures': closureState.estadoPrivadoConClosures,
  'por-que-un-closure-puede-causar-fugas-de-memoria': closureState.fugasDeMemoria,
  'que-es-una-iife': closureState.iife,
  'que-es-una-funcion-local-o-anidada': closureState.funcionLocalAnidada,

  'que-es-una-funcion-anonima-o-lambda': higherOrder.lambdaAnonima,
  'que-es-un-tear-off': higherOrder.tearOff,
  'que-es-una-funcion-de-orden-superior': higherOrder.ordenSuperior,
  'que-es-la-memoizacion-con-closure': higherOrder.memoizacion,
  'cual-es-la-buena-practica-sobre-function-sin-tipo': higherOrder.functionSinTipo,
  'que-es-un-typedef': higherOrder.typedefAlias,
  'que-es-un-typedef-generico': higherOrder.typedefGenerico,
  'que-es-la-composicion-de-funciones': higherOrder.composicionDeFunciones,
  'puede-una-lambda-referirse-a-si-misma': higherOrder.lambdaSeRefiereASiMisma,
  'que-tipos-de-tear-offs-admite-dart': higherOrder.tiposDeTearOffs,

  'que-metodos-de-coleccion-reciben-funciones-anonimas': collections.metodosConFuncionesAnonimas,
  'que-significa-que-map-y-where-sean-perezosos': collections.mapWherePerezosos,
  'que-es-un-mapa-de-funciones': collections.mapaDeFunciones,
  'que-es-el-currying': collections.currying,
  'que-patron-permite-encadenar-metodos-como-validador-agregar': collections.interfazFluent,
  'que-conceptos-combina-el-mini-proyecto-validador': collections.miniProyectoValidador,
  'que-es-una-funcion-pura': collections.funcionPura,

  'que-necesita-toda-funcion-recursiva': recursion.todaRecursivaCasoBase,
  'que-ocurre-si-una-recursion-nunca-alcanza-su-caso-base': recursion.recursionSinCasoBase,
  'optimiza-dart-la-recursion-de-cola-tail-calls': recursion.tailCallsNoOptimizan,
  'que-es-la-recursion-de-cola-con-acumulador': recursion.recursionColaAcumulador,
  'por-que-el-fibonacci-recursivo-simple-es-lento': recursion.fibonacciRecursivoLento,
  'como-se-recorre-un-arbol-recursivamente': recursion.arbolRecursivo,
  'que-es-el-backtracking-en-recursion': recursion.backtracking,
  'que-es-la-recursion-mutua': recursion.recursionMutua,

  'que-devuelve-siempre-una-funcion-async': asyncMod.asyncDevuelveFuture,
  'que-diferencia-hay-entre-sync-y-async': asyncMod.syncVsAsync,
  'bloquea-await-el-hilo-principal': asyncMod.awaitNoBloqueaElHilo,
  'que-bloque-se-ejecuta-siempre-en-try-catch': asyncMod.tryCatchFinally,
  'como-se-ejecutan-varios-futures-a-la-vez': asyncMod.futureWait,
  'como-se-manejan-errores-sin-async-await': asyncMod.thenCatchError,
  'que-hace-yield-en-un-generador-sync': asyncGen.yieldStarGenerador,
  'como-se-consume-un-stream-creado-con-async': asyncGen.consumirStreamAsync,
  'que-recomienda-la-practica-sobre-await-en-funciones-async': asyncGen.practicaAwait,
  'por-que-existen-los-isolates-en-dart': asyncGen.existenIsolates,
  'que-restriccion-tiene-la-funcion-enviada-a-un-isolate': asyncGen.restriccionIsolate,

  'que-es-un-superparametro': oop.superparametro,
  'que-es-un-initializing-formal-this-nombre': oop.initializingFormal,
  'que-son-los-getters-y-setters': oop.gettersSetters,
  'que-es-un-metodo-estatico': oop.metodoEstatico,
  'que-tipos-de-constructores-tiene-una-clase-en-dart': oop.tiposDeConstructores,
  'para-que-sirve-un-constructor-factory': oop.constructorFactory,
  'soporta-dart-la-sobrecarga-de-metodos': oopAdvanced.sobrecargaDeMetodos,
  'que-es-la-sobrecarga-de-operadores': oopAdvanced.sobrecargaDeOperadores,
  'que-es-un-objeto-invocable': oopAdvanced.objetoInvocable,
  'que-es-un-extension-method': oopAdvanced.extensionMethod,
  'que-es-un-mixin': oopAdvanced.queEsUnMixin,
  'que-indica-la-anotacion-override': oopAdvanced.anotacionOverride,

  'que-aporta-la-restriccion-t-extends-comparable-t': typesPatterns.tExtendsComparable,
  'que-hace-una-funcion-generica-como-agruparpor': typesPatterns.agruparPor,
  'se-pueden-escribir-extensiones-genericas': typesPatterns.extensionesGenericas,
  'que-es-el-pattern-matching-con-switch-en-funciones-dart-3': typesPatterns.patternMatchingSwitch,
  'que-hace-la-guarda-when-en-un-patron': typesPatterns.guardaWhen,
  'por-que-declarar-los-tipos-en-las-funciones-publicas': typesPatterns.tiposEnFuncionesPublicas,
  'que-hace-throw-dentro-de-una-funcion': typesGuards.throwEnFuncion,
  'cuando-se-ejecuta-assert': typesGuards.assertDebug,
  'que-es-el-tipo-never': typesGuards.tipoNever,
};
