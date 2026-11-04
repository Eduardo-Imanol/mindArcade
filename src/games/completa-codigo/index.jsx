import React from 'react';
import CodeGameShell from '../code-common/CodeGameShell.jsx';
import CompletaCodigo from './CompletaCodigo.jsx';

export default function CompletaCodigoGame(props) {
  return (
    <CodeGameShell
      {...props}
      gameId="completa-codigo"
      title="Completa el código"
      lead="Rellena los espacios del código y comprueba la sintaxis exacta."
      renderExercise={(state) => <CompletaCodigo {...state} />}
    />
  );
}
