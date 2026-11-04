import React from 'react';
import CodeGameShell from '../code-common/CodeGameShell.jsx';
import OrdenaCodigo from './OrdenaCodigo.jsx';

export default function OrdenaCodigoGame(props) {
  return (
    <CodeGameShell
      {...props}
      gameId="ordena-codigo"
      title="Ordena el código"
      lead="Reconstruye cada solución tocando las piezas en el orden correcto."
      renderExercise={(state) => <OrdenaCodigo {...state} />}
    />
  );
}
