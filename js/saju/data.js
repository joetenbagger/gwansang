// data.js — 천간·지지·오행 기본 표

export const ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water'];
export const EL = {
  wood:  { ko: '목', hanja: '木', name: '나무', color: '푸른색·초록', direction: '동쪽', numbers: '3, 8', season: '봄' },
  fire:  { ko: '화', hanja: '火', name: '불', color: '붉은색·보라', direction: '남쪽', numbers: '2, 7', season: '여름' },
  earth: { ko: '토', hanja: '土', name: '흙', color: '노란색·갈색', direction: '중앙', numbers: '5, 10', season: '환절기' },
  metal: { ko: '금', hanja: '金', name: '쇠', color: '흰색·금색', direction: '서쪽', numbers: '4, 9', season: '가을' },
  water: { ko: '수', hanja: '水', name: '물', color: '검은색·남색', direction: '북쪽', numbers: '1, 6', season: '겨울' },
};

// 상생: 앞이 뒤를 생함 / 상극: 앞이 뒤를 극함
export const GENERATES = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
export const CONTROLS = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };
export const generatedBy = el => ELEMENTS.find(e => GENERATES[e] === el);
export const controlledBy = el => ELEMENTS.find(e => CONTROLS[e] === el);

export const STEMS = {
  甲: { ko: '갑', el: 'wood', yang: true },  乙: { ko: '을', el: 'wood', yang: false },
  丙: { ko: '병', el: 'fire', yang: true },  丁: { ko: '정', el: 'fire', yang: false },
  戊: { ko: '무', el: 'earth', yang: true }, 己: { ko: '기', el: 'earth', yang: false },
  庚: { ko: '경', el: 'metal', yang: true }, 辛: { ko: '신', el: 'metal', yang: false },
  壬: { ko: '임', el: 'water', yang: true }, 癸: { ko: '계', el: 'water', yang: false },
};

// hidden: 지장간 [천간, 비중] — 절기 일수 비율 기준(여기·중기·본기)
export const BRANCHES = {
  子: { ko: '자', el: 'water', animal: '쥐',   main: '癸', hidden: [['壬', 0.3], ['癸', 0.7]] },
  丑: { ko: '축', el: 'earth', animal: '소',   main: '己', hidden: [['癸', 0.3], ['辛', 0.1], ['己', 0.6]] },
  寅: { ko: '인', el: 'wood',  animal: '호랑이', main: '甲', hidden: [['戊', 0.23], ['丙', 0.23], ['甲', 0.54]] },
  卯: { ko: '묘', el: 'wood',  animal: '토끼', main: '乙', hidden: [['甲', 0.33], ['乙', 0.67]] },
  辰: { ko: '진', el: 'earth', animal: '용',   main: '戊', hidden: [['乙', 0.3], ['癸', 0.1], ['戊', 0.6]] },
  巳: { ko: '사', el: 'fire',  animal: '뱀',   main: '丙', hidden: [['戊', 0.23], ['庚', 0.23], ['丙', 0.54]] },
  午: { ko: '오', el: 'fire',  animal: '말',   main: '丁', hidden: [['丙', 0.33], ['己', 0.3], ['丁', 0.37]] },
  未: { ko: '미', el: 'earth', animal: '양',   main: '己', hidden: [['丁', 0.3], ['乙', 0.1], ['己', 0.6]] },
  申: { ko: '신', el: 'metal', animal: '원숭이', main: '庚', hidden: [['戊', 0.23], ['壬', 0.23], ['庚', 0.54]] },
  酉: { ko: '유', el: 'metal', animal: '닭',   main: '辛', hidden: [['庚', 0.33], ['辛', 0.67]] },
  戌: { ko: '술', el: 'earth', animal: '개',   main: '戊', hidden: [['辛', 0.3], ['丁', 0.1], ['戊', 0.6]] },
  亥: { ko: '해', el: 'water', animal: '돼지', main: '壬', hidden: [['戊', 0.23], ['甲', 0.23], ['壬', 0.54]] },
};

export const PILLAR_NAMES = { year: '년주', month: '월주', day: '일주', hour: '시주' };
export const PILLAR_MEANING = {
  year: '조상·초년(~20세 무렵)',
  month: '부모·사회·청년기(20~40세)',
  day: '나와 배우자·중년(40~60세)',
  hour: '자녀·말년(60세~)',
};

// 십신
export const TEN_GODS = {
  비견: { group: 'bigeop', hanja: '比肩' }, 겁재: { group: 'bigeop', hanja: '劫財' },
  식신: { group: 'siksang', hanja: '食神' }, 상관: { group: 'siksang', hanja: '傷官' },
  편재: { group: 'jaeseong', hanja: '偏財' }, 정재: { group: 'jaeseong', hanja: '正財' },
  편관: { group: 'gwanseong', hanja: '偏官' }, 정관: { group: 'gwanseong', hanja: '正官' },
  편인: { group: 'inseong', hanja: '偏印' }, 정인: { group: 'inseong', hanja: '正印' },
};
export const GROUPS = {
  bigeop:    { name: '비겁', hanja: '比劫', role: '나와 같은 기운 — 자아·형제·동료·경쟁' },
  siksang:   { name: '식상', hanja: '食傷', role: '내가 낳는 기운 — 표현·재능·말·자녀(여성)' },
  jaeseong:  { name: '재성', hanja: '財星', role: '내가 다스리는 기운 — 재물·현실 감각·배우자(남성)' },
  gwanseong: { name: '관성', hanja: '官星', role: '나를 다스리는 기운 — 직장·명예·규칙·배우자(여성)' },
  inseong:   { name: '인성', hanja: '印星', role: '나를 돕는 기운 — 학문·문서·어머니·보호' },
};
export const GROUP_ORDER = ['bigeop', 'siksang', 'jaeseong', 'gwanseong', 'inseong'];

/** 일간 기준 대상 천간의 십신 */
export function tenGod(dayStem, targetStem) {
  const d = STEMS[dayStem], t = STEMS[targetStem];
  const same = d.yang === t.yang;
  if (t.el === d.el) return same ? '비견' : '겁재';
  if (GENERATES[d.el] === t.el) return same ? '식신' : '상관';
  if (CONTROLS[d.el] === t.el) return same ? '편재' : '정재';
  if (CONTROLS[t.el] === d.el) return same ? '편관' : '정관';
  return same ? '편인' : '정인';
}

/** 일간 기준으로 오행이 어떤 십신 묶음인지 */
export function groupOfElement(dayEl, el) {
  if (el === dayEl) return 'bigeop';
  if (GENERATES[dayEl] === el) return 'siksang';
  if (CONTROLS[dayEl] === el) return 'jaeseong';
  if (CONTROLS[el] === dayEl) return 'gwanseong';
  return 'inseong';
}
export function elementOfGroup(dayEl, group) {
  return ELEMENTS.find(e => groupOfElement(dayEl, e) === group);
}

export const CLASH = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']];
export const BRANCH_COMBINE = [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']];
export const STEM_COMBINE = [['甲', '己'], ['乙', '庚'], ['丙', '辛'], ['丁', '壬'], ['戊', '癸']];
export const isPair = (list, a, b) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

// 삼합 그룹(신살 계산용)
const TRIAD = { 申: 'water', 子: 'water', 辰: 'water', 寅: 'fire', 午: 'fire', 戌: 'fire', 巳: 'metal', 酉: 'metal', 丑: 'metal', 亥: 'wood', 卯: 'wood', 未: 'wood' };
export const PEACH = { water: '酉', fire: '卯', metal: '午', wood: '子' };   // 도화
export const HORSE = { water: '寅', fire: '申', metal: '亥', wood: '巳' };   // 역마
export const CANOPY = { water: '辰', fire: '戌', metal: '丑', wood: '未' };  // 화개
export const triadOf = b => TRIAD[b];
export const NOBLE = { 甲: '丑未', 戊: '丑未', 庚: '丑未', 乙: '子申', 己: '子申', 丙: '亥酉', 丁: '亥酉', 辛: '寅午', 壬: '巳卯', 癸: '巳卯' }; // 천을귀인
export const BLADE = { 甲: '卯', 丙: '午', 戊: '午', 庚: '酉', 壬: '子' }; // 양인
export const KUIGANG = ['庚辰', '庚戌', '壬辰', '壬戌', '戊戌']; // 괴강

export const ko = gz => [...gz].map(c => (STEMS[c] || BRANCHES[c])?.ko || c).join('');
