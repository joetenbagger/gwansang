// 질문별 상세 풀이 4장. 개인별 장면은 reading.js, 시기 비교는 아래 계산으로 나눕니다.
import { Solar } from '../vendor/lunar.mjs?v=18';
import { STEMS, BRANCHES, tenGod, elementOfGroup, CLASH, BRANCH_COMBINE, isPair, triadOf, PEACH } from './saju/data.js?v=18';
import { yearPillar } from './saju/calendar.js?v=18';
import { analyzeYear } from './saju/analyze.js?v=18';
import { buildReading, questionReading, yearReading } from './saju/reading.js?v=18';
import { readingBody } from './view-reading.js?v=18';
import { esc } from './util.js?v=18';
const but = t => t ? '<p class="but"><span>다만</span>' + esc(t) + '</p>' : '';
const gzKo = (s, b) => STEMS[s].ko + BRANCHES[b].ko;

function upcoming(saju, n = 10) {
  const y0 = new Date().getFullYear();
  return Array.from({ length: n }, (_, i) => analyzeYear(saju, yearPillar(y0 + i)));
}

// 점수 높은 해 목록 (reasons 비어 있으면 제외)
function pickYears(list, scoreFn, k = 3) {
  return list.map(y => ({ y, ...scoreFn(y) }))
    .filter(x => x.score > 0 && x.reasons.length)
    .sort((a, b) => b.score - a.score || a.y.year - b.y.year)
    .slice(0, k)
    .sort((a, b) => a.y.year - b.y.year);
}

const yearList = items => items.length
  ? `<ol class="list3">${items.map(x => `<li><span><b>${x.y.year}년 ${gzKo(x.y.stem, x.y.branch)}년</b> · ${esc(x.reasons.join(', '))}</span></li>`).join('')}</ol>`
  : '<p>앞으로 10년 안에 이 주제로 두드러지는 해는 크게 보이지 않아요. 대신 해마다 큰 기복 없이 흘러가는 편이에요.</p>';

function loveTiming(ctx) {
  const { saju, input } = ctx;
  const spouseEl = elementOfGroup(STEMS[saju.dayStem].el, input.gender === 'F' ? 'gwanseong' : 'jaeseong');
  const star = saju.groups.find(g => g.id === (input.gender === 'F' ? 'gwanseong' : 'jaeseong'));
  const dayB = saju.cells.day.branch;
  const peachB = new Set([PEACH[triadOf(saju.cells.day.branch.char)], PEACH[triadOf(saju.cells.year.branch.char)]]);
  const picks = pickYears(upcoming(saju), yr => {
    const reasons = []; let score = 0;
    if (STEMS[yr.stem].el === spouseEl || BRANCHES[yr.branch].el === spouseEl) { score += 2; reasons.push(`${input.gender === 'F' ? '남편' : '아내'}·연인을 뜻하는 기운이 들어와요`); }
    if (isPair(BRANCH_COMBINE, yr.branch, dayB.char)) { score += 2; reasons.push('배우자 자리와 합이 돼요'); }
    if (peachB.has(yr.branch)) { score += 1.5; reasons.push('도화가 들어와 인기가 올라요'); }
    if (yr.tone === 'good') score += 0.5;
    if (isPair(CLASH, yr.branch, dayB.char)) { score -= 1; }
    return { score, reasons };
  });
  const clashYear = upcoming(saju).find(yr => isPair(CLASH, yr.branch, dayB.char));
  return {
    kicker: '연애·결혼 3/4', title: '인연이 들어오는 해',
    body: `${yearList(picks)}
      <p class="hint">${star.level === 'high' ? '배우자를 뜻하는 기운이 원래 강해서, 위의 해가 아니어도 인연은 자주 와요.' : star.level === 'none' ? '배우자를 뜻하는 기운이 사주에 잘 안 보여서, 이런 해에 들어오는 인연을 놓치지 않는 게 중요해요.' : '이런 해에 소개, 모임, 새 환경을 일부러 늘려 보세요.'}</p>
      ${clashYear ? but(`${clashYear.year}년에는 그해 기운이 배우자 자리와 부딪혀요. 만남과 헤어짐, 이사 같은 관계 변화가 생기기 쉬우니 큰 결정은 서두르지 마세요.`) : ''}`,
  };

}

function moneyTiming(ctx) {
  const { saju } = ctx;
  const dm = saju.dayStem, s = saju.strength.key;
  const jEl = elementOfGroup(STEMS[dm].el, 'jaeseong'), sEl = elementOfGroup(STEMS[dm].el, 'siksang');
  const list = upcoming(saju);
  const picks = pickYears(list, yr => {
    const reasons = []; let score = 0;
    if (STEMS[yr.stem].el === jEl || BRANCHES[yr.branch].el === jEl) { score += 2; reasons.push(yr.god === '정재' || yr.branchGod === '정재' ? '꾸준한 돈이 붙어요' : '큰돈이 움직여요'); }
    if (s !== 'weak' && (STEMS[yr.stem].el === sEl || BRANCHES[yr.branch].el === sEl)) { score += 1; reasons.push('재능이 돈으로 바뀌어요'); }
    if (yr.tone === 'good') { score += 1; reasons.push('운 전체가 순해요'); }
    if (yr.god === '겁재') score -= 2;
    return { score, reasons };
  });
  const bad = list.find(yr => yr.god === '겁재' || (yr.tone === 'caution' && yr.branchGod === '겁재'));
  return { kicker: '돈·재물 4/4', title: '돈이 붙는 해', body: `${yearList(picks)}${bad ? but(`${bad.year}년은 돈이 새기 쉬운 해예요. 큰 투자, 빌려주기, 보증은 이 해를 피하세요.`) : ''}` };
}

function workTiming(ctx) {
  const { saju } = ctx;
  const list = upcoming(saju);
  const monthB = saju.cells.month.branch.char;
  const picks = pickYears(list, yr => {
    const reasons = []; let score = 0;
    const gs = [yr.god, yr.branchGod];
    if (gs.includes('정관')) { score += 2; reasons.push('승진·합격 운'); }
    if (gs.includes('편관')) { score += 1; reasons.push('책임 있는 자리'); }
    if (gs.includes('식신') || gs.includes('상관')) { score += 1.2; reasons.push('이직·새 일 시작'); }
    if (gs.includes('편재')) { score += 1; reasons.push('사업·외부 활동 확장'); }
    if (gs.includes('정인')) { score += 1; reasons.push('자격·학업 성과'); }
    if (isPair(CLASH, yr.branch, monthB)) { score += 0.5; reasons.push('직장 변동이 생기기 쉬움'); }
    if (yr.tone === 'good') score += 1; else if (yr.tone === 'caution') score -= 1;
    return { score, reasons };
  });
  return { kicker: '일·진로 4/4', title: '움직이기 좋은 해', body: `${yearList(picks)}<p class="hint">승진은 관성, 이직과 새 일은 식상, 사업은 재성이 들어오는 해에 잘 풀려요.</p>` };
}

function monthPillars(y) {
  return Array.from({ length: 12 }, (_, i) => {
    const m = Solar.fromYmd(y, i + 1, 20).getLunar().getMonthInGanZhiExact();
    return { month: i + 1, stem: m[0], branch: m[1] };
  });
}

function monthlyTiming(ctx) {
  const { saju, years } = ctx;
  const yr = years[0];
  const months = monthPillars(yr.year).map(m => ({ ...m, ...saju.luckTone(m.stem, m.branch), god: tenGod(saju.dayStem, m.stem) }));
  const best = [...months].sort((a, b) => b.score - a.score).slice(0, 2).sort((a, b) => a.month - b.month);
  const worst = [...months].sort((a, b) => a.score - b.score).slice(0, 2).sort((a, b) => a.month - b.month);
  const now = new Date();
  const W = 320, H = 140, bw = W / 12;
  const yv = v => 70 - Math.max(-4, Math.min(4, v)) * 14;
  const chart = `<svg class="flow" viewBox="0 0 ${W} ${H}" role="img" aria-label="달별 흐름">
    <line x1="0" x2="${W}" y1="70" y2="70" stroke="var(--rule)"/>
    ${months.map((m, i) => { const top = Math.min(70, yv(m.score)), h = Math.max(2, Math.abs(yv(m.score) - 70)); const col = m.score > 0 ? 'var(--good)' : m.score < 0 ? 'var(--seal)' : 'var(--ink-3)';
      const cur = yr.year === now.getFullYear() && m.month === now.getMonth() + 1;
      return `<rect x="${i * bw + 4}" y="${top}" width="${bw - 8}" height="${h}" fill="${col}" fill-opacity="${cur ? 1 : .7}"/>
      <text x="${i * bw + bw / 2}" y="${H - 6}" text-anchor="middle" font-size="11" fill="${cur ? 'var(--seal)' : 'var(--ink-2)'}" font-weight="${cur ? 700 : 400}">${m.month}월</text>`; }).join('')}
  </svg>`;
  return { kicker: `${yr.year}년 3/4`, title: '달별 흐름', body: `${chart}
    <p><b>힘이 붙는 달</b> · ${best.map(m => `${m.month}월(${esc(m.god)})`).join(', ')}. 중요한 시작, 면접, 계약은 이때로 잡아 보세요.</p>
    <p><b>쉬어 갈 달</b> · ${worst.map(m => `${m.month}월(${esc(m.god)})`).join(', ')}. 큰 결정을 미루고 컨디션을 챙기세요.</p>
    <p class="reading-basis">읽은 자리 · 일간 기준 월운과 용신. 각 양력 달 20일의 절기 월주를 대표값으로 비교했어요. 실제 기운이 바뀌는 절기 날짜는 달마다 달라요.</p>` };

}

export function topicCards(ctx) {
  const topic = ['love', 'money', 'work', 'year', 'self'].includes(ctx.input.topic) ? ctx.input.topic : 'self';
  const label = { love: '연애·결혼', money: '돈·재물', work: '일·진로', year: ctx.years[0].year + '년', self: '나라는 사람' }[topic];
  const cards = Array.from({ length: 4 }, (_, i) => ({ kicker: label + ' ' + (i + 1) + '/4' }));
  const r = ctx.total?.reading || buildReading(ctx.saju);
  const replace = (i, detail) => { cards[i] = { kicker: cards[i].kicker, title: esc(detail.title), body: readingBody(detail) }; };
  if (topic === 'self') {
    replace(0, r.inside);
    replace(1, r.pattern);
    replace(2, r.links[0] || { title: '힘이 흩어지는 순간', lead: r.capacity.text, caution: r.capacity.risk, action: r.capacity.action, evidence: r.pattern.evidence });
    replace(3, { title: '지금 바꿔 볼 한 가지', lead: r.intimate.action, text: r.capacity.text,
      caution: r.intimate.risk, action: r.capacity.action, evidence: r.inside.evidence });
  } else if (topic === 'year') {
    cards[2] = { ...monthlyTiming(ctx), kicker: cards[2].kicker };
    const yr = ctx.years[0];
    const detail = yearReading(ctx.saju, yr, r);
    replace(0, { title: `${yr.year}년, 내 사주에 닿는 곳`, lead: detail.text,
      caution: detail.caution, action: detail.action, evidence: detail.evidence });
    replace(1, { title: '10년의 방향과 올해의 과제', lead: detail.decade || r.pattern.text,
      text: `일에서는 ${r.environment.work} 관계에서는 ${r.intimate.love}`,
      caution: r.capacity.risk, action: r.pattern.action, evidence: r.evidence });
    replace(3, { title: '올해의 선택 기준', lead: detail.action, text: r.future.lead,
      caution: detail.caution, evidence: detail.evidence });
  } else {
    const details = questionReading(r, topic);
    replace(0, details.shared);
    replace(1, details.contrast);
    // 실제 연도별 기운 계산으로 고른 시기 카드는 유지합니다.
    replace(topic === 'love' ? 3 : 2, details.friction);
    const timing = topic === 'love' ? 2 : 3;
    cards[timing] = { ...({ love: loveTiming, money: moneyTiming, work: workTiming }[topic])(ctx), kicker: cards[timing].kicker };
    const basis = topic === 'love'
      ? `일간 기준 배우자 기운 · 일지 ${ctx.saju.cells.day.branch.char}의 합·충 · 도화 · 용신`
      : topic === 'money' ? '일간 기준 재성·식상 · 겁재 · 용신과 해의 오행'
      : `해의 십신 · 월지 ${ctx.saju.cells.month.branch.char}의 충 · 용신`;
    cards[timing].body += `<p class="reading-basis">읽은 자리 · ${esc(basis)}. 앞으로 10년을 같은 기준으로 비교했어요.</p>`;
  }
  return cards;
}
