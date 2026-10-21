import React, { useMemo } from 'react';
import Card from '../components/Card.jsx';
import CardImage from '../components/CardImage.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { loadCatalog } from '../core/content/catalog.js';
import { topicCoverCard } from '../core/content/cover.js';
import { loadSrs } from '../core/repetition/srs.js';
import { createStore } from '../core/storage/store.js';
import { getGlobalMetrics, getTopicMetrics } from '../core/metrics/metrics.js';
function formatDate(value) {
  if (!value) return 'Sin sesiones';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Sin sesiones';
  return date.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Kpis({ global }) {
  const items = [
    { label: 'XP total', value: global.xp },
    { label: 'Racha actual', value: `${global.currentStreak} día${global.currentStreak === 1 ? '' : 's'}` },
    { label: 'Días de estudio', value: global.daysStudied },
    { label: 'Precisión', value: `${Math.round((global.accuracy || 0) * 100)}%` },
    { label: 'Cartas aprendidas', value: `${global.learned} / ${global.total}` },
    { label: 'Progreso global', value: `${Math.round((global.progress || 0) * 100)}%` },
    { label: 'Por repasar', value: global.dueNow },
  ];
  return (
    <ul className="dash-kpis" aria-label="Resumen global">
      {items.map((item) => (
        <li key={item.label} className="dash-kpi">
          <span className="dash-kpi__label">{item.label}</span>
          <span className="dash-kpi__value">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}

function Activity({ activity }) {
  const max = Math.max(1, ...activity.map((day) => day.attempts));
  return (
    <section className="dash-activity" aria-label="Actividad de los últimos 14 días">
      <h2 className="neon dash-section__title">Actividad (14 días)</h2>
      <ol className="dash-activity__bars">
        {activity.map((day) => {
          const height = Math.round((day.attempts / max) * 100);
          return (
            <li key={day.date} className="dash-activity__day">
              <span
                className="dash-activity__bar"
                style={{ height: `${height}%` }}
                aria-hidden="true"
              />
              <span className="dash-activity__count">
                {day.attempts} {day.attempts === 1 ? 'intento' : 'intentos'} el {day.date}
              </span>
            </li>
          );
        })}
      </ol>
      <details className="dash-activity__table">
        <summary>Ver actividad en tabla</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Intentos</th>
              <th scope="col">Aciertos</th>
            </tr>
          </thead>
          <tbody>
            {activity.map((day) => (
              <tr key={day.date}>
                <td>{day.date}</td>
                <td>{day.attempts}</td>
                <td>{day.correct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

export default function Dashboard() {
  const topics = useMemo(() => loadCatalog(), []);
  const srs = useMemo(() => loadSrs(), []);
  const profile = useMemo(() => createStore().load(), []);
  const history = useMemo(() => (Array.isArray(profile.history) ? profile.history : []), [profile]);

  const global = useMemo(
    () => getGlobalMetrics(topics, srs, history, profile, Date.now()),
    [topics, srs, history, profile]
  );

  const ranked = useMemo(() => {
    const reference = Date.now();
    return topics
      .map((topic) => ({ topic, metrics: getTopicMetrics(topic, srs, history, reference) }))
      .sort(
        (a, b) =>
          b.metrics.notLearned - a.metrics.notLearned ||
          a.topic.title.localeCompare(b.topic.title, 'es', { sensitivity: 'base' })
      );
  }, [topics, srs, history]);

  return (
    <main className="sepect-bg dash-page">
      <div className="dash-page__inner">
        <header className="dash-header">
          <div>
            <h1 className="neon dash-title">Progreso</h1>
            <p className="dash-subtitle">Tu avance global y por tema, guardado en este dispositivo.</p>
          </div>
          <a className="btn-neon dash-back" href="#/">← Volver a temas</a>
        </header>

        {topics.length === 0 ? (
          <div style={{ marginTop: 16 }}>
            <Card title="Aún no hay temas">
              <p>Crea un tema para empezar a registrar tu progreso.</p>
              <a className="btn-neon" href="#/">Ir a temas</a>
            </Card>
          </div>
        ) : (
          <>
            <Kpis global={global} />

            <section className="dash-global" aria-label="Progreso global">
              <ProgressBar value={global.progress} label="Progreso global" />
              <p className="dash-global__note">
                {global.learned} de {global.total} cartas aprendidas · {global.dueNow} para repasar hoy
              </p>
              {global.attempts === 0 && (
                <p className="dash-global__empty">Todavía no registras intentos. Juega un tema para empezar.</p>
              )}
            </section>

            <Activity activity={global.activity} />

            <section className="dash-topics" aria-label="Progreso por tema">
              <h2 className="neon dash-section__title">Temas</h2>
              <ul className="dash-topic-list">
                {ranked.map(({ topic, metrics }) => (
                  <li key={topic.id} className="dash-topic">
                    <div className="dash-topic__media">
                      <CardImage card={topicCoverCard(topic) || { id: topic.id, front: topic.title }} fill alt="" className="dash-topic__img" />
                    </div>
                    <div className="dash-topic__body">
                      <h3 className="dash-topic__title">{topic.title}</h3>
                      <p className="dash-topic__meta">
                        {topic.cards.length} cartas · {metrics.learned} aprendidas · {metrics.learning} aprendiendo ·{' '}
                        {metrics.new} nuevas · {metrics.dueNow} vencidas
                      </p>
                      <ProgressBar value={metrics.progress} label={`Progreso de ${topic.title}`} />
                      <p className="dash-topic__stats">
                        {metrics.daysStudied} día{metrics.daysStudied === 1 ? '' : 's'} de estudio ·{' '}
                        {Math.round(metrics.accuracy * 100)}% precisión · última sesión {formatDate(metrics.lastStudiedAt)}
                      </p>
                      <a className="dash-topic__link" href={`#/tema/${topic.id}`}>Abrir tema →</a>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
