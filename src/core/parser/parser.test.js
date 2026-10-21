import { describe, it, expect } from 'vitest';
import { parseMarkdown, parseTopic } from './parser.js';

const FIXTURE = `# Go pointers
- Q: What does \`&x\` return? | A: address of x | E: easy
- Q: What does \`*\u200bp\` do? | A: dereferences p | E: hard
- Q: Zero value of a pointer? | A: nil
- BROKEN LINE WITHOUT QA MARKERS`;

const FIXTURE_A = `# Funciones en Programación
Una función encapsula lógica reutilizable y evita repetir código.

- Q: ¿Qué es una función? | A: Bloque de código reutilizable que realiza una tarea | E: easy
- Q: ¿Qué es un parámetro? | A: Variable que recibe valores de entrada | E: easy
- Q: ¿Qué es el valor de retorno? | A: Resultado que la función devuelve al llamador | E: hard
- LINEA SIN MARCADORES`;

const FIXTURE_C = `# Animales
- Q: dog | A: perro | I: 🐶
- Q: house | A: casa | I: https://example.com/house.png
- Q: book | A: libro`;

const LONG_DESCRIPTION = 'Una descripción muy larga. '.repeat(40);

const FIXTURE_LONG = `# Tema largo
${LONG_DESCRIPTION}

Segundo párrafo.

- Q: a | A: b`;

describe('parseMarkdown', () => {
  it('fixture → 3 questions + 1 error', () => {
    const { questions, errors } = parseMarkdown(FIXTURE);
    expect(questions).toHaveLength(3);
    expect(errors).toHaveLength(1);
    expect(questions[0]).toMatchObject({ topic: 'Go pointers', difficulty: 'easy' });
    expect(questions[1].difficulty).toBe('hard');
  });
  it('empty → 0 + no crash', () => {
    expect(parseMarkdown('')).toEqual({ questions: [], errors: [] });
  });
  it('never throws on garbage', () => {
    expect(() => parseMarkdown(null)).not.toThrow();
    expect(parseMarkdown(42).questions).toEqual([]);
  });
});

describe('parseTopic', () => {
  it('fixture A → topic meta + 3 cards + 1 error', () => {
    const { topic, cards, errors } = parseTopic(FIXTURE_A);
    expect(topic).toEqual({
      id: 'funciones-en-programacion',
      title: 'Funciones en Programación',
      description: 'Una función encapsula lógica reutilizable y evita repetir código.',
    });
    expect(cards).toHaveLength(3);
    expect(errors).toHaveLength(1);
    expect(cards[0]).toMatchObject({ front: '¿Qué es una función?', difficulty: 'easy' });
    expect(cards[2].difficulty).toBe('hard');
    expect(cards.map((c) => c.id)).toEqual([
      'que-es-una-funcion',
      'que-es-un-parametro',
      'que-es-el-valor-de-retorno',
    ]);
  });
  it('fixture C → image emoji / url / undefined', () => {
    const { cards } = parseTopic(FIXTURE_C);
    expect(cards[0].image).toEqual({ kind: 'emoji', value: '🐶' });
    expect(cards[1].image).toEqual({ kind: 'url', value: 'https://example.com/house.png' });
    expect(cards[2].image).toBeUndefined();
  });
  it('asset token → kind asset without prefix', () => {
    const { cards } = parseTopic('# T\n- Q: a | A: b | I: asset:temas/carta.svg');
    expect(cards[0].image).toEqual({ kind: 'asset', value: 'temas/carta.svg' });
  });
  it('dedupes card ids with -2 suffix', () => {
    const { cards } = parseTopic('# T\n- Q: dog | A: perro | E: easy\n- Q: dog | A: can | E: easy');
    expect(cards.map((c) => c.id)).toEqual(['dog', 'dog-2']);
  });
  it('never throws on garbage', () => {
    expect(() => parseTopic(null)).not.toThrow();
    expect(parseTopic(42).cards).toEqual([]);
    expect(parseTopic('').cards).toEqual([]);
  });
});

describe('parseTopic — descripción completa (spec-12 AC-1/AC-3)', () => {
  it('keeps the whole prose >400 chars with two paragraphs, no truncation', () => {
    const { topic, cards } = parseTopic(FIXTURE_LONG);
    expect(topic.description).toBe(`${LONG_DESCRIPTION}\n\nSegundo párrafo.`);
    expect(topic.description.length).toBeGreaterThan(400);
    expect(cards).toHaveLength(1);
  });
  it('contract from spec: two paragraphs preserved exactly, cards parse', () => {
    const md = `# Tema\n${LONG_DESCRIPTION}\n\nSegundo párrafo.\n\n- Q: a | A: b`;
    const { topic, cards } = parseTopic(md);
    expect(topic.description).toBe(`${LONG_DESCRIPTION}\n\nSegundo párrafo.`);
    expect(topic.description).toContain('\n\n');
    expect(cards[0]).toMatchObject({ front: 'a', back: 'b' });
  });
  it('no description → empty string', () => {
    expect(parseTopic('# Tema\n- Q: a | A: b').topic.description).toBe('');
    expect(parseTopic('- Q: a | A: b').topic.description).toBe('');
    expect(parseTopic('# Tema\n\n\n- Q: a | A: b').topic.description).toBe('');
  });
  it('headings, code blocks and horizontal rules never pollute the description', () => {
    const md = [
      '# Título',
      'Párrafo inicial.',
      '## Subtítulo intermedio',
      '```',
      'const x = 1;',
      '```',
      '---',
      '> blockquote',
      'Párrafo final.',
      '',
      '- Q: a | A: b',
    ].join('\n');
    const { topic, cards, errors } = parseTopic(md);
    expect(topic.description).toBe('Párrafo inicial.\nPárrafo final.');
    expect(topic.description).not.toMatch(/Subtítulo|const x|blockquote|---/);
    expect(cards).toHaveLength(1);
    expect(errors).toEqual([]);
  });
  it('prose after the first card is ignored for description', () => {
    const { topic, cards } = parseTopic('# T\nIntro.\n- Q: a | A: b\nTexto posterior.');
    expect(topic.description).toBe('Intro.');
    expect(cards).toHaveLength(1);
  });
  it('multiline prose keeps line breaks and trims outer blanks', () => {
    const { topic } = parseTopic('# T\n\n  Línea uno\nLínea dos\n\n\n- Q: a | A: b');
    expect(topic.description).toBe('Línea uno\nLínea dos');
  });
});
