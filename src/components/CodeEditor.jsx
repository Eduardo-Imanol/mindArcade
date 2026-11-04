import React, { useRef } from 'react';

function textOf(value) {
  return value === undefined || value === null ? '' : String(value);
}

function scheduleCaret(area, position) {
  const apply = () => {
    try {
      area.setSelectionRange(position, position);
    } catch {
      return;
    }
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(apply);
  else setTimeout(apply, 0);
}

export default function CodeEditor({
  value = '',
  onChange,
  onRun,
  label = 'Editor de código',
  describedBy,
  rows = 10,
  readOnly = false,
  className = '',
  id,
} = {}) {
  const gutterRef = useRef(null);
  const text = textOf(value);
  const lines = text.split('\n');

  const handleChange = (event) => {
    onChange?.(event.target.value, event);
  };

  const handleKeyDown = (event) => {
    if (
      event.key === 'Tab' &&
      !event.shiftKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      const area = event.currentTarget;
      const start = Number.isInteger(area.selectionStart) ? area.selectionStart : text.length;
      const end = Number.isInteger(area.selectionEnd) ? area.selectionEnd : start;
      onChange?.(`${text.slice(0, start)}  ${text.slice(end)}`, event);
      scheduleCaret(area, start + 2);
      return;
    }
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      onRun?.(text, event);
    }
  };

  const handleScroll = (event) => {
    if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop;
  };

  return (
    <div className={`code-editor ${className}`.trim()}>
      <div className="code-editor__gutter" aria-hidden="true" ref={gutterRef}>
        {lines.map((_line, index) => (
          <span key={index} className="code-editor__line">
            {index + 1}
          </span>
        ))}
      </div>
      <textarea
        id={id}
        className="code-editor__area"
        value={text}
        rows={rows}
        readOnly={readOnly}
        wrap="off"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-label={label}
        aria-describedby={describedBy}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
      />
    </div>
  );
}
