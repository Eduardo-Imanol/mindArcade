import React from 'react';

export default function NotFound({ message = 'Pantalla no encontrada' }) {
  return (
    <main className="sepect-bg topic-page error-page">
      <h1 className="neon game-app-title">404</h1>
      <p>{message}</p>
      <a className="btn-neon" href="#/">
        Volver al inicio
      </a>
    </main>
  );
}
