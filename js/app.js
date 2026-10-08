// app.js — 입력 흐름과 화면 전환. 계산은 saju/*, combined.js, metrics.js, rules.js 가 맡습니다.
import { computeMetrics } from './metrics.js?v=6';
import { interpret } from './rules.js?v=6';
import { SAMPLE_FACE } from './sample-face.js?v=6';
import { detectLandmarks } from './detector.js?v=6';
import { PLACES, computePillars, yearPillar } from './saju/calendar.js?v=6';
import { analyzeSaju, analyzeYear } from './saju/analyze.js?v=6';
import { combine } from './combined.js?v=6';
import { drawFace, renderFace } from './view-face.js?v=6';
import { renderSaju } from './view-saju.js?v=6';
import { renderTotal } from './view-total.js?v=6';
import { esc } from './util.js?v=6';

const $ = id => document.getElementById(id);
const form = $('birthForm');
const statusEl = $('status');
const SAMPLE_INPUT = { name: '', gender: 'M', calendar: 'solar', leap: false, year: 1990, month: 5, day: 15, time: '14:30', timeUnknown: false, place: 'seoul', ziMode: 'split' };
const STORE_KEY = 'gwansang.birth.v1';

const state = {
  face: null,          // { bitmap, points, metrics, result, isSample }
  isSample: true,
  tab: 'total',
};

// ---------- 입력 폼 ----------
$('place').innerHTML = PLACES.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');

function readForm() {
  const f = new FormData(form);
  const time = String(f.get('time') || '');
  const timeUnknown = $('timeUnknown').checked || !time;
  const [h, m] = time.split(':');
  return {
    name: String(f.get('name') || '').trim().slice(0, 20),
    gender: f.get('gender') === 'F' ? 'F' : 'M',
    calendar: f.get('calendar') === 'lunar' ? 'lunar' : 'solar',
    leap: $('leap').checked,
    year: +f.get('year'), month: +f.get('month'), day: +f.get('day'),
    time, timeUnknown,
    hour: timeUnknown ? null : +h, minute: timeUnknown ? 0 : +m,
    place: String(f.get('place') || 'seoul'),
    ziMode: f.get('ziMode') === 'same' ? 'same' : 'split',
  };
}

function writeForm(v) {
  form.elements.name.value = v.name || '';
  form.querySelector(`input[name="gender"][value="${v.gender}"]`).checked = true;
  form.querySelector(`input[name="calendar"][value="${v.calendar}"]`).checked = true;
  $('leap').checked = !!v.leap;
  form.elements.year.value = v.year; form.elements.month.value = v.month; form.elements.day.value = v.day;
  form.elements.time.value = v.time || '';
  $('timeUnknown').checked = !!v.timeUnknown;
  form.elements.place.value = v.place;
  form.elements.ziMode.value = v.ziMode;
  syncForm();
}

function syncForm() {
  $('leapWrap').hidden = form.elements.calendar.value !== 'lunar';
  form.elements.time.disabled = $('timeUnknown').checked;
}
form.addEventListener('change', syncForm);

function validate(v) {
  const now = new Date().getFullYear();
  if (!(v.year >= 1910 && v.year <= now)) return `태어난 해는 1910년부터 ${now}년 사이로 넣어 주세요.`;
  if (!(v.month >= 1 && v.month <= 12)) return '월은 1~12 사이로 넣어 주세요.';
  if (!(v.day >= 1 && v.day <= (v.calendar === 'lunar' ? 30 : 31))) return '일이 올바르지 않습니다.';
  if (v.calendar === 'solar') {
    const d = new Date(Date.UTC(v.year, v.month - 1, v.day));
    if (d.getUTCMonth() !== v.month - 1) return `${v.year}년 ${v.month}월에는 ${v.day}일이 없습니다.`;
  }
  return null;
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const v = readForm();
  const err = validate(v);
  if (err) { setStatus(err, true); return; }
  try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch {}
  state.isSample = false;
  if (state.face?.isSample) state.face = null;
  run(v, true);
});

$('clearForm').addEventListener('click', () => {
  try { localStorage.removeItem(STORE_KEY); } catch {}
  writeForm({ ...SAMPLE_INPUT, year: '', month: '', day: '', time: '' });
  state.face = null; state.isSample = true;
  $('photoDone').hidden = true;
  run(SAMPLE_INPUT, false, 'total');
  setStatus('입력한 정보를 지웠습니다.');
});

function setStatus(msg, err = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle('err', err);
}

// ---------- 사진 ----------
const consent = $('consent'), pick = $('pick'), shoot = $('shoot'), photo = $('photo'), cameraInput = $('cameraInput');
const cam = $('cam'), camVideo = $('camVideo');

consent.addEventListener('change', () => {
  pick.disabled = shoot.disabled = !consent.checked;
  $('photoHint').textContent = consent.checked
    ? '정면을 보고 무표정에 가까운 사진이 가장 정확합니다.'
    : '동의하면 사진을 올리거나 바로 찍을 수 있습니다. 사진 없이 사주만 봐도 됩니다.';
});
pick.addEventListener('click', () => { stopCamera(); photo.click(); });
photo.addEventListener('change', () => { if (photo.files[0]) handleFile(photo.files[0]); photo.value = ''; });
cameraInput.addEventListener('change', () => { if (cameraInput.files[0]) handleFile(cameraInput.files[0]); cameraInput.value = ''; });
shoot.addEventListener('click', startCamera);
$('snap').addEventListener('click', snap);
$('camCancel').addEventListener('click', () => { stopCamera(); setStatus(''); });
$('removePhoto').addEventListener('click', () => {
  state.face = null;
  $('photoDone').hidden = true;
  if (!state.isSample) run(readForm(), false);
});

const isTouchDevice = matchMedia('(pointer: coarse)').matches;
let stream = null;

async function startCamera() {
  if (isTouchDevice || !navigator.mediaDevices?.getUserMedia) { cameraInput.click(); return; }
  setStatus('카메라를 켜는 중입니다.');
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
  } catch (e) {
    stream = null;
    const denied = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
    setStatus(denied ? '카메라 사용이 허용되지 않았습니다. 브라우저 주소창의 카메라 권한을 확인하거나 사진을 업로드해 주세요.' : '카메라를 찾지 못했습니다. 사진을 업로드해 주세요.', true);
    return;
  }
  camVideo.srcObject = stream;
  await camVideo.play().catch(() => {});
  cam.hidden = false;
  setStatus('');
  $('snap').focus();
}

function stopCamera() {
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
  camVideo.srcObject = null;
  cam.hidden = true;
}

async function snap() {
  const w = camVideo.videoWidth, h = camVideo.videoHeight;
  if (!w || !h) { setStatus('카메라 화면이 아직 준비되지 않았습니다. 잠시 후 다시 눌러 주세요.', true); return; }
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.translate(w, 0); g.scale(-1, 1);
  g.drawImage(camVideo, 0, 0, w, h);
  stopCamera();
  await analyzePhoto(c);
}

async function handleFile(file) {
  if (!file.type.startsWith('image/')) { setStatus('이미지 파일만 올릴 수 있습니다.', true); return; }
  let bitmap;
  try { bitmap = await loadImage(file); }
  catch { setStatus('사진을 열지 못했습니다. JPG나 PNG 파일로 다시 시도해 주세요.', true); return; }
  await analyzePhoto(bitmap);
}

async function loadImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  } finally { URL.revokeObjectURL(url); }
}

async function analyzePhoto(bitmap) {
  setStatus('얼굴 모델을 불러오는 중입니다. 처음 한 번은 몇 초 걸립니다.');
  try {
    const found = await detectLandmarks(bitmap, msg => setStatus(msg));
    if (!found) { setStatus('얼굴을 찾지 못했습니다. 얼굴이 크게 나온 정면 사진으로 다시 시도해 주세요.', true); return; }
    const metrics = computeMetrics(found.points);
    const result = interpret(metrics);
    if (found.faceCount > 1) result.warnings.unshift(`얼굴이 ${found.faceCount}개 보여 가장 큰 얼굴로 풀이했습니다.`);
    state.face = { bitmap, points: found.points, metrics, result, isSample: false };
    drawFace($('thumb'), state.face);
    $('photoDone').hidden = false;
    $('photoDoneText').textContent = `${result.face.primary.name}(${result.face.primary.hanja}) 얼굴로 읽었습니다.`;
    // 생년월일을 이미 넣었다면 바로 종합 풀이를 갱신
    const v = readForm();
    if (!validate(v)) {
      state.isSample = false;
      try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch {}
      run(v, true, 'total');
    } else {
      setStatus('사진 분석을 마쳤습니다. 생년월일을 넣고 "풀이 보기"를 눌러 주세요.');
    }
  } catch (e) {
    console.error(e);
    setStatus('분석 중 문제가 생겼습니다. 페이지를 새로 고친 뒤 다시 시도해 주세요.', true);
  }
}

// ---------- 풀이 ----------
let last = null;

function run(v, scroll, tab) {
  let chart, saju;
  try {
    chart = computePillars(v);
    saju = analyzeSaju(chart);
  } catch (e) {
    if (!e.userMessage) console.error(e);
    setStatus(e.userMessage ? e.message : '날짜를 계산하지 못했습니다. 입력한 날짜를 확인해 주세요.', true);
    return;
  }
  const thisYear = new Date().getFullYear();
  const years = [analyzeYear(saju, yearPillar(thisYear)), analyzeYear(saju, yearPillar(thisYear + 1))];
  const face = state.face || (state.isSample ? sampleFace() : null);
  const total = combine(saju, face?.result || null, years);
  last = { v, chart, saju, years, face, total };
  if (tab) state.tab = tab;
  render();
  if (!state.isSample) setStatus('풀이를 마쳤습니다. 입력한 정보와 사진은 이 기기 밖으로 나가지 않습니다.');
  if (scroll) $('result').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

function sampleFace() {
  const metrics = computeMetrics(SAMPLE_FACE);
  return { bitmap: null, points: SAMPLE_FACE, metrics, result: interpret(metrics), isSample: true };
}

function render() {
  const { v, chart, saju, years, face, total } = last;
  const birth = `${v.calendar === 'lunar' ? '음력' : '양력'} ${v.year}.${v.month}.${v.day}${v.leap && v.calendar === 'lunar' ? '(윤)' : ''} ${v.timeUnknown ? '시각 모름' : v.time} · ${v.gender === 'F' ? '여' : '남'}`;
  $('resultBadge').className = 'badge' + (state.isSample ? '' : ' mine');
  $('resultBadge').textContent = state.isSample ? `예시 · ${birth} · 평균 얼굴` : `${v.name ? v.name + ' · ' : ''}${birth}${face ? ' · 사진 포함' : ''}`;

  $('tab-face').disabled = !face;
  if (!face && state.tab === 'face') state.tab = 'total';
  for (const t of ['total', 'saju', 'face']) {
    $(`tab-${t}`).setAttribute('aria-selected', String(state.tab === t));
    $(`panel-${t}`).hidden = state.tab !== t;
  }
  $('panel-total').innerHTML = renderTotal(total, { hasFace: !!face, name: v.name });
  $('panel-saju').innerHTML = renderSaju(saju, chart, total.years);
  if (face) {
    $('panel-face').innerHTML = `<div class="panel stage"><canvas id="faceCanvas" width="800" height="840" aria-label="측정선이 표시된 얼굴"></canvas>
      <div class="legend"><span><i class="lg-guide"></i>삼정 기준선</span><span><i class="lg-seal"></i>이목구비 윤곽</span></div></div>` + renderFace(face);
    drawFace($('faceCanvas'), face);
  } else {
    $('panel-face').innerHTML = '';
  }
}

document.querySelectorAll('.tabs [role="tab"]').forEach(btn => btn.addEventListener('click', () => {
  state.tab = btn.dataset.tab;
  render();
}));
document.querySelector('.tabs').addEventListener('keydown', e => {
  if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const tabs = [...document.querySelectorAll('.tabs [role="tab"]:not([disabled])')];
  const i = tabs.findIndex(t => t.dataset.tab === state.tab);
  const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
  state.tab = next.dataset.tab; render(); next.focus();
});

// 테마가 바뀌면 캔버스 색을 다시 칠함
const redraw = () => {
  if (state.face) drawFace($('thumb'), state.face);
  if (last?.face && $('faceCanvas')) drawFace($('faceCanvas'), last.face);
};
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', redraw);
new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

// ---------- 시작 ----------
let saved = null;
try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch {}
if (saved && !validate(saved)) {
  writeForm(saved);
  state.isSample = false;
  run(saved, false);
} else {
  writeForm({ ...SAMPLE_INPUT, year: '', month: '', day: '', time: '' });
  run(SAMPLE_INPUT, false);
}
