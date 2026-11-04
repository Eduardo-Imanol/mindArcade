import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App.jsx';
import { fire, mount, waitFor } from '../test/render.jsx';

const ROUTES = [
  {
    hash: '#/',
    selector: '.hub-title',
    title: 'Sepect — Biblioteca',
    text: 'Biblioteca',
  },
  {
    hash: '#/categoria/programacion',
    selector: '.hub-title',
    title: 'Sepect — Programación',
    text: 'Programación',
  },
  {
    hash: '#/tema/funciones-en-programacion',
    selector: '.topic-title',
    title: 'Sepect — Funciones en Programación',
    text: 'Funciones en Programación',
  },
  {
    hash: '#/tema/funciones-en-programacion/fuente',
    selector: '.source-reader__doc',
    title: 'Sepect — Fuente: Funciones en Programación',
  },
  {
    hash: '#/tema/funciones-en-programacion/juego/flashcards',
    selector: '.flashcards-page',
    title: 'Sepect — Flashcards',
  },
  {
    hash: '#/progreso',
    selector: '.dash-title',
    title: 'Sepect — Progreso',
    text: 'Progreso',
  },
  {
    hash: '#/configuracion',
    selector: '.settings-title',
    title: 'Sepect — Configuración',
    text: 'Configuración',
  },
  {
    hash: '#/personalizados',
    selector: '.hub-title',
    title: 'Sepect — Mis temas',
    text: 'Mis temas',
  },
];

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  window.location.hash = '';
  document.title = '';
});

describe('matriz de rutas (spec-23 AC-2)', () => {
  for (const route of ROUTES) {
    it(`${route.hash} carga por deep link y actualiza el título`, async () => {
      window.location.hash = route.hash;
      const view = mount(<App />);
      const found = await waitFor(() => view.container.querySelector(route.selector));
      if (route.text) expect(found.textContent).toContain(route.text);
      expect(document.title).toBe(route.title);
      view.unmount();
    });
  }

  it('responde a hashchange sin recargar y permite volver atrás', async () => {
    window.location.hash = '#/';
    const view = mount(<App />);
    await waitFor(() => view.container.querySelector('.hub-title'));

    window.location.hash = '#/progreso';
    fire(window, 'hashchange');
    await waitFor(() => view.container.querySelector('.dash-title'));

    window.location.hash = '#/';
    fire(window, 'hashchange');
    await waitFor(() => view.container.querySelector('.hub-title'));

    view.unmount();
  });

  it('sobrevive a recarga con storage corrupto sin perder la ruta', async () => {
    localStorage.setItem('sepect.profile.v1', '{roto');
    localStorage.setItem('sepect.srs.v1', '[]');
    localStorage.setItem('sepect.settings.v1', '{roto');
    localStorage.setItem('sepect.arcade.v1', '{roto');
    localStorage.setItem('sepect.exercises.v1', '{roto');
    window.location.hash = '#/configuracion';
    const view = mount(<App />);
    await waitFor(() => view.container.querySelector('.settings-title'));
    expect(document.title).toBe('Sepect — Configuración');
    view.unmount();
  });
});
