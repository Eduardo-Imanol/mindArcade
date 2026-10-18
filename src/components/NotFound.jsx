import React from 'react';

export default function NotFound({ message = 'Pantalla no encontrada' }) {
  return (
    <main className="sepect-bg" style={{ minHeight: '100vh', padding: 16, maxWidth: 720, margin: '0 auto' }}>
      <h1 className="neon" style={{ fontSize: 28 }}>404</h1>
      <p>{message}</p>
      <a className="btn-neon" href="#/" style={{ display: 'inline-block', textDecoration: 'none' }}>
        Volver al inicio
      </a>
    </main>
  );
}
