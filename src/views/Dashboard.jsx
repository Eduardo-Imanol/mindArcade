import React, { useMemo, useState } from 'react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { parseMarkdown } from '../core/parser/parser.js';
import { createStore } from '../core/storage/store.js';

const DEMO = `# Go pointers
- Q: What does \`&x\` return? | A: address of x | E: easy
- Q: What does \`*p\` do? | A: dereferences p | E: hard
- Q: Zero value of a pointer? | A: nil
- BROKEN LINE WITHOUT QA MARKERS`;

export default function Dashboard() {
  const [notes, setNotes] = useState(DEMO);
  const [profile, setProfile] = useState(() => createStore().load());
  const parsed = useMemo(() => parseMarkdown(notes), [notes]);
  return (
    <main className="sepect-bg" style={{ minHeight: '100vh', width: '100%', maxWidth: '100%', padding: '16px clamp(16px, 4vw, 32px)' }}>
      <h1 className="neon" style={{ fontSize: 28 }}>Sepect — Arcade Learning</h1>
      <p>XP: {profile.xp} · Streak: {profile.streak}</p>
      <Card title="Load notes">
        <label htmlFor="notes">Markdown notes</label>
        <textarea
          id="notes"
          rows={7}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ width: '100%', background: '#0f051d', color: '#f1f1f1', marginTop: 8 }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button onClick={() => {
            const store = createStore();
            const next = { ...profile, xp: profile.xp + parsed.questions.length * 10 };
            store.save(next);
            setProfile(store.load());
          }}>Parse & earn XP</Button>
        </div>
        {parsed.questions.length === 0 && <p>No questions found</p>}
      </Card>
      <Card title={`Preview (${parsed.questions.length}) · errors ${parsed.errors.length}`}>
        <ul>
          {parsed.questions.map((q) => (
            <li key={q.id}>{q.prompt} — <em>{q.difficulty}</em></li>
          ))}
        </ul>
      </Card>
      <Card title="Due today">
        <p>{parsed.questions.length > 0 ? `${parsed.questions.length} cards due` : 'Nothing due'}</p>
      </Card>
    </main>
  );
}
