// 사주 구성 → 개인별 풀이. 생일 해시·난수·요일로 문구를 바꾸지 않습니다.
// 계산과 문구를 분리하고 선택 근거를 함께 반환합니다. DOM 접근 없음.
import { GROUP_ORDER, EL, TEN_GODS, STEMS, CLASH, BRANCH_COMBINE, STEM_COMBINE, isPair } from './data.js?v=17';
import { ILJU } from '../content/ilju.js?v=17';
import { GOD_SCENES, MONTH_SCENES, SEASON_RESPONSE, HOUR_SCENES, PAIR_SCENES, CAPACITY } from '../content/reading-texts.js?v=17';

const POSITION = { year: '태어난 해', month: '사회생활 자리', day: '가까운 관계 자리', hour: '장기 계획 자리' };
const AREAS = { year: '오래 익숙했던 관계와 생활 기반', month: '일하는 방식과 사회적 역할', day: '가까운 관계와 생활의 약속', hour: '장기 목표와 앞으로의 계획' };
const pairKey = (a, b) => [a, b].sort((x, y) => GROUP_ORDER.indexOf(x) - GROUP_ORDER.indexOf(y)).join('-');
const group = god => TEN_GODS[god].group;
const pillarKo = cell => `${cell.stem.ko}${cell.branch.ko}`;
const percent = share => Math.round(share * 100);

function interactions(saju) {
  const pairs = [['month', 'day'], ['day', 'hour'], ['month', 'hour'], ['year', 'day'], ['year', 'month'], ['year', 'hour']];
  const out = [];
  for (const [a, b] of pairs) {
    const x = saju.cells[a], y = saju.cells[b];
    if (!x || !y) continue;
    const evidence = `${POSITION[a]} ${pillarKo(x)}(${x.stem.char}${x.branch.char}) · ${POSITION[b]} ${pillarKo(y)}(${y.stem.char}${y.branch.char})`;
    const area = `${AREAS[a]} / ${AREAS[b]}`;
    if (isPair(CLASH, x.branch.char, y.branch.char)) out.push({ a, b, type: 'clash', evidence,
      title: '잘하는 것과 편한 것이 다를 때',
      text: `${area}. 이 두 영역이 서로 다른 속도를 요구하는 조합(충)으로 읽어요. 한쪽에 맞추는 동안 다른 쪽에서 답답함이 남을 수 있어요.`,
      caution: '답답함을 느꼈다고 관계나 일을 곧바로 끝내야 한다는 뜻은 아니에요.',
      action: '일정이나 역할을 바꾸기 전에 양쪽에서 꼭 지킬 약속을 하나씩 정해 보세요.' });
    else if (isPair(BRANCH_COMBINE, x.branch.char, y.branch.char)) out.push({ a, b, type: 'combine', evidence,
      title: '힘을 얻는 연결, 끊기 어려운 연결',
      text: `${area}. 한 영역의 인연이 다른 영역까지 이어지는 조합(합)으로 읽어요. 연결을 통해 도움을 얻지만, 사정이 달라져도 부탁을 거절하기 어려울 수 있어요.`,
      caution: '잘 맞는다고 모든 일정과 책임을 함께할 필요는 없어요.',
      action: '함께할 부분과 각자 결정할 부분을 미리 나눠 보세요.' });
    else if (x.branch.char === y.branch.char) out.push({ a, b, type: 'repeat', evidence,
      title: '다른 자리에서도 같은 방식을 쓰는 사람',
      text: `${area}. 같은 지지가 반복돼 익숙한 방식을 여러 영역에 가져가는 모습으로 읽어요. 기준이 일관된 것이 장점이지만, 상대와 상황이 달라도 같은 답을 내릴 수 있어요.`,
      caution: '한곳에서 통했던 방식이 모든 곳에 맞는지는 다시 확인해야 해요.',
      action: '지금 상대에게 필요한 것이 내 경험과 같은지 먼저 물어보세요.' });
    else if (isPair(STEM_COMBINE, x.stem.char, y.stem.char)) out.push({ a, b, type: 'stem-combine', evidence,
      title: '다른 기대를 조율하는 사람',
      text: `${area}. 겉으로 드러난 두 천간이 합을 이루어 서로의 요구를 조율하는 쪽으로 읽어요. 접점을 찾는 데 능하지만 내 의사까지 바꿔야 하는 것은 아니에요.`,
      caution: '합이 있다는 것만으로 특정 관계의 성공이나 오행의 변화를 확정하지 않아요.',
      action: '양보할 수 있는 부분을 말할 때 내가 원하는 결과도 함께 전해 보세요.' });
  }
  return out;
}

/** 기존 analyzeSaju 출력만 사용하므로 사진 유무와 이름에 관계없이 재현됩니다. */
export function buildReading(saju) {
  const { cells } = saju;
  const ilju = ILJU[saju.dayStem + cells.day.branch.char];
  const socialGod = cells.month.stem.god;
  const environmentGod = cells.month.branch.god;
  const privateGod = cells.day.branch.god;
  const hourGod = cells.hour?.stem.god || null;
  const social = GOD_SCENES[socialGod], environment = GOD_SCENES[environmentGod], intimate = GOD_SCENES[privateGod];
  const goal = hourGod ? GOD_SCENES[hourGod] : null;
  const ranked = [...saju.groups].sort((a, b) => b.share - a.share || GROUP_ORDER.indexOf(a.id) - GROUP_ORDER.indexOf(b.id));
  const [first, second] = ranked;
  const pair = PAIR_SCENES[pairKey(first.id, second.id)];
  // 2위가 미미한데 두 기운이 비슷하다고 설명하지 않습니다.
  const concentrated = first.share >= .5 && second.share < .2;
  const nearTie = Math.abs(first.share - second.share) < .05;
  const capacity = CAPACITY[saju.strength.key];
  const wealth = saju.groups.find(g => g.id === 'jaeseong');
  const expression = saju.groups.find(g => g.id === 'siksang');
  const peers = saju.groups.find(g => g.id === 'bigeop');
  const financial = {
    lead: wealth.level === 'high'
      ? (saju.strength.key === 'weak' ? '눈에 들어오는 기회와 내가 실제로 감당할 양을 구분하는 것이 돈 풀이의 핵심이에요.' : '결과와 실속을 따지는 기운이 큰 편이에요. 기회를 찾는 것만큼 이미 맡은 거래를 마무리하는 일이 중요해요.')
      : wealth.level === 'none' || wealth.level === 'low'
        ? '사주에서 돈을 직접 다루는 기운의 비중은 작아요. 돈을 못 번다는 뜻보다, 잘한 일을 보상으로 연결하는 과정을 의식해서 만들어야 한다는 쪽으로 읽어요.'
        : '돈을 다루는 기운이 한쪽을 압도하지 않아요. 수입의 크기보다 지금 하는 일과 실제 보상의 연결을 점검하는 쪽에 무게를 두어요.',
    text: expression.share >= .2 ? '표현과 결과물을 뜻하는 식상이 받쳐 줘요. 만든 것을 남이 쓸 수 있는 형태로 정리할 때 수고와 보상의 연결이 더 분명해져요.' : '표현과 결과물의 통로를 따로 챙겨 볼 필요가 있어요. 열심히 했다는 설명보다 무엇을 마쳤는지 남기는 방식이 도움이 돼요.',
    caution: peers.share >= .26 ? '함께하는 사람과 역할이 커질수록 실제로 내가 가져가는 몫이 흐려지지 않는지 확인해요.' : saju.strength.key === 'weak' ? '좋은 조건처럼 보여도 투입할 시간과 책임이 내 여유를 넘는지 먼저 봐야 해요.' : '결과가 늦게 보이면 방향을 자주 바꾸기 쉬워요. 확인할 기간과 기준을 먼저 정해요.',
    action: '최근 한 일 하나를 골라 들인 시간, 완성한 결과, 받은 보상을 나란히 적어 보세요.',
    evidence: `재성 ${percent(wealth.share)}% · 식상 ${percent(expression.share)}% · 비겁 ${percent(peers.share)}% · ${saju.strength.tag}`,
  };
  const month = MONTH_SCENES[cells.month.branch.char];
  const seasonIndex = ['寅卯辰', '巳午未', '申酉戌', '亥子丑'].findIndex(s => s.includes(cells.month.branch.char));
  const seasonText = SEASON_RESPONSE[STEMS[saju.dayStem].el][seasonIndex];
  const links = interactions(saju);
  const linked = links.find(l => l.a === 'month' && l.b === 'day');
  const sameInside = group(socialGod) === group(privateGod);
  const sameFuture = goal && group(socialGod) === group(hourGod);
  const weights = `${first.name} ${percent(first.share)}% · ${second.name} ${percent(second.share)}%`;
  const evidence = `일간 ${cells.day.stem.ko}${EL[STEMS[saju.dayStem].el].ko}(${saju.dayStem}) · 월주 ${pillarKo(cells.month)} · 일지 ${cells.day.branch.ko}(${privateGod})${cells.hour ? ` · 시주 ${pillarKo(cells.hour)}` : ' · 시각 모름'}`;
  const pattern = {
    title: concentrated ? `${first.name}의 방식이 선명한 사람` : pair[0],
    text: concentrated
      ? `한쪽 기운이 절반 이상이라 ${first.name}의 방식이 먼저 드러나는 구성으로 읽어요. ${second.name}은 중심을 바꾸기보다 보조하는 역할에 가까워요.`
      : `${pair[1]} ${nearTie ? '두 기운의 비중이 가까워 상황에 따라 앞에 나서는 쪽이 달라질 수 있어요.' : `${first.name}이 먼저 방향을 잡고 ${second.name}이 그 뒤를 받치는 구성으로 읽어요.`}`,
    caution: concentrated ? capacity.risk : pair[2],
    action: concentrated ? capacity.action : pair[3], evidence: `${weights} · ${saju.strength.tag}`,
  };
  const outside = {
    title: `${month[0]}, 나를 쓰는 방식`,
    lead: seasonText,
    text: `${month[1]} 월간(${socialGod})에서는 ${social.social} 월지(${environmentGod})에서는 ${environment.work}`,
    caution: month[2], action: month[3],
    evidence: `절기 월지 ${cells.month.branch.char}(${cells.month.branch.ko}) × 일간 ${saju.dayStem} · 월간 ${socialGod} / 월지 ${environmentGod}`,
  };
  const inside = {
    title: sameInside ? '밖에서 지키는 기준을 관계에도 가져와요' : `밖에서는 ${social.label}, 가까워지면 ${intimate.label}`,
    lead: intimate.need,
    text: `${social.social} ${sameInside ? '밖에서 쓰는 방식과 가까운 사이에서 원하는 것이 같은 계열이에요. 믿음직한 일관성이 있지만 상대에게도 내 기준을 기대할 수 있어요.' : '밖에서 잘해 내는 역할과 가까운 사람에게 바라는 것은 다른 계열이에요. 혼자 있을 때 달라지는 모습을 숨길 필요는 없어요.'}`,
    caution: intimate.risk, action: intimate.action,
    evidence: `월간 ${socialGod} ↔ 일지 ${privateGod} · ${ilju.img}`,
  };
  const future = goal ? {
    title: sameFuture ? '지금의 방식을 오래 가져가고 싶어요' : '잘하는 일과 오래 원하는 삶은 달라요',
    lead: goal.goal,
    text: `${HOUR_SCENES[cells.hour.branch.char]} ${sameFuture ? '월간과 시간의 십신이 같은 계열이라 지금 쌓는 역할을 오래 이어 가는 쪽으로 읽어요.' : `사회에서는 ‘${social.label}’의 역할을 해도, 긴 계획에서는 ‘${goal.label}’의 욕구를 함께 챙겨야 해요.`}`,
    caution: goal.risk, action: goal.action,
    evidence: `시간 ${cells.hour.stem.char}(${hourGod}) · 시지 ${cells.hour.branch.char}(${cells.hour.branch.god}) · 출생지 보정 시주 기준`,
  } : {
    title: '아직 비워 둔 장기 계획의 자리',
    lead: '태어난 시각을 몰라 시주에서 읽는 속마음과 장기 목표는 단정하지 않아요.',
    text: '현재 풀이는 년·월·일 세 기둥으로 읽었어요. 시간을 알게 되면 시주뿐 아니라 기운의 비율과 중심 조합도 달라질 수 있어요.',
    caution: '시각이 없다고 특정 성향이나 인연이 없다는 뜻은 아니에요.',
    action: '출생 기록에서 시각을 확인할 수 있다면 다시 비교해 보세요. 확인이 어렵다면 모름으로 두어도 괜찮아요.',
    evidence: '시주 미입력 · 임의 시각으로 성격을 만들지 않음',
  };
  return {
    headline: pattern.title,
    hook: sameInside
      ? `사람들 앞에서도 가까운 사이에서도 ‘${social.label}’의 기준이 이어져요. ${linked ? '다만 두 자리가 연결되는 방식까지 보면, 늘 같은 선택이 편한 것은 아니에요.' : '일관성이 힘이 되지만 상대도 같은 기준일 거라고 생각하면 엇갈릴 수 있어요.'}`
      : `밖에서 맡는 역할은 ‘${social.label}’, 마음이 편해지는 기준은 ‘${intimate.label}’이에요. 남들이 잘한다고 보는 일과 내가 기대고 싶은 방식 사이에 차이가 있어요.`,
    evidence, pattern, outside, inside, future, capacity, financial, links,
    socialGod, environmentGod, privateGod, hourGod, social, environment, intimate, goal,
    // 풀이 선택 경로를 비교하는 점검용 값. 사용자 날짜/이름을 서명에 섞지 않습니다.
    signature: [saju.dayStem, cells.day.branch.char, cells.month.stem.char, cells.month.branch.char,
      cells.hour ? cells.hour.stem.char + cells.hour.branch.char : 'unknown', first.id, second.id, saju.strength.key,
      ...links.map(l => `${l.a}-${l.b}-${l.type}`)].join('|'),
  };
}

/** MBTI의 선택 성향을 사주식 생활 장면과 비교하는 질문. 성격 검사 결과를 추론하지 않습니다. */
export function mbtiReading(saju, type) {
  const share = id => saju.groups.find(g => g.id === id).share;
  const first = type[0] === 'E'
    ? share('inseong') >= .2
      ? '사람을 만나며 생각을 넓히는 E라도, 이 사주에서는 혼자 배우고 정리할 여백을 함께 읽어요. 약속을 채우는 날과 혼자 회복하는 날을 번갈아 두는지 살펴보세요.'
      : '사람과 함께 시작하는 E의 장점을 쓰되, 모임이 끝난 뒤 내 몫의 결과가 남는지 확인해 보세요. 관계를 넓히는 것과 모든 부탁을 받는 것은 다른 일이에요.'
    : share('siksang') >= .2
      ? '혼자 집중하는 I라도 표현과 결과물을 뜻하는 식상의 비중이 있어요. 사람을 많이 만나기보다 글이나 작품을 먼저 보여 주는 방식이 편한지 살펴보세요.'
      : '혼자 생각하는 I의 시간을 존중하되, 결론까지 혼자 내린 뒤 알리면 주변이 따라오기 어려울 수 있어요. 중간 생각을 짧게 공유하는 방식을 시험해 보세요.';
  const second = type[3] === 'P'
    ? share('gwanseong') >= .2
      ? '유연하게 바꾸고 싶은 P와 맡은 책임을 챙기는 관성이 만나요. 마감은 고정하고 과정에는 선택권을 남길 때 둘을 함께 쓸 수 있어요.'
      : 'P의 유연함을 살리려면 시작보다 끝나는 조건을 정해 두는 것이 좋아요. 선택지를 줄이는 대신 이번에 확인할 결과 하나만 정해 보세요.'
    : share('siksang') >= .2
      ? '계획을 세우는 J와 새 결과를 내고 싶은 식상을 함께 읽어요. 큰 일정은 유지하되 시안을 바꿀 수 있는 구간을 남기면 계획이 실험을 막지 않아요.'
      : 'J의 계획이 나를 돕는지, 이미 달라진 상황에도 그대로 지키게 하는지 확인해 보세요. 일정표에 다시 판단할 날짜를 넣어 두면 기준을 고치기 쉬워져요.';
  return { text: first, action: second, evidence: `입력·추정 유형 ${type}의 ${type[0]}/${type[3]} × 인성 ${percent(share('inseong'))}% · 식상 ${percent(share('siksang'))}% · 관성 ${percent(share('gwanseong'))}%` };
}

/** 질문별 핵심 장면. 연도 목록 등 기존 시간 계산은 topic.js에서 유지합니다. */
export function questionReading(reading, topic) {
  const r = reading;
  const personal = topic === 'love' ? r.intimate : r.environment;
  const domain = topic === 'self' ? 'work' : topic;
  const domainTitle = { love: '가까워질수록 드러나는 나', money: '돈을 움직이는 나의 기준', work: '직함보다 중요한 일하는 조건', self: '밖의 역할과 안의 욕구' }[topic];
  const shared = {
    title: domainTitle, lead: personal[domain],
    text: topic === 'love' ? r.inside.text : `${r.outside.lead} ${r.capacity.text}`,
    caution: personal.risk, action: personal.action,
    evidence: topic === 'love' ? r.inside.evidence : r.outside.evidence,
  };
  if (topic === 'money') Object.assign(shared, {
    lead: r.financial.lead, text: `${r.environment.money} ${r.financial.text}`,
    caution: r.financial.caution, action: r.financial.action, evidence: `${r.financial.evidence} · 월지 ${r.environmentGod}`,
  });
  const contrast = {
    title: topic === 'love' ? '설렘보다 오래 가는 생활의 약속' : topic === 'money' ? '버는 방식과 쓰고 싶은 곳' : '지금 잘하는 것, 오래 하고 싶은 것',
    lead: topic === 'love' ? r.social.love : r.goal ? r.goal.goal : r.intimate[domain],
    text: topic === 'love'
      ? `${r.goal ? r.future.lead : r.future.text} ${r.links.find(l => l.a === 'day' && l.b === 'hour')?.action || r.capacity.text}`
      : r.goal ? `${r.intimate[domain]} ${r.future.text}` : `${r.inside.text} ${r.capacity.text}`,
    caution: r.goal ? r.goal.risk : r.intimate.risk,
    action: r.goal ? r.goal.action : r.intimate.action,
    evidence: r.goal ? r.future.evidence : r.inside.evidence,
  };
  const tension = r.links.find(l => topic === 'love' ? l.a === 'day' || l.b === 'day' : l.a === 'month' || l.b === 'month');
  const friction = {
    title: topic === 'money' ? '실속이 흐려지는 순간' : topic === 'work' ? '실력보다 먼저 지치는 지점' : '관계에서 반복하기 쉬운 장면',
    lead: tension ? tension.text : r.pattern.text,
    text: r.capacity.text,
    caution: tension ? tension.caution : r.pattern.caution,
    action: tension ? tension.action : r.pattern.action,
    evidence: tension ? tension.evidence : r.pattern.evidence,
  };
  return { shared, contrast, friction };
}

/** 원국의 어느 자리에 해의 기운이 닿는지 설명. 확정적인 사건 예언은 하지 않습니다. */
export function yearReading(saju, year, reading = buildReading(saju)) {
  const god = GOD_SCENES[year.god];
  const hits = Object.entries(saju.cells).flatMap(([key, cell]) => {
    if (isPair(CLASH, year.branch, cell.branch.char)) return [{ key, type: 'clash', text: `${AREAS[key]}의 방식을 재조정하는 쪽에 주목해요.`, evidence: `${year.branch} ↔ ${cell.branch.char}(${POSITION[key]}) 충` }];
    if (isPair(BRANCH_COMBINE, year.branch, cell.branch.char)) return [{ key, type: 'combine', text: `${AREAS[key]}에서 협력과 약속의 범위를 살펴보세요.`, evidence: `${year.branch} ↔ ${cell.branch.char}(${POSITION[key]}) 합` }];
    if (year.branch === cell.branch.char) return [{ key, type: 'repeat', text: `${AREAS[key]}에서 익숙한 방식을 반복하는지 점검해 보세요.`, evidence: `${year.branch}(${POSITION[key]}) 반복` }];
    return [];
  }).sort((a, b) => ['month', 'day', 'hour', 'year'].indexOf(a.key) - ['month', 'day', 'hour', 'year'].indexOf(b.key));
  const current = saju.daYun.find(d => year.year >= d.startYear && year.year <= d.endYear);
  const decadeClash = current && isPair(CLASH, current.branch, year.branch);
  const decadeCombine = current && isPair(BRANCH_COMBINE, current.branch, year.branch);
  const decade = current ? `${current.startYear}~${current.endYear}년 대운의 ${current.god} 위에 ${year.god}의 해가 겹쳐요. ${decadeClash ? '큰 흐름과 올해 기운의 지지가 충이라 장기 계획과 올해 일정의 속도를 맞춰 볼 필요가 있어요.' : decadeCombine ? '대운과 올해 기운의 지지가 합이라 오래 추진하던 일의 협력 조건을 다시 확인해 보세요.' : `장기 과제는 ‘${GOD_SCENES[current.god].label}’, 올해의 점검 주제는 ‘${god.label}’로 나눠 읽어요.`}` : '';
  return {
    text: `${god.work} ${reading.capacity.text}${hits.length ? ` ${hits.slice(0, 2).map(h => h.text).join(' ')}` : ''}`,
    caution: `${god.risk} ${hits.some(h => h.type === 'clash') ? '충은 이직·이별 같은 사건이 반드시 생긴다는 뜻이 아니에요.' : reading.pattern.caution}`,
    action: `${god.action} ${reading.capacity.action}`,
    evidence: `일간 ${saju.dayStem} 기준 ${year.stem}${year.branch} · ${year.god} / ${year.branchGod}${hits.length ? ` · ${hits.map(h => h.evidence).join(', ')}` : ' · 원국 지지와 직접적인 육합·충·반복 없음'}`,
    decade, hits,
  };
}
