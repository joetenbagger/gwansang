// 궁합 점수 분포 점검: node tools/calibrate-gunghap.mjs
import { computePillars, yearPillar } from '../js/saju/calendar.js?v=14';
import { analyzeSaju, analyzeYear } from '../js/saju/analyze.js?v=14';
import { gunghap } from '../js/gunghap.js?v=14';
import { TYPES } from '../js/mbti.js?v=14';
let seed = 5; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const person = () => { const d = new Date(Date.UTC(1960, 0, 1) + rnd() * (Date.UTC(2005, 0, 1) - Date.UTC(1960, 0, 1)));
  const saju = analyzeSaju(computePillars({ calendar: 'solar', year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: rnd() < .2 ? null : d.getUTCHours(), minute: 0, gender: 'M', place: 'seoul' }));
  return { name: ['지호', '하늘', ''][Math.floor(rnd() * 3)], saju, mbti: rnd() < .6 ? TYPES[Math.floor(rnd() * 16)] : null, years: [analyzeYear(saju, yearPillar(2026))] }; };
const N = +(process.argv[2] || 3000); const sc = []; const bad = /undefined|NaN|null/; let probs = 0; const vt = {};
for (let i = 0; i < N; i++) { const g = gunghap(person(), person(), ['lover', 'friend', 'work'][i % 3]); sc.push(g.score); vt[g.verdict.title] = (vt[g.verdict.title] || 0) + 1;
  const txt = JSON.stringify({ ...g, mbti: g.mbti || {} }); if (bad.test(txt)) { probs++; if (probs < 3) console.log('BAD', txt.match(bad)[0], txt.slice(0, 300)); } }
sc.sort((a, b) => a - b); const q = p => sc[Math.floor(p * sc.length)];
console.log('min', sc[0], 'q10', q(.1), 'q25', q(.25), 'median', q(.5), 'q75', q(.75), 'q90', q(.9), 'max', sc[sc.length - 1], 'problems', probs);
console.log(Object.entries(vt).map(([k, v]) => `${k} ${(v / N * 100).toFixed(1)}%`).join(' · '));
