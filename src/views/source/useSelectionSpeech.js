import { useCallback, useEffect, useRef, useState } from 'react';

const AUTO_READ_DELAY = 350;

function selectedTextIn(article) {
  if (!article || typeof window.getSelection !== 'function') return '';
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.rangeCount) return '';
  const { anchorNode, focusNode } = selection;
  if (!anchorNode || !focusNode) return '';
  if (!article.contains(anchorNode) || !article.contains(focusNode)) return '';
  return selection.toString().replace(/\s+/g, ' ').trim();
}

export default function useSelectionSpeech({ docRef, speechSupported, muted, onRead, resetKey }) {
  const [selection, setSelection] = useState('');
  const selectionTextRef = useRef('');
  const lastAutoReadRef = useRef('');
  const autoReadTimerRef = useRef(null);

  const clearAutoReadTimer = useCallback(() => {
    if (autoReadTimerRef.current) clearTimeout(autoReadTimerRef.current);
    autoReadTimerRef.current = null;
  }, []);

  useEffect(() => {
    clearAutoReadTimer();
    selectionTextRef.current = '';
    lastAutoReadRef.current = '';
    setSelection('');
  }, [clearAutoReadTimer, resetKey]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const text = selectedTextIn(docRef.current);
      if (text === selectionTextRef.current) return;
      selectionTextRef.current = text;
      setSelection(text);
      if (!text) lastAutoReadRef.current = '';
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [docRef]);

  useEffect(() => {
    if (!selection) return undefined;
    if (!speechSupported || muted) {
      lastAutoReadRef.current = selection;
      return undefined;
    }
    if (lastAutoReadRef.current === selection) return undefined;
    autoReadTimerRef.current = setTimeout(() => {
      autoReadTimerRef.current = null;
      lastAutoReadRef.current = selection;
      onRead(selection);
    }, AUTO_READ_DELAY);
    return clearAutoReadTimer;
  }, [clearAutoReadTimer, muted, onRead, selection, speechSupported]);

  const playSelection = useCallback(() => {
    if (!selection) return;
    clearAutoReadTimer();
    lastAutoReadRef.current = selection;
    onRead(selection);
  }, [clearAutoReadTimer, onRead, selection]);

  return { selection, playSelection, clearAutoReadTimer };
}
