import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CodeEditor from './CodeEditor.jsx';
import { keydown, mount, setValue } from '../test/render.jsx';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('CodeEditor (spec-21 T4)', () => {
  it('renders a labelled controlled textarea with line numbers', () => {
    const view = mount(
      <CodeEditor value="let a = 1;" label="Editor de prueba" onChange={() => {}} />
    );
    const area = view.container.querySelector('textarea');

    expect(area).toBeTruthy();
    expect(area.getAttribute('aria-label')).toBe('Editor de prueba');
    expect(area.value).toBe('let a = 1;');
    expect(view.container.querySelectorAll('.code-editor__line')).toHaveLength(1);

    view.rerender(
      <CodeEditor value={'a\nb\nc'} label="Editor de prueba" onChange={() => {}} />
    );

    const numbers = [...view.container.querySelectorAll('.code-editor__line')];
    expect(numbers).toHaveLength(3);
    expect(numbers.map((line) => line.textContent)).toEqual(['1', '2', '3']);
    view.unmount();
  });

  it('emits changes, inserts two spaces on Tab and runs with Ctrl/Cmd+Enter', () => {
    const onChange = vi.fn();
    const onRun = vi.fn();
    const view = mount(<CodeEditor value="abc" onChange={onChange} onRun={onRun} />);
    const area = view.container.querySelector('textarea');

    setValue(area, 'abcd');
    expect(onChange).toHaveBeenLastCalledWith('abcd', expect.anything());

    view.rerender(<CodeEditor value="abcd" onChange={onChange} onRun={onRun} />);
    area.setSelectionRange(2, 2);
    keydown(area, 'Tab');
    expect(onChange).toHaveBeenLastCalledWith('ab  cd', expect.anything());

    view.rerender(<CodeEditor value="ab  cd" onChange={onChange} onRun={onRun} />);
    keydown(area, 'Enter', { ctrlKey: true });
    expect(onRun).toHaveBeenLastCalledWith('ab  cd', expect.anything());

    keydown(area, 'Enter', { metaKey: true });
    expect(onRun).toHaveBeenCalledTimes(2);
    view.unmount();
  });

  it('keeps the 360px layout free of horizontal overflow', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/ui/tokens.css'), 'utf8');
    const editor = css.match(/\.code-editor\s*{([^}]*)}/s)[1];
    const area = css.match(/\.code-editor__area\s*{([^}]*)}/s)[1];

    expect(editor).toMatch(/max-width:\s*100%/);
    expect(editor).toMatch(/min-width:\s*0/);
    expect(area).toMatch(/width:\s*100%/);
    expect(area).toMatch(/min-width:\s*0/);
    expect(css).toMatch(/@media \(max-width: 479px\)[\s\S]*?\.code-editor__area/);
  });
});
