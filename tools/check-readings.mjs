// 동작 검증: 같은 일주·다른 월주/시주, 시간 모름, 재현성, 전 주제, 경계 입력.
// node tools/check-readings.mjs [--examples] — 고정 문구 스냅샷 대신 실제 입력 변화로 검사합니다.
import assert from 'node:assert/strict';
import { computePillars, yearPillar } from '../js/saju/calendar.js?v=18';
import { analyzeSaju, analyzeYear } from '../js/saju/analyze.js?v=18';
import { buildReading, yearReading, mbtiReading } from '../js/saju/reading.js?v=18';
import { combine } from '../js/combined.js?v=18';
import { buildCards } from '../js/deck.js?v=18';
import { readingBody } from '../js/view-reading.js?v=18';

const TODAY = new Date('2026-11-03T12:00:00+09:00');
const base = { calendar: 'solar', year: 1990, month: 5, day: 15, hour: 10, minute: 45, gender: 'M', place: 'seoul', mbti: 'ENFP' };
const run = (change = {}) => {
  const input = { ...base, ...change };
  const chart = computePillars(input);
  const saju = analyzeSaju(chart, TODAY);
  const years = [2026, 2027].map(y => analyzeYear(saju, yearPillar(y)));
  const total = combine(saju, null, years);
  return { input, chart, saju, face: null, total, years: total.years, faceImage: null };
};
// 근거의 숫자·한자만 바뀐 결과는 새 풀이로 세지 않습니다.
const prose = r => [r.outside, r.inside, r.future, r.pattern].map(p => [p.lead, p.text, p.caution, p.action].filter(Boolean).join(' ')).join('\n').replace(/[0-9一-鿿]+/g, '');
const hourResults = Array.from({ length: 12 }, (_, i) => run({ hour: i * 2 }));
assert.equal(new Set(hourResults.map(c => c.saju.cells.hour.branch.char)).size, 12);
assert.equal(new Set(hourResults.map(c => c.saju.cells.day.stem.char + c.saju.cells.day.branch.char)).size, 1, '시간 비교 시 일주를 고정');
assert.equal(new Set(hourResults.map(c => prose(c.total.reading))).size, 12, '12시진의 풀이 본문이 모두 구분돼야 함');
const sameHourA = run({ hour: 10, minute: 40 });
const sameHourB = run({ hour: 10, minute: 50 });
assert.equal(prose(sameHourA.total.reading), prose(sameHourB.total.reading), '같은 사주를 분 단위로 임의 차별화하지 않음');
assert.deepEqual(buildReading(sameHourA.saju), buildReading(sameHourA.saju), '동일 입력은 재현 가능');
assert.equal(prose(run({ name: '다른이름', mbti: 'ISTJ' }).total.reading), prose(run().total.reading), '이름·MBTI로 사주 풀이를 무작위 변경하지 않음');

const unknown = run({ hour: null });
assert.equal(unknown.total.reading.hourGod, null);
assert.equal(unknown.saju.cells.hour, undefined);
assert.match(unknown.total.reading.future.lead, /시각을 몰라/);
assert.ok(!unknown.total.reading.links.some(l => l.a === 'hour' || l.b === 'hour'));

const monthly = Array.from({ length: 12 }, (_, i) => run({ month: i + 1 }));
assert.equal(new Set(monthly.map(c => c.saju.cells.month.branch.char)).size, 12);
assert.equal(new Set(monthly.map(c => c.total.reading.outside.text)).size, 12);

const targetIlju = run().saju.cells.day.stem.char + run().saju.cells.day.branch.char;
const sameIlju = [];
// 60日 주기를 따라 같은 일주인 실제 날짜를 수집해 계절이 바뀌는지 확인합니다.
for (let offset = -720; offset <= 720; offset += 60) {
  const date = new Date(Date.UTC(1990, 4, 15 + offset));
  const c = run({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() });
  assert.equal(c.saju.cells.day.stem.char + c.saju.cells.day.branch.char, targetIlju);
  sameIlju.push(c);
}
const seasonVariations = new Set(sameIlju.map(c => c.total.reading.outside.lead + c.total.reading.outside.text)).size;
assert.ok(seasonVariations >= 8, '같은 일주라도 계절과 월주가 달라지면 본문이 바뀜');

let decks = 0;
const topics = ['love', 'money', 'work', 'year', 'self'];
const fixtures = [...hourResults, ...monthly, unknown, run({ calendar: 'lunar', year: 2023, month: 2, day: 1, leap: true }),
  run({ year: 1988, month: 5, day: 8, hour: 3 }), run({ hour: 23, ziMode: 'same' }), run({ hour: 23, ziMode: 'split' })];
for (const ctx of fixtures) for (const topic of topics) {
  const cards = buildCards({ ...ctx, input: { ...ctx.input, topic, name: '<img src=x onerror=alert(1)>' } });
  const html = cards.map(c => c.html).join('');
  assert.ok(!/undefined|NaN|\[object Object\]/.test(html), topic + ' 빈 값 검사');
  assert.ok(!html.includes('<img src=x'), '이름은 escape되어야 함');
  assert.equal(cards.filter(c => c.id === 'topic').length, 4);
  assert.ok(cards.some(c => c.id === 'birth-month'));
  assert.ok(cards.some(c => c.id === 'birth-hour'));
  for (const c of cards.filter(c => ['birth-month', 'birth-hour', 'topic'].includes(c.id))) {
    assert.match(c.html, /읽은 자리|절기 기준|앞으로 10년/);
    const paragraphs = [...c.html.matchAll(/<p(?:\s[^>]*)?>(.*?)<\/p>/gs)].map(m => m[1].replace(/<[^>]*>/g, '').trim()).filter(Boolean);
    assert.equal(paragraphs.length, new Set(paragraphs).size, '카드 안에서 같은 문단을 반복하지 않음');
  }
  decks++;
}

const yearDetails = monthly.map(c => yearReading(c.saju, analyzeYear(c.saju, yearPillar(2026)), c.total.reading));
assert.ok(new Set(yearDetails.map(y => y.text)).size >= 8, '같은 해도 원국에 따라 설명이 다름');
for (const a of ['E', 'I']) for (const b of ['S', 'N']) for (const c of ['T', 'F']) for (const d of ['J', 'P']) {
  const blend = mbtiReading(run().saju, a + b + c + d);
  assert.ok(blend.text && blend.action && !/undefined|NaN/.test(JSON.stringify(blend)));
}
for (const c of monthly) {
  const y = c.total.years[0];
  for (const hit of yearReading(c.saju, y, c.total.reading).hits) assert.ok(c.saju.cells[hit.key], '없는 시주를 연도 해석에 넣지 않음');
}
const escaped = readingBody({ lead: '<script>bad</script>', text: '&', caution: '"', action: '<img>', evidence: '<>' });
assert.ok(!escaped.includes('<script>'));
assert.match(escaped, /&lt;script/);

console.log(`PASS: 12시진 12종 · 12절기월 12종 · 같은 ${targetIlju}일주 ${sameIlju.length}건에서 월주 풀이 ${seasonVariations}종 · ${decks}개 주제 덱`);
console.log('PASS: 시각 모름, 분 단위 동일 사주, 재현성, 이름/MBTI 독립, 음력 윤달, 서머타임, 야자시, 원국별 세운, HTML escape');
if (process.argv.includes('--examples')) for (const hour of [0, 8, 16]) {
  const c = hourResults[hour / 2];
  console.log(JSON.stringify({ birth: `${base.year}-${base.month}-${base.day} ${String(hour).padStart(2, '0')}:45`,
    headline: c.total.reading.headline, future: c.total.reading.future, pattern: c.total.reading.pattern }, null, 2));
}
