// topic.js — 첫 화면에서 고른 질문에 대한 심층 카드(4장)
import { Solar } from '../vendor/lunar.mjs?v=12';
import { STEMS, BRANCHES, EL, GROUPS, tenGod, TEN_GODS, groupOfElement, elementOfGroup, CLASH, BRANCH_COMBINE, isPair, triadOf, PEACH, generatedBy } from './saju/data.js?v=12';
import { yearPillar } from './saju/calendar.js?v=12';
import { analyzeYear } from './saju/analyze.js?v=12';
import { ATTRACT, FITS, LOVE_STYLE, INDUSTRY, WORK_STYLE, GOD_AREA, HABITS, NATAL_SOCIAL, GOD_DO } from './topic-texts.js?v=12';
import { CAREER } from './saju/texts.js?v=12';
import { esc } from './util.js?v=12';

const but = t => t ? `<p class="but"><span>다만</span>${esc(t)}</p>` : '';
const TONE = { good: '순풍', neutral: '보통', caution: '조심' };
const gz = (s, b) => `${s}${b}`;
const gzKo = (s, b) => `${STEMS[s].ko}${BRANCHES[b].ko}`;
const elKo = e => `${EL[e].ko}(${EL[e].hanja})`;
// 받침 따라 조사 고르기: j('정재', '이', '가') → '정재가'
function j(word, a, b) {
  const plain = String(word).replace(/\([^)]*\)\s*$/, '');
  const c = plain.charCodeAt(plain.length - 1);
  const has = c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 !== 0 : true;
  return word + (has ? a : b);
}

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

function bars(rows) {
  const max = Math.max(...rows.map(r => r.v), 0.0001);
  return `<div class="tbars">${rows.map(r => `<div class="tb${r.top ? ' top' : ''}"><span class="nm">${esc(r.label)}</span><span class="bar"><b style="width:${(r.v / max) * 100}%"></b></span></div>`).join('')}</div>`;
}

// ---------------- 연애·결혼 ----------------
function love(ctx) {
  const { saju, face, input } = ctx;
  const dm = saju.dayStem, dmEl = STEMS[dm].el;
  const spouseGroup = input.gender === 'F' ? 'gwanseong' : 'jaeseong';
  const spouseEl = elementOfGroup(dmEl, spouseGroup);
  const star = saju.groups.find(g => g.id === spouseGroup);
  const y = saju.yongsin;
  const dayB = saju.cells.day.branch;
  const cards = [];

  cards.push({
    kicker: '연애·결혼 1/4', title: '끌리는 사람, <em>맞는 사람</em>',
    body: `<p class="lead">${esc(ATTRACT[spouseEl])}</p>
      <p>사주에서 ${input.gender === 'F' ? '남편' : '아내'}·연인을 뜻하는 기운이 ${j(elKo(spouseEl), '이라서', '라서')} 그래요.</p>
      <hr><p><b>오래 잘 맞는 사람</b>은 조금 달라요. ${esc(FITS[y.el])}</p>
      <p>${spouseEl === y.el ? '끌리는 사람과 잘 맞는 사람이 같은 쪽이에요. 마음 가는 대로 골라도 크게 어긋나지 않는 사주예요.' : '끌리는 사람과 잘 맞는 사람이 달라요. 설레는 사람보다 편한 사람 쪽을 한 번 더 보세요.'}</p>
      <p class="hint">배우자 자리(일지): ${dayB.char} ${dayB.ko} · ${dayB.animal}, ${dayB.god}</p>`,
  });

  const sik = saju.groups.find(g => g.id === 'siksang');
  const peach = saju.shinsal.find(s => s.key === 'peach');
  const faceBits = [];
  if (face) {
    const c = face.result.features.find(f => f.id === 'mouthCorner');
    const e = face.result.features.find(f => f.id === 'eyeShape');
    faceBits.push(`얼굴은 ${e.band.tag}에 ${j(c.band.tag, '이에요', '예요')}.`);
  }
  cards.push({
    kicker: '연애·결혼 2/4', title: '연애할 때의 나',
    body: `<p class="lead">${esc(LOVE_STYLE[dm])}</p>
      <p>${sik.level === 'high' ? '표현하는 기운(식상)이 강해서 좋아하는 마음을 잘 드러내요. 다만 말이 앞서 상대를 피곤하게 할 때가 있어요.' : sik.level === 'none' || sik.level === 'low' ? '표현하는 기운(식상)이 약해서 마음은 큰데 잘 안 보여요. 상대는 내 마음을 생각보다 모를 수 있어요.' : '표현하는 기운(식상)이 알맞아서 밀고 당기기를 무리 없이 해요.'}</p>
      ${peach ? '<p>도화살이 있어 가만히 있어도 사람이 다가와요. 인연이 많은 만큼 고르는 눈이 중요해요.</p>' : ''}
      ${faceBits.length ? `<p>${esc(faceBits.join(' '))}</p>` : ''}
      ${but(saju.dayMaster.caution)}`,
  });

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
  cards.push({
    kicker: '연애·결혼 3/4', title: '인연이 들어오는 해',
    body: `${yearList(picks)}
      <p class="hint">${star.level === 'high' ? '배우자를 뜻하는 기운이 원래 강해서, 위의 해가 아니어도 인연은 자주 와요.' : star.level === 'none' ? '배우자를 뜻하는 기운이 사주에 잘 안 보여서, 이런 해에 들어오는 인연을 놓치지 않는 게 중요해요.' : '이런 해에 소개, 모임, 새 환경을 일부러 늘려 보세요.'}</p>
      ${clashYear ? but(`${clashYear.year}년에는 그해 기운이 배우자 자리와 부딪혀요. 만남과 헤어짐, 이사 같은 관계 변화가 생기기 쉬우니 큰 결정은 서두르지 마세요.`) : ''}`,
  });

  const warn = [];
  if (saju.relations.some(r => r.type === 'clash' && /일주/.test(r.text))) warn.push('사주 안에서 배우자 자리가 다른 기둥과 부딪혀요. 결혼 후 생활 방식, 집안 문제로 갈등이 생기기 쉬우니 미리 규칙을 정해 두세요.');
  if (input.gender !== 'F' && saju.groups.find(g => g.id === 'bigeop').level === 'high') warn.push('나와 같은 기운(비겁)이 강해서 연애와 돈이 섞이면 탈이 나요. 연인과의 돈 관리는 처음부터 분명히 나누세요.');
  if (input.gender === 'F' && sik.level === 'high') warn.push('말로 이기려는 기운(식상)이 강해요. 다툴 때 맞는 말이라도 상대를 몰아붙이면 관계가 상해요.');
  const gw = Object.values(saju.cells).flatMap(c => [c.stem.god, c.branch.god]);
  if (input.gender === 'F' && gw.includes('정관') && gw.includes('편관')) warn.push('남자를 뜻하는 기운이 두 종류(정관·편관) 다 있어요. 두 사람 사이에서 마음이 흔들리는 시기가 올 수 있어요.');
  if (input.gender !== 'F' && gw.includes('정재') && gw.includes('편재')) warn.push('여자를 뜻하는 기운이 두 종류(정재·편재) 다 있어요. 인연이 겹치는 시기가 올 수 있으니 선을 분명히 하세요.');
  if (star.level === 'none') warn.push('배우자를 뜻하는 기운이 약해서 일찍 하는 결혼보다 늦게, 확신이 들 때 하는 결혼이 더 안정적이에요.');
  if (face) warn.push(face.result.features.find(f => f.id === 'mouthCorner').band.caution);
  warn.push(saju.strength.key === 'strong' ? '기운이 센 사주라 관계에서도 주도권을 쥐려 해요. 한 번씩 져 주는 게 오래 가는 비결이에요.' : '상대에게 맞추다 내가 지치기 쉬워요. 싫은 건 싫다고 말하는 연습이 필요해요.');
  cards.push({
    kicker: '연애·결혼 4/4', title: '관계에서 <em>조심</em>할 것',
    body: `<ol class="list3">${warn.slice(0, 3).map(w => `<li><span>${esc(w)}</span></li>`).join('')}</ol>`,
  });
  return cards;
}

// ---------------- 돈·재물 ----------------
function money(ctx) {
  const { saju, face } = ctx;
  const dm = saju.dayStem;
  const g = id => saju.groups.find(x => x.id === id);
  const gods = Object.values(saju.cells).flatMap(c => [c.stem.god, c.branch.god]);
  const pyeon = gods.filter(x => x === '편재').length, jeong = gods.filter(x => x === '정재').length;
  const cards = [];

  let path, lead;
  if (g('siksang').level === 'high' && g('jaeseong').level !== 'none') { path = '재능이 돈이 되는 사람'; lead = '표현하고 만드는 기운(식상)이 재물(재성)로 이어지는 구조예요. 내가 잘하는 걸 상품이나 서비스로 만들 때 돈이 붙어요. 부업, 프리랜서, 콘텐츠처럼 "내 이름으로 하는 일"이 맞아요.'; }
  else if (g('jaeseong').level === 'none') { path = '실력이 쌓이면 돈이 따라오는 사람'; lead = '사주에 돈을 뜻하는 기운이 겉으로 잘 안 보여요. 돈을 직접 좇으면 오히려 멀어지고, 자격·전문성·평판을 쌓으면 돈이 뒤따라오는 구조예요.'; }
  else if (g('gwanseong').level === 'high') { path = '자리에서 돈이 나오는 사람'; lead = '조직과 명예를 뜻하는 기운(관성)이 강해요. 직급, 직함, 소속이 곧 돈이에요. 큰 투자보다 승진과 연봉 협상에 힘을 쓰는 게 이득이에요.'; }
  else if (pyeon > jeong) { path = '크게 움직이는 돈을 다루는 사람'; lead = '큰돈·바깥 돈을 뜻하는 편재가 중심이에요. 사업, 영업, 투자처럼 판이 큰 돈과 인연이 있어요. 한 번에 크게 들어오고 크게 나가는 흐름이에요.'; }
  else { path = '차곡차곡 쌓는 사람'; lead = '꾸준한 돈을 뜻하는 정재가 중심이에요. 월급, 적금, 고정 수입처럼 정해진 돈을 착실히 모을 때 가장 크게 불어나요.'; }
  cards.push({ kicker: '돈·재물 1/4', title: `<em>${path}</em>`, body: `<p class="lead">${esc(lead)}</p><p class="hint">사주의 재물 기운(재성): ${{ high: '강함', mid: '보통', low: '약함', none: '거의 없음' }[g('jaeseong').level]} · 편재 ${pyeon} · 정재 ${jeong}</p>` });

  const s = saju.strength.key, j = g('jaeseong').level;
  let bowl;
  if (s === 'strong' && (j === 'high' || j === 'mid')) bowl = '돈을 벌 힘도, 감당할 그릇도 있어요. 사주로 보면 재물 그릇이 큰 편이에요. 기회가 오면 한 단계 큰 판으로 가도 버텨요.';
  else if (s === 'strong') bowl = '벌 힘은 충분한데 돈이 들어올 판이 작아요. 내 힘을 돈으로 바꾸는 통로(부업, 이직, 사업)를 직접 만들어야 그릇이 채워져요.';
  else if (j === 'high') bowl = '돈은 눈앞에 많이 보이는데 내가 감당할 힘이 약한 구조예요. 욕심나는 기회가 많을수록 무리하지 말고, 믿을 만한 사람과 나눠서 가세요.';
  else if (s === 'balanced') bowl = '버는 힘과 담는 그릇이 균형 잡혀 있어요. 무리한 한 방만 피하면 시간이 갈수록 꾸준히 불어나는 구조예요.';
  else bowl = '큰돈보다 작은 돈을 오래 굴리는 쪽이 맞아요. 잃지 않는 것이 버는 것보다 중요한 사주예요.';
  const nose = face?.result.features.find(f => f.id === 'noseWidth');
  cards.push({ kicker: '돈·재물 2/4', title: '내 돈 그릇', body: `<p class="lead">${esc(bowl)}</p>${nose ? `<p>관상에서 재물 창고로 보는 콧볼은 '${esc(nose.band.tag)}'이에요. ${esc(nose.band.text)}</p>` : '<p class="hint">사진을 넣으면 관상의 재물 창고(콧볼)도 함께 봐요.</p>'}` });

  const leaks = [];
  if (g('bigeop').level === 'high') leaks.push('사람에게 새는 돈. 빌려주기, 보증, 동업, 경조사처럼 정 때문에 나가는 돈이 커요.');
  if (g('siksang').level === 'high') leaks.push('나를 위해 쓰는 돈. 맛있는 것, 취미, 기분 전환에 쓰는 돈이 생각보다 많아요.');
  if (g('inseong').level === 'high') leaks.push('생각만 하다 놓치는 돈. 공부와 준비에 돈을 쓰고, 정작 실행은 늦어서 기회비용이 커요.');
  if (j === 'high' && s === 'weak') leaks.push('감당 못 할 투자. 남들이 좋다는 데 따라 들어갔다가 크게 물리기 쉬워요.');
  if (pyeon > jeong && pyeon >= 2) leaks.push('한 방을 노리는 돈. 큰 수익을 노릴수록 손실도 커지는 구조예요.');
  if (nose) leaks.push(nose.band.caution);
  if (leaks.length < 2) leaks.push('고정 지출. 크게 새는 곳은 없지만 구독, 보험, 할부처럼 조용히 나가는 돈을 1년에 한 번은 정리하세요.');
  cards.push({ kicker: '돈·재물 3/4', title: '돈이 <em>새는</em> 구멍', body: `<ol class="list3">${leaks.slice(0, 3).map(t => `<li><span>${esc(t)}</span></li>`).join('')}</ol>` });

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
  cards.push({ kicker: '돈·재물 4/4', title: '돈이 붙는 해', body: `${yearList(picks)}${bad ? but(`${bad.year}년은 돈이 새기 쉬운 해예요. 큰 투자, 빌려주기, 보증은 이 해를 피하세요.`) : ''}` });
  return cards;
}

// ---------------- 일·진로 ----------------
function work(ctx) {
  const { saju, face } = ctx;
  const dm = saju.dayStem;
  const g = id => saju.groups.find(x => x.id === id);
  const d = saju.dominant;
  const monthGod = saju.cells.month.branch.god;
  const cards = [];
  cards.push({ kicker: '일·진로 1/4', title: '일할 때의 나', body: `<p class="lead">${esc(WORK_STYLE[dm])}</p><p>사회 생활을 보는 자리(월지)에는 ${esc(j(monthGod, '이', '가'))} 있어요. ${esc(NATAL_SOCIAL[monthGod].work)}</p>${face ? `<p>얼굴은 ${esc(face.result.face.primary.name)}으로, ${esc(face.result.face.primary.text.split('. ')[1] || '')}</p>` : ''}` });

  cards.push({ kicker: '일·진로 2/4', title: '잘 맞는 분야', body: `
    <p class="lead">${esc(CAREER[d.id])} 쪽이 잘 맞아요.</p>
    <p>사주에서 가장 센 기운이 ${GROUPS[d.id].name}(${GROUPS[d.id].about.split('·').slice(0, 2).join('·')})이라서예요.</p>
    <hr><p><b>오래 버티기 좋은 업종</b> · ${esc(INDUSTRY[saju.yongsin.el])}</p>
    <p class="hint">나에게 필요한 기운 ${elKo(saju.yongsin.el)}에 속한 업종이에요. 일이 힘들어도 기운을 채워 줘서 오래 갈 수 있어요.</p>` });

  const types = [
    { id: 'job', label: '조직형', v: g('gwanseong').share + g('inseong').share * 0.6, text: '정해진 자리에서 인정받을 때 가장 잘 커요. 공공기관, 대기업, 전문 조직처럼 규칙이 분명한 곳이 맞아요.' },
    { id: 'pro', label: '전문가형', v: g('siksang').share * 0.7 + g('inseong').share * 0.7, text: '내 기술과 지식이 무기예요. 자격, 포트폴리오, 이름값을 쌓아서 어디서든 불려 가는 사람이 되는 길이 맞아요.' },
    { id: 'biz', label: '사업형', v: g('jaeseong').share + g('bigeop').share * 0.5 + g('siksang').share * 0.3, text: '내 판을 직접 짤 때 힘이 나요. 처음엔 작게, 남의 돈 말고 내 돈으로 시작하는 사업이 맞아요.' },
  ];
  const top = [...types].sort((a, b) => b.v - a.v)[0];
  top.top = true;
  cards.push({ kicker: '일·진로 3/4', title: `나는 <em>${top.label}</em>`, body: `${bars(types)}<p class="lead">${esc(top.text)}</p>${but(d.caution)}` });

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
  cards.push({ kicker: '일·진로 4/4', title: '움직이기 좋은 해', body: `${yearList(picks)}<p class="hint">승진은 관성, 이직과 새 일은 식상, 사업은 재성이 들어오는 해에 잘 풀려요.</p>` });
  return cards;
}

// ---------------- 올해 운세 ----------------
function monthPillars(y) {
  return Array.from({ length: 12 }, (_, i) => {
    const m = Solar.fromYmd(y, i + 1, 20).getLunar().getMonthInGanZhiExact();
    return { month: i + 1, stem: m[0], branch: m[1] };
  });
}

function year(ctx) {
  const { saju, years } = ctx;
  const yr = years[0];
  const cards = [];
  const pillarName = { year: '집안·부모', month: '직장·사회', day: '나와 배우자', hour: '자녀·앞날 계획' };
  const hits = [];
  for (const k of ['year', 'month', 'day', 'hour']) {
    const c = saju.cells[k]; if (!c) continue;
    if (isPair(CLASH, yr.branch, c.branch.char)) hits.push(`${pillarName[k]} 쪽에 변화가 생겨요(충)`);
    if (isPair(BRANCH_COMBINE, yr.branch, c.branch.char)) hits.push(`${pillarName[k]} 쪽에 좋은 인연이 붙어요(합)`);
  }
  cards.push({ kicker: `${yr.year}년 1/4`, title: `${yr.year}년은 <em>${TONE[yr.tone]}</em>`, body: `
    <p class="lead">${esc(yr.theme)}</p>
    <p>${yr.tone === 'good' ? '내 사주에 필요한 기운이 들어오는 해라서, 같은 노력을 해도 결과가 잘 나와요.' : yr.tone === 'caution' ? '내 사주가 꺼리는 기운이 들어오는 해라서, 새로 벌이기보다 지키는 쪽이 이득이에요.' : '좋고 나쁨이 섞여 있어서, 무엇을 고르느냐에 따라 결과가 갈리는 해예요.'}</p>
    ${hits.length ? `<p>${esc(hits.join('. '))}.</p>` : ''}
    ${but(yr.caution)}` });

  const A = GOD_AREA[yr.god], B = GOD_AREA[yr.branchGod];
  cards.push({ kicker: `${yr.year}년 2/4`, title: '분야별로 보면', body: `
    <p class="hint">한 해의 앞쪽은 천간(${yr.stem}, ${esc(yr.god)}), 뒤쪽은 지지(${yr.branch}, ${esc(yr.branchGod)})의 영향이 커요.</p>
    <div class="area"><b>돈</b><p>상반기: ${esc(A.money)}<br>하반기: ${esc(B.money)}</p></div>
    <div class="area"><b>일</b><p>상반기: ${esc(A.work)}<br>하반기: ${esc(B.work)}</p></div>
    <div class="area"><b>사람</b><p>상반기: ${esc(A.people)}<br>하반기: ${esc(B.people)}</p></div>` });

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
  cards.push({ kicker: `${yr.year}년 3/4`, title: '달별 흐름', body: `${chart}
    <p><b>힘이 붙는 달</b> · ${best.map(m => `${m.month}월(${esc(m.god)})`).join(', ')}. 중요한 시작, 면접, 계약은 이때로 잡아 보세요.</p>
    <p><b>쉬어 갈 달</b> · ${worst.map(m => `${m.month}월(${esc(m.god)})`).join(', ')}. 큰 결정을 미루고 컨디션을 챙기세요.</p>
    <p class="hint">절기 기준이라 달마다 5일 무렵에 기운이 바뀌어요.</p>` });

  const ny = years[1];
  cards.push({ kicker: `${yr.year}년 4/4`, title: '올해 할 것, 하지 말 것', body: `
    <p><b>할 것</b></p><ol class="list3">${HABITS[saju.yongsin.el].slice(0, 2).map(h => `<li><span>${esc(h)}</span></li>`).join('')}<li><span>${esc(GOD_DO[yr.god])}</span></li></ol>
    <p><b>하지 말 것</b></p><p>${esc(yr.caution)}</p>
    <hr><p class="hint">${ny.year}년 미리 보기: ${TONE[ny.tone]} · ${esc(ny.theme)}</p>` });
  return cards;
}

// ---------------- 나라는 사람 ----------------
function self(ctx) {
  const { saju, face } = ctx;
  const dm = saju.dayMaster;
  const monthStemGod = saju.cells.month.stem.god;
  const cards = [];
  cards.push({ kicker: '나라는 사람 1/4', title: '겉과 <em>속</em>', body: `
    <p><b>속</b> · ${esc(dm.text)}</p>
    <p><b>밖에서 보이는 나</b> · 사회 생활을 보는 월주에 ${esc(j(monthStemGod, '이', '가'))} 드러나 있어요. ${esc(NATAL_SOCIAL[monthStemGod].people)}</p>
    ${face ? `<p><b>얼굴이 주는 인상</b> · ${esc(face.result.face.primary.text)}</p>` : ''}
    <p class="hint">${saju.strength.key === 'strong' ? '속이 단단해서 겉보다 실제로 더 고집이 세요.' : saju.strength.key === 'weak' ? '겉으로는 괜찮아 보여도 속은 주변 영향을 많이 받아요.' : '겉과 속의 차이가 크지 않은 편이에요.'}</p>` });

  const strengths = [];
  strengths.push(saju.dominant.text);
  const goodSal = saju.shinsal.find(s => ['noble', 'peach', 'canopy', 'horse'].includes(s.key));
  if (goodSal) strengths.push(`${goodSal.name}: ${goodSal.text}`);
  if (face) strengths.push(`관상: ${face.result.standouts[0].band.text}`);
  strengths.push(saju.strength.text);
  cards.push({ kicker: '나라는 사람 2/4', title: '타고난 <em>무기</em>', body: `<ol class="list3">${strengths.slice(0, 3).map(t => `<li><span>${esc(t)}</span></li>`).join('')}</ol>` });

  const weak = [dm.caution, saju.strength.caution];
  if (saju.excess[0]) weak.push(saju.excess[0].text);
  if (face) weak.push(face.result.standouts[0].band.caution);
  cards.push({ kicker: '나라는 사람 3/4', title: '알아 두면 좋은 <em>약점</em>', body: `<ol class="list3">${weak.slice(0, 3).map(t => `<li><span>${esc(t)}</span></li>`).join('')}</ol>` });

  const y = saju.yongsin.el;
  cards.push({ kicker: '나라는 사람 4/4', title: '나를 살리는 습관', body: `
    <p class="lead">나에게 모자란 기운은 ${j(elKo(y), '이에요', '예요')}. 생활에서 이 기운을 채우면 컨디션과 운이 같이 올라가요.</p>
    <ol class="list3">${HABITS[y].map(h => `<li><span>${esc(h)}</span></li>`).join('')}</ol>` });
  return cards;
}

const BUILDERS = { love, money, work, year, self };

export function topicCards(ctx) {
  const fn = BUILDERS[ctx.input.topic] || self;
  return fn(ctx);
}
