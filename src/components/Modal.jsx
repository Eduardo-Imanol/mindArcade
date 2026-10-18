import React from 'react';
export default function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" className="card-neon" style={{ padding: 16 }}>
      {children}
      <button className="btn-neon" type="button" onClick={onClose} style={{ marginTop: 12 }}>Cerrar</button>
    </div>
  );
}
