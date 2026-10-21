import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App.jsx';
import { registerServiceWorker } from './core/pwa/registerServiceWorker.js';
import './ui/tokens.css';
import './ui/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Modo instalable (PWA) y uso sin conexión. Solo en producción para no
// cachear el bundle de desarrollo.
if (import.meta.env.PROD) {
  registerServiceWorker({ baseUrl: import.meta.env.BASE_URL });
}
