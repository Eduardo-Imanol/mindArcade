import React from 'react';
import { describe, expect, it } from 'vitest';
import ArcadeSummary from './ArcadeSummary.jsx';
import { mount } from '../test/render.jsx';

describe('ArcadeSummary (spec-18 T15)', () => {
  it('announces the full result once and focuses the repeat action', () => {
    const view = mount(
      <ArcadeSummary
        score={480}
        best={480}
        isRecord
        lives={3}
        correct={10}
        wrong={0}
        completed
        deckLabel="Mazo 1"
        actions={
          <button type="button" autoFocus>
            Repetir mazo
          </button>
        }
      />
    );

    const live = view.container.querySelector('.result-panel__live');
    expect(live.getAttribute('role')).toBe('status');
    expect(live.getAttribute('aria-atomic')).toBe('true');
    expect(live.textContent).toContain('Puntuación 480.');
    expect(live.textContent).toContain('Nuevo récord.');
    expect(live.textContent).toContain('Vidas restantes 3.');
    expect(live.textContent).toContain('Aciertos 10.');
    expect(live.textContent).toContain('Fallos 0.');
    expect(live.textContent).toContain('Mazo 1.');
    expect(view.container.textContent).toContain('Mazo completado');
    expect(document.activeElement.textContent).toBe('Repetir mazo');
    view.unmount();
  });

  it('sanitizes counters and keeps a stable best when there is no record', () => {
    const view = mount(
      <ArcadeSummary score={-5} best={250} lives={1.9} correct="3" wrong={null} />
    );

    expect(view.container.textContent).toContain('Partida terminada');
    expect(view.container.textContent).toContain('Mejor: 250');
    expect(view.container.querySelector('.result-panel__live').textContent).toContain(
      'Puntuación 0. Mejor marca 250. Vidas restantes 1. Aciertos 3. Fallos 0.'
    );
    view.unmount();
  });
});
