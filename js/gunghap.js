// gunghap.js — 두 사람 궁합 (순수 함수). 재미용입니다.
// 항목: 일간(본성) 30 · 서로 필요한 기운 25 · 일지(속마음·생활) 20 · 띠 10 · MBTI 15 (MBTI가 없으면 나머지로 나눔)
import { STEMS, BRANCHES, EL, ELEMENTS, GENERATES, CONTROLS, CLASH, BRANCH_COMBINE, STEM_COMBINE, isPair, triadOf } from './saju/data.js?v=14';
import { goodMatches } from './mbti.js?v=14';

export const RELATIONS = {
  lover: { label: '연인·썸', who: '연인' },
  friend: { label: '친구', who: '친구' },
  work: { label: '동료·동업', who: '동료' },
};


// 이름 뒤 조사(받침 유무): I(지호)=지호가, I(하늘)=하늘이 / R=을를 / N=은는
const hasB = w => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; };
const I = w => w + (hasB(w) ? '이' : '가');
const R = w => w + (hasB(w) ? '을' : '를');
const N = w => w + (hasB(w) ? '은' : '는');

const top = saju => ELEMENTS.reduce((a, e) => (saju.powerPct[e] > saju.powerPct[a] ? e : a));

function stemRelation(a, b, na, nb) {
  const A = STEMS[a], B = STEMS[b];
  if (isPair(STEM_COMBINE, a, b)) return { score: 100, tag: '천간합', title: '처음부터 끌리는 사이',
    text: `${na}의 ${a}와 ${nb}의 ${b}는 서로 합을 이루는 짝이에요. 설명하기 어려운 끌림이 있고, 함께 있으면 둘 다 성격이 한결 부드러워져요.`,
    caution: '합은 서로에게 물들기도 쉬워요. 둘이 같이 나쁜 습관에 빠지지 않게 조심하세요.' };
  if (A.el === B.el) return { score: A.yang === B.yang ? 66 : 72, tag: '같은 기운', title: '말 안 해도 아는 사이',
    text: `둘 다 ${EL[A.el].ko}(${EL[A.el].hanja}) 기운이에요. 생각하는 방식이 비슷해서 금방 편해지고 대화가 잘 통해요.`,
    caution: '닮은 만큼 같은 데서 막혀요. 둘 다 약한 부분은 누구도 채워 주지 못하니, 바깥의 도움이 필요해요.' };
  if (GENERATES[A.el] === B.el) return { score: 82, tag: '상생', title: `${I(na)} ${R(nb)} 키워 주는 사이`,
    text: `${na}의 ${EL[A.el].ko} 기운이 ${nb}의 ${EL[B.el].ko} 기운을 살려 줘요. ${I(na)} 챙기고 밀어주고, ${N(nb)} 그 덕에 자라는 관계예요.`,
    caution: `주는 쪽(${na})이 지치지 않게, 받는 쪽(${nb})이 고마움을 자주 말해 주세요.` };
  if (GENERATES[B.el] === A.el) return { score: 82, tag: '상생', title: `${I(nb)} ${R(na)} 키워 주는 사이`,
    text: `${nb}의 ${EL[B.el].ko} 기운이 ${na}의 ${EL[A.el].ko} 기운을 살려 줘요. ${nb} 옆에 있으면 ${I(na)} 힘을 얻어요.`,
    caution: `${I(na)} 받기만 하면 기울어요. 작은 것이라도 먼저 챙겨 주세요.` };
  if (CONTROLS[A.el] === B.el) return { score: 48, tag: '상극', title: `${I(na)} 이끄는 사이`,
    text: `${na}의 ${EL[A.el].ko} 기운이 ${nb}의 ${EL[B.el].ko} 기운을 다스려요. ${I(na)} 주도하고 ${I(nb)} 맞춰 주는 구도가 되기 쉬워요. 긴장감이 있어서 지루하지는 않아요.`,
    caution: `${N(na)} 밀어붙이지 말고, ${nb}의 속도를 기다려 주세요. 눌린 쪽은 언젠가 터져요.` };
  return { score: 48, tag: '상극', title: `${I(nb)} 이끄는 사이`,
    text: `${nb}의 ${EL[B.el].ko} 기운이 ${na}의 ${EL[A.el].ko} 기운을 다스려요. ${I(nb)} 주도하고 ${I(na)} 맞춰 주는 구도가 되기 쉬워요. 서로 자극이 되는 관계예요.`,
    caution: `${N(na)} 서운한 걸 쌓아 두지 말고, ${N(nb)} 말투를 한 번 더 고르세요.` };
}

function branchRelation(a, b, label) {
  if (isPair(BRANCH_COMBINE, a, b)) return { score: 100, tag: '육합', text: `${label}가 서로 합을 이뤄요. 같이 있으면 마음이 놓이고 생활 리듬이 잘 맞아요.` };
  if (a !== b && triadOf(a) === triadOf(b)) return { score: 86, tag: '삼합', text: `${label}가 같은 무리(삼합)에 속해요. 목표가 생기면 한 팀처럼 움직여요.` };
  if (a === b) return { score: 70, tag: '같음', text: `${label}가 같아요. 취향과 습관이 닮아서 편하지만, 같은 문제에서 같이 막혀요.` };
  if (isPair(CLASH, a, b)) return { score: 32, tag: '충', text: `${label}가 서로 부딪혀요(충). 생활 방식이나 속도가 달라서 자주 투닥거리지만, 그만큼 서로를 바꿔 놓아요.` };
  return { score: 62, tag: '무난', text: `${label}는 특별히 부딪히지도 끌리지도 않아요. 무난하게 지내는 조합이에요.` };
}

function fillRelation(A, B, na, nb) {
  const aTop = top(A.saju), bTop = top(B.saju);
  let score = 50; const lines = [];
  if (bTop === A.saju.yongsin.el) { score += 25; lines.push(`${nb}에게 많은 ${EL[bTop].ko}(${EL[bTop].hanja}) 기운이 마침 ${na}에게 꼭 필요한 기운이에요. ${nb} 곁에 있으면 ${na}의 빈 곳이 채워져요.`); }
  if (aTop === B.saju.yongsin.el) { score += 25; lines.push(`${na}에게 많은 ${EL[aTop].ko}(${EL[aTop].hanja}) 기운이 ${nb}에게 꼭 필요한 기운이에요. ${I(na)} ${R(nb)} 살려 줘요.`); }
  if (bTop === A.saju.yongsin.giEl) { score -= 20; lines.push(`${nb}에게 많은 기운이 ${I(na)} 피해야 할 기운이라, 오래 붙어 있으면 ${I(na)} 은근히 지칠 수 있어요.`); }
  if (aTop === B.saju.yongsin.giEl) { score -= 20; lines.push(`${na}에게 많은 기운이 ${I(nb)} 피해야 할 기운이라, ${I(nb)} 가끔 숨 막혀 할 수 있어요.`); }
  if (!lines.length) lines.push(`서로의 빈 곳을 직접 채워 주지는 않아요. ${na}에게는 ${EL[A.saju.yongsin.el].ko}, ${nb}에게는 ${EL[B.saju.yongsin.el].ko} 기운이 필요한데, 함께하는 활동으로 채우면 좋아요.`);
  return { score: Math.max(10, Math.min(100, score)), lines, aTop, bTop };
}

function mbtiRelation(a, b, na, nb) {
  if (!a || !b) return null;
  if (goodMatches(a).includes(b) || goodMatches(b).includes(a)) return { score: 95, text: `${a}와 ${b}는 흔히 잘 맞는다고 하는 조합이에요. 서로 없는 부분을 자연스럽게 채워요.` };
  let s = 40; const notes = [];
  if (a[1] === b[1]) { s += 25; notes.push(a[1] === 'N' ? '둘 다 상상과 가능성을 좋아해서 대화가 끝이 없어요' : '둘 다 현실적이라 계획이 금방 맞춰져요'); }
  else notes.push('한 사람은 현실을, 한 사람은 가능성을 봐서 대화가 엇갈릴 때가 있어요');
  if (a[0] !== b[0]) { s += 12; notes.push('외향과 내향이 섞여서 한 사람이 끌고 한 사람이 쉬게 해 줘요'); } else s += 6;
  if (a[2] === b[2]) { s += 10; } else notes.push('판단 기준(머리 vs 마음)이 달라서 다툴 때 서로 억울해해요');
  if (a[3] !== b[3]) { s += 6; } else s += 4;
  return { score: Math.min(100, s), text: notes.join('. ') + '.' };
}

export const VERDICTS = [
  { min: 85, title: '천생연분', line: { lover: '만날 사람은 결국 만난다는 말이 맞는 사이', friend: '평생 가는 친구가 될 사이', work: '같이 일하면 결과가 나는 사이' } },
  { min: 72, title: '잘 맞는 사이', line: { lover: '편하고 설레는 균형이 좋은 사이', friend: '오래 봐도 질리지 않는 사이', work: '손발이 잘 맞는 사이' } },
  { min: 58, title: '노력하면 빛나는 사이', line: { lover: '서로 맞춰 갈수록 깊어지는 사이', friend: '알수록 좋아지는 사이', work: '역할을 잘 나누면 강해지는 사이' } },
  { min: 44, title: '다른 별에서 온 사이', line: { lover: '다르기 때문에 끌리는 사이', friend: '서로 몰랐던 세상을 보여 주는 사이', work: '부딪히며 아이디어가 나오는 사이' } },
  { min: 0, title: '부딪히며 크는 사이', line: { lover: '연습이 많이 필요한 사이', friend: '거리를 두면 오히려 좋은 사이', work: '규칙을 정해 두고 일해야 하는 사이' } },
];

/**
 * A, B = { name, saju, mbti, years:[올해, 내년] }
 * rel = 'lover' | 'friend' | 'work'
 */
export function gunghap(A, B, rel = 'friend') {
  const na = A.name || '나', nb = B.name || '상대';
  const stem = stemRelation(A.saju.dayStem, B.saju.dayStem, na, nb);
  const fill = fillRelation(A, B, na, nb);
  const day = branchRelation(A.saju.cells.day.branch.char, B.saju.cells.day.branch.char, '두 사람의 일지(속마음·생활 자리)');
  const zodiac = branchRelation(A.saju.cells.year.branch.char, B.saju.cells.year.branch.char, `${BRANCHES[A.saju.cells.year.branch.char].animal}띠와 ${BRANCHES[B.saju.cells.year.branch.char].animal}띠`);
  const mbti = mbtiRelation(A.mbti, B.mbti, na, nb);
  const parts = [
    { id: 'stem', w: 30, s: stem.score }, { id: 'fill', w: 25, s: fill.score }, { id: 'day', w: 20, s: day.score },
    { id: 'zodiac', w: 10, s: zodiac.score }, ...(mbti ? [{ id: 'mbti', w: 15, s: mbti.score }] : []),
  ];
  const wsum = parts.reduce((a, p) => a + p.w, 0);
  // 원점수를 그대로 쓰면 50~80에 몰려서, 보기 좋게 펼침
  const raw = parts.reduce((a, p) => a + p.w * p.s, 0) / wsum;
  const score = Math.round(Math.max(25, Math.min(99, 68 + (raw - 64.6) * 1.7)));
  const verdict = VERDICTS.find(v => score >= v.min);

  // 올해 두 사람의 흐름
  const ya = A.years?.[0], yb = B.years?.[0];
  let yearLine = '';
  if (ya && yb) {
    const word = { good: '순풍', neutral: '보통', caution: '조심' };
    if (ya.tone === 'good' && yb.tone !== 'good') yearLine = `${ya.year}년은 ${I(na)} ${word.good}, ${N(nb)} ${word[yb.tone]}이에요. 올해는 ${I(na)} 끌어 주는 해예요.`;
    else if (yb.tone === 'good' && ya.tone !== 'good') yearLine = `${ya.year}년은 ${I(nb)} ${word.good}, ${N(na)} ${word[ya.tone]}이에요. 올해는 ${nb}에게 기대도 되는 해예요.`;
    else if (ya.tone === 'good' && yb.tone === 'good') yearLine = `${ya.year}년은 둘 다 순풍이에요. 같이 뭔가 시작하기 좋은 해예요.`;
    else if (ya.tone === 'caution' && yb.tone === 'caution') yearLine = `${ya.year}년은 둘 다 조심할 해예요. 큰일을 같이 벌이기보다 서로 버팀목이 되어 주세요.`;
    else if (ya.tone === 'caution') yearLine = `${ya.year}년은 ${I(na)} 조심, ${N(nb)} 보통이에요. 올해는 ${I(nb)} ${R(na)} 받쳐 주는 해예요.`;
    else if (yb.tone === 'caution') yearLine = `${ya.year}년은 ${I(nb)} 조심, ${N(na)} 보통이에요. 올해는 ${I(na)} ${R(nb)} 받쳐 주는 해예요.`;
    else yearLine = `${ya.year}년은 둘 다 무난한 흐름이에요. 평소처럼 꾸준히 가면 돼요.`;
  }

  // 잘 지내는 법: 약한 항목부터
  const tips = [];
  const weakest = [...parts].sort((a, b) => a.s - b.s);
  for (const p of weakest) {
    if (p.id === 'stem') tips.push(stem.caution);
    if (p.id === 'fill') tips.push(`${N(na)} ${EL[A.saju.yongsin.el].color} 쪽, ${N(nb)} ${EL[B.saju.yongsin.el].color} 쪽 기운이 필요해요. 데이트·모임 장소나 선물 색으로 서로 채워 주세요.`);
    if (p.id === 'day') tips.push(day.tag === '충' ? '생활 습관(잠, 정리, 돈 쓰는 방식)이 부딪히기 쉬워요. 집안일과 돈은 규칙을 먼저 정하세요.' : '속마음을 나누는 시간을 일부러 만드세요. 편해질수록 말을 아끼게 돼요.');
    if (p.id === 'zodiac') tips.push(zodiac.tag === '충' ? '집안·가족 문제로 의견이 갈릴 수 있어요. 서로의 가족 이야기는 조심스럽게 꺼내세요.' : '함께 아는 사람들 사이에서 둘의 사이가 좋게 보이는 조합이에요. 같이 어울리는 자리를 늘려 보세요.');
    if (p.id === 'mbti') tips.push('판단 방식이 다를 때는 누가 맞는지보다 어떻게 느꼈는지부터 물어보세요.');
    if (tips.length >= 3) break;
  }

  return { score, verdict, line: verdict.line[rel], rel, na, nb, stem, fill, day, zodiac, mbti, yearLine, tips };
}
