const $ = id => document.getElementById(id);
let yt, ready = false, lines = [], idx = -1, vid = '', errors = 0, typed = 0, startT = 0, done = 0;
const DEMO = {
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  lyrics: "[0:18] We're no strangers to love\n[0:22] You know the rules and so do I\n[0:27] A full commitment's what I'm thinking of\n[0:31] You wouldn't get this from any other guy"
};

function parseId(u) { const m = u.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/); return m && m[1]; }
function parseLyrics(t) {
  return t.split('\n').map(s => s.trim()).filter(Boolean).map(s => {
    const m = s.match(/^\[?(\d+):(\d{1,2})\]?\s+(.*)$/);
    return m ? { t: +m[1] * 60 + +m[2], text: m[3] } : { t: null, text: s };
  });
}
function fmt(s) { s = Math.max(0, s | 0); return String(s / 60 | 0).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }

window.onYouTubeIframeAPIReady = () => { ready = true; if (vid) mount(); };
function mount() {
  $('player-ph').style.display = 'none';
  if (yt && yt.loadVideoById) { yt.loadVideoById(vid); return; }
  yt = new YT.Player('player', {
    videoId: vid,
    playerVars: { playsinline: 1, autoplay: 1, rel: 0, cc_load_policy: 1 },
    events: { onStateChange: e => { $('bPlay').textContent = e.data === 1 ? '❚❚' : '▶'; } }
  });
}

function show(i, seek) {
  if (i < 0 || i >= lines.length) return;
  idx = i;
  $('wave').classList.add('hide');
  $('input').value = '';
  $('echo').textContent = lines[i].text;
  $('sLine').textContent = `${i + 1}/${lines.length}`;
  $('bar').style.width = ((i + 1) / lines.length * 100) + '%';
  render('');
  $('input').focus();
  if (seek && yt && yt.seekTo && lines[i].t != null) yt.seekTo(lines[i].t, true);
}
const norm = s => {
  if (!$('punct').checked) s = s.replace(/[^\p{L}\p{N}\s]/gu, '');
  return $('case').checked ? s : s.toLowerCase();
};
function render(v) {
  const L = lines[idx].text, a = [...L], b = [...v];
  let h = '';
  a.forEach((c, i) => {
    const e = c.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    if (i < b.length) h += `<span class="${norm(b[i]) === norm(c) ? 'ok' : 'bad'}">${e}</span>`;
    else h += i === b.length ? `<span class="cur">${e}</span>` : e;
  });
  $('line').innerHTML = h;
}
function stats() {
  const mins = Math.max(Date.now() - startT, 3000) / 60000;
  $('sWpm').textContent = startT && mins > 0 ? Math.round(done / 5 / mins) : 0;
  $('sAcc').textContent = (typed ? Math.round((typed - errors) / typed * 100) : 100) + '%';
}

$('input').addEventListener('input', e => {
  if (idx < 0 || $('mode').value === 'read') return;
  if (!startT) startT = Date.now();
  const v = e.target.value, L = [...lines[idx].text], b = [...v];
  if (e.inputType && e.inputType.startsWith('insert')) {
    typed++;
    const k = b.length - 1;
    if (norm(b[k] || '') !== norm(L[k] || '')) errors++; else done++;
  }
  render(v); stats();
  if (b.length >= L.length && b.every((c, i) => norm(c) === norm(L[i] || ''))) {
    if (idx + 1 < lines.length) show(idx + 1); else $('echo').textContent = 'Finished! 🎉';
  }
});
$('bNext').onclick = () => show(Math.min(idx + 1, lines.length - 1), true);
$('bPrev').onclick = () => show(Math.max(idx - 1, 0), true);
$('bRestart').onclick = () => { if (!lines.length) return; errors = typed = done = 0; startT = 0; stats(); show(0, true); if (yt && yt.seekTo) yt.seekTo(lines[0].t || 0, true); };
$('bPlay').onclick = () => { if (!yt || !yt.getPlayerState) return; yt.getPlayerState() === 1 ? yt.pauseVideo() : yt.playVideo(); };
$('rate').onchange = e => yt && yt.setPlaybackRate && yt.setPlaybackRate(+e.target.value);
$('punct').onchange = $('case').onchange = () => idx >= 0 && render($('input').value);
$('bTheme').onclick = () => { const d = document.documentElement; d.dataset.theme = d.dataset.theme === 'dark' ? '' : 'dark'; };
$('bVideo').onclick = () => $('dlg').showModal();
$('demo').onclick = () => { $('url').value = DEMO.url; $('lyrics').value = DEMO.lyrics; };
$('url').oninput = () => $('url').setCustomValidity('');
$('form').addEventListener('submit', e => {
  if (e.submitter && e.submitter.value !== 'ok') return;
  const id = parseId($('url').value);
  if (!id) { e.preventDefault(); $('url').setCustomValidity('Invalid YouTube link'); $('url').reportValidity(); return; }
  lines = parseLyrics($('lyrics').value); vid = id; errors = typed = done = 0; startT = 0; stats();
  if (ready) mount();
  show(0, true);
});
setInterval(() => {
  if (yt && yt.getCurrentTime && vid) $('time').textContent = fmt(yt.getCurrentTime()) + ' / ' + fmt(yt.getDuration() || 0);
}, 500);
