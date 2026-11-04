import React from 'react';
import CodeGameShell from '../code-common/CodeGameShell.jsx';
import EscribeCodigo from './EscribeCodigo.jsx';

export default function EscribeCodigoGame(props) {
  return (
    <CodeGameShell
      {...props}
      gameId="escribe-codigo"
      title="Escribe el código"
      lead="Escribe la función completa y ejecútala contra los casos del ejercicio."
      renderExercise={(state) => <EscribeCodigo {...state} />}
    />
  );
}
