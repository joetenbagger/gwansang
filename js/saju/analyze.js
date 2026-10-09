// analyze.js — 사주팔자 → 해석 데이터 (DOM과 무관한 순수 함수)
import {
  ELEMENTS, EL, STEMS, BRANCHES, GENERATES, CONTROLS, generatedBy, controlledBy,
  tenGod, groupOfElement, elementOfGroup, GROUPS, GROUP_ORDER, TEN_GODS,
  CLASH, BRANCH_COMBINE, STEM_COMBINE, isPair, triadOf, PEACH, HORSE, CANOPY, NOBLE, BLADE, KUIGANG,
} from './data.js?v=12';
import {
  DAY_MASTER, STRENGTH, GROUP_TEXT, CAREER, ELEMENT_EXCESS, ELEMENT_LACK, SHINSAL, CLASH_TEXT, LUCK_THEME,
} from './texts.js?v=12';

// 일간 강약 판정 경계 (무작위 생일 2만 개 분포의 약 1/3 지점들로 맞춤 — tools/calibrate-saju.mjs)
export const STRENGTH_CUTS = { weak: 0.33, strong: 0.47 };

const ORDER = ['hour', 'day', 'month', 'year'];

export function analyzeSaju(chart, today = new Date()) {
  const { pillars } = chart;
  const dayStem = pillars.day.stem;
  const dm = STEMS[dayStem];
  const list = ORDER.map(k => pillars[k]).filter(Boolean);

  // ---- 글자별 정보 ----
  const cells = {};
  for (const p of list) {
    cells[p.kind] = {
      stem: { char: p.stem, ...STEMS[p.stem], god: p.kind === 'day' ? '일간' : tenGod(dayStem, p.stem) },
      branch: {
        char: p.branch, ...BRANCHES[p.branch], god: tenGod(dayStem, BRANCHES[p.branch].main),
        hidden: BRANCHES[p.branch].hidden.map(([s]) => ({ char: s, ko: STEMS[s].ko, el: STEMS[s].el, god: tenGod(dayStem, s) })),
      },
    };
  }

  // ---- 오행: 겉으로 드러난 글자 수 / 지장간 포함 세력 ----
  const count = Object.fromEntries(ELEMENTS.map(e => [e, 0]));
  const power = Object.fromEntries(ELEMENTS.map(e => [e, 0]));
  for (const p of list) {
    count[STEMS[p.stem].el] += 1;
    count[BRANCHES[p.branch].el] += 1;
    power[STEMS[p.stem].el] += 1;
    const w = p.kind === 'month' ? 2 : 1; // 월령(태어난 달)은 두 배
    for (const [s, r] of BRANCHES[p.branch].hidden) power[STEMS[s].el] += r * w;
  }
  const powerTotal = ELEMENTS.reduce((a, e) => a + power[e], 0);
  const powerPct = Object.fromEntries(ELEMENTS.map(e => [e, power[e] / powerTotal]));

  // ---- 강약: 일간 자신은 빼고 돕는 기운(비겁+인성)의 비율 ----
  const supportEls = [dm.el, generatedBy(dm.el)];
  const adj = { ...power, [dm.el]: power[dm.el] - 1 };
  const adjTotal = ELEMENTS.reduce((a, e) => a + adj[e], 0);
  const supportRatio = supportEls.reduce((a, e) => a + adj[e], 0) / adjTotal;
  const strengthKey = supportRatio >= STRENGTH_CUTS.strong ? 'strong' : supportRatio < STRENGTH_CUTS.weak ? 'weak' : 'balanced';
  const monthSupports = supportEls.includes(BRANCHES[pillars.month.branch].el); // 득령

  // ---- 십신 묶음 세력 ----
  const groupPower = Object.fromEntries(GROUP_ORDER.map(g => [g, adj[elementOfGroup(dm.el, g)]]));
  const groupCount = Object.fromEntries(GROUP_ORDER.map(g => [g, 0]));
  for (const p of list) {
    if (p.kind !== 'day') groupCount[TEN_GODS[tenGod(dayStem, p.stem)].group] += 1;
    groupCount[TEN_GODS[tenGod(dayStem, BRANCHES[p.branch].main)].group] += 1;
  }
  const groupLevel = g => {
    const share = groupPower[g] / adjTotal;
    if (groupCount[g] === 0 && share < 0.06) return 'none';
    if (share >= 0.26 || groupCount[g] >= 3) return 'high';
    if (share < 0.12) return 'low';
    return 'mid';
  };
  const groups = GROUP_ORDER.map(g => {
    const level = groupLevel(g);
    return { id: g, ...GROUPS[g], el: elementOfGroup(dm.el, g), count: groupCount[g], share: groupPower[g] / adjTotal, level,
      ...GROUP_TEXT[g][level] };
  });
  const dominant = [...groups].sort((a, b) => b.share - a.share)[0];

  // ---- 용신(억부): 강하면 덜어 주고, 약하면 도와주는 오행 ----
  let yong, yongReason;
  const g = id => groups.find(x => x.id === id);
  if (strengthKey === 'strong') {
    if (g('inseong').share > g('bigeop').share) { yong = 'jaeseong'; yongReason = '인성이 많아 재성으로 눌러 주어야 균형이 맞습니다.'; }
    else if (g('siksang').share >= 0.25) { yong = 'jaeseong'; yongReason = '비겁과 식상이 함께 강해, 넘치는 힘을 재성으로 이어 흘려보내야 균형이 맞습니다.'; }
    else if (g('gwanseong').share < 0.2) { yong = 'gwanseong'; yongReason = '비겁이 강해 관성으로 다스려 주어야 균형이 맞습니다.'; }
    else { yong = 'siksang'; yongReason = '넘치는 힘을 식상으로 흘려보내야 균형이 맞습니다.'; }
  } else if (strengthKey === 'weak') {
    const drain = ['siksang', 'jaeseong', 'gwanseong'].map(id => g(id)).sort((a, b) => b.share - a.share)[0];
    if (drain.id === 'jaeseong' || g('jaeseong').share >= 0.25) { yong = 'bigeop'; yongReason = '재성이 많아 비겁으로 힘을 보태야 재물을 감당할 수 있습니다.'; }
    else { yong = 'inseong'; yongReason = drain.id === 'gwanseong' ? '관성의 압박을 인성으로 받아 내 힘으로 바꿔야 합니다.' : '식상으로 빠지는 힘을 인성으로 채워야 합니다.'; }
  } else {
    yong = groupOfElement(dm.el, ELEMENTS.reduce((a, e) => (power[e] < power[a] ? e : a), ELEMENTS[0]));
    yongReason = '균형이 잡혀 있어, 가장 약한 기운을 채워 주는 쪽으로 봅니다.';
  }
  const yongEl = elementOfGroup(dm.el, yong);
  const yongsin = {
    group: yong, el: yongEl, reason: yongReason,
    heeEl: pickHee(dm.el, yong, strengthKey, yongEl, g('siksang').share >= 0.25), // 희신: 용신을 돕는 오행
    giEl: controlledBy(yongEl),       // 기신: 용신을 해치는 오행
    lucky: EL[yongEl],
  };

  // ---- 오행 과다·부족 ----
  const excess = ELEMENTS.filter(e => powerPct[e] >= 0.32).map(e => ({ el: e, text: ELEMENT_EXCESS[e] }));
  const lack = ELEMENTS.filter(e => count[e] === 0 || powerPct[e] < 0.07).map(e => ({ el: e, text: ELEMENT_LACK[e], missing: count[e] === 0 }));

  // ---- 신살 ----
  const shinsal = [];
  const branchesOf = except => list.filter(p => p.kind !== except).map(p => p.branch);
  const addSal = (key, where) => { if (!shinsal.some(s => s.key === key)) shinsal.push({ key, where, ...SHINSAL[key] }); };
  for (const base of ['year', 'day']) {
    if (!pillars[base]) continue;
    const t = triadOf(pillars[base].branch);
    const others = branchesOf(base);
    if (others.includes(PEACH[t])) addSal('peach');
    if (others.includes(HORSE[t])) addSal('horse');
    if (others.includes(CANOPY[t])) addSal('canopy');
  }
  if (list.some(p => NOBLE[dayStem].includes(p.branch))) addSal('noble');
  if (BLADE[dayStem] && list.some(p => p.branch === BLADE[dayStem])) addSal('blade');
  if (KUIGANG.includes(pillars.day.stem + pillars.day.branch)) addSal('kuigang');

  // ---- 충·합 ----
  const relations = [];
  const kinds = list.map(p => p.kind);
  for (let i = 0; i < kinds.length; i++) for (let j = i + 1; j < kinds.length; j++) {
    const a = pillars[kinds[i]], b = pillars[kinds[j]];
    const key = ['year', 'month', 'day', 'hour'].filter(k => k === a.kind || k === b.kind).join('-');
    if (isPair(CLASH, a.branch, b.branch)) relations.push({ type: 'clash', label: `${BRANCHES[a.branch].ko}${BRANCHES[b.branch].ko} 충`, text: CLASH_TEXT[key] });
    if (isPair(BRANCH_COMBINE, a.branch, b.branch)) relations.push({ type: 'combine', label: `${BRANCHES[a.branch].ko}${BRANCHES[b.branch].ko} 합`, text: '서로 끌어당기는 합이 있어 해당 시기의 인연이 끈끈하고 도움이 오갑니다. 다만 합이 많으면 맺고 끊기가 어렵습니다.' });
    if (isPair(STEM_COMBINE, a.stem, b.stem)) relations.push({ type: 'combine', label: `${STEMS[a.stem].ko}${STEMS[b.stem].ko} 합`, text: '천간끼리 합이 있어 사람과 잘 어울리고 타협에 능합니다. 대신 우유부단해 보일 수 있습니다.' });
  }

  // ---- 대운: 현재 대운과 각 대운의 흐름 ----
  const year = today.getFullYear();
  const luckTone = (stem, branch) => {
    const els = [STEMS[stem].el, BRANCHES[branch].el];
    let s = 0;
    // 용신 +2, 희신 +1, 기신 -2. 그 밖에 신강일 때 일간을 더 키우는 기운, 신약일 때 힘을 빼는 재성·관성은 -1
    const heavy = strengthKey === 'strong' ? supportEls : strengthKey === 'weak' ? [elementOfGroup(dm.el, 'jaeseong'), elementOfGroup(dm.el, 'gwanseong')] : [];
    for (const e of els) {
      if (e === yongEl) s += 2; else if (e === yongsin.heeEl) s += 1; else if (e === yongsin.giEl) s -= 2; else if (heavy.includes(e)) s -= 1;
    }
    const clash = isPair(CLASH, branch, pillars.day.branch);
    if (clash) s -= 1;
    return { score: s, tone: s >= 2 ? 'good' : s <= -2 ? 'caution' : 'neutral', clashDay: clash };
  };
  const daYun = chart.daYun.map(d => {
    const god = tenGod(dayStem, d.stem);
    return { ...d, god, theme: LUCK_THEME[god], branchGod: tenGod(dayStem, BRANCHES[d.branch].main), current: year >= d.startYear && year <= d.endYear, ...luckTone(d.stem, d.branch) };
  });

  return {
    dayStem, dayMaster: { ...dm, char: dayStem, ...DAY_MASTER[dayStem] },
    cells, count, power, powerPct,
    strength: { key: strengthKey, ratio: supportRatio, monthSupports, ...STRENGTH[strengthKey] },
    groups, dominant, career: CAREER[dominant.id],
    yongsin, excess, lack, shinsal, relations, daYun,
    luckTone,
  };
}

// 희신: 신강이면 일간을 더 키우지 않는 쪽, 신약이면 일간을 돕는 쪽에서 고릅니다.
function pickHee(dmEl, yong, strengthKey, yongEl, siksangStrong) {
  if (strengthKey === 'strong') {
    const pair = { siksang: 'jaeseong', jaeseong: siksangStrong ? 'gwanseong' : 'siksang', gwanseong: 'jaeseong' };
    return elementOfGroup(dmEl, pair[yong]);
  }
  if (strengthKey === 'weak') return elementOfGroup(dmEl, yong === 'inseong' ? 'bigeop' : 'inseong');
  return generatedBy(yongEl);
}

/** 특정 해(세운)의 흐름 */
export function analyzeYear(saju, yp) {
  const god = tenGod(saju.dayStem, yp.stem);
  const branchGod = tenGod(saju.dayStem, BRANCHES[yp.branch].main);
  const tone = saju.luckTone(yp.stem, yp.branch);
  return { ...yp, stemKo: STEMS[yp.stem].ko, branchKo: BRANCHES[yp.branch].ko, god, branchGod, theme: LUCK_THEME[god], ...tone };
}
