// celeb-match.js — 나와 일주가 같거나 기운이 비슷한 유명인 찾기
import { CELEBS } from './celebs.js?v=14';
import { computePillars } from './saju/calendar.js?v=14';
import { analyzeSaju } from './saju/analyze.js?v=14';
import { ELEMENTS } from './saju/data.js?v=14';

let cache = null;
function celebSajus() {
  if (cache) return cache;
  cache = CELEBS.map(([name, field, date]) => {
    const [y, m, d] = date.split('-').map(Number);
    try {
      const saju = analyzeSaju(computePillars({ calendar: 'solar', year: y, month: m, day: d, hour: null, gender: 'M', place: 'none' }));
      return { name, field, date, saju, ilju: saju.cells.day.stem.char + saju.cells.day.branch.char };
    } catch { return null; }
  }).filter(Boolean);
  return cache;
}

const dist = (a, b) => ELEMENTS.reduce((s, e) => s + Math.abs(a.powerPct[e] - b.powerPct[e]), 0);

export function findCelebs(saju, k = 3) {
  const list = celebSajus();
  const ilju = saju.cells.day.stem.char + saju.cells.day.branch.char;
  const same = list.filter(c => c.ilju === ilju);
  const sameStem = list.filter(c => c.ilju !== ilju && c.saju.dayStem === saju.dayStem)
    .map(c => ({ ...c, d: dist(c.saju, saju) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k);
  return { ilju, same: same.slice(0, 6), similar: sameStem };
}

export function iljuCount() { return new Set(celebSajus().map(c => c.ilju)).size; }
