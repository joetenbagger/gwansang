// mbti.js — 사주로 MBTI 성향을 추정하고, 실제 MBTI와 비교합니다. 재미용입니다.
//
// 축별 근거
//  E/I  밖으로 뻗는 기운(식상·재성·화·목) ↔ 안으로 모으는 기운(인성·수·금)
//  S/N  현실의 기운(토·금·재성·정관) ↔ 상상·직관의 기운(수·목·인성·상관)
//  T/F  판단의 기운(금·관성) ↔ 정의 기운(목·화·인성·식신)
//  J/P  질서의 기운(관성·토·정재·정인) ↔ 흐름의 기운(식상·편재·편인·수·역마)
// 점수는 무작위 생일 분포의 중앙값을 0으로 맞춰(CAL) 각 축이 대략 반반으로 나뉘게 했습니다(tools/calibrate-mbti.mjs).

export const TYPES = ['ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP', 'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'];
export const AXES = [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']];
export const LETTER_KO = { E: '외향', I: '내향', S: '감각', N: '직관', T: '사고', F: '감정', J: '계획', P: '즉흥' };

// 보정값: [중앙값, 척도] — tools/calibrate-mbti.mjs 결과
export const CAL = {"EI":[0.0911,0.1631],"SN":[0.0425,0.1307],"TF":[0.0544,0.0982],"JP":[-0.0488,0.0873]};

function godCount(saju, names) {
  let n = 0;
  for (const c of Object.values(saju.cells)) {
    if (names.includes(c.stem.god)) n++;
    if (names.includes(c.branch.god)) n++;
  }
  return n;
}

export function rawScores(saju) {
  const p = saju.powerPct;
  const g = id => saju.groups.find(x => x.id === id).share;
  const dm = saju.cells.day.stem;
  const yang = dm.yang ? 1 : -1;
  const dmTF = { metal: 1, earth: 0.5, water: 0, fire: -0.5, wood: -1 }[dm.el];
  const monthB = saju.cells.month.branch.char;
  const monthJP = '辰戌丑未'.includes(monthB) ? 1 : '寅申巳亥'.includes(monthB) ? -1 : 0;
  const jeong = godCount(saju, ['정재', '정인', '정관']), pyeon = godCount(saju, ['편재', '편인', '편관', '상관']);
  return {
    // 일간의 음양 + 표현(식상)·활동(재성) 대 수용(인성) + 화 대 수
    EI: 0.12 * yang + g('siksang') + 0.5 * g('jaeseong') - g('inseong') + 0.5 * (p.fire - p.water),
    // 실물(재성·관성·토) 대 생각(인성·편인·상관·수)
    SN: g('jaeseong') + 0.5 * g('gwanseong') + 0.5 * p.earth - g('inseong') - 0.4 * p.water - 0.04 * godCount(saju, ['상관', '편인']),
    // 일간의 오행(금·토는 판단, 목·화는 정) + 관성 대 식신·정인
    TF: 0.15 * dmTF + 0.5 * g('gwanseong') + 0.4 * (p.metal - p.wood) - 0.05 * godCount(saju, ['식신', '정인']),
    // 바른 기운(정재·정인·정관) 대 치우친 기운(편재·편인·편관·상관) + 태어난 달의 성질
    JP: 0.05 * (jeong - pyeon) + 0.08 * monthJP + 0.4 * g('gwanseong') - 0.4 * g('siksang'),
  };
}

const sigmoid = x => 1 / (1 + Math.exp(-x));

// 축끼리 겹치는 근거(예: 수 기운은 I와 N 양쪽에 걸림)를 걷어 내서 16유형이 고르게 나오게 함
export const DECOR = {"SN":{"EI":0.4964},"TF":{"EI":-0.1096,"SN":0.1262},"JP":{"EI":-0.1762,"SN":0.3535,"TF":0.0394}};
export function decorrelate(r) {
  const o = { EI: r.EI };
  o.SN = r.SN - DECOR.SN.EI * o.EI;
  o.TF = r.TF - DECOR.TF.EI * o.EI - DECOR.TF.SN * o.SN;
  o.JP = r.JP - DECOR.JP.EI * o.EI - DECOR.JP.SN * o.SN - DECOR.JP.TF * o.TF;
  return o;
}

/** 사주가 말하는 MBTI: 각 축 앞 글자(E,S,T,J) 쪽 확률 */
export function predictMbti(saju) {
  const raw = decorrelate(rawScores(saju));
  const keys = ['EI', 'SN', 'TF', 'JP'];
  const axes = keys.map((k, i) => {
    const [mid, sc] = CAL[k];
    const pA = Math.min(0.9, Math.max(0.1, sigmoid((raw[k] - mid) / sc)));
    const [a, b] = AXES[i];
    return { key: k, a, b, pA, letter: pA >= 0.5 ? a : b, strength: Math.abs(pA - 0.5) * 2 };
  });
  return { type: axes.map(x => x.letter).join(''), axes };
}

// ---------- 문구 ----------
export const MBTI_ADJ = {
  ISTJ: '원칙대로 가는', ISFJ: '묵묵히 챙기는', INFJ: '속 깊은', INTJ: '판을 짜는',
  ISTP: '손이 빠른', ISFP: '감성 가득한', INFP: '꿈꾸는', INTP: '끝까지 파고드는',
  ESTP: '몸이 먼저 가는', ESFP: '분위기를 띄우는', ENFP: '아이디어 넘치는', ENTP: '판을 뒤집는',
  ESTJ: '일을 굴리는', ESFJ: '사람을 모으는', ENFJ: '사람을 이끄는', ENTJ: '목표로 직진하는',
};
export const DAY_NOUN = { 甲: '큰 나무', 乙: '들풀', 丙: '태양', 丁: '등불', 戊: '큰 산', 己: '밭', 庚: '바위', 辛: '보석', 壬: '강', 癸: '빗물' };

export const MBTI_LINE = {
  ISTJ: '약속과 기록을 믿는 사람. 한번 맡으면 끝까지 해내요.',
  ISFJ: '티 안 나게 주변을 지키는 사람. 기억력이 좋아 사람을 잘 챙겨요.',
  INFJ: '사람 속을 읽는 사람. 조용하지만 자기만의 신념이 단단해요.',
  INTJ: '머릿속에 이미 큰 그림이 있는 사람. 효율 없는 걸 못 참아요.',
  ISTP: '말보다 손이 먼저인 사람. 위기에서 침착하게 해결해요.',
  ISFP: '자기 취향이 분명한 사람. 조용히 아름다운 걸 만들어요.',
  INFP: '마음속 세계가 넓은 사람. 의미 없는 일엔 힘이 안 나요.',
  INTP: '왜 그런지 끝까지 알아야 하는 사람. 생각이 깊고 독특해요.',
  ESTP: '일단 해 보는 사람. 현장에서 가장 빠르게 판단해요.',
  ESFP: '어디서든 분위기를 살리는 사람. 지금 이 순간을 즐겨요.',
  ENFP: '가능성을 보는 사람. 시작하는 힘과 사람을 끄는 힘이 커요.',
  ENTP: '반대로 생각해 보는 사람. 말싸움도 아이디어도 지지 않아요.',
  ESTJ: '정리하고 굴리는 사람. 조직이 돌아가게 만드는 힘이 있어요.',
  ESFJ: '사람과 사람을 잇는 사람. 모임의 중심이 되는 일이 많아요.',
  ENFJ: '사람의 가능성을 키우는 사람. 말에 힘이 있어요.',
  ENTJ: '목표를 정하면 길을 만드는 사람. 결단과 추진이 빨라요.',
};

// 축별: 사주와 같을 때 / 다를 때 (key: 사주글자+실제글자)
export const AXIS_TEXT = {
  EE: '사람들 사이에서 힘이 나는 건 타고난 거예요. 사주도 밖으로 뻗는 기운이 커요.',
  II: '혼자 있을 때 충전되는 건 타고난 거예요. 사주도 안으로 모으는 기운이 커요.',
  SS: '현실 감각은 사주에서도 그대로 보여요. 손에 잡히는 결과를 믿는 사람이에요.',
  NN: '직관과 상상은 사주에서도 그대로 보여요. 보이지 않는 가능성을 먼저 봐요.',
  TT: '논리로 판단하는 건 사주에도 새겨져 있어요. 옳고 그름이 분명해요.',
  FF: '마음을 먼저 보는 건 사주에도 새겨져 있어요. 정이 많은 사람이에요.',
  JJ: '계획하고 정리하는 건 타고난 체질이에요. 사주도 질서의 기운이 강해요.',
  PP: '흐름대로 사는 건 타고난 체질이에요. 사주도 자유로운 기운이 강해요.',
  EI: '사주는 밖으로 뻗는 기운인데, 지금은 혼자 충전하는 쪽이에요. 타고난 에너지를 아끼며 사는 중일 수 있어요. 가끔은 판에 뛰어들어 보세요.',
  IE: '사주는 혼자 깊어지는 기운인데, 지금은 밖에 나가 있어요. 사회생활이 만든 E일 수 있어요. 집에 오면 녹초가 된다면 그 이유예요.',
  SN: '타고난 건 현실 감각인데, 지금은 상상과 가능성을 좇고 있어요. 아이디어를 현실로 옮길 때 원래 힘이 나와요.',
  NS: '타고난 건 직관과 상상인데, 지금은 현실에 발을 붙이고 있어요. 머릿속 그림을 꺼낼 곳이 필요해요.',
  TF: '사주는 판단이 칼 같은데, 지금은 마음을 먼저 봐요. 관계 속에서 단단함이 부드러워진 거예요.',
  FT: '사주는 정이 많은데, 지금은 논리로 버티고 있어요. 차갑다는 말을 듣는다면 일부러 그렇게 사는 중일지도 몰라요.',
  JP: '사주는 계획과 질서인데, 지금은 흐름대로 살아요. 마감 직전에 몰아치는 게 사실 체질에 안 맞을 수 있어요.',
  PJ: '사주는 자유로운 흐름인데, 지금은 계획표 속에 살아요. 숨이 막힌다면 빈 시간을 일부러 남겨 두세요.',
};

export const MATCH_TEXT = [
  { title: '정반대', text: '사주와 MBTI가 네 글자 모두 달라요. 지금의 나는 환경과 노력으로 많이 만들어진 나예요. 지칠 때는 타고난 쪽으로 돌아가 쉬는 게 답이에요.' },
  { title: '많이 다름', text: '네 글자 중 세 글자가 달라요. 겉으로 보이는 나와 타고난 나 사이에 거리가 있어요. 그 차이가 나를 피곤하게 만들 때가 있어요.' },
  { title: '반반', text: '두 글자는 같고 두 글자는 달라요. 타고난 성향 위에 살면서 배운 성향이 잘 섞여 있는 사람이에요.' },
  { title: '거의 같음', text: '네 글자 중 세 글자가 같아요. 타고난 대로 살고 있는 편이라 억지로 맞추는 피로가 적어요.' },
  { title: '완전 일치', text: '사주가 말하는 MBTI와 실제 MBTI가 똑같아요. 타고난 그대로 살고 있는 드문 사람이에요.' },
];

/** 실제 MBTI와 비교 */
export function compareMbti(pred, actual) {
  const rows = pred.axes.map((ax, i) => {
    const me = actual?.[i];
    return { ...ax, actual: me, same: me ? me === ax.letter : null, text: me ? AXIS_TEXT[ax.letter + me] : null };
  });
  const same = actual ? rows.filter(r => r.same).length : null;
  return { rows, same, match: same == null ? null : MATCH_TEXT[same] };
}

/** 잘 맞는다고들 하는 유형: E/I와 J/P를 바꾼 유형, J/P만 바꾼 유형 */
export function goodMatches(type) {
  const flip = { E: 'I', I: 'E', J: 'P', P: 'J' };
  const a = flip[type[0]] + type[1] + type[2] + flip[type[3]];
  const b = type[0] + type[1] + type[2] + flip[type[3]];
  return [a, b];
}

// 간이 테스트 4문제 (축 순서대로)
export const QUIZ = [
  { q: '주말에 쉬었다는 느낌이 드는 건?', a: ['사람 만나고 들어왔을 때', 'E'], b: ['집에서 혼자 보냈을 때', 'I'] },
  { q: '새 일을 배울 때 나는?', a: ['예시와 순서부터 본다', 'S'], b: ['전체 그림과 원리부터 본다', 'N'] },
  { q: '친구가 고민을 털어놓으면?', a: ['해결책부터 떠오른다', 'T'], b: ['마음부터 알아준다', 'F'] },
  { q: '여행 갈 때 나는?', a: ['일정표를 미리 짠다', 'J'], b: ['가서 끌리는 대로 다닌다', 'P'] },
];
