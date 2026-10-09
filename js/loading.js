// loading.js — 분석 중 연출. 계산은 이미 끝난 상태에서 결과를 한 단계씩 보여 줍니다.
import { STEMS, BRANCHES, EL, ELEMENTS, GENERATES } from './saju/data.js?v=10';
import { LOADING_STEPS } from './copy.js?v=10';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(r => setTimeout(r, reduce ? Math.min(ms, 250) : ms));
const ease = t => 1 - Math.pow(1 - t, 3);
const ALL_HANJA = [...Object.keys(STEMS), ...Object.keys(BRANCHES)];
const GLOW = { wood: '#6BC48C', fire: '#F07A5F', earth: '#E4B456', metal: '#D3D7DE', water: '#7FA6E8' };

function tween(ms, fn) {
  return new Promise(resolve => {
    if (reduce) { fn(1); resolve(); return; }
    const t0 = performance.now();
    const tick = now => {
      const t = Math.min(1, (now - t0) / ms);
      fn(t);
      if (t < 1) requestAnimationFrame(tick); else resolve();
    };
    requestAnimationFrame(tick);
  });
}

// 1) 여덟 글자 맞추기
async function pillarsScene(stage, chart) {
  const order = [['hour', '시'], ['day', '일'], ['month', '월'], ['year', '년']];
  stage.innerHTML = `<div class="slots fade">${order.map(([k, label]) => `
    <div class="col" data-k="${k}"><small>${label}</small><span></span><span></span></div>`).join('')}</div>`;
  const cells = [];
  for (const [k] of order) {
    const p = chart.pillars[k];
    const [s, b] = stage.querySelectorAll(`[data-k="${k}"] span`);
    cells.push({ el: s, ch: p?.stem, elem: p && STEMS[p.stem].el, k });
    cells.push({ el: b, ch: p?.branch, elem: p && BRANCHES[p.branch].el, k });
  }
  let running = true;
  const spin = () => {
    for (const c of cells) if (!c.done) c.el.textContent = ALL_HANJA[(Math.random() * ALL_HANJA.length) | 0];
    if (running) setTimeout(spin, 70);
  };
  if (!reduce) spin();
  await wait(700);
  // 년 → 월 → 일 → 시 순서로 자리 잡기
  for (const k of ['year', 'month', 'day', 'hour']) {
    for (const c of cells.filter(x => x.k === k)) {
      c.done = true;
      if (c.ch) { c.el.textContent = c.ch; c.el.dataset.el = c.elem; c.el.classList.add('set'); }
      else { c.el.textContent = '?'; c.el.classList.add('blank'); }
      await wait(170);
    }
  }
  running = false;
  await wait(500);
}

// 2) 다섯 기운: 상생 순서로 놓인 다섯 원이 세력만큼 차오름
async function elementsScene(stage, saju) {
  const cx = 170, cy = 172, R = 112;
  const pos = ELEMENTS.map((e, i) => {
    const a = -Math.PI / 2 + i * (2 * Math.PI / 5);
    return { e, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });
  const svg = `<svg class="fade" viewBox="0 0 340 340" aria-label="오행 분포">
    ${pos.map((p, i) => { const q = pos[(i + 1) % 5]; return `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="#4A3C25" stroke-width="1" />`; }).join('')}
    ${pos.map((p, i) => { const q = pos[(i + 2) % 5]; return `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="#2E2517" stroke-width="1" stroke-dasharray="3 4" />`; }).join('')}
    ${pos.map(p => `<circle data-e="${p.e}" cx="${p.x}" cy="${p.y}" r="0" fill="${GLOW[p.e]}" fill-opacity=".18" stroke="${GLOW[p.e]}" stroke-width="1.5" />
      <text x="${p.x}" y="${p.y + 9}" text-anchor="middle" font-family="Song Myung, serif" font-size="26" fill="${GLOW[p.e]}">${EL[p.e].hanja}</text>
      <text data-pct="${p.e}" x="${p.x}" y="${p.y + (p.y < cy ? -42 : 52)}" text-anchor="middle" font-size="13" fill="#9F8E6A"></text>`).join('')}
  </svg>`;
  stage.innerHTML = svg;
  const circles = Object.fromEntries(ELEMENTS.map(e => [e, stage.querySelector(`circle[data-e="${e}"]`)]));
  const labels = Object.fromEntries(ELEMENTS.map(e => [e, stage.querySelector(`[data-pct="${e}"]`)]));
  await wait(200);
  await tween(1600, t => {
    const k = ease(t);
    for (const e of ELEMENTS) {
      const r = 14 + saju.powerPct[e] * 95;
      circles[e].setAttribute('r', (r * k).toFixed(1));
      labels[e].textContent = `${Math.round(saju.powerPct[e] * 100 * k)}%`;
    }
  });
  // 필요한 기운(용신) 강조
  const y = circles[saju.yongsin.el];
  y.setAttribute('stroke-width', '3');
  y.setAttribute('fill-opacity', '.4');
  await wait(800);
}

// 3) 얼굴 선 따라가기
async function faceScene(stage, face) {
  stage.innerHTML = '<canvas class="fade" width="680" height="680" aria-label="얼굴 분석"></canvas>';
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const { bitmap, points } = face;
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const side = Math.max(maxX - minX, maxY - minY) * 1.55;
  const crop = { x: (minX + maxX) / 2 - side / 2, y: (minY + maxY) / 2 - side * 0.56, w: side, h: side };
  const s = canvas.width / crop.w;
  const T = p => ({ x: (p.x - crop.x) * s, y: (p.y - crop.y) * s });
  const contours = [[0, 16], [17, 21], [22, 26], [27, 30], [31, 35], [36, 41, 1], [42, 47, 1], [48, 59, 1], [60, 67, 1]];

  const draw = (scan, dotsK, lineK) => {
    ctx.fillStyle = '#16120D';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (bitmap) {
      ctx.save();
      ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 6, 0, Math.PI * 2); ctx.clip();
      ctx.globalAlpha = 0.55;
      ctx.drawImage(bitmap, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    ctx.strokeStyle = '#5B4A2E'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 6, 0, Math.PI * 2); ctx.stroke();
    // 스캔선
    if (scan < 1) {
      const y = scan * canvas.height;
      const g = ctx.createLinearGradient(0, y - 60, 0, y);
      g.addColorStop(0, 'rgba(243,222,156,0)'); g.addColorStop(1, 'rgba(243,222,156,.35)');
      ctx.fillStyle = g; ctx.fillRect(0, y - 60, canvas.width, 60);
      ctx.fillStyle = '#F3DE9C'; ctx.fillRect(0, y - 1, canvas.width, 2);
    }
    // 선
    ctx.strokeStyle = '#F07A5F'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    const total = contours.length;
    contours.forEach(([a, b, close], ci) => {
      const local = Math.max(0, Math.min(1, lineK * total - ci));
      if (!local) return;
      const idx = []; for (let i = a; i <= b; i++) idx.push(i); if (close) idx.push(a);
      const upto = Math.max(2, Math.ceil(idx.length * local));
      ctx.beginPath();
      idx.slice(0, upto).forEach((i, n) => { const q = T(points[i]); n ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); });
      ctx.stroke();
    });
    // 점
    const shown = Math.floor(points.length * dotsK);
    ctx.fillStyle = '#F3DE9C';
    for (let i = 0; i < shown; i++) { const q = T(points[i]); ctx.beginPath(); ctx.arc(q.x, q.y, 3.2, 0, Math.PI * 2); ctx.fill(); }
  };
  await tween(1100, t => draw(t, 0, 0));
  await tween(900, t => draw(1, ease(t), 0));
  await tween(1000, t => draw(1, 1, ease(t)));
  await wait(450);
}

// 4) 얼굴과 사주 겹치기 (사진이 없으면 일간만)
async function mergeScene(stage, saju, face) {
  const dm = saju.dayStem;
  const dmEl = STEMS[dm].el;
  const faceEl = face ? face.result.face.primary.id : null;
  stage.innerHTML = `<svg class="fade" viewBox="0 0 340 340">
    ${faceEl ? `<text id="mL" x="80" y="190" text-anchor="middle" font-family="Song Myung, serif" font-size="90" fill="${GLOW[faceEl]}">${EL[faceEl].hanja}</text>
      <text x="80" y="232" text-anchor="middle" font-size="13" fill="#9F8E6A">얼굴</text>` : ''}
    <text id="mR" x="${faceEl ? 260 : 170}" y="190" text-anchor="middle" font-family="Song Myung, serif" font-size="90" fill="${GLOW[saju.yongsin.el]}">${EL[saju.yongsin.el].hanja}</text>
    <text x="${faceEl ? 260 : 170}" y="232" text-anchor="middle" font-size="13" fill="#9F8E6A">필요한 기운</text>
    <text id="mC" x="170" y="205" text-anchor="middle" font-family="Song Myung, serif" font-size="150" fill="${GLOW[dmEl]}" opacity="0">${dm}</text>
  </svg>`;
  const L = stage.querySelector('#mL'), R = stage.querySelector('#mR'), C = stage.querySelector('#mC');
  await wait(500);
  await tween(900, t => {
    const k = ease(t);
    if (L) { L.setAttribute('x', 80 + 90 * k); L.setAttribute('opacity', 1 - k); }
    R.setAttribute('x', (faceEl ? 260 : 170) - (faceEl ? 90 : 0) * k); R.setAttribute('opacity', 1 - k);
    stage.querySelectorAll('text[font-size="13"]').forEach(x => x.setAttribute('opacity', 1 - k));
  });
  await tween(700, t => { C.setAttribute('opacity', ease(t)); C.setAttribute('font-size', 120 + 30 * ease(t)); });
  await wait(600);
}

export async function runLoading(root, { chart, saju, face }) {
  const stage = root.querySelector('#stage');
  const list = root.querySelector('#lsteps');
  const steps = ['pillars', 'elements', ...(face && !face.isSample ? ['face', 'merge'] : ['merge'])];
  const labels = { ...LOADING_STEPS, merge: face && !face.isSample ? LOADING_STEPS.merge : LOADING_STEPS.done };
  list.innerHTML = steps.map(s => `<li data-s="${s}"><i></i>${labels[s]}</li>`).join('');
  const mark = (s, cls) => { const li = list.querySelector(`[data-s="${s}"]`); li.classList.remove('on'); li.classList.add(cls); };
  for (const s of steps) {
    mark(s, 'on');
    if (s === 'pillars') await pillarsScene(stage, chart);
    if (s === 'elements') await elementsScene(stage, saju);
    if (s === 'face') await faceScene(stage, face);
    if (s === 'merge') await mergeScene(stage, saju, face && !face.isSample ? face : null);
    mark(s, 'done');
  }
  await wait(250);
}
