// app.js — 화면(UI) 담당. 얼굴 검출은 detector.js, 측정은 metrics.js, 풀이는 rules.js.
// 앱으로 옮길 때 이 파일만 플랫폼 UI로 바꾸면 됩니다.
import { computeMetrics } from './metrics.js?v=3';
import { interpret } from './rules.js?v=3';
import { SAMPLE_FACE, SAMPLE_SIZE } from './sample-face.js?v=3';
import { detectLandmarks } from './detector.js?v=3';

const $ = id => document.getElementById(id);
const consent = $('consent'), pick = $('pick'), shoot = $('shoot'), photo = $('photo'), drop = $('drop');
const cameraInput = $('cameraInput'), cam = $('cam'), camVideo = $('camVideo');
const statusEl = $('status'), canvas = $('view'), reading = $('reading');

let current = null; // { bitmap|null, points, metrics, result, isSample }

// ---------- 동의 ----------
consent.addEventListener('change', () => {
  const ok = consent.checked;
  pick.disabled = !ok;
  shoot.disabled = !ok;
  drop.classList.toggle('locked', !ok);
  $('dropHint').textContent = ok
    ? '정면을 보고 무표정에 가까운 사진이 가장 정확합니다. 얼굴이 여럿이면 가장 큰 얼굴을 봅니다.'
    : '동의하면 사진을 올리거나 바로 찍을 수 있습니다.';
});
pick.addEventListener('click', () => { stopCamera(); photo.click(); });
photo.addEventListener('change', () => { if (photo.files[0]) handleFile(photo.files[0]); photo.value = ''; });
cameraInput.addEventListener('change', () => { if (cameraInput.files[0]) handleFile(cameraInput.files[0]); cameraInput.value = ''; });
shoot.addEventListener('click', startCamera);
$('snap').addEventListener('click', snap);
$('camCancel').addEventListener('click', () => { stopCamera(); setStatus(''); });

// ---------- 촬영 ----------
// 휴대폰·태블릿: 기기 카메라 앱(전면)을 엽니다. 앱(Capacitor)으로 감쌌을 때도 같은 방식이 동작합니다.
// 컴퓨터: 웹캠 미리보기를 띄워 찍습니다. 웹캠을 쓸 수 없는 환경이면 안내만 합니다.
const isTouchDevice = matchMedia('(pointer: coarse)').matches;
let stream = null;

async function startCamera() {
  if (isTouchDevice || !navigator.mediaDevices?.getUserMedia) {
    cameraInput.click();
    return;
  }
  setStatus('카메라를 켜는 중입니다.');
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false,
    });
  } catch (e) {
    stream = null;
    const denied = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
    setStatus(denied
      ? '이 화면에서는 웹캠을 쓸 수 없습니다. 휴대폰에서 열어 촬영하거나 사진을 업로드해 주세요.'
      : '카메라를 찾지 못했습니다. 사진을 업로드해 주세요.', true);
    return;
  }
  camVideo.srcObject = stream;
  await camVideo.play().catch(() => {});
  canvas.hidden = true;
  cam.hidden = false;
  setStatus('');
  $('snap').focus();
}

function stopCamera() {
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
  camVideo.srcObject = null;
  cam.hidden = true;
  canvas.hidden = false;
}

async function snap() {
  const w = camVideo.videoWidth, h = camVideo.videoHeight;
  if (!w || !h) { setStatus('카메라 화면이 아직 준비되지 않았습니다. 잠시 후 다시 눌러 주세요.', true); return; }
  // 미리보기는 거울처럼 보이지만, 저장은 거울 반전한 상태로 해서 사용자가 본 그대로 분석합니다.
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.translate(w, 0); g.scale(-1, 1);
  g.drawImage(camVideo, 0, 0, w, h);
  stopCamera();
  await analyze(c);
}

['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => {
  e.preventDefault();
  if (consent.checked) drop.classList.add('over');
}));
['dragleave', 'drop'].forEach(t => drop.addEventListener(t, () => drop.classList.remove('over')));
drop.addEventListener('drop', e => {
  e.preventDefault();
  if (!consent.checked) { setStatus('먼저 사진 분석에 동의해 주세요.', true); return; }
  stopCamera();
  const f = e.dataTransfer.files[0];
  if (f) handleFile(f);
});
$('reset').addEventListener('click', () => { stopCamera(); showSample(); });

function setStatus(msg, err = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle('err', err);
}

// ---------- 분석 ----------
async function handleFile(file) {
  if (!file.type.startsWith('image/')) { setStatus('이미지 파일만 올릴 수 있습니다.', true); return; }
  let bitmap;
  try {
    bitmap = await loadImage(file);
  } catch {
    setStatus('사진을 열지 못했습니다. JPG나 PNG 파일로 다시 시도해 주세요.', true);
    return;
  }
  await analyze(bitmap);
}

async function analyze(bitmap) {
  setStatus('얼굴 모델을 불러오는 중입니다. 처음 한 번은 몇 초 걸립니다.');
  try {
    const found = await detectLandmarks(bitmap, msg => setStatus(msg));
    if (!found) {
      setStatus('얼굴을 찾지 못했습니다. 얼굴이 크게 나온 정면 사진을 올려 주세요.', true);
      return;
    }
    const metrics = computeMetrics(found.points);
    const result = interpret(metrics);
    if (found.faceCount > 1) result.warnings.unshift(`얼굴이 ${found.faceCount}개 보여 가장 큰 얼굴로 풀이했습니다.`);
    current = { bitmap, points: found.points, metrics, result, isSample: false };
    render();
    setStatus('풀이를 마쳤습니다. 사진은 이 기기 밖으로 나가지 않았습니다.');
    $('actions').hidden = false;
  } catch (e) {
    console.error(e);
    setStatus('분석 중 문제가 생겼습니다. 페이지를 새로 고친 뒤 다시 시도해 주세요.', true);
  }
}

/** 너무 큰 사진은 1600px로 줄여 속도를 맞춥니다. EXIF 회전은 브라우저가 처리합니다. */
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
  } finally {
    URL.revokeObjectURL(url);
  }
}

function showSample() {
  const metrics = computeMetrics(SAMPLE_FACE);
  current = { bitmap: null, points: SAMPLE_FACE, metrics, result: interpret(metrics), isSample: true };
  $('actions').hidden = true;
  setStatus('');
  render();
}

// ---------- 그리기 ----------
const tok = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function render() {
  drawCanvas();
  renderReading();
}

function drawCanvas() {
  const { bitmap, points, metrics } = current;
  const ctx = canvas.getContext('2d');
  let crop;
  if (bitmap) {
    // 얼굴 주변만 잘라서 보여 줌
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const w = maxX - minX, h = maxY - minY;
    const side = Math.max(w, h) * 1.7;
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2 - h * 0.12;
    crop = { x: cx - side / 2, y: cy - side / 2, w: side, h: side * 1.05 };
    canvas.width = 800; canvas.height = 840;
  } else {
    crop = { x: 0, y: 0, w: SAMPLE_SIZE.w, h: SAMPLE_SIZE.h };
    canvas.width = 800; canvas.height = 840;
  }
  const s = canvas.width / crop.w;
  const T = p => ({ x: (p.x - crop.x) * s, y: (p.y - crop.y) * s });

  ctx.fillStyle = tok('--paper');
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (bitmap) {
    ctx.drawImage(bitmap, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, crop.h * s);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 삼정 기준선: 눈썹 · 코끝 · 턱 (얼굴 기울기에 맞춰 회전)
  const ang = metrics.rollDeg * Math.PI / 180;
  const dir = { x: Math.cos(ang), y: Math.sin(ang) };
  const anchors = [
    { p: { x: (points[19].x + points[24].x) / 2, y: (points[19].y + points[24].y) / 2 }, label: '눈썹' },
    { p: points[33], label: '코끝' },
    { p: points[8], label: '턱' },
  ];
  const guide = bitmap ? '#9CC0FF' : tok('--guide');
  ctx.strokeStyle = guide; ctx.fillStyle = guide;
  ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
  ctx.font = `500 22px ${tok('--mono') || 'monospace'}`;
  const L = canvas.width * 1.5;
  for (const a of anchors) {
    const c = T(a.p);
    ctx.beginPath();
    ctx.moveTo(c.x - dir.x * L, c.y - dir.y * L);
    ctx.lineTo(c.x + dir.x * L, c.y + dir.y * L);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // 중정 · 하정 표시
  const top = T(anchors[0].p), mid = T(anchors[1].p), bot = T(anchors[2].p);
  const bx = 34;
  ctx.lineWidth = 2;
  for (const [a, b, label] of [[top, mid, '中停'], [mid, bot, '下停']]) {
    ctx.beginPath(); ctx.moveTo(bx, a.y); ctx.lineTo(bx, b.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx - 8, a.y); ctx.lineTo(bx + 8, a.y); ctx.moveTo(bx - 8, b.y); ctx.lineTo(bx + 8, b.y); ctx.stroke();
    ctx.save();
    ctx.font = `800 26px ${tok('--display')}`;
    ctx.fillText(label, bx + 14, (a.y + b.y) / 2 + 9);
    ctx.restore();
  }

  // 이목구비 윤곽
  const seal = bitmap ? '#FF8A6E' : tok('--seal');
  ctx.strokeStyle = seal; ctx.lineWidth = bitmap ? 2.5 : 3; ctx.lineJoin = 'round';
  const path = (from, to, close = false) => {
    ctx.beginPath();
    for (let i = from; i <= to; i++) {
      const q = T(points[i]);
      i === from ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y);
    }
    if (close) ctx.closePath();
    ctx.stroke();
  };
  path(0, 16); path(17, 21); path(22, 26); path(27, 30); path(31, 35);
  path(36, 41, true); path(42, 47, true); path(48, 59, true); path(60, 67, true);
  ctx.fillStyle = seal;
  for (const p of points) {
    const q = T(p);
    ctx.beginPath(); ctx.arc(q.x, q.y, bitmap ? 2.5 : 3, 0, Math.PI * 2); ctx.fill();
  }
}

// ---------- 풀이 ----------
const GROUP_HANJA = { 삼정: '三停', 눈: '眼', 눈썹: '眉', 코: '鼻', 입: '口' };
const fmt = (v, d = 2) => (Math.round(v * 10 ** d) / 10 ** d).toFixed(d);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function gauge(f) {
  const [lo, hi] = f.scale;
  const pct = v => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
  const cuts = f.bands.filter(b => b.below !== undefined).map(b => b.below);
  const edges = [lo, ...cuts, hi];
  let segs = '';
  for (let i = 0; i < edges.length - 1; i++) {
    const a = pct(edges[i]), b = pct(edges[i + 1]);
    segs += `<span class="seg${i === f.band.index ? ' on' : ''}" style="left:${a}%;width:${b - a}%"></span>`;
  }
  const ticks = cuts.map(c => `<span class="tick" style="left:${pct(c)}%"></span>`).join('');
  const digits = Math.abs(hi - lo) >= 5 ? 1 : 2;
  return `<div class="gauge" aria-label="${esc(f.unit)} ${fmt(f.value, digits)}">
      <div class="track">${segs}${ticks}<span class="dot" style="left:${pct(f.value)}%"></span></div>
      <div class="val"><span>${esc(f.unit)}</span><b>${fmt(f.value, digits)}</b></div>
    </div>`;
}

function renderReading() {
  const { result, metrics, isSample } = current;
  const { face, features, symmetry, warnings, summary } = result;
  const groups = [...new Set(features.map(f => f.group))];

  const elements = face.all
    .slice().sort((a, b) => b.share - a.share)
    .map((t, i) => `<div class="el${i === 0 ? ' top' : ''}">
        <span class="nm">${t.name} ${t.hanja}</span>
        <span class="bar"><b style="width:${(t.share * 100).toFixed(1)}%"></b></span>
        <span class="pc">${Math.round(t.share * 100)}%</span>
      </div>`).join('');

  const groupHtml = groups.map(g => `
    <div class="group">
      <h3>${g} <small>${GROUP_HANJA[g] || ''}</small></h3>
      ${features.filter(f => f.group === g).map(f => `
        <div class="feat">
          <div>
            <div class="head">
              <span class="palace">${esc(f.hanja)}</span>
              <span class="name">${esc(f.name)}</span>
              <span class="tag">${esc(f.band.tag)}</span>
            </div>
            <p>${esc(f.band.text)}</p>
            <p class="note">${esc(f.note)}</p>
          </div>
          ${gauge(f)}
        </div>`).join('')}
    </div>`).join('');

  const rawRows = Object.entries(metrics)
    .filter(([k]) => k !== 'guides')
    .map(([k, v]) => `<tr><td>${k}</td><td>${fmt(v, 3)}</td></tr>`).join('');

  reading.innerHTML = `
    <div><span class="badge${isSample ? '' : ' mine'}">${isSample ? '예시 · 여러 얼굴의 평균 윤곽 · 사진을 올리면 바뀝니다' : '내 사진 분석 결과 · ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span></div>
    ${warnings.map(w => `<p class="warn">${esc(w)}</p>`).join('')}
    <div class="verdict">
      <h2><em>${face.primary.name}</em> ${face.primary.hanja} · ${esc(face.primary.shape)}</h2>
      <p class="summary">${esc(summary)}</p>
      <p class="facetext">${esc(face.primary.text)}</p>
      <div class="elements" aria-label="오행형 근접도">${elements}</div>
    </div>
    <div class="standouts">
      <h3>가장 두드러진 특징</h3>
      <ol>${result.standouts.map(f => `<li><span class="palace">${esc(f.hanja)}</span> <b>${esc(f.band.tag)}</b><span>${esc(f.band.text)}</span></li>`).join('')}</ol>
    </div>
    ${groupHtml}
    <div class="group">
      <h3>좌우 균형 <small>對稱</small></h3>
      <div class="feat">
        <div>
          <div class="head"><span class="tag">${esc(symmetry.tag)}</span></div>
          <p>${esc(symmetry.text)}</p>
        </div>
        ${gauge({ scale: [0, 100], bands: [{ below: 70 }, { below: 85 }, {}], band: { index: symmetry.value < 70 ? 0 : symmetry.value < 85 ? 1 : 2 }, value: symmetry.value, unit: '대칭 점수' })}
      </div>
    </div>
    <details class="raw panel">
      <summary>측정값 전체 보기</summary>
      <div class="tablewrap"><table><thead><tr><th>항목</th><th>값</th></tr></thead><tbody>${rawRows}</tbody></table></div>
    </details>`;
}

// 테마가 바뀌면 캔버스 색을 다시 칠함
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => current && drawCanvas());
new MutationObserver(() => current && drawCanvas()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

showSample();
