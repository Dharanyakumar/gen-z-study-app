/* Converter Lab: focus + study-problem solvers. Zen mode, distraction tracking, parking lot, breathing, revision planner */
(() => {
const LS = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const day = d => new Date(d).toLocaleDateString('en-CA'), today = () => day(Date.now());
const Q = ['Small steps done daily beat big plans done never.', 'Your future self is watching this session. Make them proud.', 'You do not need motivation. You need a 5 minute start.', 'One focused hour is worth three distracted ones.', 'Tired is fine. Quitting is optional. Rest, then return.', 'Every planet in your sky was one session.', 'Phone down. Brain on. Let us cook.'];
document.querySelector('header').insertAdjacentHTML('afterend', `<p class="qt">${Q[new Date().getDate() % Q.length]}</p>`);

const tabsEl = document.querySelector('.tabs'), side = document.querySelector('aside');
const mk = (k, label, html) => { const b = document.createElement('button'); b.dataset.t = k; b.textContent = label; tabsEl.append(b);
  const p = document.createElement('div'); p.className = 'pane'; p.dataset.tab = k; p.hidden = true; p.innerHTML = html; side.append(p);
  b.onclick = () => { tabsEl.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); document.querySelectorAll('.pane').forEach(q => q.hidden = q.dataset.tab !== k); if (k === 'fix') rvRender(); if (k === 'focus') dsp(); }; };

const PROB = { 'Cannot focus': ['Put the phone in another room, not just on silent', 'Write ONE goal for the session before you press Start', 'Use Zen mode in the Focus tab so nothing else is on screen'],
  'Forget what I read': ['Close the book and write what you remember (active recall)', 'Explain it aloud like you are teaching a friend', 'Add the topic to the Revision planner below'],
  'Too much syllabus': ['List every unit and mark it easy, medium or scary', 'Finish the easy ones first for quick wins', 'Use the Panic planner in the Chill tab to split your time'],
  'Exam tension': ['Do 4 rounds of box breathing in the Focus tab', 'Solve one previous question instead of reading new theory', 'Sleep 7 hours. Memory gets saved while you sleep'],
  'Sleepy': ['Wash your face and study standing for 10 minutes', 'Keep hard topics for fresh hours, light topics for night', 'Drink water and skip heavy meals before studying'],
  'Phone addiction': ['Turn on Do Not Disturb and keep the phone face down, far away', 'Urge to check something? Write it in the Parking lot', 'Reward yourself with phone time only after a finished session'],
  'Boring subject': ['Turn each heading into a question and answer it', 'Beat yesterday: try to study 5 more minutes', 'Study with a friend on a call, both on mute'] };

mk('focus', 'Focus', `
 <section class="card cv"><h2>Focus shield</h2><p class="hint">Browsers cannot block other apps, so this keeps you honest. Leave the tab during a focus session and it is counted.</p>
  <div class="ctl"><button id="zen2" class="primary">Enter Zen mode</button></div><p class="res" id="dct"></p>
  <p class="lk"><a href="https://www.youtube.com/watch?v=jfKfPfyJRdk" target="_blank" rel="noopener">Lofi radio</a></p></section>
 <section class="card cv"><h2>Cannot start? Do just 2 minutes</h2><div class="ctl"><button id="two">Start 2 min</button></div><p class="res" id="twr"></p></section>
 <section class="card cv"><h2>Brain parking lot</h2><p class="hint">Random thought mid-study? Park it here and keep going. Check it after.</p><div class="add"><input id="pk" maxlength="80" placeholder="Check score, reply to Ravi..."><button id="pka">Park</button></div><ul id="pkl"></ul></section>
 <section class="card cv"><h2>Calm down</h2><div class="bz" id="bz"></div><p class="res" id="bzt">Box breathing: 4 in, 4 hold, 4 out, 4 hold</p><div class="ctl"><button id="bzb">Start</button></div></section>`);

mk('fix', 'Fix it', `
 <section class="card cv"><h2>What is going wrong?</h2><div class="modes" id="pb">${Object.keys(PROB).map(k => `<button>${k}</button>`).join('')}</div><ul id="fixr"></ul></section>
 <section class="card cv"><h2>Revision planner</h2><p class="hint">Add what you studied today. It comes back after 1, 3, 7 and 21 days so it stays in your head.</p>
  <div class="add"><input id="rt" maxlength="60" placeholder="Topic (e.g. Trees in DS)"><button id="rta">Add</button></div><ul id="rl"></ul></section>`);

// Problem solver
document.querySelectorAll('#pb button').forEach(b => b.onclick = () => { document.querySelectorAll('#pb button').forEach(x => x.classList.toggle('on', x === b));
  $('#fixr').innerHTML = PROB[b.textContent].map(s => `<li>${s}</li>`).join(''); });

// Distraction counter
const dsp = () => { const n = LS.get('dst', {})[today()] || 0; $('#dct').textContent = n ? `Tab switches during focus today: ${n}. Beat it tomorrow.` : 'Zero tab switches today. Clean focus.'; };
document.addEventListener('visibilitychange', () => { if (!timer || mode <= 5) return;
  if (document.hidden) { const d = LS.get('dst', {}); d[today()] = (d[today()] || 0) + 1; LS.set('dst', d); dsp(); }
  else toast(`Welcome back. Switch #${LS.get('dst', {})[today()]} today. Stay in orbit.`); });

// Zen mode
const zx = document.createElement('button'); zx.className = 'zx'; zx.textContent = 'Exit Zen'; zx.hidden = true; document.body.append(zx);
const zen = on => { document.body.classList.toggle('zen', on); zx.hidden = !on; if (on) document.documentElement.requestFullscreen?.().catch(() => {}); else if (document.fullscreenElement) document.exitFullscreen(); };
zx.onclick = () => zen(false); $('#zen2').onclick = () => zen(true);
const zb = document.createElement('button'); zb.textContent = 'Zen mode'; zb.onclick = () => zen(true); document.querySelector('.stage .ctl').append(zb);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('zen')) zen(false); });
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && document.body.classList.contains('zen')) zen(false); });

// 2 minute start
let tw = 0; $('#two').onclick = () => { clearInterval(tw); let s = 120; const f = () => $('#twr').textContent = s > 0 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}. Just open the book and read.` : 'Two minutes done. Already started, so keep going.'; f();
  tw = setInterval(() => { s--; f(); if (s <= 0) { clearInterval(tw); toast('Nice! You started. Keep going.'); } }, 1000); };

// Parking lot
const pkr = () => { const L = LS.get('park', []); $('#pkl').innerHTML = L.map((t, i) => `<li>${esc(t)}<button data-pk="${i}" aria-label="Remove">✕</button></li>`).join('') || '<li class="hint">Nothing parked. Good.</li>'; };
$('#pka').onclick = () => { const v = $('#pk').value.trim(); if (!v) return toast('Type the thought first'); LS.set('park', [v, ...LS.get('park', [])]); $('#pk').value = ''; pkr(); };
$('#pk').onkeydown = e => { if (e.key === 'Enter') $('#pka').click(); };
$('#pkl').onclick = e => { const b = e.target.closest('[data-pk]'); if (b) { const L = LS.get('park', []); L.splice(+b.dataset.pk, 1); LS.set('park', L); pkr(); } }; pkr();

// Box breathing
let bt = 0, bp = 0; const PH = ['Breathe in', 'Hold', 'Breathe out', 'Hold'];
$('#bzb').onclick = () => { if (bt) { clearInterval(bt); bt = 0; $('#bz').className = 'bz'; $('#bzb').textContent = 'Start'; $('#bzt').textContent = 'Box breathing: 4 in, 4 hold, 4 out, 4 hold'; return; }
  $('#bzb').textContent = 'Stop'; bp = 0; const step = () => { $('#bzt').textContent = PH[bp % 4] + '...'; $('#bz').className = 'bz ' + (bp % 4 === 0 || bp % 4 === 1 ? 'big' : ''); bp++; }; step(); bt = setInterval(step, 4000); };

// Revision planner (day 1, 3, 7, 21)
const IV = [1, 3, 7, 21], due = (r, i) => { const d = new Date(r.at + 'T00:00'); d.setDate(d.getDate() + IV[i]); return day(d); };
function rvRender() { const R = LS.get('rev', []), t = today(); let h = '', later = 0;
  R.forEach(r => IV.forEach((v, i) => { if (r.done.includes(i)) return; if (due(r, i) <= t) h += `<li><span>${esc(r.t)}<small> revise day ${v}</small></span><button data-rv="${r.id}:${i}">Done</button></li>`; else later++; }));
  $('#rl').innerHTML = (h || '<li class="hint">Nothing due today.</li>') + (later ? `<li class="hint">${later} revision(s) coming up later.</li>` : ''); }
$('#rta').onclick = () => { const v = $('#rt').value.trim(); if (!v) return toast('Add the topic name'); LS.set('rev', [...LS.get('rev', []), { id: Date.now().toString(36), t: v, at: today(), done: [] }]); $('#rt').value = ''; rvRender(); toast('Added. First revision is tomorrow.'); };
$('#rl').onclick = e => { const b = e.target.closest('[data-rv]'); if (!b) return; const [id, i] = b.dataset.rv.split(':'), R = LS.get('rev', []), r = R.find(x => x.id === id); if (r) { r.done.push(+i); LS.set('rev', R); rvRender(); toast('Revised. Memory +1'); } };
})();
