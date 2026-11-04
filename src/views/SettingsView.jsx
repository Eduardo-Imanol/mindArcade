import React, { useMemo } from 'react';
import SoundToggle from '../components/SoundToggle.jsx';
import { isSupported } from '../core/audio/tts.js';
import { loadCatalog } from '../core/content/catalog.js';
import { getGlobalMetrics } from '../core/metrics/metrics.js';
import { loadSrs } from '../core/repetition/srs.js';
import { loadArcadeRecords } from '../core/storage/arcade.js';
import { loadExerciseProgress } from '../core/storage/exercises.js';
import { createStore } from '../core/storage/store.js';

function countExercisesLearned(progress) {
  let done = 0;
  for (const topic of Object.values(progress)) {
    for (const deck of Object.values(topic)) {
      for (const exercise of Object.values(deck)) {
        if (exercise.done) done += 1;
      }
    }
  }
  return done;
}

function countArcadeRuns(records) {
  return Object.values(records).reduce(
    (total, entry) => total + (Array.isArray(entry.runs) ? entry.runs.length : 0),
    0
  );
}

export default function SettingsView() {
  const summary = useMemo(() => {
    const topics = loadCatalog();
    const srs = loadSrs();
    const profile = createStore().load();
    const metrics = getGlobalMetrics(topics, srs, profile.history || [], profile);
    const exercises = loadExerciseProgress();
    const arcade = loadArcadeRecords();
    return {
      topics: topics.length,
      learned: metrics.learned,
      total: metrics.total,
      attempts: metrics.attempts,
      xp: metrics.xp,
      exercises: countExercisesLearned(exercises),
      runs: countArcadeRuns(arcade),
    };
  }, []);

  const facts = [
    { label: 'Temas', value: summary.topics },
    { label: 'Cartas aprendidas', value: `${summary.learned} / ${summary.total}` },
    { label: 'Ejercicios aprendidos', value: summary.exercises },
    { label: 'Rondas arcade', value: summary.runs },
    { label: 'Intentos', value: summary.attempts },
    { label: 'XP total', value: summary.xp },
  ];
  const speechSupported = isSupported();

  return (
    <main className="sepect-bg topic-page settings-page">
      <div className="topic-page__inner">
        <nav className="settings-nav" aria-label="Ruta de navegación">
          <a className="topic-back" href="#/">
            ← Biblioteca
          </a>
          <a className="settings-progress-link" href="#/progreso">
            Ver progreso
          </a>
        </nav>

        <header className="settings-header">
          <p className="settings-eyebrow">Ajustes del arcade</p>
          <h1 className="neon settings-title">Configuración</h1>
          <p className="settings-subtitle">
            Sonido, voz y un resumen de todo lo que guardas en este dispositivo.
          </p>
        </header>

        <div className="settings-grid">
          <section className="card-neon settings-card" aria-labelledby="settings-audio-title">
            <p className="settings-card__eyebrow">Audio</p>
            <h2 className="settings-card__title" id="settings-audio-title">
              Sonido y voz
            </h2>
            <p className="settings-card__text">
              Los efectos se sintetizan en vivo y la lectura usa la voz del sistema. No se descarga
              ningún audio.
            </p>
            <div className="settings-card__actions">
              {speechSupported ? (
                <SoundToggle />
              ) : (
                <p className="settings-card__note" role="status">
                  Este navegador no ofrece voz del sistema. Los efectos de sonido siguen activos.
                </p>
              )}
            </div>
            <p className="settings-card__note">
              El silencio también detiene la lectura del documento original.
            </p>
          </section>

          <section className="card-neon settings-card" aria-labelledby="settings-data-title">
            <p className="settings-card__eyebrow">Datos locales</p>
            <h2 className="settings-card__title" id="settings-data-title">
              Tu progreso, en este navegador
            </h2>
            <dl className="settings-facts">
              {facts.map((fact) => (
                <div key={fact.label} className="settings-fact">
                  <dt className="settings-fact__label">{fact.label}</dt>
                  <dd className="settings-fact__value">{fact.value}</dd>
                </div>
              ))}
            </dl>
            <p className="settings-card__note">
              Sin cuentas ni red: el progreso, los récords y los temas personalizados no salen del
              dispositivo.
            </p>
          </section>
        </div>

        <footer className="settings-footer">
          <a className="btn-neon" href="#/">
            Volver a la biblioteca
          </a>
          <a className="btn-neon" href="#/progreso">
            Abrir progreso
          </a>
        </footer>
      </div>
    </main>
  );
}
