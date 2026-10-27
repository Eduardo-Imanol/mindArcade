import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import MarkdownBlocks from '../components/MarkdownBlocks.jsx';
import NotFound from '../components/NotFound.jsx';
import SourceReaderControls from './source/SourceReaderControls.jsx';
import SourceReaderHeader from './source/SourceReaderHeader.jsx';
import SourceReaderState from './source/SourceReaderState.jsx';
import useSelectionSpeech from './source/useSelectionSpeech.js';
import { documentStats } from './source/sourceReaderModel.js';
import { loadCatalog } from '../core/content/catalog.js';
import { blocksToSpeech, parseSourceMarkdown } from '../core/content/markdown.js';
import { hasSource, loadSource } from '../core/content/sources.js';
import { findCategory } from '../core/content/library.js';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  subscribeSettings,
} from '../core/storage/settings.js';
import { isSupported, speakSequence, stopSpeech } from '../core/audio/tts.js';

export default function SourceReader({ topicId }) {
  const topics = useMemo(() => loadCatalog(), []);
  const topic = topics.find((entry) => entry.id === topicId) || null;
  const sourcePath = topic?.sourcePath || null;
  const category = topic?.categoryId ? findCategory(topic.categoryId) : null;
  const muted = useSyncExternalStore(
    subscribeSettings,
    () => loadSettings().muted,
    () => DEFAULT_SETTINGS.muted
  );
  const speechSupported = isSupported();
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ status: 'loading', blocks: [], message: '' });
  const [playback, setPlayback] = useState('idle');
  const [mode, setMode] = useState('idle');
  const controlRef = useRef(null);
  const docRef = useRef(null);

  useEffect(() => {
    let alive = true;
    if (!sourcePath) {
      setState({
        status: 'empty',
        blocks: [],
        message: topic?.source === 'custom'
          ? 'Los temas personalizados no tienen documento original.'
          : 'Este tema no tiene documento original.',
      });
      return () => { alive = false; };
    }
    if (!hasSource(sourcePath)) {
      setState({
        status: 'empty',
        blocks: [],
        message: 'El documento original no está disponible para este tema.',
      });
      return () => { alive = false; };
    }
    setState({ status: 'loading', blocks: [], message: '' });
    loadSource(sourcePath)
      .then((md) => {
        if (!alive) return;
        if (md == null) {
          setState({ status: 'error', blocks: [], message: 'No se pudo cargar el documento original.' });
          return;
        }
        const blocks = parseSourceMarkdown(md);
        if (!blocks.length) {
          setState({ status: 'empty', blocks: [], message: 'El documento original está vacío.' });
          return;
        }
        setState({ status: 'ready', blocks, message: '' });
      })
      .catch(() => {
        if (alive) setState({ status: 'error', blocks: [], message: 'No se pudo cargar el documento original.' });
      });
    return () => { alive = false; };
  }, [sourcePath, reloadKey, topic?.source]);

  useEffect(() => () => stopSpeech(), [sourcePath]);

  const startSequence = useCallback((parts, nextMode) => {
    const control = speakSequence(parts, {
      onEnd: () => {
        controlRef.current = null;
        setPlayback('idle');
        setMode('idle');
      },
      onError: () => {
        controlRef.current = null;
        setPlayback('idle');
        setMode('idle');
      },
    });
    if (!control) {
      setPlayback('idle');
      setMode('idle');
      return false;
    }
    controlRef.current = control;
    setPlayback('speaking');
    setMode(nextMode);
    return true;
  }, []);

  const readSelectedText = useCallback(
    (text) => startSequence([text], 'selection'),
    [startSequence]
  );

  const { selection, playSelection, clearAutoReadTimer } = useSelectionSpeech({
    docRef,
    speechSupported,
    muted,
    onRead: readSelectedText,
    resetKey: sourcePath,
  });

  const stopPlayback = useCallback(() => {
    clearAutoReadTimer();
    stopSpeech();
    controlRef.current = null;
    setPlayback('idle');
    setMode('idle');
  }, [clearAutoReadTimer]);

  useEffect(() => {
    if (muted) stopPlayback();
  }, [muted, stopPlayback]);

  const play = useCallback(() => {
    const parts = blocksToSpeech(state.blocks);
    if (!parts.length) return;
    clearAutoReadTimer();
    startSequence(parts, 'document');
  }, [clearAutoReadTimer, startSequence, state.blocks]);

  const pause = useCallback(() => {
    if (controlRef.current?.pause()) setPlayback('paused');
    else stopPlayback();
  }, [stopPlayback]);

  const resume = useCallback(() => {
    if (controlRef.current?.resume()) setPlayback('speaking');
    else stopPlayback();
  }, [stopPlayback]);

  if (!topic) return <NotFound message={`Tema "${topicId}" no encontrado`} />;

  const stats = documentStats(state.blocks);
  return (
    <main className="sepect-bg topic-page source-reader">
      <div className="topic-page__inner source-reader__inner">
        <SourceReaderHeader
          topic={topic}
          category={category}
          stats={state.status === 'ready' ? stats : null}
          blocks={state.blocks}
        />

        {state.status === 'ready' ? (
          <>
            <SourceReaderControls
              supported={speechSupported}
              muted={muted}
              status={playback}
              mode={mode}
              selection={selection}
              onPlay={play}
              onPause={pause}
              onResume={resume}
              onStop={stopPlayback}
              onPlaySelection={playSelection}
            />
            <article
              className="source-reader__doc card-neon"
              aria-label={`Documento original de ${topic.title}`}
              ref={docRef}
            >
              <MarkdownBlocks blocks={state.blocks} />
            </article>
          </>
        ) : (
          <SourceReaderState
            state={state}
            topic={topic}
            onRetry={() => setReloadKey((value) => value + 1)}
          />
        )}
      </div>
    </main>
  );
}
