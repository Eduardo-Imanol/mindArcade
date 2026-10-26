import React, { useMemo, useRef, useState } from 'react';
import Card from '../components/Card.jsx';
import Modal from '../components/Modal.jsx';
import CardImage from '../components/CardImage.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { loadCatalog, saveCustomTopic } from '../core/content/catalog.js';
import { ensureTopicMeta } from '../core/content/topicMeta.js';
import { parseTopic } from '../core/parser/parser.js';
import { findEmoji } from '../core/content/image.js';
import { saveImage } from '../core/storage/images.js';
import { slugify } from '../core/content/slug.js';
import { loadSrs } from '../core/repetition/srs.js';
import { createStore } from '../core/storage/store.js';
import { CATEGORIES, topicsForCategory } from '../core/content/library.js';
import { getTopicMetrics } from '../core/metrics/metrics.js';


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


export default function TopicsHub({ loadTopics = loadCatalog } = {}) {
  const [version, setVersion] = useState(0);
  const [creating, setCreating] = useState(false);

  const allTopics = useMemo(() => ensureTopicMeta(loadTopics()), [loadTopics, version]);
  const srs = useMemo(() => loadSrs(), [version]);
  const history = useMemo(() => createStore().load().history || [], [version]);
  const now = Date.now();

  const topicsById = useMemo(() => new Map(allTopics.map((t) => [t.id, t])), [allTopics]);

  const categoryCards = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const moduleTopics = topicsForCategory(cat.id);
      const topicIds = moduleTopics.map((m) => m.topicId);
      const topics = topicIds.map((id) => topicsById.get(id)).filter(Boolean);
      const customTopics = cat.id === 'personalizados' ? allTopics.filter((t) => t.source === 'custom') : [];
      const list = cat.id === 'personalizados' ? customTopics : topics;
      const totalCards = list.reduce((acc, t) => acc + (t.cards?.length || 0), 0);
      let progressSum = 0;
      let count = 0;
      for (const t of list) {
        const m = getTopicMetrics(t, srs, history, now);
        progressSum += m.progress || 0;
        count += 1;
      }
      const progress = count > 0 ? Math.round(progressSum / count) : 0;
      return {
        category: cat,
        count: list.length,
        totalCards,
        progress,
        hasContent: list.length > 0,
      };
    });
  }, [allTopics, topicsById, srs, history, now]);

  const hasAnyTopics = allTopics.length > 0;
  const categoryImage = (cat) =>
    `${import.meta.env.BASE_URL || '/'}${cat.image || `categories/${cat.id}.png`}`;

  return (
    <main className="sepect-bg topic-page">
      <header className="hub-header">
        <div>
          <h1 className="neon hub-title">Biblioteca</h1>
          <p className="hub-subtitle">Elige una categoría y practica por módulos.</p>
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

      <img
        className="hub-cover"
        src={`${import.meta.env.BASE_URL || '/'}cover/arcade-cover.png`}
        alt="Carátula de Sepect: un arcade con una máquina por tipo de tema (programación, idiomas y universidad)."
        width="1200"
        height="630"
        decoding="async"
      />

      {hasAnyTopics === false ? (
        <div style={{ marginTop: 16 }}>
          <Card title="Aún no hay temas">
            <p>Pega tus notas en Markdown para crear tu primer tema.</p>
            <button className="btn-neon" type="button" onClick={() => setCreating(true)}>
              Crear mi primer tema
            </button>
          </Card>
        </div>
      ) : null}

      <section className="library">
        <ul className="library__grid">
          {categoryCards.map((card) => {
            const cat = card.category;
            if (!card.hasContent && cat.id !== 'personalizados') {
              return (
                <li key={cat.id}>
                  <Card className="library-card library-card--coming">
                    <img
                      className="library-card__media"
                      src={categoryImage(cat)}
                      alt=""
                      width="720"
                      height="405"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="library-card__header">
                      <h2 className="library-card__title">{cat.title}</h2>
                      {cat.description ? <p className="library-card__desc">{cat.description}</p> : null}
                    </div>
                    <span className="library-card__badge">Próximamente</span>
                  </Card>
                </li>
              );
            }
            return (
              <li key={cat.id}>
                <a className="card-neon library-card" href={`#/categoria/${cat.id}`}>
                  <img
                    className="library-card__media"
                    src={categoryImage(cat)}
                    alt=""
                    width="720"
                    height="405"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="library-card__header">
                    <h2 className="library-card__title">{cat.title}</h2>
                    {cat.description ? <p className="library-card__desc">{cat.description}</p> : null}
                  </div>
                  <div className="library-card__meta">
                    <span>{card.count} {card.count === 1 ? 'tema' : 'temas'}</span>
                    <span>{card.totalCards} {card.totalCards === 1 ? 'carta' : 'cartas'}</span>
                  </div>
                  <div className="library-card__progress">
                    <ProgressBar
                      value={card.progress / 100}
                      label={`Progreso de ${cat.title}`}
                    />
                    <span className="library-card__percent">Progreso {card.progress}%</span>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

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
