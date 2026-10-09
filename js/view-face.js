// view-face.js — 관상: 측정선 그리기와 풀이 화면
import { SAMPLE_SIZE } from './sample-face.js?v=12';
import { esc, fmt, tok } from './util.js?v=12';

/** face = { bitmap|null, points, metrics, result, isSample } */
export function drawFace(canvas, face) {
  const { bitmap, points, metrics } = face;
  const ctx = canvas.getContext('2d');
  let crop;
  if (bitmap) {
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const w = maxX - minX, h = maxY - minY;
    const side = Math.max(w, h) * 1.7;
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2 - h * 0.12;
    crop = { x: cx - side / 2, y: cy - side / 2, w: side, h: side * 1.05 };
  } else {
    crop = { x: 0, y: 0, w: SAMPLE_SIZE.w, h: SAMPLE_SIZE.h };
  }
  canvas.width = 800; canvas.height = 840;
  const s = canvas.width / crop.w;
  const T = p => ({ x: (p.x - crop.x) * s, y: (p.y - crop.y) * s });

  ctx.fillStyle = tok('--paper');
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (bitmap) {
    ctx.drawImage(bitmap, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, crop.h * s);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 삼정 기준선
  const ang = metrics.rollDeg * Math.PI / 180;
  const dir = { x: Math.cos(ang), y: Math.sin(ang) };
  const anchors = [
    { x: (points[19].x + points[24].x) / 2, y: (points[19].y + points[24].y) / 2 },
    points[33], points[8],
  ];
  const guide = bitmap ? '#9CC0FF' : tok('--guide');
  ctx.strokeStyle = guide; ctx.fillStyle = guide;
  ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
  const L = canvas.width * 1.5;
  for (const a of anchors) {
    const c = T(a);
    ctx.beginPath(); ctx.moveTo(c.x - dir.x * L, c.y - dir.y * L); ctx.lineTo(c.x + dir.x * L, c.y + dir.y * L); ctx.stroke();
  }
  ctx.setLineDash([]);
  const [top, mid, bot] = anchors.map(T);
  const bx = 34;
  for (const [a, b, label] of [[top, mid, '中停'], [mid, bot, '下停']]) {
    ctx.beginPath(); ctx.moveTo(bx, a.y); ctx.lineTo(bx, b.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx - 8, a.y); ctx.lineTo(bx + 8, a.y); ctx.moveTo(bx - 8, b.y); ctx.lineTo(bx + 8, b.y); ctx.stroke();
    ctx.font = `800 26px ${tok('--display')}`;
    ctx.fillText(label, bx + 14, (a.y + b.y) / 2 + 9);
  }

  // 이목구비 윤곽
  const seal = bitmap ? '#FF8A6E' : tok('--seal');
  ctx.strokeStyle = seal; ctx.lineWidth = bitmap ? 2.5 : 3; ctx.lineJoin = 'round';
  const path = (from, to, close = false) => {
    ctx.beginPath();
    for (let i = from; i <= to; i++) { const q = T(points[i]); i === from ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y); }
    if (close) ctx.closePath();
    ctx.stroke();
  };
  path(0, 16); path(17, 21); path(22, 26); path(27, 30); path(31, 35);
  path(36, 41, true); path(42, 47, true); path(48, 59, true); path(60, 67, true);
  ctx.fillStyle = seal;
  for (const p of points) { const q = T(p); ctx.beginPath(); ctx.arc(q.x, q.y, bitmap ? 2.5 : 3, 0, Math.PI * 2); ctx.fill(); }
}

const GROUP_HANJA = { 삼정: '三停', 눈: '眼', 눈썹: '眉', 코: '鼻', 입: '口' };

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

export const caution = text => text ? `<p class="but"><span>다만</span>${esc(text)}</p>` : '';

export function renderFace(face) {
  const { result, metrics } = face;
  const { face: type, features, symmetry, warnings, summary } = result;
  const groups = [...new Set(features.map(f => f.group))];

  const elements = type.all.slice().sort((a, b) => b.share - a.share)
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
            ${caution(f.band.caution)}
            <p class="note">${esc(f.note)}</p>
          </div>
          ${gauge(f)}
        </div>`).join('')}
    </div>`).join('');

  const rawRows = Object.entries(metrics).filter(([k]) => k !== 'guides')
    .map(([k, v]) => `<tr><td>${k}</td><td>${fmt(v, 3)}</td></tr>`).join('');

  return `
    ${warnings.map(w => `<p class="warn">${esc(w)}</p>`).join('')}
    <div class="verdict">
      <h2><em>${type.primary.name}</em> ${type.primary.hanja} · ${esc(type.primary.shape)}</h2>
      <p class="summary">${esc(summary)}</p>
      <p class="facetext">${esc(type.primary.text)}</p>
      ${caution(type.primary.caution)}
      <div class="elements" aria-label="오행형 근접도">${elements}</div>
    </div>
    <div class="standouts">
      <h3>가장 두드러진 특징</h3>
      <ol>${result.standouts.map(f => `<li><span class="palace">${esc(f.hanja)}</span> <b>${esc(f.band.tag)}</b><span>${esc(f.band.text)}</span><span class="but"><span>다만</span>${esc(f.band.caution)}</span></li>`).join('')}</ol>
    </div>
    ${groupHtml}
    <div class="group">
      <h3>좌우 균형 <small>對稱</small></h3>
      <div class="feat">
        <div>
          <div class="head"><span class="tag">${esc(symmetry.tag)}</span></div>
          <p>${esc(symmetry.text)}</p>
          ${caution(symmetry.caution)}
        </div>
        ${gauge({ scale: [0, 100], bands: [{ below: 70 }, { below: 85 }, {}], band: { index: symmetry.value < 70 ? 0 : symmetry.value < 85 ? 1 : 2 }, value: symmetry.value, unit: '대칭 점수' })}
      </div>
    </div>
    <details class="raw panel">
      <summary>측정값 전체 보기</summary>
      <div class="tablewrap"><table><thead><tr><th>항목</th><th>값</th></tr></thead><tbody>${rawRows}</tbody></table></div>
    </details>`;
}
