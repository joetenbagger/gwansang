// 사주→MBTI 점수 보정값(중앙값·척도) 계산: node tools/calibrate-mbti.mjs
import { computePillars } from '../js/saju/calendar.js';
import { analyzeSaju } from '../js/saju/analyze.js';
import { rawScores, predictMbti, decorrelate, DECOR } from '../js/mbti.js';
let seed = 11; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const N = +(process.argv[2] || 8000);
const raws = { EI: [], SN: [], TF: [], JP: [] }; const types = {};
const sajus = [];
for (let i = 0; i < N; i++) {
  const t = Date.UTC(1950, 0, 1) + rnd() * (Date.UTC(2010, 0, 1) - Date.UTC(1950, 0, 1)); const d = new Date(t);
  const s = analyzeSaju(computePillars({ calendar: 'solar', year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes(), gender: 'M', place: 'seoul' }));
  sajus.push(s);
  const r = rawScores(s); for (const k in r) raws[k].push(r[k]);
}
// 회귀계수(잔차화): 각 축을 앞선 축들로 설명되는 부분만큼 빼기
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const cov = (a, b) => { const ma = mean(a), mb = mean(b); return mean(a.map((x, i) => (x - ma) * (b[i] - mb))); };
const R = { EI: raws.EI.slice() };
const coef = { SN: {}, TF: {}, JP: {} };
const order = ['EI', 'SN', 'TF', 'JP'];
for (let i = 1; i < 4; i++) {
  const k = order[i]; let y = raws[k].slice();
  for (let j = 0; j < i; j++) { const x = R[order[j]]; const b = cov(y, x) / cov(x, x); coef[k][order[j]] = +b.toFixed(4); y = y.map((v, n) => v - b * x[n]); }
  R[k] = y;
}
console.log('DECOR', JSON.stringify(coef));
for (const k of order) raws[k] = R[k];
const out = {};
for (const k in raws) {
  const v = raws[k].sort((a, b) => a - b); const q = p => v[Math.floor(p * v.length)];
  out[k] = [+q(.5).toFixed(4), +((q(.75) - q(.25)) / 2.2).toFixed(4)];
}
console.log(JSON.stringify(out));
if (process.argv[3] === 'check') {
  for (const s of sajus) { const t = predictMbti(s).type; types[t] = (types[t] || 0) + 1; }
  console.log(Object.entries(types).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} ${(n / N * 100).toFixed(1)}%`).join('  '));
}
