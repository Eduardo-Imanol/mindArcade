import React from 'react';
export default function Card({ title, children }) {
  return (
    <section className="card-neon" style={{ padding: 16 }}>
      {title && <h2 className="neon" style={{ marginBottom: 8 }}>{title}</h2>}
      {children}
    </section>
  );
}
