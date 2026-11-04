import React, { useId } from 'react';
import ArcadeHud from '../../components/ArcadeHud.jsx';
import ArcadeSummary from '../../components/ArcadeSummary.jsx';
import DeckPicker from '../../components/DeckPicker.jsx';
import GameModeSwitch from '../../components/GameModeSwitch.jsx';
import GameSetup from '../../components/GameSetup.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';
import SoundToggle from '../../components/SoundToggle.jsx';
import { CODE_MODE_OPTIONS, useCodeSession } from './useCodeSession.js';

function StateScreen({ title, message, detail, onExit, busy = false, alert = false }) {
  return (
    <main className="sepect-bg topic-page code-game-page">
      <div className="game-stage code-state">
        <h1 className="neon game-app-title">{title}</h1>
        <div role={alert ? 'alert' : 'status'} aria-live={busy ? 'polite' : undefined}>
          <p>{message}</p>
          {detail ? <p className="code-state__detail">{detail}</p> : null}
        </div>
        {onExit ? (
          <button className="btn-neon" type="button" onClick={onExit}>
            Volver al tema
          </button>
        ) : null}
        <SoundToggle />
      </div>
    </main>
  );
}

function errorsOf(exercises) {
  const errors = Array.isArray(exercises?.errors) ? exercises.errors : [];
  return [...errors, exercises?.error].filter(
    (error) => typeof error === 'string' && error.trim()
  );
}

export default function CodeGameShell({
  gameId,
  title,
  lead,
  eyebrow = 'Configura tu partida',
  topicId,
  exercises,
  exerciseProgress,
  decks = [],
  best,
  onExerciseResult,
  onGrade,
  onArcadeEnd,
  onExit,
  renderExercise,
  defaultDifficulty = 'facil',
} = {}) {
  const session = useCodeSession({
    exercises,
    exerciseProgress,
    decks,
    topicId,
    best,
    onExerciseResult,
    onGrade,
    onArcadeEnd,
    onExit,
    defaultDifficulty,
  });
  const rawId = useId();
  const idPrefix = `code-${rawId.replace(/[^A-Za-z0-9_-]/g, '')}`;

  if (exercises === undefined || exercises === null) {
    return (
      <StateScreen
        title={title}
        message="Cargando ejercicios…"
        busy
        onExit={session.exit}
      />
    );
  }

  const errors = errorsOf(exercises);
  if (errors.length) {
    return (
      <StateScreen
        title={title}
        message="No se pudieron cargar los ejercicios."
        detail={errors[0]}
        alert
        onExit={session.exit}
      />
    );
  }

  if (!session.decks.length) {
    return (
      <StateScreen
        title={title}
        message="Este tema todavía no tiene ejercicios."
        onExit={session.exit}
      />
    );
  }

  if (!renderExercise) {
    return (
      <StateScreen
        title={title}
        message="Este juego no está configurado correctamente."
        alert
        onExit={session.exit}
      />
    );
  }

  if (session.phase === 'setup') {
    const total = session.mastery.total;
    const done = session.mastery.done;
    const selectedCount = session.deckExercises.length;
    const note =
      selectedCount < 2
        ? 'Este mazo todavía no tiene los 2 ejercicios mínimos para jugar.'
        : `${selectedCount} ejercicios en este mazo · ${
            session.mode === 'arcade' ? '3 vidas por partida' : 'reintentos sin vidas'
          } · ${done}/${total} aprendidos.`;

    return (
      <GameSetup
        pageClassName="code-game-page"
        stageClassName="code-game-setup"
        title={title}
        eyebrow={eyebrow}
        lead={lead}
        note={note}
        start={
          <button
            className="btn-neon"
            type="button"
            onClick={session.start}
            disabled={!session.canStart}
          >
            Empezar
          </button>
        }
        actions={
          <>
            <SoundToggle />
            <button className="btn-neon game-setup__exit" type="button" onClick={session.exit}>
              Salir
            </button>
          </>
        }
      >
        <GameModeSwitch
          mode={session.mode}
          onChange={session.setMode}
          options={CODE_MODE_OPTIONS}
        />
        <DeckPicker
          decks={session.decks}
          selectedDeckId={session.selectedDeck?.id}
          onSelect={(_id, deck) => session.setDeckNumber(deck?.number)}
          best={best}
          disabledReason={(deck) => session.deckDisabledReason(deck)}
          gameId={gameId}
          label="Elige tu mazo"
        />
        <fieldset className="code-difficulty">
          <legend className="code-difficulty__legend">Dificultad</legend>
          <div className="code-difficulty__options">
            {session.difficultyOptions.map((option) => {
              const selected = option.id === session.difficulty;
              const reasonId = `${idPrefix}-difficulty-${option.id}`;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`code-difficulty__option${selected ? ' is-selected' : ''}`}
                  data-difficulty={option.id}
                  aria-pressed={selected}
                  aria-describedby={option.disabled ? reasonId : undefined}
                  disabled={option.disabled}
                  onClick={() => session.setDifficulty(option.id)}
                >
                  <span className="code-difficulty__label">{option.label}</span>
                  <span className="code-difficulty__count">{option.count} ejercicios</span>
                  {option.disabled ? (
                    <span className="code-difficulty__reason" id={reasonId}>
                      {option.reason}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="code-progress" role="status">
          <div className="code-progress__head">
            <span>
              Ejercicios: {done}/{total}
            </span>
            <strong>{session.levelLabel}</strong>
          </div>
          <ProgressBar
            value={total ? done / total : 0}
            label={`Progreso de ejercicios del mazo ${session.deckNumber ?? ''}`}
          />
        </div>
      </GameSetup>
    );
  }

  if (session.phase === 'summary' && session.summary) {
    const bestValue = Number(session.arcadeResult?.best ?? session.bestForDeck);
    const isRecord = Boolean(session.arcadeResult?.isRecord);
    const total = session.mastery.total;
    const done = session.mastery.done;
    const actions = (
      <>
        <button className="btn-neon" type="button" onClick={session.restart} autoFocus>
          Repetir
        </button>
        <button className="btn-neon" type="button" onClick={session.chooseDeck}>
          Elegir mazo
        </button>
        <button className="btn-neon" type="button" onClick={session.exit}>
          Salir
        </button>
        <SoundToggle />
      </>
    );
    const progress = (
      <div className="code-progress code-progress--summary">
        <div className="code-progress__head">
          <span>
            Ejercicios: {done}/{total}
          </span>
          <strong>{session.levelLabel}</strong>
        </div>
        <ProgressBar
          value={total ? done / total : 0}
          label={`Progreso de ejercicios del mazo ${session.deckNumber ?? ''}`}
        />
      </div>
    );

    if (session.summary.mode === 'arcade') {
      return (
        <main className="sepect-bg topic-page code-game-page">
          <div className="game-stage code-game">
            <ArcadeSummary
              score={session.summary.score}
              best={bestValue}
              isRecord={isRecord}
              lives={session.summary.lives}
              correct={session.summary.correct}
              wrong={session.summary.wrong}
              completed={session.summary.completed}
              deckLabel={session.deckLabel}
              actions={actions}
            />
            {progress}
          </div>
        </main>
      );
    }

    return (
      <main className="sepect-bg topic-page code-game-page">
        <div className="game-stage code-game">
          <section className="result-panel" aria-labelledby={`${idPrefix}-summary-title`}>
            <p className="result-panel__eyebrow">Sesión completada</p>
            <h1 id={`${idPrefix}-summary-title`} className="neon game-app-title">
              {title}
            </h1>
            <p className="result-panel__live" role="status" aria-atomic="true">
              Aciertos {session.summary.correct}. Fallos {session.summary.wrong}. Ejercicios{' '}
              {done} de {total}. {session.levelLabel}.
            </p>
            <dl className="result-panel__stats">
              <div className="result-panel__stat">
                <dt>Aciertos</dt>
                <dd>{session.summary.correct}</dd>
              </div>
              <div className="result-panel__stat">
                <dt>Fallos</dt>
                <dd>{session.summary.wrong}</dd>
              </div>
              <div className="result-panel__stat result-panel__stat--wide">
                <dt>Mazo</dt>
                <dd>{session.deckLabel}</dd>
              </div>
            </dl>
            {progress}
            <div className="result-panel__actions">{actions}</div>
          </section>
        </div>
      </main>
    );
  }

  const run = session.run;
  const exercise = session.currentExercise;
  if (!run || !exercise) {
    return (
      <StateScreen
        title={title}
        message="No hay ejercicios disponibles para este mazo."
        onExit={session.exit}
      />
    );
  }

  const last = run.index + 1 >= run.exercises.length;
  const livesOut = session.mode === 'arcade' && session.arcade.lives === 0;

  return (
    <main className="sepect-bg topic-page code-game-page">
      <div className="game-stage code-game">
        <header className="game-session-header">
          <div className="game-session-header__text">
            <p className="game-session-header__eyebrow">
              {session.deckLabel} · {session.mode === 'arcade' ? 'Arcade' : 'Normal'}
            </p>
            <h1 className="neon game-app-title">{title}</h1>
            <p className="game-session-progress__text">
              Ejercicio {run.index + 1} de {run.exercises.length} · Ejercicios:{' '}
              {session.mastery.done}/{session.mastery.total}
            </p>
          </div>
          <div className="game-session-header__actions">
            <SoundToggle />
            <button className="btn-neon" type="button" onClick={session.exit}>
              Salir
            </button>
          </div>
        </header>

        {session.mode === 'arcade' ? (
          <ArcadeHud
            lives={session.arcade.lives}
            score={session.arcade.score}
            streak={session.arcade.streak}
            best={session.bestForDeck}
          />
        ) : null}

        <section className="card-neon code-exercise" aria-labelledby={`${idPrefix}-prompt`}>
          <div className="code-exercise__head">
            <p className="code-exercise__prompt" id={`${idPrefix}-prompt`}>
              {exercise.prompt}
            </p>
            <button
              className="btn-neon"
              type="button"
              aria-label="Escuchar el prompt"
              onClick={session.speakPrompt}
            >
              🔊 Prompt
            </button>
          </div>
          <div className="code-mechanic" key={`${exercise.id}-${run.attempt}`}>
            {renderExercise({
              exercise,
              exerciseIndex: run.index,
              total: run.exercises.length,
              mode: session.mode,
              result: run.result,
              attempt: run.attempt,
              onResult: session.submit,
              arcade: session.arcade,
            })}
          </div>
        </section>

        {run.result ? (
          <div
            className={`code-feedback${run.result.correct ? ' is-correct' : ' is-wrong'}`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="code-feedback__text">
              {run.result.correct ? '¡Correcto!' : 'Incorrecto. Revisa la respuesta.'}
            </p>
            <div className="code-feedback__actions">
              {!run.result.correct && session.mode === 'normal' ? (
                <button className="btn-neon" type="button" onClick={session.retry}>
                  Reintentar
                </button>
              ) : null}
              <button className="btn-neon" type="button" onClick={session.next}>
                {last || livesOut ? 'Ver resumen' : 'Siguiente'}
              </button>
            </div>
          </div>
        ) : (
          <p className="code-feedback code-feedback--idle">
            Comprueba tu respuesta para continuar.
          </p>
        )}
      </div>
    </main>
  );
}
