// 대운 계산값은 유지하고 읽는 시점을 현재로 맞춥니다. 평생 최고/최저점은 고르지 않습니다.
import { TEN_GODS } from './data.js?v=18';
import { GOD_SCENES } from '../content/reading-texts.js?v=18';

const THEMES = {
  비견: '내가 정할 일과 함께 의논할 일을 구분하며 주도권을 다지는 흐름이에요.',
  겁재: '사람들과 함께할 기회가 주제예요. 가까운 사이에서도 역할과 비용의 경계를 챙겨요.',
  식신: '꾸준히 익힌 것을 작은 결과로 남기는 흐름이에요. 한 번의 성과보다 이어 갈 리듬을 만들어요.',
  상관: '익숙한 방식을 고치고 내 생각을 표현하는 흐름이에요. 지적만 하기보다 바꿀 방법까지 보여 줘요.',
  편재: '바깥의 사람과 새로운 선택지를 만나는 흐름이에요. 넓히기 전에 지금 감당할 범위를 정해요.',
  정재: '생활의 기반과 반복되는 약속을 차근차근 다지는 흐름이에요. 실제로 남는 결과를 확인해요.',
  편관: '어려운 문제와 맡은 책임을 조정하는 흐름이에요. 버티는 힘만큼 도움을 받는 조건도 중요해요.',
  정관: '역할과 약속을 분명히 하며 신뢰를 쌓는 흐름이에요. 기대에 맞추느라 내 기준을 놓치지 않아요.',
  편인: '새로운 관점과 깊이 있는 탐색이 주제예요. 더 알아보는 일과 지금 해 볼 일을 나눠요.',
  정인: '배우고 도움을 받으며 기반을 채우는 흐름이에요. 익힌 것을 실제 생활에 써 볼 기회를 만들어요.',
};

// 실제 직업·혼인 여부를 모르므로 나이로 특정 생활 상태를 단정하지 않습니다.
const ACTIONS = {
  young: {
    bigeop: '학업·취미·친구 관계 중 스스로 고를 수 있는 일 하나를 정하고 끝까지 해 보세요.',
    siksang: '배운 것 하나를 글·그림·작은 작품으로 남겨 보세요. 잘하는 분야를 찾는 단서가 돼요.',
    jaeseong: '용돈이나 생활 비용처럼 직접 관리할 수 있는 작은 범위에서 계획과 실제 사용을 비교해 보세요.',
    gwanseong: '여러 기대가 겹치면 이번에 꼭 할 일 하나를 정하고, 벅찬 부분은 믿을 만한 어른과 상의해 보세요.',
    inseong: '관심 있는 분야를 작게 체험해 보세요. 배우는 동안 내가 즐기는 과정이 무엇인지 기록해 보세요.',
  },
  adult: {
    bigeop: '배움·일·개인 계획 중 직접 결정할 일 하나를 정하고, 다른 사람에게 받을 도움도 함께 정해 보세요.',
    siksang: '지금 익히는 것을 남에게 보여 줄 결과물 하나로 마무리해 보세요. 반응을 보고 다음 계획을 고쳐요.',
    jaeseong: '생활을 유지하는 데 필요한 비용과 새 시도에 쓸 시간·비용을 나란히 적어 보세요.',
    gwanseong: '지금 맡은 일과 새로 원하는 기회를 함께 적고, 하나를 더할 때 무엇을 줄일지 정해 보세요.',
    inseong: '앞으로 쓰고 싶은 지식 하나를 골라, 배운 뒤 실제로 시험할 날짜까지 잡아 보세요.',
  },
  middle: {
    bigeop: '지금 유지할 약속과 내 뜻대로 다시 정할 일을 나눠 보세요. 경험이 있다는 이유로 전부 혼자 맡지는 마세요.',
    siksang: '쌓아 온 경험 중 반복해서 써먹을 수 있는 방식 하나를 정리해 보세요. 새 일을 늘리기보다 완성도를 높여요.',
    jaeseong: '현재 생활을 지키는 데 필요한 자원과 바꾸고 싶은 목표를 함께 적어 보세요. 두 계획이 서로 무리하지 않는지 확인해요.',
    gwanseong: '기존 책임을 계속할 조건과 줄일 수 있는 부분을 정리해 보세요. 새 역할은 지원받을 조건까지 확인해요.',
    inseong: '새로 배울 것 하나와 이미 아는 것을 활용할 일 하나를 짝지어 보세요. 준비와 실행의 균형을 잡아요.',
  },
  later: {
    bigeop: '지금도 직접 선택하고 싶은 일과 도움을 받아 편해질 일을 구분해 보세요. 내 생활의 속도를 기준으로 정해요.',
    siksang: '오래 익힌 경험이나 취미 중 계속 즐기고 싶은 것을 정해 보세요. 무리 없는 주기로 결과를 남겨요.',
    jaeseong: '유지하고 싶은 생활과 새로운 계획에 필요한 자원을 먼저 적어 보세요. 익숙한 관리 방식도 현재 조건에 맞춰 고쳐요.',
    gwanseong: '오래 맡아 온 역할 중 계속할 것과 나눌 것을 정해 보세요. 새 역할을 원한다면 쓸 수 있는 시간부터 확인해요.',
    inseong: '계속 배우고 싶은 것과 다른 사람에게 전하고 싶은 경험을 하나씩 골라 보세요. 지금의 관심을 계획에 넣어요.',
  },
};

export function koreaDate(today = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(today);
  const value = type => Number(parts.find(p => p.type === type).value);
  return { year: value('year'), month: value('month'), day: value('day') };
}

export function fullAge(birth, date) {
  const birthdayAhead = date.month < birth.month || (date.month === birth.month && date.day < birth.day);
  return Math.max(0, date.year - birth.year - Number(birthdayAhead));
}

export function buildLifeFlow(saju, chart, today = new Date()) {
  const date = koreaDate(today);
  const year = date.year, horizon = year + 5;
  // 음력 입력도 변환된 실제 양력 생일을 기준으로 만나이를 구합니다.
  const age = fullAge(chart.solarDate, date);
  const periods = [...saju.daYun].sort((a, b) => a.startYear - b.startYear);
  const current = periods.find(d => d.startYear <= year && year <= d.endYear) || null;
  const next = periods.find(d => d.startYear > year && d.startYear <= horizon) || null;
  const first = periods[0];
  const beforeStart = !current && first && year < first.startYear;
  const phase = age < 19 ? 'young' : age < 35 ? 'adult' : age < 55 ? 'middle' : 'later';
  const theme = d => THEMES[d.god];
  const action = d => ACTIONS[phase][TEN_GODS[d.god].group];
  const points = Array.from({ length: 6 }, (_, i) => {
    const at = year + i;
    const period = periods.find(d => d.startYear <= at && at <= d.endYear) || null;
    return { year: at, score: period ? period.score : null, period };
  });
  let title, text, caution, nowAction;
  if (current) {
    title = { good: '지금 쌓는 일에 힘이 붙는 시기예요', neutral: '지금은 방향을 고르고 다지는 시기예요', caution: '지금은 넓히기보다 부담을 줄일 때예요' }[current.tone];
    text = theme(current);
    caution = GOD_SCENES[current.god].risk;
    nowAction = action(current);
  } else if (beforeStart) {
    title = '지금은 첫 대운을 맞기 전이에요';
    text = '아직 첫 번째 10년 운의 구간이 시작되지 않았어요. 먼 미래의 좋고 나쁨을 먼저 고르기보다 지금의 배움과 생활 리듬을 살펴봐요.';
    caution = '첫 대운 전이라고 기회나 성향이 없는 것은 아니에요. 현재 원국의 풀이와 실제 생활을 함께 봐요.';
    nowAction = '좋아하는 활동을 조금씩 경험하고, 편안하게 이어 갈 일상 하나를 만들어 보세요.';
  } else {
    title = '현재 시기를 중심으로 다시 살펴봐요';
    text = '현재 연도에 해당하는 대운 구간이 계산 자료에 없어요. 예전 구간을 지금의 운으로 대신 보여 주지는 않아요.';
    caution = '이 상태에서는 현재 대운의 좋고 나쁨을 판단할 수 없어요.';
    nowAction = '올해·내년 카드와 원국 풀이에서 현재 고민에 맞는 내용을 먼저 살펴보세요.';
  }
  let transition = null;
  if (next) {
    const inYears = next.startYear - year;
    transition = {
      label: `${next.startYear}년 · ${inYears === 1 ? '내년' : `${inYears}년 뒤`}의 전환`,
      text: theme(next),
      comparison: !current ? '이때 첫 대운이 시작돼요.' : next.score > current.score
        ? '현재보다 새로운 시도에 힘을 쓰기 좋은 쪽으로 읽어요.' : next.score < current.score
          ? '현재보다 속도를 낮추고 부담을 줄이는 쪽으로 읽어요.'
          : '큰 기운의 강도는 비슷하지만 중심 과제는 달라져요.',
    };
  }
  const outlook = transition ? null : current
    ? `앞으로 5년(${year}~${horizon}년) 안에는 새 대운으로 넘어가는 전환이 없어요. 지금 구간에서 정한 방향을 차근차근 다지는 데 집중해요.`
    : beforeStart ? `앞으로 5년(${year}~${horizon}년)은 첫 대운 전의 생활과 배움에 집중하는 구간이에요.`
      : `앞으로 5년(${year}~${horizon}년)의 대운 자료가 충분하지 않아요.`;
  const coverageEnds = current && points.some(p => !p.period);
  return {
    year, horizon, age, phase, current, next, periods, points, transition,
    title, text, caution, action: nowAction,
    outlook: coverageEnds ? `${periods.at(-1).endYear}년 이후는 계산 자료의 범위를 벗어나요. 그 뒤의 흐름은 이 그래프에서 판단하지 않아요.` : outlook,
    ageLabel: `지금 만 ${age}세 · ${year}년 기준`,
    basis: current ? `현재 대운 ${current.startYear}~${current.endYear}년 · ${current.stem}${current.branch} · ${current.god}` : beforeStart ? '첫 대운 시작 전' : '현재 대운 자료 없음',
  };
}
