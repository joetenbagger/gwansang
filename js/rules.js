// rules.js — 측정값 → 관상 풀이
// 해석 문구와 기준값은 모두 이 파일의 데이터에 있습니다. 코드를 건드리지 않고 문구·기준만 고칠 수 있게 분리했습니다.
// 기준값은 샘플 얼굴 측정값의 평균±0.43표준편차(대략 3등분)로 잡은 초기값이며, 실제 사용자 사진이 쌓이면 다시 맞춰야 합니다.
// 풀이는 고전 상법(마의상법·유장상법 등)의 일반 개념을 바탕으로 새로 쓴 문장입니다. 재미용입니다.

/**
 * 각 항목: metric 값이 bands의 경계(below)보다 작으면 그 band가 선택됩니다. 마지막 band는 나머지 전부.
 * scale: 화면 막대에 표시할 범위
 */
export const FEATURES = [
  {
    id: 'samjeong', group: '삼정', name: '중정과 하정', hanja: '中停·下停',
    metric: 'midLowRatio', unit: '중정 ÷ 하정', scale: [0.85, 1.65],
    note: '눈썹~코끝(중정)은 청장년기, 코끝~턱(하정)은 말년을 봅니다. 상정(이마)은 머리카락에 가려 사진으로는 재지 않습니다.',
    bands: [
      { below: 1.12, tag: '하정이 넉넉함', text: '턱과 입 주변이 넉넉해 말년의 기반이 두터운 상입니다. 나이 들수록 집과 사람이 모이고, 아랫사람의 도움을 받는 흐름으로 봅니다.' },
      { below: 1.36, tag: '중정·하정 균형', text: '중정과 하정이 고르게 나뉘어 있습니다. 상법에서 가장 좋게 치는 비례로, 중년의 성취가 말년까지 끊기지 않고 이어지는 상입니다.' },
      { tag: '중정이 길고 힘 있음', text: '코를 중심으로 한 중정이 길어 30~40대에 스스로 일어서는 힘이 강한 상입니다. 자수성가형으로 보며, 중년에 기세가 가장 크게 오릅니다.' },
    ],
  },
  {
    id: 'eyeShape', group: '눈', name: '눈의 생김', hanja: '監察官',
    metric: 'eyeAspect', unit: '눈 높이 ÷ 눈 길이', scale: [0.24, 0.38],
    note: '눈은 마음이 드러나는 감찰관(監察官)입니다.',
    bands: [
      { below: 0.295, tag: '가늘고 긴 눈', text: '가로로 길고 가는 눈은 속을 쉽게 드러내지 않는 신중한 눈입니다. 관찰력이 좋고 판단이 깊어 큰일을 맡기기 좋은 상으로 봅니다.' },
      { below: 0.321, tag: '균형 잡힌 눈', text: '길이와 높이가 알맞은 눈입니다. 감정과 이성의 균형이 좋고, 사람을 대할 때 안정감을 주는 눈입니다.' },
      { tag: '크고 둥근 눈', text: '크고 둥근 눈은 감수성이 풍부하고 표현이 솔직한 눈입니다. 사람을 끄는 힘이 있어 대인 관계에서 복을 얻는 상입니다.' },
    ],
  },
  {
    id: 'eyeTilt', group: '눈', name: '눈꼬리', hanja: '魚尾',
    metric: 'eyeTiltDeg', unit: '도(°), +는 올라감', scale: [-3, 12],
    note: '눈꼬리 부근을 어미(魚尾)라 하며 배우자와 인연의 자리(처첩궁)로 봅니다.',
    bands: [
      { below: 3.5, tag: '수평에 가까운 눈꼬리', text: '눈꼬리가 수평에 가깝거나 부드럽게 내려간 눈은 온화하고 정이 많은 눈입니다. 사람을 편하게 해 주어 인복이 따르고, 배우자 인연이 순한 상으로 봅니다.' },
      { below: 5.9, tag: '살짝 올라간 눈꼬리', text: '눈꼬리가 살짝 올라가 부드러움과 단단함이 함께 있는 눈입니다. 판단이 치우치지 않고 차분해 주변의 신뢰를 얻습니다.' },
      { tag: '또렷이 올라간 눈꼬리', text: '눈꼬리가 위로 또렷이 향한 눈은 결단력과 추진력이 강한 눈입니다. 자존심과 승부욕이 있어 앞에서 이끄는 자리에 어울립니다.' },
    ],
  },
  {
    id: 'eyeGap', group: '눈', name: '두 눈 사이', hanja: '山根',
    metric: 'eyeGapRatio', unit: '눈 사이 ÷ 눈 길이', scale: [1.4, 1.68],
    note: '두 눈 사이 콧대가 시작되는 곳이 산근(山根)입니다.',
    bands: [
      { below: 1.52, tag: '가까운 두 눈', text: '두 눈이 가까운 편으로 집중력이 좋고 섬세합니다. 한 분야를 깊게 파고드는 일에 강한 상입니다. 서두르는 마음만 다스리면 좋습니다.' },
      { below: 1.56, tag: '알맞은 간격', text: '두 눈 사이가 얼굴과 잘 어울리는 간격입니다. 시야와 집중력이 고루 갖춰진 균형형입니다.' },
      { tag: '넓은 두 눈 사이', text: '두 눈 사이가 넓어 마음이 너그럽고 시야가 넓습니다. 큰 그림을 보는 데 능하며, 세부는 믿을 만한 사람에게 맡기면 좋습니다.' },
    ],
  },
  {
    id: 'glabella', group: '눈썹', name: '미간', hanja: '命宮',
    metric: 'glabellaRatio', unit: '미간 ÷ 눈 길이', scale: [1.1, 1.8],
    note: '두 눈썹 사이 미간은 명궁(命宮)으로, 타고난 기운이 모이는 자리입니다.',
    bands: [
      { below: 1.4, tag: '좁은 미간', text: '미간이 좁은 편으로 생각이 깊고 꼼꼼합니다. 책임감이 강한 만큼 걱정도 많을 수 있어, 마음을 넓게 쓰면 운이 트이는 상입니다.' },
      { below: 1.5, tag: '반듯한 미간', text: '미간이 알맞게 열려 있어 명궁이 밝은 상입니다. 마음이 안정되어 있고 일이 막혀도 금방 길을 찾습니다.' },
      { tag: '넓은 미간', text: '미간이 넓게 열려 있어 낙천적이고 포용력이 큽니다. 사람을 가리지 않아 주변에 늘 사람이 있는 상입니다.' },
    ],
  },
  {
    id: 'browEye', group: '눈썹', name: '눈과 눈썹 사이', hanja: '田宅宮',
    metric: 'browEyeGap', unit: '간격 ÷ 눈 길이', scale: [0.45, 1.15],
    note: '눈과 눈썹 사이는 전택궁(田宅宮)으로, 집과 재산, 가정의 자리입니다.',
    bands: [
      { below: 0.75, tag: '가까운 눈썹', text: '눈썹이 눈에 가까워 열정적이고 행동이 빠릅니다. 기회를 잡는 순발력이 좋으며, 재산은 쌓기보다 굴리는 쪽에 재능이 있습니다.' },
      { below: 0.85, tag: '알맞은 전택궁', text: '눈과 눈썹 사이가 알맞아 가정이 안정되고 집안 일이 순탄한 상입니다.' },
      { tag: '넓은 전택궁', text: '눈과 눈썹 사이가 넉넉해 여유롭고 느긋합니다. 상법에서는 집과 땅의 복이 있는 상으로 봅니다.' },
    ],
  },
  {
    id: 'browLen', group: '눈썹', name: '눈썹 길이', hanja: '兄弟宮',
    metric: 'browLenRatio', unit: '눈썹 길이 ÷ 눈 길이', scale: [1.52, 1.74],
    note: '눈썹은 형제궁(兄弟宮)으로, 형제와 친구, 동료와의 인연을 봅니다.',
    bands: [
      { below: 1.614, tag: '짧은 눈썹', text: '눈썹이 눈 길이에 가까워 독립심이 강합니다. 남에게 기대기보다 스스로 길을 내는 상입니다.' },
      { below: 1.644, tag: '눈을 덮는 눈썹', text: '눈썹이 눈을 넉넉히 덮어 형제와 동료의 덕이 있는 상입니다. 함께 일할 때 힘이 납니다.' },
      { tag: '길게 뻗은 눈썹', text: '눈썹이 눈보다 길게 뻗어 교우 관계가 넓고 오래갑니다. 사람의 도움으로 기회를 얻는 상입니다.' },
    ],
  },
  {
    id: 'noseLen', group: '코', name: '코 길이', hanja: '審辨官',
    metric: 'noseLenRatio', unit: '코 길이 ÷ 콧대~턱', scale: [0.34, 0.54],
    note: '코는 심변관(審辨官)이며 얼굴의 중심, 자아와 재물의 자리입니다.',
    bands: [
      { below: 0.415, tag: '짧은 코', text: '코가 짧은 편으로 융통성이 있고 친근합니다. 사람과 쉽게 어울리며 변화에 빠르게 적응합니다.' },
      { below: 0.457, tag: '알맞은 코', text: '코의 길이가 얼굴과 잘 어울립니다. 자기 주관과 협조성이 고루 갖춰진 상입니다.' },
      { tag: '길게 뻗은 코', text: '코가 길게 뻗어 원칙이 분명하고 책임감이 강합니다. 자존심이 있어 맡은 일은 끝까지 해내는 상입니다.' },
    ],
  },
  {
    id: 'noseWidth', group: '코', name: '콧볼', hanja: '財帛宮',
    metric: 'noseWidthRatio', unit: '콧볼 폭 ÷ 눈 사이', scale: [0.55, 0.79],
    note: '코끝과 콧볼은 재백궁(財帛宮)으로, 재물을 담는 창고로 봅니다.',
    bands: [
      { below: 0.646, tag: '단정한 콧볼', text: '콧볼이 단정하고 좁은 편입니다. 씀씀이가 깔끔하고 계획적이지만, 들어온 재물이 쉽게 나갈 수 있어 모으는 습관을 들이면 좋습니다.' },
      { below: 0.688, tag: '알맞은 콧볼', text: '콧볼이 알맞게 자리 잡아 벌고 쓰는 균형이 좋은 상입니다.' },
      { tag: '도톰한 콧볼', text: '콧볼이 넓고 도톰해 재물을 모으고 지키는 힘이 강한 상입니다. 상법에서 재복이 있다고 보는 코입니다.' },
    ],
  },
  {
    id: 'mouthW', group: '입', name: '입 크기', hanja: '出納官',
    metric: 'mouthWidthRatio', unit: '입 너비 ÷ 동공 사이', scale: [0.7, 1.1],
    note: '입은 출납관(出納官)으로, 말과 먹을 복이 드나드는 자리입니다.',
    bands: [
      { below: 0.854, tag: '작고 단정한 입', text: '입이 작고 단정해 말이 신중하고 섬세합니다. 실수가 적고 믿음을 주는 상입니다.' },
      { below: 0.934, tag: '알맞은 입', text: '입의 크기가 얼굴과 잘 어울려 말과 행동이 조화로운 상입니다.' },
      { tag: '큰 입', text: '입이 커서 활동적이고 포부가 큽니다. 사람을 이끄는 힘이 있고 먹을 복이 있는 상입니다.' },
    ],
  },
  {
    id: 'mouthCorner', group: '입', name: '입꼬리', hanja: '口角',
    metric: 'mouthCornerLift', unit: '입꼬리 높이 ÷ 입 너비', scale: [-0.08, 0.12],
    note: '입꼬리는 표정과 함께 바뀌므로 무표정 사진이 가장 정확합니다.',
    bands: [
      { below: -0.015, tag: '내려간 입꼬리', text: '입꼬리가 아래로 향해 진중하고 생각이 깊어 보입니다. 웃는 표정을 자주 지으면 인상과 운이 함께 밝아진다고 봅니다.' },
      { below: 0.03, tag: '반듯한 입꼬리', text: '입꼬리가 반듯해 감정이 안정되어 있고 말에 무게가 있는 상입니다.' },
      { tag: '올라간 입꼬리', text: '입꼬리가 위로 향해 낙천적이고 밝습니다. 상법에서는 말년 복과 인덕이 있는 입으로 봅니다.' },
    ],
  },
  {
    id: 'lips', group: '입', name: '입술 두께', hanja: '脣',
    metric: 'lipThickness', unit: '입술 두께 ÷ 입 너비', scale: [0.15, 0.37],
    note: '입술은 정(情)과 표현력을 봅니다.',
    bands: [
      { below: 0.239, tag: '얇은 입술', text: '입술이 얇아 말이 정확하고 이성적입니다. 감정보다 논리로 사람을 설득하는 상입니다.' },
      { below: 0.275, tag: '알맞은 입술', text: '입술 두께가 알맞아 정과 이성이 균형 잡힌 상입니다.' },
      { tag: '도톰한 입술', text: '입술이 도톰해 정이 많고 표현이 풍부합니다. 애정과 의리가 깊은 상입니다.' },
    ],
  },
];

/** 오행형 얼굴: 측정값을 표준점수로 바꾼 뒤 각 형의 원형(prototype)과의 거리로 판정 */
export const FACE_NORMS = {
  faceAspect: { mean: 0.955, sd: 0.075 },
  jawRatio:   { mean: 0.793, sd: 0.026 },
  chinRatio:  { mean: 0.49, sd: 0.027 },
};

export const FACE_TYPES = [
  { id: 'wood',  name: '목형', hanja: '木形', shape: '길고 곧은 얼굴', proto: [1.4, -0.2, -0.2],
    text: '세로로 길고 곧은 얼굴입니다. 나무처럼 위로 자라는 기운이라 학문과 기획에 밝고, 이상이 높으며 꾸준히 성장하는 상입니다.' },
  { id: 'fire',  name: '화형', hanja: '火形', shape: '턱이 좁은 역삼각 얼굴', proto: [0.4, -1.3, -1.3],
    text: '위가 넓고 턱이 좁아지는 얼굴입니다. 불처럼 위로 타오르는 기운이라 두뇌 회전이 빠르고 감각이 예민하며, 예술과 표현에 재능이 있습니다.' },
  { id: 'earth', name: '토형', hanja: '土形', shape: '넓고 두툼한 얼굴', proto: [-1.0, 1.2, 1.0],
    text: '넓고 두툼하며 턱까지 든든한 얼굴입니다. 땅처럼 무게가 있어 믿음직하고, 재물과 사람을 품는 그릇이 큰 상입니다.' },
  { id: 'metal', name: '금형', hanja: '金形', shape: '각이 진 네모 얼굴', proto: [0.0, 1.3, 0.3],
    text: '턱선에 각이 있고 반듯한 얼굴입니다. 쇠처럼 단단해 의지가 굳고 결단이 빠르며, 조직을 이끄는 자리에서 빛나는 상입니다.' },
  { id: 'water', name: '수형', hanja: '水形', shape: '둥글고 부드러운 얼굴', proto: [-1.2, -0.1, 0.4],
    text: '둥글고 부드러운 얼굴입니다. 물처럼 막힘 없이 흘러 지혜롭고 사교적이며, 사람과 기회를 자연스럽게 끌어오는 상입니다.' },
];

function pickBand(feature, value) {
  const i = feature.bands.findIndex(b => b.below === undefined || value < b.below);
  return { index: i, ...feature.bands[i] };
}

export function classifyFace(m) {
  const z = ['faceAspect', 'jawRatio', 'chinRatio'].map(k => (m[k] - FACE_NORMS[k].mean) / FACE_NORMS[k].sd);
  const scored = FACE_TYPES.map(t => {
    const d2 = t.proto.reduce((s, p, i) => s + (p - z[i]) ** 2, 0);
    return { ...t, d2 };
  });
  const w = scored.map(t => Math.exp(-t.d2 / 2));
  const total = w.reduce((a, b) => a + b, 0) || 1;
  scored.forEach((t, i) => { t.share = w[i] / total; });
  scored.sort((a, b) => b.share - a.share);
  return { primary: scored[0], secondary: scored[1], all: scored, z };
}

function symmetryReading(s) {
  if (s >= 85) return { tag: '좌우가 고른 얼굴', text: '얼굴의 좌우가 고르게 잡혀 기운이 한쪽으로 치우치지 않는 상입니다. 생활이 안정되고 운의 기복이 적다고 봅니다.' };
  if (s >= 70) return { tag: '자연스러운 좌우', text: '좌우가 대체로 고릅니다. 누구에게나 있는 자연스러운 차이 정도입니다.' };
  return { tag: '개성 있는 좌우', text: '좌우 차이가 조금 있습니다. 사진 각도의 영향일 수 있으니 정면에서 다시 찍어 보세요. 상법에서는 좌우가 다르면 인생 전반과 후반의 흐름이 다르다고 봅니다.' };
}

/** 전체 풀이 */
export function interpret(m) {
  const features = FEATURES.map(f => {
    const value = m[f.metric];
    return { ...f, value, band: pickBand(f, value) };
  });
  const face = classifyFace(m);
  const symmetry = { value: m.symmetry, ...symmetryReading(m.symmetry) };

  const warnings = [];
  if (Math.abs(m.yaw) > 0.07) warnings.push('얼굴이 옆으로 돌아가 있습니다. 정면 사진일수록 정확합니다.');
  if (Math.abs(m.rollDeg) > 15) warnings.push('고개가 많이 기울어 있습니다. 보정은 했지만 바로 선 사진이 더 정확합니다.');
  if (m.mouthCornerLift > 0.08 || m.lipThickness > 0.5) warnings.push('웃거나 입을 벌린 사진은 입 관련 풀이가 달라질 수 있습니다.');

  return { face, features, symmetry, standouts: rankStandouts(features), summary: summarize(face, features), warnings };
}

/** 중간 구간의 한가운데에서 얼마나 멀리 떨어졌는지(구간 폭 단위)로 두드러진 순서를 매김 */
function distinctiveness(f) {
  const a = f.bands[0].below, b = f.bands[1].below;
  return Math.abs(f.value - (a + b) / 2) / (b - a);
}
function rankStandouts(features) {
  return features
    .map(f => ({ f, score: distinctiveness(f) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, 3)
    .map(x => x.f);
}

/** 받침 유무에 따라 을/를 선택 */
function eulReul(word) {
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return word + '을(를)';
  return word + ((c - 0xac00) % 28 ? '을' : '를');
}

/** 가운데 구간에서 가장 멀리 벗어난 특징을 골라 한 줄 요약 */
function summarize(face, features) {
  const standout = rankStandouts(features.filter(f => f.band.index !== 1)).map(f => f.band.tag);
  const head = `${face.primary.shape}의 ${face.primary.name}(${face.primary.hanja})`;
  if (!standout.length) return `${head}에, 이목구비가 고루 균형 잡힌 상입니다.`;
  return `${head}에, ${eulReul(standout.join(' · '))} 가진 상입니다.`;
}
