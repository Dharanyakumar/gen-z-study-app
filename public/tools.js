/* Converter Lab: student tools + file converters (all run in the browser, nothing is uploaded) */
const dl = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
const readBuf = f => f.arrayBuffer();
const loadImg = f => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('Cannot read ' + f.name)); i.src = URL.createObjectURL(f); });
const canvasBlob = (img, type, q, maxW) => { const k = maxW && img.width > maxW ? maxW / img.width : 1, c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  const x = c.getContext('2d'); if (type === 'image/jpeg') { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); } x.drawImage(img, 0, 0, c.width, c.height); return new Promise(r => c.toBlob(r, type, q)); };
const fail = e => toast(e.message || 'Something went wrong. Try another file.');

const PANES = [
 ['conv', 'Convert', `
  <section class="card cv"><h2>Images to PDF</h2><p class="hint">Pick photos or scans. Each one becomes a page, in the order you select.</p>
   <input type="file" id="i2p" accept="image/*" multiple><div class="ctl"><button id="i2pgo" class="primary">Make PDF</button></div></section>
  <section class="card cv"><h2>Merge PDFs</h2><p class="hint">Select two or more PDFs (record + assignment, notes chapters...).</p>
   <input type="file" id="mrg" accept="application/pdf" multiple><div class="ctl"><button id="mrggo" class="primary">Merge</button></div></section>
  <section class="card cv"><h2>Compress or convert image</h2>
   <input type="file" id="ic" accept="image/*"><div class="add"><select id="icf"><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select>
   <input type="number" id="icw" placeholder="Max width px (optional)" min="50"></div>
   <label class="test">Quality <input type="range" id="icq" min=".2" max="1" step=".05" value=".7"></label><div class="ctl"><button id="icgo" class="primary">Convert</button></div><p class="res" id="icr"></p></section>
  <section class="card cv"><h2>Text to PDF</h2><textarea id="t2p" rows="5" placeholder="Paste your notes here (English letters only)"></textarea><div class="ctl"><button id="t2pgo" class="primary">Make PDF</button></div></section>
  <section class="card cv"><h2>PPT, Word and other files</h2><p class="hint">These need a server, so use a trusted online tool:</p>
   <p class="lk"><a href="https://www.ilovepdf.com/powerpoint_to_pdf" target="_blank" rel="noopener">PPT to PDF</a><a href="https://www.ilovepdf.com/word_to_pdf" target="_blank" rel="noopener">Word to PDF</a><a href="https://www.ilovepdf.com/pdf_to_word" target="_blank" rel="noopener">PDF to Word</a></p></section>`],
];
const TOOLS = `
  <section class="card cv"><h2>Attendance calculator</h2><div class="add"><input type="number" id="atot" min="0" placeholder="Total classes"><input type="number" id="aatt" min="0" placeholder="Attended"></div><p class="res" id="ares">Enter your numbers (75% rule)</p></section>
  <section class="card cv"><h2>CGPA calculator</h2><div id="cg"></div><div class="ctl"><button id="cgadd">Add semester</button></div><p class="res" id="cgres">CGPA: 0.00</p></section>
  <section class="card cv"><h2>Unit converter</h2><div class="add"><select id="uc"></select><input type="number" id="uv" value="1"></div><div class="add"><select id="ua"></select><select id="ub"></select></div><p class="res" id="ur"></p></section>
  <section class="card cv"><h2>Number systems</h2><div class="add"><input id="nv" placeholder="Value (e.g. 1011)"><select id="nb"><option value="2">Binary</option><option value="8">Octal</option><option value="10" selected>Decimal</option><option value="16">Hex</option></select></div><p class="res" id="nr"></p></section>
  <section class="card cv"><h2>Word counter</h2><textarea id="wc" rows="4" placeholder="Paste text to count"></textarea><p class="res" id="wcr">0 words · 0 characters · 0 min read</p></section>`;

const tabs = document.querySelector('.tabs'), aside = document.querySelector('aside');
PANES.forEach(([k, label, html]) => {
  const b = document.createElement('button'); b.dataset.t = k; b.textContent = label; tabs.append(b);
  const p = document.createElement('div'); p.className = 'pane'; p.dataset.tab = k; p.hidden = true; p.innerHTML = html; aside.append(p);
  b.onclick = () => { tabs.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); document.querySelectorAll('.pane').forEach(q => q.hidden = q.dataset.tab !== k); };
});
document.querySelector('.pane[data-tab="tools"]').insertAdjacentHTML('beforeend', TOOLS);

// Images -> PDF
$('#i2pgo').onclick = async () => { try {
  const fs = [...$('#i2p').files]; if (!fs.length) return toast('Choose at least one image');
  const doc = await PDFLib.PDFDocument.create();
  for (const f of fs) { const ok = /jpe?g|png/.test(f.type); const bytes = ok ? await readBuf(f) : await (await canvasBlob(await loadImg(f), 'image/jpeg', .92)).arrayBuffer();
    const im = /png/.test(f.type) ? await doc.embedPng(bytes) : await doc.embedJpg(bytes), s = Math.min(1, 595 / im.width, 842 / im.height);
    const w = im.width * s, h = im.height * s, pg = doc.addPage([595, 842]); pg.drawImage(im, { x: (595 - w) / 2, y: (842 - h) / 2, width: w, height: h }); }
  dl(new Blob([await doc.save()], { type: 'application/pdf' }), 'images.pdf'); toast('PDF ready. Check your downloads.');
} catch (e) { fail(e); } };

// Merge PDFs
$('#mrggo').onclick = async () => { try {
  const fs = [...$('#mrg').files]; if (fs.length < 2) return toast('Choose at least two PDFs');
  const out = await PDFLib.PDFDocument.create();
  for (const f of fs) { const d = await PDFLib.PDFDocument.load(await readBuf(f)); (await out.copyPages(d, d.getPageIndices())).forEach(p => out.addPage(p)); }
  dl(new Blob([await out.save()], { type: 'application/pdf' }), 'merged.pdf'); toast('Merged ' + fs.length + ' PDFs');
} catch (e) { fail(e); } };

// Compress / convert image
$('#icgo').onclick = async () => { try {
  const f = $('#ic').files[0]; if (!f) return toast('Choose an image first');
  const t = $('#icf').value, b = await canvasBlob(await loadImg(f), t, +$('#icq').value, +$('#icw').value || 0);
  $('#icr').textContent = `${(f.size / 1024).toFixed(0)} KB → ${(b.size / 1024).toFixed(0)} KB`; dl(b, f.name.replace(/\.[^.]+$/, '') + '.' + t.split('/')[1].replace('jpeg', 'jpg'));
} catch (e) { fail(e); } };

// Text -> PDF
$('#t2pgo').onclick = async () => { try {
  const txt = $('#t2p').value.trim(); if (!txt) return toast('Paste some text first');
  const doc = await PDFLib.PDFDocument.create(), font = await doc.embedFont(PDFLib.StandardFonts.Helvetica), sz = 12, W = 495;
  let pg = doc.addPage([595, 842]), y = 790;
  for (const para of txt.split('\n')) { let line = '';
    for (const w of (para || ' ').split(' ')) { const t = line ? line + ' ' + w : w;
      if (font.widthOfTextAtSize(t, sz) > W) { draw(line); line = w; } else line = t; }
    draw(line); }
  function draw(s) { if (y < 60) { pg = doc.addPage([595, 842]); y = 790; } pg.drawText(s, { x: 50, y, size: sz, font }); y -= 18; }
  dl(new Blob([await doc.save()], { type: 'application/pdf' }), 'notes.pdf');
} catch (e) { toast('Use English letters only. Tamil and emoji are not supported here.'); } };

// Attendance
const att = () => { const T = +$('#atot').value, A = +$('#aatt').value; if (!T || A > T) return $('#ares').textContent = 'Enter total classes and attended (attended ≤ total)';
  const p = A / T * 100, ok = p >= 75;
  $('#ares').textContent = ok ? `${p.toFixed(1)}%. You can miss ${Math.floor(A / .75 - T)} more class(es) and stay at 75%.` : `${p.toFixed(1)}%. Attend the next ${Math.ceil((.75 * T - A) / .25)} class(es) in a row to reach 75%.`; };
$('#atot').oninput = $('#aatt').oninput = att;

// CGPA (credit weighted)
const cgRow = () => { const r = document.createElement('div'); r.className = 'gr cgr'; r.innerHTML = '<input type="number" step=".01" min="0" max="10" placeholder="SGPA" aria-label="SGPA"><input type="number" min="1" placeholder="Credits" aria-label="Credits">'; r.oninput = cg; $('#cg').append(r); };
function cg() { let c = 0, p = 0; document.querySelectorAll('.cgr').forEach(r => { const g = +r.children[0].value, k = +r.children[1].value; c += k; p += g * k; }); $('#cgres').textContent = 'CGPA: ' + (c ? (p / c).toFixed(2) : '0.00'); }
$('#cgadd').onclick = cgRow; for (let i = 0; i < 2; i++) cgRow();

// Unit converter
const U = { Length: { m: 1, km: 1000, cm: .01, mm: .001, mile: 1609.344, ft: .3048, inch: .0254 }, Mass: { kg: 1, g: .001, mg: 1e-6, lb: .45359237, oz: .0283495 },
  Data: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 }, Speed: { 'm/s': 1, 'km/h': 1 / 3.6, mph: .44704 }, Time: { s: 1, min: 60, hr: 3600, day: 86400 }, Temperature: { '°C': 1, '°F': 1, K: 1 } };
const opts = o => Object.keys(o).map(k => `<option>${k}</option>`).join('');
$('#uc').innerHTML = opts(U);
function uFill() { $('#ua').innerHTML = $('#ub').innerHTML = opts(U[$('#uc').value]); $('#ub').selectedIndex = 1; uCalc(); }
function uCalc() { const c = $('#uc').value, v = +$('#uv').value, a = $('#ua').value, b = $('#ub').value; let r;
  if (c === 'Temperature') { const k = a === '°C' ? v + 273.15 : a === '°F' ? (v - 32) * 5 / 9 + 273.15 : v; r = b === '°C' ? k - 273.15 : b === '°F' ? (k - 273.15) * 9 / 5 + 32 : k; }
  else r = v * U[c][a] / U[c][b];
  $('#ur').textContent = `${v} ${a} = ${+r.toPrecision(8)} ${b}`; }
$('#uc').onchange = uFill; ['#uv', '#ua', '#ub'].forEach(s => $(s).oninput = $(s).onchange = uCalc); uFill();

// Number systems
$('#nv').oninput = $('#nb').onchange = () => { const s = $('#nv').value.trim(), b = +$('#nb').value, n = parseInt(s, b);
  $('#nr').textContent = !s ? '' : isNaN(n) || n.toString(b).toUpperCase() !== s.replace(/^0+(?=.)/, '').toUpperCase() ? 'Not a valid base-' + b + ' number' : `Binary ${n.toString(2)} · Octal ${n.toString(8)} · Decimal ${n} · Hex ${n.toString(16).toUpperCase()}`; };

// Word counter
$('#wc').oninput = () => { const t = $('#wc').value, w = (t.trim().match(/\S+/g) || []).length; $('#wcr').textContent = `${w} words · ${t.length} characters · ${Math.ceil(w / 200)} min read`; };
