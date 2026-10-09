// app.js — 화면 흐름. 질문 하나씩 → 분석 연출 → 결과 카드.
import { computeMetrics } from './metrics.js?v=8';
import { interpret } from './rules.js?v=8';
import { detectLandmarks } from './detector.js?v=8';
import { PLACES, computePillars, yearPillar } from './saju/calendar.js?v=8';
import { analyzeSaju, analyzeYear } from './saju/analyze.js?v=8';
import { combine } from './combined.js?v=8';
import { drawFace, renderFace } from './view-face.js?v=8';
import { renderSaju } from './view-saju.js?v=8';
import { buildCards } from './deck.js?v=8';
import { runLoading } from './loading.js?v=8';
import { makeShareImage, shareOrSave } from './share.js?v=8';
import { TOPICS, SIJIN } from './copy.js?v=8';
import { esc } from './util.js?v=8';

const $ = id => document.getElementById(id);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const STORE = 'eolgul.input.v1';
const FLOW = ['intro', 'topic', 'name', 'gender', 'birth', 'time', 'place', 'photo'];

const input = {
  topic: null, name: '', gender: null, calendar: 'solar', leap: false, year: '', month: '', day: '',
  timeMode: 'exact', time: '', sijin: null, place: 'seoul', ziMode: 'split',
};
let face = null;      // 분석한 얼굴
let result = null;    // 마지막 풀이
let current = 'intro';

// ---------- 화면 전환 ----------
function show(name, { back = false, push = true } = {}) {
  const prev = current;
  $$('[data-screen]').forEach(s => { s.hidden = s.dataset.screen !== name; });
  const el = document.querySelector(`[data-screen="${name}"]`);
  el.classList.remove('enter', 'enter-back');
  void el.offsetWidth;
  if (name !== 'loading') el.classList.add(back ? 'enter-back' : 'enter');
  current = name;
  const i = FLOW.indexOf(name);
  if (i > 0) el.querySelector('.progress b').style.width = `${(i / (FLOW.length - 1)) * 100}%`;
  if (push && name !== 'loading' && prev !== name) history.pushState({ screen: name }, '');
  window.scrollTo(0, 0);
  onEnter(name);
}

window.addEventListener('popstate', e => {
  $('sheet').hidden = true;
  if (current === 'loading') return;
  const target = e.state?.screen || 'intro';
  if (target === 'loading') return;
  stopCamera();
  show(target === 'result' && !result ? 'intro' : target, { back: true, push: false });
});

function next() {
  const i = FLOW.indexOf(current);
  if (i >= 0 && i < FLOW.length - 1) show(FLOW[i + 1]);
}
$$('.back').forEach(b => b.addEventListener('click', () => history.back()));
$$('[data-go]').forEach(b => b.addEventListener('click', () => show(b.dataset.go)));
$$('[data-next]').forEach(b => b.addEventListener('click', () => { if (validate(current)) { save(); next(); } }));

function onEnter(name) {
  if (name === 'name') setTimeout(() => $('nameInput').focus(), 350);
  if (name === 'gender') $$('.who').forEach(w => { w.textContent = input.name ? `${input.name}님, ` : ''; });
  if (name === 'birth' && !input.year) setTimeout(() => $('yIn').focus(), 350);
  if (name === 'intro') $('openLast').hidden = !loadSaved();
}

// ---------- 질문 화면 ----------
$('topicOpts').innerHTML = TOPICS.map(t => `<button class="opt" type="button" data-v="${t.id}" aria-pressed="false">
  <span><b>${t.label}</b><small>${t.hint}</small></span><span class="mark"></span></button>`).join('');

function single(container, key, after) {
  const opts = $$('.opt', container);
  const sync = () => opts.forEach(o => o.setAttribute('aria-pressed', String(o.dataset.v === input[key])));
  opts.forEach(o => o.addEventListener('click', () => {
    input[key] = o.dataset.v; sync();
    const btn = container.closest('.screen').querySelector('[data-next]');
    if (btn) btn.disabled = false;
    after?.();
  }));
  return sync;
}
const syncTopic = single($('topicOpts'), 'topic', () => setTimeout(() => { save(); next(); }, 220));
const syncGender = single($('genderOpts'), 'gender', () => setTimeout(() => { save(); next(); }, 220));
const syncZi = single($('ziOpts'), 'ziMode');

$('nameInput').addEventListener('input', e => { input.name = e.target.value.trim().slice(0, 12); });
$('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); save(); next(); } });

// 생년월일
$$('#calToggle button').forEach(b => b.addEventListener('click', () => {
  input.calendar = b.dataset.v;
  $$('#calToggle button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  $('leapWrap').hidden = input.calendar !== 'lunar';
}));
[['yIn', 'year'], ['mIn', 'month'], ['dIn', 'day']].forEach(([id, k]) => {
  $(id).addEventListener('input', e => {
    input[k] = e.target.value;
    $('birthErr').textContent = '';
    // 자리수가 차면 다음 칸으로
    if (k === 'year' && e.target.value.length === 4) $('mIn').focus();
    if (k === 'month' && (e.target.value.length === 2 || +e.target.value > 1)) $('dIn').focus();
  });
});
$('leapIn').addEventListener('change', e => { input.leap = e.target.checked; });

// 시각
$('sijinGrid').innerHTML = SIJIN.map(s => `<button type="button" data-b="${s.b}" aria-pressed="false">
  <span class="h">${s.b}</span><span class="n">${s.ko} · ${s.animal}</span><span class="r">${s.range}</span></button>`).join('');
$$('#sijinGrid button').forEach(b => b.addEventListener('click', () => {
  input.sijin = b.dataset.b;
  $$('#sijinGrid button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  $('timeErr').textContent = '';
}));
function setTimeMode(m) {
  input.timeMode = m;
  $$('[data-screen="time"] [role="tab"]').forEach(t => t.setAttribute('aria-selected', String(t.dataset.mode === m)));
  $$('[data-pane]').forEach(p => { p.hidden = p.dataset.pane !== m; });
  $('timeErr').textContent = '';
}
$$('[data-screen="time"] [role="tab"]').forEach(t => t.addEventListener('click', () => setTimeMode(t.dataset.mode)));
$('timeIn').addEventListener('input', e => { input.time = e.target.value; $('timeErr').textContent = ''; });

// 출생지
$('placeChips').innerHTML = PLACES.map(p => `<button type="button" data-v="${p.id}" aria-pressed="false">${esc(p.id === 'none' ? '해외·잘 모름' : p.name.replace(/·.*/, ''))}</button>`).join('');
const syncPlace = () => $$('#placeChips button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === input.place)));
$$('#placeChips button').forEach(b => b.addEventListener('click', () => { input.place = b.dataset.v; syncPlace(); }));

function validate(step) {
  if (step === 'birth') {
    const now = new Date().getFullYear();
    const y = +input.year, m = +input.month, d = +input.day;
    let msg = '';
    if (!(y >= 1910 && y <= now)) msg = `태어난 해를 1910~${now} 사이로 넣어 주세요.`;
    else if (!(m >= 1 && m <= 12)) msg = '월은 1~12 사이예요.';
    else if (!(d >= 1 && d <= (input.calendar === 'lunar' ? 30 : 31))) msg = '일이 맞지 않아요.';
    else if (input.calendar === 'solar') {
      const dt = new Date(Date.UTC(y, m - 1, d));
      if (dt.getUTCMonth() !== m - 1) msg = `${m}월에는 ${d}일이 없어요.`;
    } else {
      try { computePillars(toCalcInput({ ...input, timeMode: 'unknown' })); }
      catch (e) { msg = e.userMessage ? e.message : '음력 날짜를 확인해 주세요.'; }
    }
    $('birthErr').textContent = msg;
    return !msg;
  }
  if (step === 'time') {
    if (input.timeMode === 'exact' && !input.time) { $('timeErr').textContent = '시각을 넣거나, 대충 알면 옆 탭에서 골라 주세요.'; return false; }
    if (input.timeMode === 'sijin' && !input.sijin) { $('timeErr').textContent = '태어난 시간대를 하나 골라 주세요.'; return false; }
  }
  return true;
}

function toCalcInput(v) {
  let hour = null, minute = 0;
  if (v.timeMode === 'exact' && v.time) [hour, minute] = v.time.split(':').map(Number);
  if (v.timeMode === 'sijin' && v.sijin) [hour, minute] = SIJIN.find(s => s.b === v.sijin).mid.split(':').map(Number);
  return { calendar: v.calendar, leap: v.leap, year: +v.year, month: +v.month, day: +v.day, hour, minute, gender: v.gender || 'M', place: v.place, ziMode: v.ziMode };
}

function save() { try { localStorage.setItem(STORE, JSON.stringify(input)); } catch {} }
function loadSaved() {
  try { const v = JSON.parse(localStorage.getItem(STORE) || 'null'); return v && v.year && v.gender && v.topic ? v : null; } catch { return null; }
}

// ---------- 사진 ----------
const consent = $('consent'), pick = $('pick'), shoot = $('shoot');
const camVideo = $('camVideo'), preview = $('photoPreview');
consent.addEventListener('change', () => { pick.disabled = shoot.disabled = !consent.checked; });
pick.addEventListener('click', () => $('photoFile').click());
$('photoFile').addEventListener('change', e => { if (e.target.files[0]) useFile(e.target.files[0]); e.target.value = ''; });
$('cameraFile').addEventListener('change', e => { if (e.target.files[0]) useFile(e.target.files[0]); e.target.value = ''; });
shoot.addEventListener('click', startCamera);
$('snap').addEventListener('click', snap);
$('camCancel').addEventListener('click', stopCamera);
$('skipPhoto').addEventListener('click', () => { face = null; analyze(); });
$('goAnalyze').addEventListener('click', () => analyze());
$('retake').addEventListener('click', () => {
  face = null; preview.hidden = true; $('goAnalyze').hidden = true; $('retake').hidden = true; $('photoBtns').hidden = false;
  $('camEmpty').hidden = false; $('camEmpty').innerHTML = '<div><b>相</b>사진을 올리거나 바로 찍어 주세요</div>'; $('photoErr').textContent = '';
});

const touch = matchMedia('(pointer: coarse)').matches;
let stream = null;
async function startCamera() {
  $('photoErr').textContent = '';
  if (touch || !navigator.mediaDevices?.getUserMedia) { $('cameraFile').click(); return; }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
  } catch (e) {
    $('photoErr').textContent = e?.name === 'NotAllowedError' ? '카메라 권한이 막혀 있어요. 주소창의 카메라 권한을 켜거나 앨범에서 골라 주세요.' : '카메라를 찾지 못했어요. 앨범에서 골라 주세요.';
    return;
  }
  camVideo.srcObject = stream;
  await camVideo.play().catch(() => {});
  camVideo.hidden = false; $('camGuide').hidden = false; $('camEmpty').hidden = true; preview.hidden = true;
  $('photoBtns').hidden = true; $('camBtns').hidden = false; $('goAnalyze').hidden = true;
}
function stopCamera() {
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null; camVideo.srcObject = null; camVideo.hidden = true; $('camGuide').hidden = true;
  $('camBtns').hidden = true;
  if (!face) { $('camEmpty').hidden = false; $('photoBtns').hidden = false; }
}
async function snap() {
  const w = camVideo.videoWidth, h = camVideo.videoHeight;
  if (!w) return;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.translate(w, 0); g.scale(-1, 1); g.drawImage(camVideo, 0, 0, w, h);
  stopCamera();
  await readFace(c);
}
async function useFile(file) {
  if (!file.type.startsWith('image/')) { $('photoErr').textContent = '사진 파일만 올릴 수 있어요.'; return; }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = url; await img.decode();
    const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    await readFace(c);
  } catch { $('photoErr').textContent = '사진을 열지 못했어요. 다른 사진으로 해 주세요.'; }
  finally { URL.revokeObjectURL(url); }
}
async function readFace(bitmap) {
  $('photoErr').textContent = '';
  $('camEmpty').hidden = false;
  $('camEmpty').innerHTML = '<div><b>相</b>얼굴을 찾는 중이에요…</div>';
  $('goAnalyze').hidden = true;
  try {
    const found = await detectLandmarks(bitmap);
    if (!found) {
      face = null;
      $('camEmpty').innerHTML = '<div><b>相</b>얼굴을 못 찾았어요.<br>얼굴이 크게 나온 정면 사진으로 다시 해 주세요.</div>';
      return;
    }
    const metrics = computeMetrics(found.points);
    const r = interpret(metrics);
    if (found.faceCount > 1) r.warnings.unshift(`얼굴이 ${found.faceCount}개 보여서 가장 큰 얼굴로 봤어요.`);
    face = { bitmap, points: found.points, metrics, result: r, isSample: false };
    drawFace(preview, face);
    preview.hidden = false; $('camEmpty').hidden = true;
    $('goAnalyze').hidden = false; $('photoBtns').hidden = true; $('retake').hidden = false;
    if (r.warnings.length) $('photoErr').textContent = r.warnings[0];
  } catch (e) {
    console.error(e);
    $('camEmpty').innerHTML = '<div><b>相</b>분석하다 문제가 생겼어요.<br>새로고침 후 다시 해 주세요.</div>';
  }
}

// ---------- 풀이 ----------
function compute(v, faceObj) {
  const chart = computePillars(toCalcInput(v));
  const saju = analyzeSaju(chart);
  const y = new Date().getFullYear();
  const years = [analyzeYear(saju, yearPillar(y)), analyzeYear(saju, yearPillar(y + 1))];
  const total = combine(saju, faceObj?.result || null, years);
  let faceImage = null;
  if (faceObj) {
    const c = document.createElement('canvas');
    drawFace(c, faceObj);
    faceImage = c.toDataURL('image/jpeg', 0.85);
  }
  return { input: { ...v }, chart, saju, years: total.years, face: faceObj, total, faceImage };
}

async function analyze({ animate = true } = {}) {
  stopCamera();
  save();
  try { result = compute(input, face); }
  catch (e) { console.error(e); toast(e.userMessage ? e.message : '계산하다 문제가 생겼어요. 생년월일을 다시 확인해 주세요.'); show('birth'); return; }
  if (animate) {
    show('loading');
    try { await runLoading(document.querySelector('[data-screen="loading"]'), result); } catch (e) { console.error(e); }
  }
  renderResult();
  show('result');
}

let cardIndex = 0;
function renderResult() {
  const cards = buildCards(result);
  const deck = $('deck');
  deck.innerHTML = cards.map(c => c.html).join('');
  $('dots').innerHTML = cards.map(() => '<i></i>').join('');
  deck.scrollLeft = 0;
  cardIndex = 0;
  updateDots();
}
function updateDots() {
  const n = $('deck').children.length;
  $$('#dots i').forEach((d, i) => d.classList.toggle('on', i === cardIndex));
  $('deckCount').textContent = `${cardIndex + 1} / ${n}`;
  $('prevCard').disabled = cardIndex === 0;
  $('nextCard').disabled = cardIndex === n - 1;
}
$('deck').addEventListener('scroll', () => {
  const d = $('deck');
  const w = d.firstElementChild?.getBoundingClientRect().width || 1;
  const i = Math.round(d.scrollLeft / (w + 12));
  if (i !== cardIndex) { cardIndex = i; updateDots(); }
}, { passive: true });
const goCard = i => {
  const d = $('deck'); const c = d.children[i]; if (!c) return;
  d.scrollTo({ left: c.offsetLeft - 20, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
};
$('prevCard').addEventListener('click', () => goCard(cardIndex - 1));
$('nextCard').addEventListener('click', () => goCard(cardIndex + 1));
$('deck').addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') goCard(cardIndex + 1);
  if (e.key === 'ArrowLeft') goCard(cardIndex - 1);
});
document.querySelector('[data-screen="result"] .back').addEventListener('click', e => {
  e.stopImmediatePropagation();
  show('intro', { back: true });
}, true);

// 전체 풀이
let sheetTab = 'saju';
function renderSheet() {
  const { saju, chart, years, face: f } = result;
  $$('#sheetTabs button').forEach(b => { b.setAttribute('aria-selected', String(b.dataset.tab === sheetTab)); });
  $$('#sheetTabs button')[1].disabled = !f;
  if (sheetTab === 'face' && f) {
    $('sheetBody').innerHTML = `<div class="stage2"><canvas id="sheetFace" width="800" height="840" aria-label="측정선이 표시된 얼굴"></canvas>
      <div class="legend"><span><i class="lg-guide"></i>삼정 기준선</span><span><i class="lg-seal"></i>이목구비 윤곽</span></div></div>${renderFace(f)}`;
    drawFace($('sheetFace'), f);
  } else {
    $('sheetBody').innerHTML = renderSaju(saju, chart, years);
  }
}
$('openSheet').addEventListener('click', () => { sheetTab = 'saju'; renderSheet(); $('sheet').hidden = false; $('sheet').scrollTop = 0; history.pushState({ screen: 'result', sheet: true }, ''); });
$('closeSheet').addEventListener('click', () => history.back());
$$('#sheetTabs button').forEach(b => b.addEventListener('click', () => { if (b.disabled) return; sheetTab = b.dataset.tab; renderSheet(); }));

// 공유 이미지
$('share').addEventListener('click', async () => {
  const btn = $('share'); btn.disabled = true; btn.textContent = '만드는 중…';
  try {
    const blob = await makeShareImage(result);
    const r = await shareOrSave(blob, `얼굴팔자-${result.input.name || '나'}.png`);
    if (r === 'saved') toast('이미지를 저장했어요.');
  } catch (e) { console.error(e); toast('이미지를 만들지 못했어요.'); }
  finally { btn.disabled = false; btn.textContent = '이미지로 저장'; }
});

let toastTimer;
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

// 지난 결과
$('openLast').addEventListener('click', () => {
  const v = loadSaved(); if (!v) return;
  Object.assign(input, v); face = null; restoreForm();
  analyze({ animate: true });
});

function restoreForm() {
  syncTopic(); syncGender(); syncZi(); syncPlace();
  $('nameInput').value = input.name || '';
  $('yIn').value = input.year; $('mIn').value = input.month; $('dIn').value = input.day;
  $$('#calToggle button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.v === input.calendar)));
  $('leapWrap').hidden = input.calendar !== 'lunar'; $('leapIn').checked = !!input.leap;
  $('timeIn').value = input.time || '';
  $$('#sijinGrid button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.b === input.sijin)));
  setTimeMode(input.timeMode || 'exact');
  $$('[data-screen] [data-next]').forEach(b => { b.disabled = false; });
}

// ---------- 시작 ----------
const saved = loadSaved();
if (saved) { Object.assign(input, saved); restoreForm(); }
syncPlace();
history.replaceState({ screen: 'intro' }, '');
show('intro', { push: false });
