// Leonida Trophy Guide — tracker logic. Plain ES module, no dependencies.
// Loads app/data/trophies.json, renders Cards / Table / Roadmap views, and
// keeps checklist + notes in localStorage only (nothing leaves the browser).
const STORE_KEY = 'gta6-guide-r2c-v1';
const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const KIND_LABELS = {
  story: 'Story', stranger: 'Strangers', activity: 'Activities',
  collectible: 'Collectibles', combat: 'Combat & heists', money: 'Money',
  completion: '100% completion', misc: 'Misc', platinum: 'Platinum',
};

const params = new URLSearchParams(location.search);
const seedCount = Math.max(0, Number(params.get('seed')) || 0);

let trophies = [];
let meta = {};
let state = loadState();
let currentView = params.get('view') || 'cards';
let sortKey = 'name';
let sortDir = 1;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    return { earned: saved.earned || {}, notes: saved.notes || {} };
  } catch {
    return { earned: {}, notes: {} };
  }
}
function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}
function stars(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function displayName(t) {
  const showHidden = document.getElementById('spoilerToggle').checked;
  if (t.hidden && !showHidden) return `Hidden trophy · ${KIND_LABELS[t.kind] || t.kind}`;
  return t.name;
}
function isEarned(t) { return !!state.earned[t.id]; }
function toggleEarned(id) {
  state.earned[id] ? delete state.earned[id] : (state.earned[id] = true);
  saveState();
  renderAll();
}

// --- filters -------------------------------------------------------------
function filtered() {
  const q = document.getElementById('search').value.trim().toLowerCase();
  const kind = document.getElementById('kindFilter').value;
  const grade = document.getElementById('gradeFilter').value;
  const earnedOnly = document.getElementById('earnedOnly').checked;
  return trophies.filter((t) => {
    if (kind && t.kind !== kind) return false;
    if (grade && t.grade !== grade) return false;
    if (earnedOnly && !isEarned(t)) return false;
    if (q && !(t.name + ' ' + t.desc + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
}

// --- hero: platinum ring + per-grade bars --------------------------------
function renderHero() {
  const earned = trophies.filter(isEarned).length;
  const pct = Math.round((earned / trophies.length) * 100);
  document.getElementById('pctBig').textContent = pct + '%';
  document.getElementById('countBig').textContent = `${earned} / ${trophies.length}`;
  document.getElementById('ringFg').style.strokeDashoffset = String(326.7 * (1 - earned / trophies.length));
  const wrap = document.getElementById('gradeBars');
  wrap.innerHTML = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const total = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t) => t.grade === g && isEarned(t)).length;
    const p = total ? Math.round((got / total) * 100) : 0;
    return `<div class="grade-bar"><small><span>${g[0].toUpperCase() + g.slice(1)}</span><span>${got}/${total} · ${p}%</span></small><div class="track"><span class="fill ${g}" style="width:${p}%"></span></div></div>`;
  }).join('');
}

// --- "Next up" planner: missable first, then easiest unearned ------------
function renderPlanner() {
  const left = trophies.filter((t) => !isEarned(t) && t.grade !== 'platinum');
  const missable = left.find((t) => t.missable);
  const picks = [];
  if (missable) picks.push({ t: missable, why: 'Do first — possibly missable' });
  const rest = left.filter((t) => t !== missable)
    .sort((a, b) => a.diff - b.diff || a.rarity - b.rarity);
  for (const t of rest) {
    if (picks.length >= 3) break;
    picks.push({ t, why: t.hidden ? 'Hidden story trophy — spoiler-safe pick' : `Easiest left · ${t.diff}/5 · ${t.time}` });
  }
  document.getElementById('plannerCards').innerHTML = picks.map(({ t, why }) => `
    <button type="button" class="planner-card" data-open="${t.id}">
      <span class="why">${esc(why)}</span>
      <strong>${esc(displayName(t))}</strong>
      <span>${esc(t.desc)} · ${t.rarity}% of players</span>
    </button>`).join('') || '<p class="empty">All trophies earned — Leonida Legend. 🏆</p>';
}

// --- cards view ----------------------------------------------------------
function badgeHtml(t) {
  const out = [];
  if (t.hidden) out.push('<span class="badge hidden">Hidden</span>');
  if (t.missable) out.push('<span class="badge missable">Missable</span>');
  if (t.unconfirmed) out.push('<span class="badge unconfirmed">Unconfirmed</span>');
  if (t.single) out.push('<span class="badge single">Single source</span>');
  return out.join('');
}
function renderCards(list) {
  const wrap = document.getElementById('view-cards');
  wrap.innerHTML = list.map((t) => `
    <article class="card${isEarned(t) ? ' earned' : ''}" data-open="${t.id}">
      <div class="card-top">
        <span class="grade-pill ${t.grade}">${t.grade}</span>
        <label class="card-earned"><input type="checkbox" data-earn="${t.id}" ${isEarned(t) ? 'checked' : ''}> Earned</label>
      </div>
      <h3 class="card-name">${esc(displayName(t))}</h3>
      <p class="card-desc">${esc(t.desc)}</p>
      <p class="card-guide"><b>How:</b> ${esc(t.guide)}</p>
      <div class="badges">${badgeHtml(t)}</div>
      <div class="card-meta">
        <span class="stars" title="Difficulty ${t.diff}/5">${stars(t.diff)}</span>
        <span>⏱ ${esc(t.time)}</span>
        <span>◈ ${t.rarity}% of players</span>
        <span>${esc(KIND_LABELS[t.kind] || t.kind)}</span>
      </div>
    </article>`).join('') || '<p class="empty">No trophies match these filters.</p>';
}

// --- table view ----------------------------------------------------------
function renderTable(list) {
  const rows = [...list].sort((a, b) => {
    let v = 0;
    if (sortKey === 'name') v = a.name.localeCompare(b.name);
    else if (sortKey === 'grade') v = GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade];
    else if (sortKey === 'rarity') v = a.rarity - b.rarity;
    else if (sortKey === 'diff') v = a.diff - b.diff;
    else if (sortKey === 'time') v = a.time.localeCompare(b.time);
    return v * sortDir;
  });
  document.getElementById('tableBody').innerHTML = rows.map((t) => `
    <tr class="${isEarned(t) ? 'earned' : ''}" data-open="${t.id}">
      <td><span class="tname">${esc(displayName(t))}</span><br><span class="tdesc">${esc(t.desc)}</span></td>
      <td><span class="grade-pill ${t.grade}">${t.grade}</span></td>
      <td>${t.rarity}%</td>
      <td><span class="stars">${stars(t.diff)}</span></td>
      <td>${esc(t.time)}</td>
      <td class="tguide">${esc(t.guide)}<br><span class="tdesc">Source: ${esc(t.src)}</span></td>
      <td><input type="checkbox" data-earn="${t.id}" ${isEarned(t) ? 'checked' : ''} aria-label="Earned"></td>
    </tr>`).join('') || '<tr><td colspan="7">No trophies match these filters.</td></tr>';
}

// --- roadmap view --------------------------------------------------------
function renderRoadmap() {
  const phases = [
    { id: 1, kinds: ['story'] },
    { id: 2, kinds: ['activity', 'collectible', 'combat', 'money', 'completion'] },
    { id: 3, kinds: ['stranger', 'misc'] },
  ];
  for (const p of phases) {
    const inPhase = trophies.filter((t) => p.kinds.includes(t.kind));
    const got = inPhase.filter(isEarned).length;
    const pct = inPhase.length ? Math.round((got / inPhase.length) * 100) : 0;
    document.getElementById(`phase${p.id}Bar`).style.width = pct + '%';
    document.getElementById(`phase${p.id}Count`).textContent = `${got} / ${inPhase.length} trophies · ${pct}%`;
  }
}

// --- detail dialog -------------------------------------------------------
let detailId = null;
function openDetail(id) {
  const t = trophies.find((x) => x.id === id);
  if (!t) return;
  detailId = id;
  document.getElementById('detailGrade').innerHTML = `<span class="grade-pill ${t.grade}">${t.grade}</span> ${badgeHtml(t)}`;
  document.getElementById('detailName').textContent = displayName(t);
  document.getElementById('detailDesc').textContent = t.desc;
  document.getElementById('detailMeta').innerHTML = `
    <div><dt>Difficulty</dt><dd><span class="stars" style="color:var(--gold)">${stars(t.diff)}</span> ${t.diff}/5</dd></div>
    <div><dt>Time</dt><dd>⏱ ${esc(t.time)}</dd></div>
    <div><dt>Rarity</dt><dd>◈ ${t.rarity}% of players (Exophase, 20 Nov 2026)</dd></div>
    <div><dt>Type</dt><dd>${esc(KIND_LABELS[t.kind] || t.kind)}</dd></div>`;
  document.getElementById('detailGuide').textContent = t.guide;
  document.getElementById('detailSrc').textContent = 'Source: ' + t.src +
    (t.unconfirmed ? ' — method unconfirmed, marked honestly.' : '') +
    (t.single ? ' — single source, provisional.' : '');
  document.getElementById('detailNote').value = state.notes[id] || '';
  document.getElementById('detailEarned').checked = isEarned(t);
  document.getElementById('detailBackdrop').hidden = false;
}
function closeDetail() {
  document.getElementById('detailBackdrop').hidden = true;
  detailId = null;
}

// --- master render -------------------------------------------------------
function renderAll() {
  const list = filtered();
  document.getElementById('resultCount').textContent =
    `${list.length} of ${trophies.length} trophies · ${trophies.filter(isEarned).length} earned`;
  renderHero();
  renderPlanner();
  renderCards(list);
  renderTable(list);
  renderRoadmap();
  for (const id of ['view-cards', 'view-table', 'view-roadmap']) {
    document.getElementById(id).hidden = id !== 'view-' + currentView;
  }
  document.querySelectorAll('.views button').forEach((b) =>
    b.classList.toggle('active', b.dataset.view === currentView));
}

// --- events --------------------------------------------------------------
document.addEventListener('click', (e) => {
  const earnBox = e.target.closest('[data-earn]');
  if (earnBox) { e.stopPropagation(); toggleEarned(Number(earnBox.dataset.earn)); return; }
  const opener = e.target.closest('[data-open]');
  if (opener) { openDetail(Number(opener.dataset.open)); return; }
  if (e.target.closest('#detailClose') || e.target.id === 'detailBackdrop') closeDetail();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetail(); });
document.getElementById('detailNote').addEventListener('input', (e) => {
  if (detailId == null) return;
  state.notes[detailId] = e.target.value;
  saveState();
});
document.getElementById('detailEarned').addEventListener('change', (e) => {
  if (detailId == null) return;
  state.earned[detailId] = e.target.checked;
  if (!e.target.checked) delete state.earned[detailId];
  saveState();
  renderAll();
});
document.getElementById('missableBtn').addEventListener('click', () => {
  const t = trophies.find((x) => x.missable);
  if (t) openDetail(t.id);
});
for (const id of ['search', 'kindFilter', 'gradeFilter', 'earnedOnly', 'spoilerToggle']) {
  document.getElementById(id).addEventListener('input', renderAll);
}
document.querySelectorAll('.views button').forEach((b) =>
  b.addEventListener('click', () => { currentView = b.dataset.view; renderAll(); }));
document.querySelectorAll('th button[data-sort]').forEach((b) =>
  b.addEventListener('click', () => {
    if (sortKey === b.dataset.sort) sortDir *= -1;
    else { sortKey = b.dataset.sort; sortDir = 1; }
    renderAll();
  }));
document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('importBtn').addEventListener('click', () =>
  document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (imported.earned || imported.notes) {
      state = { earned: imported.earned || {}, notes: imported.notes || {} };
      saveState();
      renderAll();
    }
  } catch { alert('That file is not a valid progress export.'); }
  e.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Clear all earned marks and notes?')) {
    state = { earned: {}, notes: {} };
    saveState();
    renderAll();
  }
});

// --- boot ----------------------------------------------------------------
fetch('data/trophies.json')
  .then((r) => r.json())
  .then((data) => {
    trophies = data.trophies;
    meta = data;
    // Demo seed (?seed=N): mark the first N non-platinum trophies earned so
    // screenshots show a tracker in use. Only when nothing is stored yet.
    if (seedCount > 0 && Object.keys(state.earned).length === 0) {
      trophies.filter((t) => t.grade !== 'platinum').slice(0, seedCount)
        .forEach((t) => { state.earned[t.id] = true; });
      saveState();
    }
    if (params.get('spoiler') === 'off') document.getElementById('spoilerToggle').checked = false;
    renderAll();
    const detail = Number(params.get('detail'));
    if (detail) openDetail(detail);
  })
  .catch((err) => {
    document.getElementById('view-cards').innerHTML =
      `<p class="empty">Could not load the trophy data: ${esc(err.message)}</p>`;
  });
