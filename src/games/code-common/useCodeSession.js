import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { speak, stopSpeech } from '../../core/audio/tts.js';
import { arcadeFinish, arcadeHit, arcadeMiss, createArcade } from '../../core/engine/arcade.js';
import { deckExerciseMastery, recordExerciseAttempt } from '../../core/exercises/mastery.js';
import {
  EXERCISE_COUNTS,
  findExerciseDeck,
  selectExercises,
} from '../../core/exercises/select.js';
import { bestScoreFor } from '../best.js';

export const MIN_EXERCISES = 2;

export const CODE_MODE_OPTIONS = Object.freeze([
  { id: 'normal', label: 'Normal', hint: 'Reintenta sin vidas' },
  { id: 'arcade', label: 'Arcade', hint: '3 vidas · set elegido' },
]);

export const CODE_DIFFICULTIES = Object.freeze([
  { id: 'facil', label: 'Fácil', count: EXERCISE_COUNTS.facil },
  { id: 'medio', label: 'Medio', count: EXERCISE_COUNTS.medio },
  { id: 'dificil', label: 'Difícil', count: EXERCISE_COUNTS.dificil },
]);

export const LEVEL_LABELS = Object.freeze({
  'no-iniciado': 'Nivel sin empezar',
  'en-progreso': 'Nivel en progreso',
  completado: 'Nivel de ejercicios completado',
});

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function numericKeysOnly(value) {
  const keys = Object.keys(value);
  return keys.length === 0 || keys.every((key) => /^\d+$/.test(key));
}

function exerciseDecksOf(documentValue) {
  return asArray(documentValue?.decks).filter(
    (deck) => isObject(deck) && Number.isInteger(Number(deck.number))
  );
}

function normalizeDeckNumber(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

export function progressForTopic(progress, topicId) {
  if (!isObject(progress)) return {};
  if (topicId && isObject(progress[topicId])) return progress[topicId];
  if (!topicId || numericKeysOnly(progress)) return progress;
  return {};
}

export function applyProgressAttempt(progress, run, topicId) {
  const base = isObject(progress) ? progress : {};
  if (topicId && !isObject(base[topicId]) && numericKeysOnly(base)) {
    const next = recordExerciseAttempt({ [topicId]: base }, run);
    return isObject(next[topicId]) ? next[topicId] : {};
  }
  return recordExerciseAttempt(base, run);
}

export function useCodeSession({
  exercises,
  exerciseProgress,
  decks = [],
  topicId = '',
  best,
  onExerciseResult,
  onGrade,
  onArcadeEnd,
  onExit,
  defaultDifficulty = 'facil',
} = {}) {
  const documentDecks = useMemo(() => exerciseDecksOf(exercises), [exercises]);
  const resolvedTopicId = topicId || exercises?.topicId || '';
  const firstDeckNumber = documentDecks.length ? Number(documentDecks[0].number) : null;
  const [deckNumber, setDeckNumber] = useState(firstDeckNumber);
  const [mode, setMode] = useState('normal');
  const [difficulty, setDifficulty] = useState(defaultDifficulty);
  const [phase, setPhase] = useState('setup');
  const [localProgress, setLocalProgress] = useState(() => exerciseProgress || {});
  const [run, setRun] = useState(null);
  const [arcade, setArcade] = useState(() => createArcade());
  const [arcadeResult, setArcadeResult] = useState(null);
  const [summary, setSummary] = useState(null);
  const gradedCards = useRef(new Set());
  const submitted = useRef('');
  const advanced = useRef('');

  useEffect(() => {
    const numbers = documentDecks.map((deck) => Number(deck.number));
    setDeckNumber((current) =>
      numbers.includes(Number(current)) ? Number(current) : (numbers[0] ?? null)
    );
  }, [documentDecks]);

  useEffect(() => {
    setLocalProgress(exerciseProgress || {});
  }, [exerciseProgress]);

  useEffect(
    () => () => {
      stopSpeech();
    },
    []
  );

  const activeDeckNumber = deckNumber ?? firstDeckNumber;
  const deckExercises = useMemo(
    () => asArray(findExerciseDeck(exercises, activeDeckNumber)?.exercises),
    [exercises, activeDeckNumber]
  );
  const topicProgress = useMemo(
    () => progressForTopic(localProgress, resolvedTopicId),
    [localProgress, resolvedTopicId]
  );
  const mastery = useMemo(
    () => deckExerciseMastery(activeDeckNumber, deckExercises, topicProgress),
    [activeDeckNumber, deckExercises, topicProgress]
  );

  const difficultyOptions = useMemo(
    () =>
      CODE_DIFFICULTIES.map((option) => {
        const available = deckExercises.length >= option.count;
        return {
          ...option,
          disabled: !available,
          reason: available
            ? ''
            : `Necesita ${option.count} ejercicios y el mazo tiene ${deckExercises.length}`,
        };
      }),
    [deckExercises.length]
  );

  const effectiveDifficulty = useMemo(() => {
    const selected = difficultyOptions.find(
      (option) => option.id === difficulty && !option.disabled
    );
    if (selected) return selected.id;
    const first = difficultyOptions.find((option) => !option.disabled);
    return first ? first.id : difficulty;
  }, [difficulty, difficultyOptions]);

  const providedDecks = asArray(decks).filter(isObject);
  const pickerDecks = useMemo(() => {
    if (providedDecks.length) return providedDecks;
    return documentDecks.map((deck) => {
      const number = Number(deck.number);
      const list = asArray(deck.exercises);
      const deckMastery = deckExerciseMastery(number, list, topicProgress);
      const deckStatus = deckMastery.status;
      return {
        id: `deck-${number}`,
        number,
        label: `${list.length} ejercicios`,
        cards: [],
        total: list.length,
        studied: deckMastery.done,
        pending: list.length - deckMastery.done,
        complete: deckStatus === 'completado',
        mastery:
          deckStatus === 'completado'
            ? 'aprendida'
            : deckStatus === 'en-progreso'
              ? 'repasar'
              : 'no-aprendida',
        counts: {},
      };
    });
  }, [providedDecks, documentDecks, topicProgress]);

  const selectedDeck =
    pickerDecks.find((deck) => Number(deck.number) === Number(activeDeckNumber)) || null;
  const deckId = selectedDeck?.id || (activeDeckNumber ? `deck-${activeDeckNumber}` : null);
  const deckLabel = selectedDeck
    ? `Mazo ${selectedDeck.number} (${selectedDeck.label})`
    : activeDeckNumber
      ? `Mazo ${activeDeckNumber}`
      : 'Mazo';
  const bestForDeck = bestScoreFor(best, deckId);
  const levelLabel = LEVEL_LABELS[mastery.status] || LEVEL_LABELS['no-iniciado'];
  const canStart =
    Boolean(activeDeckNumber) &&
    deckExercises.length >= MIN_EXERCISES &&
    difficultyOptions.some((option) => !option.disabled);

  const currentExercise = run ? run.exercises[run.index] || null : null;

  const selectDeck = useCallback(
    (value) => {
      const deck = pickerDecks.find((entry) => entry.id === value);
      const number = deck ? Number(deck.number) : normalizeDeckNumber(value);
      if (number) setDeckNumber(number);
    },
    [pickerDecks]
  );

  const selectDifficulty = useCallback(
    (value) => {
      if (
        difficultyOptions.some((option) => option.id === value && !option.disabled)
      ) {
        setDifficulty(value);
      }
    },
    [difficultyOptions]
  );

  const deckDisabledReason = useCallback(
    (deck) => {
      const list = asArray(findExerciseDeck(exercises, Number(deck?.number))?.exercises);
      if (list.length < MIN_EXERCISES) {
        return `Necesitas al menos ${MIN_EXERCISES} ejercicios`;
      }
      return '';
    },
    [exercises]
  );

  const start = useCallback(() => {
    const selected = selectExercises(exercises, activeDeckNumber, {
      difficulty: effectiveDifficulty,
      progress: topicProgress,
    });
    if (!selected.length) return;
    gradedCards.current = new Set();
    submitted.current = '';
    advanced.current = '';
    setArcade(createArcade());
    setArcadeResult(null);
    setSummary(null);
    stopSpeech();
    setRun({
      exercises: selected,
      index: 0,
      attempt: 0,
      result: null,
      correct: 0,
      wrong: 0,
    });
    setPhase('playing');
  }, [exercises, activeDeckNumber, effectiveDifficulty, topicProgress]);

  const submit = useCallback(
    (correct) => {
      if (!run || run.result || phase !== 'playing') return;
      const exercise = run.exercises[run.index];
      if (!exercise) return;
      const submitKey = `${run.index}-${run.attempt}`;
      if (submitted.current === submitKey) return;
      submitted.current = submitKey;
      const didPass = correct === true;
      const attemptRun = {
        topicId: resolvedTopicId,
        deckNumber: activeDeckNumber,
        exerciseId: exercise.id,
        correct: didPass,
      };
      setLocalProgress((current) =>
        applyProgressAttempt(current, attemptRun, resolvedTopicId)
      );
      onExerciseResult?.(attemptRun);

      for (const cardId of asArray(exercise.cardIds)) {
        if (typeof cardId !== 'string' || !cardId) continue;
        if (gradedCards.current.has(cardId)) continue;
        gradedCards.current.add(cardId);
        onGrade?.(cardId, didPass ? 'facil' : 'otra-vez', {
          topicId: resolvedTopicId,
          exerciseId: exercise.id,
        });
      }

      if (mode === 'arcade') {
        setArcade((current) => (didPass ? arcadeHit(current) : arcadeMiss(current)));
      }

      setRun((current) =>
        current
          ? {
              ...current,
              result: { correct: didPass },
              correct: current.correct + (didPass ? 1 : 0),
              wrong: current.wrong + (didPass ? 0 : 1),
            }
          : current
      );
    },
    [run, phase, resolvedTopicId, activeDeckNumber, onExerciseResult, onGrade, mode]
  );

  const retry = useCallback(() => {
    if (!run || !run.result || run.result.correct || mode !== 'normal') return;
    setRun({ ...run, result: null, attempt: run.attempt + 1 });
  }, [run, mode]);

  const next = useCallback(() => {
    if (!run || !run.result) return;
    const nextKey = `${run.index}-${run.result.correct}`;
    if (advanced.current === nextKey) return;
    advanced.current = nextKey;
    const noLives = mode === 'arcade' && arcade.lives === 0;
    if (!noLives && run.index + 1 < run.exercises.length) {
      setRun({ ...run, index: run.index + 1, attempt: 0, result: null });
      return;
    }

    let finalArcade = arcade;
    let completed = false;
    if (mode === 'arcade') {
      finalArcade = arcade.lives > 0 ? arcadeFinish(arcade) : arcade;
      completed = Boolean(finalArcade.completed);
      setArcade(finalArcade);
      const result = onArcadeEnd?.({
        topicId: resolvedTopicId,
        deckId,
        deckNumber: activeDeckNumber,
        score: finalArcade.score,
        correct: finalArcade.correct,
        wrong: finalArcade.wrong,
        lives: finalArcade.lives,
        completed,
      });
      setArcadeResult(result || { best: finalArcade.score, isRecord: false });
    }

    setSummary({
      mode,
      correct: mode === 'arcade' ? finalArcade.correct : run.correct,
      wrong: mode === 'arcade' ? finalArcade.wrong : run.wrong,
      score: mode === 'arcade' ? finalArcade.score : 0,
      lives: mode === 'arcade' ? finalArcade.lives : 0,
      completed,
    });
    setPhase('summary');
    stopSpeech();
  }, [run, mode, arcade, onArcadeEnd, resolvedTopicId, deckId, activeDeckNumber]);

  const restart = useCallback(() => {
    start();
  }, [start]);

  const chooseDeck = useCallback(() => {
    stopSpeech();
    setPhase('setup');
    setRun(null);
    setSummary(null);
    setArcade(createArcade());
    setArcadeResult(null);
  }, []);

  const exit = useCallback(() => {
    stopSpeech();
    onExit?.();
  }, [onExit]);

  useEffect(() => {
    if (phase !== 'playing' || !currentExercise) return;
    speak(currentExercise.prompt);
  }, [phase, currentExercise]);

  useEffect(() => {
    if (!run?.result) return;
    speak(run.result.correct ? '¡Correcto!' : 'Incorrecto. Revisa la respuesta.');
  }, [run?.result]);

  return {
    phase,
    mode,
    setMode,
    difficulty: effectiveDifficulty,
    difficultyOptions,
    setDifficulty: selectDifficulty,
    deckNumber: activeDeckNumber,
    deckId,
    deckLabel,
    decks: pickerDecks,
    selectedDeck,
    deckExercises,
    deckDisabledReason,
    setDeckNumber: selectDeck,
    mastery,
    levelLabel,
    canStart,
    bestForDeck,
    run,
    currentExercise,
    arcade,
    arcadeResult,
    summary,
    start,
    submit,
    retry,
    next,
    restart,
    chooseDeck,
    exit,
    speakPrompt: () => currentExercise && speak(currentExercise.prompt),
    progress: topicProgress,
  };
}
