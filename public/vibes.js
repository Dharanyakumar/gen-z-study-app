/* Converter Lab: Gen Z layer. Themes, share card, weekly wrapped, mood, break-zone games, panic planner */
(() => {
const LS = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const THEMES = { Space: ['#12132f', '#1c1e47', '#34376b', '#ffc857', '#ff7a6b', '#7fd8f5', '#2a2c6e'], Sunset: ['#2b1020', '#3d1a30', '#6b2f4f', '#ffb347', '#ff5e7e', '#ffd1a1', '#5a1f45'],
  Matcha: ['#0f2018', '#183024', '#2f5a43', '#d9f27a', '#ff9f80', '#7fe0b0', '#1f4a36'], Bubblegum: ['#241238', '#341a52', '#5d3b8a', '#ff9de2', '#ffd166', '#8be9ff', '#4a2a73'] };
const applyTheme = n => { const t = THEMES[n] || THEMES.Space, s = document.documentElement.style;
  ['--ink', '--card', '--line', '--sun', '--coral', '--sky', '--glow'].forEach((v, i) => s.setProperty(v, t[i]));
  document.body.style.background = `radial-gradient(circle at 20% 0,${t[6]} 0,transparent 45%),${t[0]}`; LS.set('theme', n); document.querySelectorAll('#th button').forEach(b => b.classList.toggle('on', b.dataset.n === n)); };

const MOODS = [['😵', 'Fried'], ['😮‍💨', 'Tired'], ['😐', 'Okay'], ['🙂', 'Good'], ['🤩', 'Locked in']];
const TIPS = ['Fried is valid. Do one 5 min Break session and stop there.', 'Tired? Try one 25 min focus, then check again.', 'Okay is enough. Start with the easiest task.', 'Nice. Ride it with a 50 min deep session.', 'Locked in! Quest hunting time.'];
const FUN = ['Stretch your arms up for 20 seconds', 'Drink a full glass of water', 'Look out of the window for 1 minute', 'Text one friend a meme', 'Do 10 squats', 'Tidy your desk', 'Walk to the door and back'];
const day = d => new Date(d).toLocaleDateString('en-CA');

const tabsEl = document.querySelector('.tabs'), side = document.querySelector('aside');
const mk = (k, label, html) => { const b = document.createElement('button'); b.dataset.t = k; b.textContent = label; tabsEl.append(b);
  const p = document.createElement('div'); p.className = 'pane'; p.dataset.tab = k; p.hidden = true; p.innerHTML = html; side.append(p);
  b.onclick = () => { tabsEl.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); document.querySelectorAll('.pane').forEach(q => q.hidden = q.dataset.tab !== k); if (k === 'vibes') vibeRender(); }; };

mk('vibes', 'Vibes', `
 <section class="card cv"><h2>Pick your vibe</h2><div id="th" class="modes">${Object.keys(THEMES).map(n => `<button data-n="${n}">${n}</button>`).join('')}</div></section>
 <section class="card cv"><h2>How are you feeling?</h2><div id="mood" class="mood">${MOODS.map((m, i) => `<button data-i="${i}" aria-label="${m[1]}" title="${m[1]}">${m[0]}</button>`).join('')}</div><p class="res" id="mtip"></p><p class="hint" id="mhist"></p></section>
 <section class="card cv"><h2>Your week, wrapped</h2><div id="wrap"></div><div class="ctl"><button id="shr" class="primary">Save share card</button></div><p class="hint">Makes a picture of your level and streak. Post it, flex it.</p></section>`);

mk('chill', 'Chill', `
 <section class="card cv"><h2>Reaction test</h2><div id="rx" class="rx" role="button" tabindex="0">Tap to start</div><p class="hint" id="rxb"></p></section>
 <section class="card cv"><h2>Break roulette</h2><div class="ctl"><button id="spin" class="primary">Spin</button></div><p class="res" id="spr">Press spin for a 5 min break idea</p></section>
 <section class="card cv"><h2>Exam tomorrow? Panic planner</h2><div class="add"><input type="number" id="ph" min="1" max="16" placeholder="Hours left"><input id="ps" placeholder="Subjects, comma separated"></div><div class="ctl"><button id="pgo">Plan it</button></div><ul id="pout"></ul></section>`);

document.querySelectorAll('#th button').forEach(b => b.onclick = () => applyTheme(b.dataset.n));
applyTheme(LS.get('theme', 'Space'));

// Mood
const moodShow = () => { const m = LS.get('mood', {}), t = m[day(Date.now())];
  document.querySelectorAll('#mood button').forEach(b => b.classList.toggle('on', +b.dataset.i === t)); $('#mtip').textContent = t == null ? 'Tap one. It stays on your device.' : TIPS[t];
  $('#mhist').textContent = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); const v = m[day(d)]; return v == null ? '·' : MOODS[v][0]; }).join(' '); };
document.querySelectorAll('#mood button').forEach(b => b.onclick = () => { const m = LS.get('mood', {}); m[day(Date.now())] = +b.dataset.i; LS.set('mood', m); moodShow(); });

// Wrapped
let W = null;
function vibeRender() { moodShow(); const S = (state && state.sessions || []).filter(x => Date.now() - x.at < 6048e5), box = $('#wrap');
  if (!S.length) { W = null; return box.innerHTML = '<p class="hint">No sessions this week yet. Finish one focus session and your wrapped appears.</p>'; }
  const min = S.reduce((a, x) => a + x.minutes, 0), by = {}; S.forEach(x => by[x.subject || 'General'] = (by[x.subject || 'General'] || 0) + x.minutes);
  const top = Object.entries(by).sort((a, b) => b[1] - a[1])[0], best = [...state.stats.week].sort((a, b) => b.m - a.m)[0];
  const hrs = S.map(x => new Date(x.at).getHours()), late = hrs.filter(h => h >= 22 || h < 5).length, early = hrs.filter(h => h >= 5 && h < 11).length;
  const title = late > S.length / 2 ? 'Night Owl 🦉' : early > S.length / 2 ? 'Early Bird 🐦' : 'Daylight Grinder ☀️';
  W = { min, n: S.length, top: top[0], best: best.d, title };
  box.innerHTML = `<div class="wr"><b>${min}</b><span>minutes focused</span></div><div class="wr"><b>${top[0]}</b><span>your top subject (${top[1]} min)</span></div><div class="wr"><b>${best.d}</b><span>your best day</span></div><div class="wr"><b>${title}</b><span>your study personality</span></div>`; }

$('#shr').onclick = async () => { const s = state.stats, cs = getComputedStyle(document.documentElement), v = n => cs.getPropertyValue(n).trim();
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 1080, 1350);
  g.addColorStop(0, v('--glow')); g.addColorStop(1, v('--ink')); x.fillStyle = g; x.fillRect(0, 0, 1080, 1350);
  x.fillStyle = v('--sun'); x.beginPath(); x.arc(900, 220, 90, 0, 7); x.fill(); x.strokeStyle = v('--line'); x.lineWidth = 4; [160, 260, 360].forEach(r => { x.beginPath(); x.arc(900, 220, r, 0, 7); x.stroke(); });
  const T = (t, y, sz, col, w = 800) => { x.fillStyle = col; x.font = `${w} ${sz}px 'Bricolage Grotesque',system-ui,sans-serif`; x.fillText(t, 90, y); };
  T('Converter Lab', 140, 54, v('--text')); T('Level ' + s.level, 560, 220, v('--sun')); T(s.streak + ' day streak 🔥', 700, 80, v('--coral'));
  T(s.xp + ' XP earned', 800, 60, v('--text'), 600); if (W) { T(W.min + ' min focused this week', 890, 52, v('--sky'), 600); T(W.title, 970, 52, v('--text'), 600); }
  T('Convert your time into progress', 1250, 44, v('--sky'), 600);
  const b = await new Promise(r => c.toBlob(r, 'image/png')), f = new File([b], 'my-study-card.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [f] })) { try { return await navigator.share({ files: [f] }); } catch {} } dl(b, 'my-study-card.png'); toast('Card saved. Go flex it.'); };

// Reaction test
let rxT = 0, rxW = 0, rs = 'idle'; const rx = $('#rx'), best = () => $('#rxb').textContent = LS.get('rxbest', 0) ? 'Best: ' + LS.get('rxbest', 0) + ' ms' : '';
const rxGo = () => { if (rs === 'idle') { rs = 'wait'; rx.className = 'rx wait'; rx.textContent = 'Wait for green...'; rxW = setTimeout(() => { rs = 'go'; rx.className = 'rx go'; rx.textContent = 'TAP!'; rxT = performance.now(); }, 1200 + Math.random() * 2500); }
  else if (rs === 'wait') { clearTimeout(rxW); rs = 'idle'; rx.className = 'rx'; rx.textContent = 'Too early. Tap to retry'; }
  else { const t = Math.round(performance.now() - rxT), bb = LS.get('rxbest', 0); if (!bb || t < bb) LS.set('rxbest', t); rs = 'idle'; rx.className = 'rx'; rx.textContent = t + ' ms. Tap to go again'; best(); } };
rx.onclick = rxGo; rx.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); rxGo(); } }; best();

// Break roulette
$('#spin').onclick = () => { let n = 0; const t = setInterval(() => { $('#spr').textContent = FUN[Math.floor(Math.random() * FUN.length)]; if (++n > 12) clearInterval(t); }, 90); };

// Panic planner
$('#pgo').onclick = () => { const h = +$('#ph').value, subs = $('#ps').value.split(',').map(s => s.trim()).filter(Boolean);
  if (!h || !subs.length) return toast('Add hours left and at least one subject');
  const each = Math.max(10, Math.floor(h * 60 * .85 / subs.length / 5) * 5);
  $('#pout').innerHTML = subs.map(s => `<li>${esc(s)}: ${each} min</li>`).join('') + `<li class="hint">Then 5 min break after every ${Math.min(each, 50)} min. Sleep counts as revision too.</li>`; };
})();
