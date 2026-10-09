// view-saju.js — 사주 풀이 화면
import { EL, ELEMENTS, STEMS, BRANCHES, PILLAR_MEANING, GROUPS } from './saju/data.js?v=8';
import { STRENGTH_CUTS } from './saju/analyze.js?v=8';
import { esc, pct } from './util.js?v=8';
import { caution } from './view-face.js?v=8';

const COLS = [['hour', '시주', '時'], ['day', '일주', '日'], ['month', '월주', '月'], ['year', '년주', '年']];
const TONE = { good: ['순풍', 'good'], neutral: ['보통', 'neutral'], caution: ['주의', 'bad'] };
const elTag = el => `<span class="elchip" data-el="${el}">${EL[el].ko} ${EL[el].hanja}</span>`;

function chartTable(saju, chart) {
  const cell = (kind, part) => {
    const c = saju.cells[kind];
    if (!c) return `<td class="empty">${part === 'stem' || part === 'branch' ? '<span class="unknown">?</span>' : ''}</td>`;
    if (part === 'stemGod') return `<td class="god">${esc(c.stem.god)}</td>`;
    if (part === 'branchGod') return `<td class="god">${esc(c.branch.god)}</td>`;
    if (part === 'hidden') return `<td class="hidden">${c.branch.hidden.map(h => `<span data-el="${h.el}">${h.char}</span>`).join('')}</td>`;
    const x = c[part];
    return `<td class="glyph${kind === 'day' && part === 'stem' ? ' me' : ''}" data-el="${x.el}">
        <span class="hz">${x.char}</span><span class="kr">${x.ko}${part === 'branch' ? ' · ' + x.animal : ''}</span></td>`;
  };
  const row = (part, label) => `<tr><th scope="row">${label}</th>${COLS.map(([k]) => cell(k, part)).join('')}</tr>`;
  return `<div class="tablewrap"><table class="pillars">
    <thead><tr><th></th>${COLS.map(([k, n, h]) => `<th scope="col">${n}<small>${h}柱</small></th>`).join('')}</tr></thead>
    <tbody>
      ${row('stemGod', '십신')}${row('stem', '천간')}${row('branch', '지지')}${row('branchGod', '십신')}${row('hidden', '지장간')}
    </tbody></table></div>
    <p class="fine">${chart.timeKnown ? '' : '태어난 시각을 몰라 시주는 비워 두었습니다. 시주가 없으면 말년·자녀운과 일부 판단의 정확도가 떨어집니다. '}
      일간(나)은 일주의 천간 <b>${saju.dayStem}(${STEMS[saju.dayStem].ko})</b>입니다.
      ${COLS.filter(([k]) => saju.cells[k]).map(([k, n]) => `${n}: ${PILLAR_MEANING[k]}`).join(' · ')}</p>`;
}

function elementBars(saju) {
  const max = Math.max(...ELEMENTS.map(e => saju.powerPct[e]));
  return `<div class="ohaeng">${ELEMENTS.map(e => {
    const ex = saju.excess.some(x => x.el === e), lk = saju.lack.some(x => x.el === e);
    return `<div class="oh" data-el="${e}">
      <span class="nm">${EL[e].ko} ${EL[e].hanja}</span>
      <span class="bar"><b style="width:${(saju.powerPct[e] / max) * 100}%"></b></span>
      <span class="num">${saju.count[e]}자 · ${pct(saju.powerPct[e])}</span>
      <span class="flag">${ex ? '많음' : lk ? (saju.count[e] === 0 ? '없음' : '부족') : ''}</span>
    </div>`;
  }).join('')}</div>
  <p class="fine">글자 수는 여덟 글자에 드러난 개수, %는 지장간(지지 속 숨은 기운)과 태어난 달의 힘(월령)을 반영한 세력입니다.</p>`;
}

function strengthMeter(saju) {
  const lo = 0.1, hi = 0.8;
  const p = v => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
  return `<div class="meter">
    <div class="track">
      <span class="zone" style="left:0;width:${p(STRENGTH_CUTS.weak)}%"></span>
      <span class="zone mid" style="left:${p(STRENGTH_CUTS.weak)}%;width:${p(STRENGTH_CUTS.strong) - p(STRENGTH_CUTS.weak)}%"></span>
      <span class="zone" style="left:${p(STRENGTH_CUTS.strong)}%;right:0"></span>
      <span class="dot" style="left:${p(saju.strength.ratio)}%"></span>
    </div>
    <div class="labels"><span>신약</span><span>중화</span><span>신강</span></div>
  </div>`;
}

function daYunStrip(saju, chart) {
  const items = saju.daYun.map(d => `<li class="dy${d.current ? ' now' : ''}" data-tone="${d.tone}">
      <span class="age">${d.startAge}세</span>
      <span class="gz"><b data-el="${STEMS[d.stem].el}">${d.stem}</b><b data-el="${BRANCHES[d.branch].el}">${d.branch}</b></span>
      <span class="kr">${STEMS[d.stem].ko}${BRANCHES[d.branch].ko}</span>
      <span class="god">${d.god}</span>
      <span class="pill ${TONE[d.tone][1]}">${TONE[d.tone][0]}</span>
      ${d.current ? '<span class="nowtag">지금</span>' : ''}
    </li>`).join('');
  const cur = saju.daYun.find(d => d.current);
  return `<div class="strip"><ol>${items}</ol></div>
    <p class="fine">대운은 ${chart.daYunStart.years}년 ${chart.daYunStart.months}개월 무렵 시작해 10년마다 바뀌며, ${chart.daYunStart.forward ? '순행' : '역행'}합니다.</p>
    ${cur ? `<div class="callout"><h4>지금 대운: ${cur.startYear}~${cur.endYear}년 ${STEMS[cur.stem].ko}${BRANCHES[cur.branch].ko}(${cur.stem}${cur.branch}) · ${cur.god}</h4>
      <p>${esc(cur.theme)} ${cur.tone === 'good' ? '사주에 필요한 기운이 들어와 힘을 받는 10년입니다.' : cur.tone === 'caution' ? '사주가 꺼리는 기운이 들어와 버티는 힘이 필요한 10년입니다.' : '좋고 나쁨이 섞여 있어 선택이 결과를 가르는 10년입니다.'}</p>
      ${cur.clashDay ? caution('대운의 지지가 일지(배우자 자리)와 충돌합니다. 가정·거처·관계에 변화가 생기기 쉬운 시기입니다.') : ''}</div>` : ''}`;
}

export function renderSaju(saju, chart, years) {
  const dm = saju.dayMaster;
  const y = saju.yongsin;
  const corr = chart.correction;
  return `
  <section class="block">
    <h3>사주 원국 <small>四柱 原局</small></h3>
    ${chartTable(saju, chart)}
    <p class="fine">양력 ${chart.solarDate.year}.${chart.solarDate.month}.${chart.solarDate.day} · 음력 ${chart.lunar.year}.${chart.lunar.month}.${chart.lunar.day}${chart.lunar.leap ? '(윤달)' : ''}
      ${chart.timeKnown ? ` · ${esc(corr.place)} 기준 태양시 ${corr.solarTime.slice(11)} (시계보다 ${Math.abs(corr.diffMin)}분 ${corr.diffMin < 0 ? '늦게' : '빠르게'} 계산)${corr.dst ? ' · 서머타임 1시간 반영' : ''}` : ''}</p>
  </section>

  <section class="block">
    <h3>나를 나타내는 글자 <small>日干</small></h3>
    <div class="dm" data-el="${dm.el}">
      <span class="hz">${dm.char}</span>
      <div><b>${esc(dm.image)} · ${STEMS[dm.char].ko}${EL[dm.el].ko}(${dm.char}${EL[dm.el].hanja})</b>
        <p>${esc(dm.text)}</p>${caution(dm.caution)}</div>
    </div>
  </section>

  <section class="block">
    <h3>오행 분포 <small>五行</small></h3>
    ${elementBars(saju)}
    ${saju.excess.map(x => caution(x.text)).join('')}
    ${saju.lack.map(x => caution(x.text)).join('')}
  </section>

  <section class="block">
    <h3>일간의 힘 <small>身強·身弱</small></h3>
    ${strengthMeter(saju)}
    <p><b>${esc(saju.strength.tag)}</b>. ${esc(saju.strength.text)} ${saju.strength.monthSupports ? '태어난 달이 일간을 돕습니다(득령).' : '태어난 달이 일간을 돕지 않습니다(실령).'}</p>
    ${caution(saju.strength.caution)}
  </section>

  <section class="block">
    <h3>필요한 기운 <small>用神</small></h3>
    <div class="yong">
      <div><span class="lbl">용신</span>${elTag(y.el)}<span class="sub">${GROUPS[y.group].name}</span></div>
      <div><span class="lbl">희신</span>${elTag(y.heeEl)}<span class="sub">용신을 돕는 기운</span></div>
      <div><span class="lbl">기신</span>${elTag(y.giEl)}<span class="sub">피하면 좋은 기운</span></div>
    </div>
    <p>${esc(y.reason)}</p>
    <p class="fine">억부법(강하면 덜고 약하면 돕는 방식)으로 고른 간이 용신입니다. 계절의 온도(조후)까지 따지면 달라질 수 있습니다.</p>
  </section>

  <section class="block">
    <h3>십신 구성 <small>十神</small></h3>
    <div class="gods">${saju.groups.map(g => `
      <div class="godrow" data-level="${g.level}">
        <div class="godhead"><b>${g.name}</b><small>${g.hanja}</small>${elTag(g.el)}
          <span class="lvl">${{ high: '강함', mid: '보통', low: '약함', none: '없음' }[g.level]}</span></div>
        <span class="bar"><b style="width:${Math.min(100, g.share * 250)}%"></b></span>
        <p class="role">${esc(g.role)}: ${esc(g.about)}</p>
        ${g.text ? `<p>${esc(g.text)}</p>${caution(g.caution)}` : ''}
      </div>`).join('')}
    </div>
  </section>

  ${saju.shinsal.length ? `<section class="block">
    <h3>신살 <small>神殺</small></h3>
    <div class="sals">${saju.shinsal.map(s => `<div class="sal"><b>${s.name}</b><small>${s.hanja}</small><p>${esc(s.text)}</p>${caution(s.caution)}</div>`).join('')}</div>
  </section>` : ''}

  ${saju.relations.length ? `<section class="block">
    <h3>합과 충 <small>合·沖</small></h3>
    ${saju.relations.map(r => `<div class="rel"><span class="pill ${r.type === 'clash' ? 'bad' : 'good'}">${esc(r.label)}</span><p>${esc(r.text)}</p></div>`).join('')}
  </section>` : ''}

  <section class="block">
    <h3>대운 <small>大運</small></h3>
    ${daYunStrip(saju, chart)}
  </section>

  <section class="block">
    <h3>세운 <small>歲運</small></h3>
    <div class="years">${years.map(yr => `<div class="yearcard" data-tone="${yr.tone}">
      <div class="yhead"><b>${yr.year}년 ${yr.stemKo}${yr.branchKo}년</b><span class="pill ${TONE[yr.tone][1]}">${TONE[yr.tone][0]}</span></div>
      <p>${esc(yr.text)}</p>${caution(yr.caution)}</div>`).join('')}</div>
  </section>`;
}
