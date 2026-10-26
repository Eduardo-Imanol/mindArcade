import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import TopicView from './TopicView.jsx';
import { saveCustomTopic } from '../core/content/catalog.js';
import { mount } from '../test/render.jsx';

const FIXTURE = `# Tema propio
- Q: perro | A: dog
- Q: gato | A: cat`;

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('TopicView source link (spec-19 T5)', () => {
  it('links to the reader only for topics with a resolvable source', () => {
    const { container } = mount(<TopicView topicId="funciones-en-programacion" />);
    const link = container.querySelector('a[href="#/tema/funciones-en-programacion/fuente"]');
    expect(link).toBeTruthy();
    expect(link.textContent).toBe('Leer documento original');
  });

  it('does not show the link for custom topics', () => {
    const { topic } = saveCustomTopic({ title: 'Tema propio', md: FIXTURE });
    const { container } = mount(<TopicView topicId={topic.id} />);
    expect(container.querySelector('a[href*="/fuente"]')).toBeNull();
    expect(container.textContent).not.toContain('Leer documento original');
  });
});
