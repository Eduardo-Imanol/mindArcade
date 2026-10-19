import React, { useMemo, useRef, useState } from 'react';
import Card from '../components/Card.jsx';
import Modal from '../components/Modal.jsx';
import CardImage from '../components/CardImage.jsx';
import { loadCatalog, saveCustomTopic } from '../core/content/catalog.js';
import { parseTopic } from '../core/parser/parser.js';
import { findEmoji } from '../core/content/image.js';
import { saveImage } from '../core/storage/images.js';
import { slugify } from '../core/content/slug.js';

const PAGE = { minHeight: '100vh', width: '100%', maxWidth: '100%', padding: '16px clamp(16px, 4vw, 32px)' };
const INPUT = {
  width: '100%',
  background: '#0f051d',
  color: 'var(--text)',
  border: '1px solid rgba(0,255,204,.5)',
  borderRadius: 8,
  padding: 10,
  marginTop: 4,
};

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
      <h2 className="neon" style={{ marginTop: 0 }}>Crear tema</h2>
      <label htmlFor="topic-title">Título (opcional: se toma del Markdown)</label>
      <input
        id="topic-title"
        style={INPUT}
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
        style={INPUT}
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
                  style={{ ...INPUT, width: 'auto', flex: '1 1 140px', marginTop: 0 }}
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
  const topics = useMemo(() => loadTopics(), [loadTopics, version]);

  return (
    <main className="sepect-bg" style={PAGE}>
      <header
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
      >
        <div>
          <h1 className="neon" style={{ fontSize: 28, margin: 0 }}>Sepect — Arcade Learning</h1>
          <p style={{ margin: '4px 0 0', opacity: 0.8 }}>Elige un tema y juega para memorizarlo.</p>
        </div>
        <button className="btn-neon" type="button" onClick={() => setCreating(true)}>
          Crear tema
        </button>
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
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '16px 0 0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 12,
          }}
        >
          {topics.map((topic) => (
            <li key={topic.id}>
              <a
                className="card-neon"
                href={`#/tema/${topic.id}`}
                style={{ display: 'block', padding: 16, textDecoration: 'none', color: 'var(--text)', minHeight: 44 }}
              >
                <h2 className="neon" style={{ fontSize: 18, margin: 0 }}>{topic.title}</h2>
                <p style={{ margin: '6px 0', opacity: 0.85 }}>{topic.description || 'Sin descripción'}</p>
                <p style={{ margin: 0, fontSize: 13 }}>
                  <strong>{topic.cards.length}</strong> cartas
                  {topic.source === 'custom' && ' · Personalizado'}
                  {topic.errors.length > 0 && ` · ${topic.errors.length} líneas ignoradas`}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}

      <Modal open={creating} onClose={() => setCreating(false)}>
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
