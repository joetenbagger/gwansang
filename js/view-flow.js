import { esc } from './util.js?v=18';

export function nearFlowChart(flow) {
  if (!flow.points.some(p => p.period)) return '';
  const W = 320, H = 145, left = 15, right = 14, top = 23, bottom = 33;
  const x = year => left + (year - flow.year) * (W - left - right) / 5;
  const y = score => top + (4 - Math.max(-4, Math.min(4, score))) * (H - top - bottom) / 8;
  // 대운 안에서 해마다 운이 출렁이는 것처럼 보이지 않게 계단으로 표시합니다.
  let path = '', last = null;
  for (const p of flow.points) {
    if (!p.period) { last = null; continue; }
    path += last ? ` H${x(p.year).toFixed(1)} V${y(p.score).toFixed(1)}` : ` M${x(p.year).toFixed(1)},${y(p.score).toFixed(1)}`;
    last = p;
  }
  const now = flow.points[0];
  return `<svg class="flow near-flow" viewBox="0 0 ${W} ${H}" role="img" aria-label="${flow.year}년부터 ${flow.horizon}년까지 대운 흐름">
    <line x1="${left}" x2="${W - right}" y1="${y(0)}" y2="${y(0)}" stroke="var(--rule)" stroke-dasharray="3 3"/>
    <path d="${path.trim()}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/>
    ${now.period ? `<circle cx="${x(flow.year)}" cy="${y(now.score)}" r="5" fill="var(--seal)"/><text x="${x(flow.year)}" y="${y(now.score) - 11}" text-anchor="start" font-size="11" fill="var(--seal)">지금</text>` : ''}
    ${flow.transition ? `<line x1="${x(flow.next.startYear)}" x2="${x(flow.next.startYear)}" y1="${top - 5}" y2="${H - bottom + 5}" stroke="var(--seal)" stroke-dasharray="3 3"/><text x="${x(flow.next.startYear)}" y="12" text-anchor="${flow.next.startYear === flow.horizon ? 'end' : 'middle'}" font-size="11" fill="var(--seal)">전환</text>` : ''}
    ${flow.points.map(p => `<text x="${x(p.year)}" y="${H - 10}" text-anchor="middle" font-size="10.5" fill="${p.year === flow.year ? 'var(--seal)' : 'var(--ink-2)'}">${p.year}</text>`).join('')}
  </svg>`;
}

export function fullLifeChart(flow) {
  const list = flow.periods;
  if (!list.length) return '';
  const W = 320, H = 145, left = 6, top = 23, bottom = 31;
  const x = i => left + (i + .5) * (W - 2 * left) / list.length;
  const y = score => top + (4 - Math.max(-4, Math.min(4, score))) * (H - top - bottom) / 8;
  const path = list.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.score).toFixed(1)}`).join(' ');
  return `<svg class="flow full-life-flow" viewBox="0 0 ${W} ${H}" role="img" aria-label="전체 대운 흐름, 각 구간의 시작 연도">
    <line x1="${left}" x2="${W - left}" y1="${y(0)}" y2="${y(0)}" stroke="var(--rule)" stroke-dasharray="3 3"/>
    <path d="${path}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/>
    ${list.map((d, i) => {
      const now = d === flow.current;
      return `<circle cx="${x(i)}" cy="${y(d.score)}" r="${now ? 5 : 3}" fill="${now ? 'var(--seal)' : 'var(--paper-2)'}" stroke="var(--ink)"/>
        ${now ? `<text x="${x(i)}" y="${y(d.score) - 11}" text-anchor="middle" font-size="11" fill="var(--seal)">지금</text>` : ''}
        <text x="${x(i)}" y="${H - 13}" text-anchor="middle" font-size="9.5" fill="${now ? 'var(--seal)' : 'var(--ink-2)'}">${d.startYear}</text>`;
    }).join('')}
  </svg>`;
}

export function lifeFlowBody(flow, { history = true } = {}) {
  return `<p class="life-now">${esc(flow.ageLabel)}</p>
    <h2>${esc(flow.title)}</h2>
    <p class="lead">${esc(flow.text)}</p>
    ${nearFlowChart(flow)}
    ${flow.transition ? `<div class="life-transition"><b>${esc(flow.transition.label)}</b><p>${esc(flow.transition.text)} ${esc(flow.transition.comparison)}</p></div>` : `<p>${esc(flow.outlook)}</p>`}
    ${flow.transition && flow.outlook ? `<p>${esc(flow.outlook)}</p>` : ''}
    <p class="but"><span>다만</span>${esc(flow.caution)}</p>
    <p class="reading-action"><b>지금 해 보면 좋은 것</b>${esc(flow.action)}</p>
    <p class="reading-basis">${esc(flow.basis)}. 같은 대운 안에서는 큰 기운이 이어져 선이 평평해요.</p>
    ${history && flow.periods.length ? `<details class="life-history"><summary>전체 인생 흐름 보기</summary>${fullLifeChart(flow)}<p class="hint">각 점 아래는 대운이 시작되는 연도예요. 현재 구간은 ‘지금’으로 표시했어요.</p></details>` : ''}`;
}
