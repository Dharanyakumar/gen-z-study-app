const express = require('express'), fs = require('fs'), path = require('path');
const app = express(), FILE = path.join(__dirname, 'data', 'db.json');
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const load = () => { try { return JSON.parse(fs.readFileSync(FILE)); } catch { return { sessions: [], notes: [] }; } };
const save = d => { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(d, null, 1)); };
const day = t => new Date(t).toLocaleDateString('en-CA');
const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

function stats(s) {
  const xp = s.reduce((a, x) => a + x.xp, 0), days = new Set(s.map(x => day(x.at)));
  let streak = 0, d = new Date();
  if (!days.has(day(d))) d.setDate(d.getDate() - 1);
  while (days.has(day(d))) { streak++; d.setDate(d.getDate() - 1); }
  const week = [...Array(7)].map((_, i) => {
    const t = new Date(); t.setDate(t.getDate() - 6 + i);
    return { d: t.toLocaleDateString('en', { weekday: 'short' }), m: s.filter(x => day(x.at) === day(t)).reduce((a, x) => a + x.minutes, 0) };
  });
  return { xp, level: Math.floor(xp / 100) + 1, streak, credits: s.length * 10, today: s.filter(x => day(x.at) === day(Date.now())).length, week };
}

app.get('/api/state', (q, r) => { const d = load(); r.json({ ...d, stats: stats(d.sessions) }); });
app.post('/api/sessions', (q, r) => {
  const d = load(), m = Math.min(Math.max(+q.body.minutes || 25, 1), 120);
  d.sessions.push({ id: id(), minutes: m, xp: m, subject: String(q.body.subject || '').slice(0, 30), at: Date.now() }); save(d); r.json({ ok: true });
});
app.post('/api/notes', (q, r) => {
  const d = load(), text = String(q.body.text || '').trim().slice(0, 500);
  if (!text) return r.status(400).json({ error: 'Write something first' });
  d.notes.unshift({ id: id(), text }); save(d); r.json({ ok: true });
});
app.delete('/api/notes/:id', (q, r) => { const d = load(); d.notes = d.notes.filter(n => n.id !== q.params.id); save(d); r.json({ ok: true }); });

const F = { tasks: ['text', 'done', 'sub'], exams: ['name', 'date'], cards: ['q', 'a'] };
const pick = (c, b) => Object.fromEntries(F[c].filter(k => k in b).map(k => [k, typeof b[k] === 'boolean' ? b[k] : String(b[k]).slice(0, 300)]));
for (const c in F) {
  app.post('/api/' + c, (q, r) => { const d = load(); (d[c] = d[c] || []).unshift({ id: id(), ...pick(c, q.body) }); save(d); r.json({ ok: true }); });
  app.patch('/api/' + c + '/:id', (q, r) => { const d = load(), x = (d[c] || []).find(i => i.id === q.params.id); if (x) Object.assign(x, pick(c, q.body)); save(d); r.json({ ok: true }); });
  app.delete('/api/' + c + '/:id', (q, r) => { const d = load(); d[c] = (d[c] || []).filter(i => i.id !== q.params.id); save(d); r.json({ ok: true }); });
}
app.listen(process.env.PORT || 3000, () => console.log('Converter Lab running at http://localhost:' + (process.env.PORT || 3000)));
