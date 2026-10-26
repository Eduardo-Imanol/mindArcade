import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App.jsx';
import { mount, waitFor } from '../test/render.jsx';

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  window.location.hash = '';
  document.title = '';
});

describe('App source deep link (spec-19 T5)', () => {
  it('renders the reader and updates the title from the hash route', async () => {
    window.location.hash = '#/tema/funciones-en-programacion/fuente';
    const { container } = mount(<App />);
    await waitFor(() => container.querySelector('.source-reader__doc'));
    expect(container.querySelector('.source-reader__title').textContent).toContain('Funciones');
    expect(document.title).toBe('Sepect — Fuente: Funciones en Programación');
  });
});
