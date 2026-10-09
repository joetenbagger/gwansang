// calendar.js — 생년월일시 → 사주팔자(네 기둥)와 대운
// 만세력 계산은 lunar-javascript(MIT)에 맡기고, 한국 출생자에 맞는 시간 보정만 여기서 합니다.
//
// 시간 보정 원칙
//  1) 입력한 시각은 "그날 한국 시계가 가리킨 시각"으로 봅니다.
//     한국 표준시는 여러 번 바뀌었고(UTC+8:30 ↔ +9) 서머타임을 실시한 해도 있어, 먼저 정확한 세계시(UTC)로 바꿉니다.
//  2) 년주·월주는 절기(입춘, 경칩 …)로 바뀝니다. 만세력 라이브러리의 절기 시각은 베이징 시간(UTC+8) 기준이라 UTC+8로 바꿔서 넣습니다.
//  3) 일주·시주는 해의 위치가 기준이므로 출생지 경도로 보정한 평균 태양시를 씁니다(서울은 시계보다 약 32분 늦음).
import { Solar, Lunar } from '../../vendor/lunar.mjs?v=12';

// [UTC 기준 시작 시각(ms), 표준시 오프셋(분), 서머타임 여부] — IANA Asia/Seoul 기록에서 뽑음
const KOREA_OFFSETS = [
  ['1900-01-01T00:00Z', 510, 0],
  ['1911-12-31T16:00Z', 540, 0],
  ['1948-05-31T15:00Z', 600, 1], ['1948-09-12T14:00Z', 540, 0],
  ['1949-04-02T15:00Z', 600, 1], ['1949-09-10T14:00Z', 540, 0],
  ['1950-03-31T15:00Z', 600, 1], ['1950-09-09T14:00Z', 540, 0],
  ['1951-05-05T15:00Z', 600, 1], ['1951-09-08T14:00Z', 540, 0],
  ['1954-03-20T15:00Z', 510, 0],
  ['1955-05-04T16:00Z', 570, 1], ['1955-09-08T15:00Z', 510, 0],
  ['1956-05-19T16:00Z', 570, 1], ['1956-09-29T15:00Z', 510, 0],
  ['1957-05-04T16:00Z', 570, 1], ['1957-09-21T15:00Z', 510, 0],
  ['1958-05-03T16:00Z', 570, 1], ['1958-09-20T15:00Z', 510, 0],
  ['1959-05-02T16:00Z', 570, 1], ['1959-09-19T15:00Z', 510, 0],
  ['1960-04-30T16:00Z', 570, 1], ['1960-09-17T15:00Z', 510, 0],
  ['1961-08-09T16:00Z', 540, 0],
  ['1987-05-09T17:00Z', 600, 1], ['1987-10-10T17:00Z', 540, 0],
  ['1988-05-07T17:00Z', 600, 1], ['1988-10-08T17:00Z', 540, 0],
].map(([t, off, dst]) => ({ t: Date.parse(t), off, dst: !!dst }));

export const PLACES = [
  { id: 'seoul', name: '서울', lon: 126.98 },
  { id: 'incheon', name: '인천', lon: 126.70 },
  { id: 'suwon', name: '수원·경기 남부', lon: 127.03 },
  { id: 'chuncheon', name: '춘천', lon: 127.73 },
  { id: 'gangneung', name: '강릉', lon: 128.90 },
  { id: 'cheongju', name: '청주', lon: 127.49 },
  { id: 'daejeon', name: '대전', lon: 127.38 },
  { id: 'jeonju', name: '전주', lon: 127.15 },
  { id: 'gwangju', name: '광주', lon: 126.85 },
  { id: 'daegu', name: '대구', lon: 128.60 },
  { id: 'pohang', name: '포항', lon: 129.37 },
  { id: 'ulsan', name: '울산', lon: 129.31 },
  { id: 'busan', name: '부산', lon: 129.08 },
  { id: 'changwon', name: '창원', lon: 128.68 },
  { id: 'jeju', name: '제주', lon: 126.53 },
  { id: 'none', name: '보정 안 함 (시계 시각 그대로)', lon: null },
];

/** 한국 시계 시각(벽시계) → UTC ms. 서머타임이 끝나며 같은 시각이 두 번 생기는 경우는 앞쪽으로 봅니다. */
export function koreaWallToUtc(y, mo, d, h, mi) {
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  let pick = KOREA_OFFSETS[0];
  for (const e of KOREA_OFFSETS) {
    if (wall - e.off * 60000 >= e.t) pick = e; else break;
  }
  return { utc: wall - pick.off * 60000, offsetMin: pick.off, dst: pick.dst };
}

const parts = ms => {
  const t = new Date(ms);
  return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), t.getUTCHours(), t.getUTCMinutes(), t.getUTCSeconds()];
};

/**
 * @param {object} input
 *   calendar: 'solar' | 'lunar', leap: boolean (음력 윤달)
 *   year, month, day, hour?, minute? (시간 모르면 hour = null)
 *   gender: 'M' | 'F'
 *   place: PLACES id
 *   ziMode: 'split' (23시 이후는 다음 날 일주 — 기본) | 'same' (야자시: 0시에 날짜 변경)
 */
export function computePillars(input) {
  let { year, month, day } = input;
  if (input.calendar === 'lunar') {
    let sol;
    try {
      sol = Lunar.fromYmd(year, input.leap ? -month : month, day).getSolar();
    } catch (e) {
      const err = new Error(/only (\d+) days/.test(e.message)
        ? `음력 ${year}년 ${input.leap ? '윤' : ''}${month}월은 ${e.message.match(/only (\d+) days/)[1]}일까지 있어요.`
        : input.leap ? `음력 ${year}년에는 윤${month}월이 없어요. 윤달 표시를 확인해 주세요.` : '음력 날짜를 확인해 주세요.');
      err.userMessage = true;
      throw err;
    }
    year = sol.getYear(); month = sol.getMonth(); day = sol.getDay();
  }
  const timeKnown = input.hour !== null && input.hour !== undefined && input.hour !== '';
  const hour = timeKnown ? +input.hour : 12;
  const minute = timeKnown ? +(input.minute || 0) : 0;

  const { utc, offsetMin, dst } = koreaWallToUtc(year, month, day, hour, minute);
  const place = PLACES.find(p => p.id === input.place) || PLACES[0];
  const solarOffsetMin = place.lon == null ? offsetMin - (dst ? 60 : 0) : place.lon * 4;
  const localSolarMs = utc + solarOffsetMin * 60000;
  const beijingMs = utc + 8 * 60 * 60000;

  const ecSeason = Solar.fromYmdHms(...parts(beijingMs)).getLunar().getEightChar();
  const ecDay = Solar.fromYmdHms(...parts(localSolarMs)).getLunar().getEightChar();
  ecDay.setSect(input.ziMode === 'same' ? 2 : 1);

  const pillar = (gz, kind) => ({ kind, stem: gz[0], branch: gz[1] });
  const pillars = {
    year: pillar(ecSeason.getYear(), 'year'),
    month: pillar(ecSeason.getMonth(), 'month'),
    day: pillar(ecDay.getDay(), 'day'),
    hour: timeKnown ? pillar(ecDay.getTime(), 'hour') : null,
  };

  // 대운: 남자 양년생·여자 음년생은 순행, 반대는 역행 (라이브러리가 처리). 절기 기준이므로 베이징 시각 기둥으로 계산.
  const yun = ecSeason.getYun(input.gender === 'F' ? 0 : 1, 2);
  const daYun = yun.getDaYun(11)
    .filter(d => d.getGanZhi())
    .map(d => ({ startAge: d.getStartAge(), startYear: d.getStartYear(), endYear: d.getEndYear(), stem: d.getGanZhi()[0], branch: d.getGanZhi()[1] }));

  const [sy, smo, sd, sh, smi] = parts(localSolarMs);
  return {
    pillars,
    timeKnown,
    daYun,
    daYunStart: { years: yun.getStartYear(), months: yun.getStartMonth(), forward: yun.isForward() },
    solarDate: { year, month, day },
    lunar: (() => { const l = Solar.fromYmd(year, month, day).getLunar(); return { year: l.getYear(), month: Math.abs(l.getMonth()), day: l.getDay(), leap: l.getMonth() < 0 }; })(),
    correction: {
      offsetMin, dst, place: place.name,
      solarTime: `${sy}-${String(smo).padStart(2, '0')}-${String(sd).padStart(2, '0')} ${String(sh).padStart(2, '0')}:${String(smi).padStart(2, '0')}`,
      diffMin: Math.round(solarOffsetMin - offsetMin),
    },
  };
}

/** 특정 연도의 세운(그해 간지) — 입춘 이후 시점 기준 */
export function yearPillar(y) {
  const gz = Solar.fromYmd(y, 6, 1).getLunar().getYearInGanZhiExact();
  return { stem: gz[0], branch: gz[1], year: y };
}
