const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let ci = 0, flip = false, ac, src, gain;
const G = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'RA': 0 };

document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  document.querySelectorAll('.pane').forEach(p => p.hidden = p.dataset.tab !== b.dataset.t);
});
const add = async (c, body) => { await api('/' + c, 'POST', body); load(); };

function renderMore() {
  const s = state.stats, T = state.tasks || [], E = state.exams || [], K = state.cards || [], S = state.sessions;
  const dt = T.filter(t => t.done).length;
  $('#quests').innerHTML = [['Finish 2 focus sessions', s.today, 2], ['Study 60 minutes', s.week[6].m, 60], ['Complete 3 tasks', dt, 3]]
    .map(([n, v, g]) => `<li class="${v >= g ? 'ok' : ''}"><span>${n}</span><em>${Math.min(v, g)}/${g}</em><div class="bar"><i style="width:${Math.min(v / g, 1) * 100}%"></i></div></li>`).join('');
  $('#tbar').style.width = (T.length ? dt / T.length * 100 : 0) + '%';
  $('#tasks').innerHTML = T.map(t => `<li class="${t.done ? 'dn' : ''}"><label><input type="checkbox" data-tg="${t.id}" ${t.done ? 'checked' : ''}>${esc(t.text)}${t.sub ? `<em>${esc(t.sub)}</em>` : ''}</label><button data-del="tasks:${t.id}" aria-label="Delete task">✕</button></li>`).join('') || '<li>No tasks yet. Add your first one above.</li>';
  const today = new Date().setHours(0, 0, 0, 0);
  $('#exams').innerHTML = E.filter(e => e.date).sort((a, b) => a.date.localeCompare(b.date)).map(e => {
    const d = Math.ceil((new Date(e.date + 'T00:00') - today) / 864e5);
    return `<li><div class="ex ${d <= 7 ? 'soon' : ''}"><b>${d < 0 ? '–' : d}</b><div>${esc(e.name)}<small>${d < 0 ? 'Finished' : d === 0 ? 'Today. All the best!' : d + ' days left'}</small></div></div><button data-del="exams:${e.id}" aria-label="Delete exam">✕</button></li>`;
  }).join('') || '<li>No exams yet. Add one to start the countdown.</li>';
  if (ci >= K.length) ci = 0;
  $('#card').innerHTML = K.length ? `<div class="fc ${flip ? 'flip' : ''}" id="fc"><div>${esc(K[ci].q)}</div><div>${esc(K[ci].a)}</div></div><p class="hint">Card ${ci + 1} of ${K.length}. Tap to flip. <a href="#" data-del="cards:${K[ci].id}" style="color:var(--coral)">Delete</a></p>` : '<p class="hint">No cards yet. Add a question and answer below.</p>';
  const by = {}; S.forEach(x => by[x.subject || 'General'] = (by[x.subject || 'General'] || 0) + x.minutes);
  const mx = Math.max(1, ...Object.values(by));
  $('#subs').innerHTML = Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="sub">${esc(k)} · ${v} min<div class="bar"><i style="width:${v / mx * 100}%"></i></div></div>`).join('') || '<p class="hint">Add a subject before a session to see it here.</p>';
  const B = [['🚀', 'First launch', S.length >= 1], ['🔥', '3-day streak', s.streak >= 3], ['⭐', 'Level 5', s.level >= 5], ['🪐', '10 sessions', S.length >= 10], ['🧠', 'Deep dive 50 min', S.some(x => x.minutes >= 50)], ['🗂️', '5 flashcards', K.length >= 5], ['📅', 'Exam planned', E.length > 0], ['✅', '5 tasks done', dt >= 5]];
  $('#badges').innerHTML = B.map(([i, n, ok]) => `<div class="bd ${ok ? 'on' : ''}"><b>${i}</b>${n}</div>`).join('');
}

document.addEventListener('click', async e => {
  const d = e.target.closest('[data-del]');
  if (d) { e.preventDefault(); const [c, id] = d.dataset.del.split(':'); await api('/' + c + '/' + id, 'DELETE'); load(); }
  if (e.target.closest('#fc')) { flip = !flip; renderMore(); }
});
document.addEventListener('change', async e => { const id = e.target.dataset.tg; if (id) { await api('/tasks/' + id, 'PATCH', { done: e.target.checked }); load(); } });
const need = (v, m) => v ? true : (toast(m), false);
$('#tadd').onclick = () => { const t = $('#ttext').value.trim(); if (need(t, 'Write the task first')) { add('tasks', { text: t, sub: $('#tsub').value.trim(), done: false }); $('#ttext').value = ''; } };
$('#eadd').onclick = () => { const n = $('#ename').value.trim(), d = $('#edate').value; if (need(n && d, 'Add the exam name and date')) { add('exams', { name: n, date: d }); $('#ename').value = ''; } };
$('#cadd').onclick = () => { const q = $('#cq').value.trim(), a = $('#ca').value.trim(); if (need(q && a, 'Add both question and answer')) { add('cards', { q, a }); $('#cq').value = $('#ca').value = ''; } };
$('#cnext').onclick = () => { ci++; flip = false; renderMore(); };
$('#cprev').onclick = () => { ci = Math.max(0, ci - 1); flip = false; renderMore(); };
$('#cshuf').onclick = () => { ci = Math.floor(Math.random() * (state.cards || []).length); flip = false; renderMore(); };

function confetti() {
  for (let i = 0; i < 40; i++) { const p = document.createElement('i'); p.className = 'cf';
    p.style.cssText = `left:${Math.random() * 100}vw;background:${PAL[i % 8]};animation-delay:${Math.random() * .4}s;--x:${Math.random() * 200 - 100}px`;
    document.body.append(p); setTimeout(() => p.remove(), 2800); }
}

document.querySelectorAll('#amb button').forEach(b => b.onclick = () => {
  const k = b.dataset.k; if (src) { src.stop(); src = null; }
  document.querySelectorAll('#amb button').forEach(x => x.classList.toggle('on', x === b)); if (k === 'off') return;
  ac = ac || new AudioContext(); const n = ac.sampleRate * 2, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0); let l = 0;
  for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; d[i] = k === 'rain' ? w * .5 : (l = (l + .02 * w) / 1.02) * 3.5; }
  src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
  const f = ac.createBiquadFilter(); f.type = k === 'rain' ? 'highpass' : 'lowpass'; f.frequency.value = { rain: 1500, wind: 500, brown: 900 }[k];
  gain = ac.createGain(); gain.gain.value = +$('#vol').value; src.connect(f); f.connect(gain); gain.connect(ac.destination); src.start();
});
$('#vol').oninput = () => gain && (gain.gain.value = +$('#vol').value);

function gpRow() {
  const r = document.createElement('div'); r.className = 'gr';
  r.innerHTML = `<input type="number" min="1" max="10" placeholder="Credits" aria-label="Credits"><select aria-label="Grade">${Object.keys(G).map(g => `<option>${g}</option>`).join('')}</select>`;
  r.oninput = sgpa; $('#gp').append(r);
}
function sgpa() {
  let c = 0, p = 0; document.querySelectorAll('.gr').forEach(r => { const cr = +r.children[0].value; c += cr; p += cr * G[r.children[1].value]; });
  $('#sgpa').textContent = 'SGPA: ' + (c ? (p / c).toFixed(2) : '0.00');
}
$('#gadd').onclick = gpRow; for (let i = 0; i < 5; i++) gpRow();
