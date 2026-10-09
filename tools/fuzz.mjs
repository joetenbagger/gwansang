// 무작위 입력으로 풀이 문장을 만들어 빈 값(undefined·NaN 등)이나 오류가 없는지 확인: node tools/fuzz.mjs
import { computePillars, yearPillar } from '../js/saju/calendar.js?v=8';
import { analyzeSaju, analyzeYear } from '../js/saju/analyze.js?v=8';
import { combine } from '../js/combined.js?v=8';
import { renderSaju } from '../js/view-saju.js?v=8';
import { renderTotal } from '../js/view-total.js?v=8';
import { renderFace } from '../js/view-face.js?v=8';
import { computeMetrics } from '../js/metrics.js?v=8';
import { interpret } from '../js/rules.js?v=8';
import { SAMPLE_FACE } from '../js/sample-face.js?v=8';
import { buildCards } from '../js/deck.js?v=8';
let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const jitterFace = () => SAMPLE_FACE.map(p => ({ x: p.x + (rnd() - .5) * 14, y: p.y + (rnd() - .5) * 14 }));
const bad = /undefined|NaN|null|\[object/;
let n = 0, fails = 0;
const N = +(process.argv[2] || 3000);
for (let i = 0; i < N; i++) {
  const t = Date.UTC(1925, 0, 1) + rnd() * (Date.UTC(2024, 0, 1) - Date.UTC(1925, 0, 1));
  const d = new Date(t);
  const lunar = rnd() < .2;
  const input = { calendar: lunar ? 'lunar' : 'solar', leap: false, year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: lunar ? 1 + Math.floor(rnd() * 29) : d.getUTCDate(),
    hour: rnd() < .15 ? null : d.getUTCHours(), minute: d.getUTCMinutes(), gender: rnd() < .5 ? 'M' : 'F', place: ['seoul', 'busan', 'jeju', 'none'][Math.floor(rnd() * 4)], ziMode: rnd() < .5 ? 'split' : 'same' };
  try {
    const chart = computePillars(input);
    const saju = analyzeSaju(chart, new Date('2026-10-08'));
    const years = [analyzeYear(saju, yearPillar(2026)), analyzeYear(saju, yearPillar(2027))];
    const withFace = rnd() < .6;
    const face = withFace ? { bitmap: null, points: jitterFace(), metrics: null, result: null } : null;
    if (face) { face.metrics = computeMetrics(face.points); face.result = interpret(face.metrics); }
    const total = combine(saju, face?.result || null, years);
    const topic = ['love', 'money', 'work', 'year', 'self'][Math.floor(rnd() * 5)];
    const cards = buildCards({ input: { ...input, topic, name: rnd() < .5 ? '지호' : '' }, chart, saju, face, total, years: total.years, faceImage: null });
    const html = renderTotal(total, { hasFace: !!face, name: '' }) + renderSaju(saju, chart, total.years) + (face ? renderFace(face) : '') + cards.map(c => c.html).join('');
    const m = html.match(bad);
    if (m) { fails++; if (fails < 5) console.log('BAD', m[0], JSON.stringify(input), html.slice(Math.max(0, m.index - 120), m.index + 40)); }
    n++;
  } catch (e) { fails++; if (fails < 5) console.log('ERR', e.message, JSON.stringify(input)); }
}
console.log(`${n}/${N} ok, ${fails} problems`);
