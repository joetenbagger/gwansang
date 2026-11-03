// node tools/check-life-flow.mjs — 현재 시점, 실제 만나이, 가까운 전환만 표시하는지 검증합니다.
import assert from 'node:assert/strict';
import { computePillars } from '../js/saju/calendar.js?v=18';
import { analyzeSaju } from '../js/saju/analyze.js?v=18';
import { buildLifeFlow, fullAge, koreaDate } from '../js/saju/life-flow.js?v=18';
import { lifeFlowBody, nearFlowChart } from '../js/view-flow.js?v=18';

const TODAY = new Date('2026-11-04T12:00:00+09:00');
const sample = (input = {}, today = TODAY) => {
  const chart = computePillars({ calendar: 'solar', year: 1990, month: 5, day: 15, hour: 10, minute: 0, gender: 'M', place: 'seoul', ...input });
  const saju = analyzeSaju(chart, today);
  return { chart, saju, flow: buildLifeFlow(saju, chart, today) };
};
assert.deepEqual(koreaDate(new Date('2026-12-31T15:01:00Z')), { year: 2027, month: 1, day: 1 });
assert.equal(fullAge({ year: 1990, month: 11, day: 5 }, { year: 2026, month: 11, day: 4 }), 35);
assert.equal(fullAge({ year: 1990, month: 11, day: 5 }, { year: 2026, month: 11, day: 5 }), 36);
assert.equal(fullAge({ year: 2024, month: 2, day: 29 }, { year: 2025, month: 2, day: 28 }), 0);
assert.equal(fullAge({ year: 2024, month: 2, day: 29 }, { year: 2025, month: 3, day: 1 }), 1);

let scenarios = 0;
for (const year of [1925, 1930, 1940, 1960, 1980, 1990, 2000, 2015, 2024, 2026]) {
  for (const month of [1, 5, 9]) for (const gender of ['M', 'F']) for (const hour of [null, 10]) {
    const { saju, flow } = sample({ year, month, day: 1, gender, hour });
    const expected = saju.daYun.find(d => d.startYear <= 2026 && 2026 <= d.endYear);
    assert.equal(flow.current?.startYear, expected?.startYear);
    assert.equal(flow.current?.endYear, expected?.endYear);
    assert.deepEqual(flow.points.map(p => p.year), [2026, 2027, 2028, 2029, 2030, 2031]);
    assert.ok(!flow.next || flow.next.startYear > 2026 && flow.next.startYear <= 2031);
    assert.match(flow.ageLabel, /지금 만 \d+세 · 2026년 기준/);
    const html = lifeFlowBody(flow, { history: false });
    assert.ok(!/undefined|NaN|\[object Object\]/.test(html));
    assert.ok(!/세부터|가장 순해요|세 무렵/.test(html), '평생 최고/최저 나이로 돌아가지 않음');
    if (flow.current) {
      assert.ok(flow.action);
      assert.ok(flow.caution);
    }
    scenarios++;
  }
}

const { saju, chart, flow } = sample();
assert.equal(flow.age, 36);
assert.equal(flow.next.startYear, 2027);
assert.match(flow.transition.label, /2027년 · 내년/);
// 먼 미래가 최고·최저 점수여도 현재 제목과 권고를 바꾸지 않아야 합니다.
const far = { ...saju.daYun.at(-1), startYear: 2080, endYear: 2089, score: 1000, tone: 'good', god: '정관' };
const distant = buildLifeFlow({ ...saju, daYun: [...saju.daYun, far] }, chart, TODAY);
assert.equal(distant.title, flow.title);
assert.equal(distant.action, flow.action);
assert.ok(!lifeFlowBody(distant, { history: false }).includes('2080'));
assert.ok(lifeFlowBody(distant).includes('전체 인생 흐름 보기'), '전체 인생 흐름은 선택해서 볼 수 있음');
const distantWorst = buildLifeFlow({ ...saju, daYun: [...saju.daYun, { ...far, score: -1000, tone: 'caution' }] }, chart, TODAY);
assert.equal(distantWorst.title, flow.title);

// current 플래그가 옛 상태여도 기준일로 구간을 다시 선택합니다.
const stale = buildLifeFlow({ ...saju, daYun: saju.daYun.map(d => ({ ...d, current: !d.current })) }, chart, TODAY);
assert.equal(stale.current.startYear, flow.current.startYear);
const start = new Date(`${flow.next.startYear}-01-01T00:00:00+09:00`);
const switched = buildLifeFlow(saju, chart, start);
assert.equal(switched.current.startYear, flow.next.startYear);
assert.equal(switched.age, 36, '해가 바뀌어도 생일 전까지 만나이는 그대로');
const samePeriod = buildLifeFlow(saju, chart, new Date('2029-05-16T12:00:00+09:00'));
assert.equal(samePeriod.next, null, '5년보다 먼 다음 대운은 기본 권고에 넣지 않음');
assert.match(samePeriod.outlook, /전환이 없어요/);
assert.equal(new Set(samePeriod.points.map(p => p.score)).size, 1, '대운 안에서 가짜 연도별 변동을 만들지 않음');

const before = buildLifeFlow({ ...saju, daYun: [{ ...saju.daYun[0], startYear: 2033, endYear: 2042 }] }, chart, TODAY);
assert.equal(before.current, null);
assert.equal(before.next, null);
assert.match(before.title, /첫 대운/);
assert.equal(nearFlowChart(before), '', '자료 없는 구간을 0점으로 그리지 않음');
const noData = buildLifeFlow({ ...saju, daYun: [] }, chart, TODAY);
assert.equal(noData.current, null);
assert.match(noData.text, /계산 자료/);
const oldest = sample({ year: 1900 });
assert.equal(oldest.flow.current, null);
assert.ok(!/undefined|NaN/.test(lifeFlowBody(oldest.flow)));
const partial = buildLifeFlow({ ...saju, daYun: [saju.daYun.find(d => d.current)] }, chart, TODAY);
assert.match(partial.outlook, /계산 자료의 범위/);

const lunar = sample({ calendar: 'lunar', year: 1990, month: 12, day: 20 });
const solar = sample({ ...lunar.chart.solarDate });
assert.equal(lunar.flow.age, solar.flow.age, '음력 입력도 양력 변환 후 같은 실제 만나이 사용');
assert.equal(lunar.flow.current.startYear, solar.flow.current.startYear);
assert.equal(sample({ year: 2015 }).flow.phase, 'young');
assert.equal(sample({ year: 2000 }).flow.phase, 'adult');
assert.equal(sample({ year: 1980 }).flow.phase, 'middle');
assert.equal(sample({ year: 1960 }).flow.phase, 'later');
assert.ok(!/연봉|승진|투자/.test(sample({ year: 2015 }).flow.action), '어린 사용자에게 성인 생활을 가정하지 않음');
console.log(`PASS: ${scenarios}개 생년월일·성별·시간 조합, 현재/다음 대운, 5년 범위, 먼 미래 최고·최저점 무시`);
console.log('PASS: 생일 전후 만나이, 윤일, 음력, 한국 새해 경계, 오래된 current 표시, 첫 대운 전, 계산 범위 끝, 전체 흐름 펼치기');
