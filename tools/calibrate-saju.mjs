// 무작위 생년월일시로 사주 해석 분포를 점검하는 도구: node tools/calibrate-saju.mjs
import { computePillars } from '../js/saju/calendar.js';
import { analyzeSaju } from '../js/saju/analyze.js';
let seed = 42; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const N = +(process.argv[2] || 20000);
const ratios = [], tally = {};
const inc = (k) => tally[k] = (tally[k] || 0) + 1;
for (let i = 0; i < N; i++) {
  const t = Date.UTC(1940, 0, 1) + rnd() * (Date.UTC(2015, 0, 1) - Date.UTC(1940, 0, 1));
  const d = new Date(t);
  const chart = computePillars({ calendar: 'solar', year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes(), gender: rnd() < .5 ? 'M' : 'F', place: 'seoul' });
  const s = analyzeSaju(chart, new Date('2026-10-08'));
  ratios.push(s.strength.ratio);
  inc('strength:' + s.strength.key); inc('yong:' + s.yongsin.group); inc('dominant:' + s.dominant.id);
  s.groups.forEach(g => inc(`level:${g.id}:${g.level}`));
  s.shinsal.forEach(x => inc('sal:' + x.key));
  inc('excessCount:' + s.excess.length); inc('lackCount:' + s.lack.length);
}
ratios.sort((a, b) => a - b);
const q = p => ratios[Math.floor(p * ratios.length)].toFixed(3);
console.log('support ratio q33', q(1 / 3), 'q50', q(.5), 'q67', q(2 / 3));
for (const k of Object.keys(tally).sort()) console.log(k.padEnd(28), (tally[k] / N * 100).toFixed(1) + '%');
