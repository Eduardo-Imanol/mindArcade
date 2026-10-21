import React, { useMemo, useRef, useState } from 'react';
import Card from '../components/Card.jsx';
import Modal from '../components/Modal.jsx';
import CardImage from '../components/CardImage.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { loadCatalog, saveCustomTopic } from '../core/content/catalog.js';
import { topicCoverCard } from '../core/content/cover.js';
import { ensureTopicMeta } from '../core/content/topicMeta.js';
import { parseTopic } from '../core/parser/parser.js';
import { findEmoji } from '../core/content/image.js';
import { saveImage } from '../core/storage/images.js';
import { slugify } from '../core/content/slug.js';
import { loadSrs } from '../core/repetition/srs.js';
import { createStore } from '../core/storage/store.js';
import { filterAndSortTopics, SORT_OPTIONS, STATUS_OPTIONS } from './topics.js';


function CreateTopicForm({ onCreated, onCancel }) {
  const [title, setTitle] = useState('');
  const [md, setMd] = useState('');
  const [overrides, setOverrides] = useState({});
  const [message, setMessage] = useState('');
  const fileInputs = useRef({});
  const parsed = useMemo(() => parseTopic(md), [md]);

  const setOverride = (cardId, value) => {
    setOverrides((prev) => {
      const next = { ...prev };
      if (value) next[cardId] = value;
      else delete next[cardId];
      return next;
    });
    setMessage('');
  };

  const pickEmoji = (card) => {
    const emoji = findEmoji(card.front);
    if (emoji) setOverride(card.id, { kind: 'emoji', value: emoji });
  };

  const pickUrl = (card, value) => {
    const url = value.trim();
    setOverride(card.id, url ? { kind: 'url', value: url } : null);
  };

  const pickFile = async (card, file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage('Imagen demasiado grande (máximo 2 MB): se mantiene la imagen anterior.');
      return;
    }
    const key = `custom-${slugify(title || parsed.topic.id || 'tema')}-${card.id}`;
    const result = await saveImage(key, file);
    if (!result.ok) {
      setMessage('No se pudo guardar la imagen (almacenamiento no disponible): se mantiene la imagen anterior.');
      return;
    }
    setOverride(card.id, { kind: 'upload', value: key });
  };

  const submit = (event) => {
    event.preventDefault();
    const result = saveCustomTopic({ title, md, images: overrides });
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    onCreated();
  };

  const urlValue = (card) => {
    const value = overrides[card.id];
    return value && value.kind === 'url' ? value.value : '';
  };

  return (
    <form onSubmit={submit}>
      <label htmlFor="topic-title">Título (opcional: se toma del Markdown)</label>
      <input
        id="topic-title"
        className="hub-field"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Mi tema"
      />
      <label htmlFor="topic-md" style={{ display: 'block', marginTop: 12 }}>
        Pega tus notas en Markdown
      </label>
      <textarea
        id="topic-md"
        rows={6}
        className="hub-field"
        value={md}
        onChange={(event) => setMd(event.target.value)}
        placeholder={'# Mi tema\nUna descripción breve.\n\n- Q: término | A: significado | E: easy'}
      />
      {md.trim() !== '' && (
        <p role="status" style={{ margin: '8px 0' }}>
          {parsed.cards.length} cartas válidas · {parsed.errors.length} líneas ignoradas
        </p>
      )}
      {parsed.cards.map((card) => {
        const suggestion = findEmoji(card.front);
        return (
          <div
            key={card.id}
            className="card-neon"
            style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 12, marginTop: 8 }}
          >
            <CardImage card={card} overrides={overrides} size={64} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 6px', fontWeight: 700 }}>{card.front}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {suggestion && (
                  <button className="btn-neon" type="button" onClick={() => pickEmoji(card)}>
                    Sugerir {suggestion}
                  </button>
                )}
                <input
                  type="url"
                  className="hub-field"
                  style={{ width: 'auto', flex: '1 1 140px', marginTop: 0 }}
                  aria-label={`URL de imagen para ${card.front}`}
                  placeholder="https://imagen…"
                  value={urlValue(card)}
                  onChange={(event) => pickUrl(card, event.target.value)}
                />
                <button
                  className="btn-neon"
                  type="button"
                  onClick={() => fileInputs.current[card.id]?.click()}
                >
                  Subir imagen
                </button>
                <input
                  ref={(element) => {
                    fileInputs.current[card.id] = element;
                  }}
                  type="file"
                  accept="image/*"
                  aria-label={`Subir imagen para ${card.front}`}
                  style={{ display: 'none' }}
                  onChange={(event) => pickFile(card, event.target.files?.[0])}
                />
              </div>
            </div>
          </div>
        );
      })}
      {message && (
        <p role="alert" style={{ color: 'var(--neon-magenta)' }}>
          {message}
        </p>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button className="btn-neon" type="submit">Guardar tema</button>
        <button className="btn-neon" type="button" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}
function TopicCard({ topic, metrics, cover }) {
  const learned = metrics ? metrics.learned : 0;
  const notLearned = metrics ? metrics.notLearned : topic.cards.length;
  const days = metrics ? metrics.daysStudied : 0;
  return (
    <a
      className="card-neon topic-card-tile"
      href={`#/tema/${topic.id}`}
      style={{ textDecoration: 'none', color: 'var(--text)', minHeight: 44 }}
    >
      <div className="topic-card-tile__media">
        {cover ? <CardImage card={cover} fill className="topic-card-tile__img" /> : null}
      </div>
      <div className="topic-card-tile__body">
        <h2 className="neon topic-card-tile__title">{topic.title}</h2>
        <p className="topic-card-tile__count">
          <strong>{topic.cards.length}</strong> cartas
          {topic.source === 'custom' && ' · Personalizado'}
        </p>
        <ProgressBar value={metrics ? metrics.progress : 0} label={`Progreso de ${topic.title}`} />
        <p className="topic-card-tile__stats">
          {learned} aprendidas · {notLearned} por aprender
        </p>
        <p className="topic-card-tile__days">
          {days === 0 ? 'Sin sesiones todavía' : `${days} día${days === 1 ? '' : 's'} de estudio`}
        </p>
      </div>
    </a>
  );
}

export default function TopicsHub({ loadTopics = loadCatalog } = {}) {
  const [version, setVersion] = useState(0);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');
  const [status, setStatus] = useState('all');

  const topics = useMemo(() => ensureTopicMeta(loadTopics()), [loadTopics, version]);
  const srs = useMemo(() => loadSrs(), [version]);
  const history = useMemo(() => createStore().load().history || [], [version]);

  const { topics: visible, metrics } = useMemo(
    () =>
      filterAndSortTopics(topics, {
        query,
        sort,
        status,
        srs,
        history,
        now: Date.now(),
      }),
    [topics, query, sort, status, srs, history]
  );

  const hasFilters = query.trim() !== '' || status !== 'all';
  return (
    <main className="sepect-bg topic-page">
      <header className="hub-header">
        <div>
          <h1 className="neon hub-title">Tus temas</h1>
          <p className="hub-subtitle">Elige un tema y juega para memorizarlo.</p>
        </div>
        <div className="hub-header__actions">
          <button className="btn-neon" type="button" onClick={() => setCreating(true)}>
            Crear tema
          </button>
          <a className="btn-neon hub-progress-link" href="#/progreso">
            Progreso
          </a>
        </div>
      </header>

      {topics.length === 0 ? (
        <div style={{ marginTop: 16 }}>
          <Card title="Aún no hay temas">
            <p>Pega tus notas en Markdown para crear tu primer tema.</p>
            <button className="btn-neon" type="button" onClick={() => setCreating(true)}>
              Crear mi primer tema
            </button>
          </Card>
        </div>
      ) : (
        <>
          <div className="hub-controls">
            <div className="hub-search">
              <span className="hub-search__icon" aria-hidden="true">🔍</span>
              <input
                id="hub-search"
                type="search"
                className="hub-field"
                aria-label="Buscar temas"
                placeholder="Buscar por título o descripción"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query !== '' && (
                <button
                  className="btn-neon hub-search__clear"
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setQuery('')}
                >
                  ✕
                </button>
              )}
            </div>
            <label className="hub-control">
              <span>Ordenar</span>
              <select
                className="hub-select"
                aria-label="Ordenar temas"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="hub-control">
              <span>Estado</span>
              <select
                className="hub-select"
                aria-label="Filtrar por estado"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          {visible.length === 0 ? (
            <div style={{ marginTop: 16 }}>
              <Card title="Sin resultados">
                <p>No hay temas que coincidan con tu búsqueda o filtros.</p>
                {hasFilters && (
                  <button
                    className="btn-neon"
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setStatus('all');
                    }}
                  >
                    Limpiar filtros
                  </button>
                )}
              </Card>
            </div>
          ) : (
            <ul className="hub-grid">
              {visible.map((topic) => (
                <li key={topic.id}>
                  <TopicCard
                    topic={topic}
                    metrics={metrics[topic.id]}
                    cover={topicCoverCard(topic)}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Modal open={creating} title="Crear tema" onClose={() => setCreating(false)}>
        <CreateTopicForm
          onCreated={() => {
            setCreating(false);
            setVersion((value) => value + 1);
          }}
          onCancel={() => setCreating(false)}
        />
      </Modal>
    </main>
  );
}
