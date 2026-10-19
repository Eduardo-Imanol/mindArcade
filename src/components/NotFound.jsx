import React from 'react';

export default function NotFound({ message = 'Pantalla no encontrada' }) {
  return (
    <main className="sepect-bg" style={{ minHeight: '100vh', width: '100%', maxWidth: '100%', padding: '16px clamp(16px, 4vw, 32px)' }}>
      <h1 className="neon" style={{ fontSize: 28 }}>404</h1>
      <p>{message}</p>
      <a className="btn-neon" href="#/" style={{ display: 'inline-block', textDecoration: 'none' }}>
        Volver al inicio
      </a>
    </main>
  );
}
