import React from 'react';
export default function Card({ title, children, className = '', ...rest }) {
  const classes = className ? `card-neon ${className}` : 'card-neon';
  return (
    <section className={classes} style={{ padding: 16 }} {...rest}>
      {title && <h2 className="neon" style={{ marginBottom: 8 }}>{title}</h2>}
      {children}
    </section>
  );
}
