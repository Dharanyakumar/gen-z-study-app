const $ = s => document.querySelector(s);
const api = (u, m = 'GET', b) => fetch('/api' + u, { method: m, headers: { 'Content-Type': 'application/json' }, body: b && JSON.stringify(b) }).then(r => r.json());
const C = 2 * Math.PI * 130, PAL = ['#ffc857', '#ff7a6b', '#7fd8f5', '#b79cff', '#8ff0b0', '#ff9ed8', '#ffd7a0', '#9db4ff'];
let mode = 25, rem = 0, end = 0, timer = null, state = null;

const dur = () => $('#test').checked ? mode * 2 : mode * 60;
const fmt = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0');

function draw() {
  const f = 1 - rem / dur();
  $('#time').textContent = fmt(Math.ceil(rem));
  $('#prog').style.strokeDashoffset = C * (1 - f);
  $('#dot').setAttribute('transform', `rotate(${f * 360} 150 150)`);
  document.title = (timer ? fmt(Math.ceil(rem)) + ' · ' : '') + 'Converter Lab';
}
function reset() {
  clearInterval(timer); timer = null; rem = dur();
  $('#go').textContent = 'Start'; $('#label').textContent = mode === 5 ? 'Break time' : 'Ready to launch'; draw();
}
function toggle() {
  if (timer) { rem = Math.max(0, (end - Date.now()) / 1000); clearInterval(timer); timer = null; $('#go').textContent = 'Resume'; $('#label').textContent = 'Paused'; return; }
  end = Date.now() + rem * 1000; timer = setInterval(tick, 200);
  $('#go').textContent = 'Pause'; $('#label').textContent = mode === 5 ? 'Resting' : 'In orbit';
}
function tick() { rem = (end - Date.now()) / 1000; if (rem <= 0) return done(); draw(); }
async function done() {
  clearInterval(timer); timer = null; rem = 0; draw(); beep();
  if (mode > 5) { await api('/sessions', 'POST', { minutes: mode, subject: $('#subject').value.trim() }); toast(`Session complete. +${mode} XP and a new planet.`); confetti(); await load(); }
  else toast('Break over. Ready for another orbit?');
  reset();
}
function beep() {
  try { const a = new AudioContext(), o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination);
    o.frequency.value = 660; g.gain.setValueAtTime(.2, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + 1); o.start(); o.stop(a.currentTime + 1); } catch {}
}
function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); setTimeout(() => e.classList.remove('show'), 3200); }

async function load() { state = await api('/state'); render(); }
function render() {
  const s = state.stats;
  $('#lvl').textContent = s.level; $('#streak').textContent = s.streak; $('#cr').textContent = s.credits; $('#today').textContent = s.today;
  $('#xpbar').style.width = s.xp % 100 + '%'; $('#xptxt').textContent = `${s.xp % 100} / 100 XP to level ${s.level + 1}`;
  const max = Math.max(30, ...s.week.map(w => w.m));
  $('#week').innerHTML = s.week.map(w => `<div title="${w.m} min"><i style="height:${w.m / max * 100}%"></i>${w.d}</div>`).join('');
  const list = $('#notes'); list.innerHTML = '';
  if (!state.notes.length) list.innerHTML = '<li>No notes yet. Jot down what you are studying.</li>';
  state.notes.forEach(n => {
    const li = document.createElement('li'), b = document.createElement('button');
    li.textContent = n.text; b.textContent = '✕'; b.setAttribute('aria-label', 'Delete note');
    b.onclick = async () => { await api('/notes/' + n.id, 'DELETE'); load(); }; li.append(b); list.append(li);
  });
  const last = state.sessions.slice(-8);
  let svg = '<circle cx="160" cy="160" r="22" fill="#ffc857"/>';
  last.forEach((x, i) => {
    const r = 42 + i * 14, size = 4 + Math.min(x.minutes / 12, 5), sec = 8 + i * 5;
    svg += `<circle cx="160" cy="160" r="${r}" fill="none" stroke="#34376b" stroke-dasharray="2 6"/>` +
      `<g class="orb" style="animation-duration:${sec}s;animation-delay:-${i * 3}s"><circle cx="${160 + r}" cy="160" r="${size}" fill="${PAL[i % 8]}"/></g>`;
  });
  $('#sys').innerHTML = svg;
  window.renderMore && renderMore();
}

document.querySelectorAll('.modes button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.modes button').forEach(x => x.classList.remove('on')); b.classList.add('on'); mode = +b.dataset.m; reset();
});
$('#go').onclick = toggle; $('#reset').onclick = reset; $('#test').onchange = reset;
$('#nadd').onclick = async () => { const t = $('#ntext').value.trim(); if (!t) return toast('Write something first'); await api('/notes', 'POST', { text: t }); $('#ntext').value = ''; load(); };
$('#ntext').onkeydown = e => { if (e.key === 'Enter') $('#nadd').click(); };
document.onkeydown = e => { if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') { e.preventDefault(); toggle(); } };
reset(); load();
