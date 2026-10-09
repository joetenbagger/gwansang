// copy.js — 화면에 쓰는 짧은 문구 모음 (앱 말투)

export const APP_NAME = '얼굴팔자';

// 일간별 별명: 표지 카드의 큰 제목
export const NICK = {
  甲: '곧게 뻗은 큰 나무', 乙: '꺾이지 않는 들풀', 丙: '한낮의 태양', 丁: '밤을 밝히는 등불',
  戊: '묵직한 큰 산', 己: '곡식을 키우는 밭', 庚: '단단한 바위', 辛: '빛나는 보석',
  壬: '넓게 흐르는 강', 癸: '조용히 내리는 비',
};

export const STRENGTH_FRIENDLY = { strong: '기운이 센 편', balanced: '기운이 고른 편', weak: '기운이 여린 편' };

export const TOPICS = [
  { id: 'love', label: '연애·결혼', hint: '어떤 사람과 맞을까', section: 'people' },
  { id: 'money', label: '돈·재물', hint: '돈이 모이는 사람일까', section: 'money' },
  { id: 'work', label: '일·진로', hint: '나한테 맞는 일은', section: 'work' },
  { id: 'year', label: '올해 운세', hint: '올해 어떻게 흘러갈까', section: 'year' },
  { id: 'self', label: '나라는 사람', hint: '타고난 성격이 궁금해', section: 'nature' },
];

// 12시진: 한국 시계 기준 대략 구간(서울 경도 보정 반영)과 계산에 쓸 가운데 시각
export const SIJIN = [
  { b: '子', ko: '자시', range: '밤 11:30 ~ 1:30', mid: '00:30', animal: '쥐' },
  { b: '丑', ko: '축시', range: '새벽 1:30 ~ 3:30', mid: '02:30', animal: '소' },
  { b: '寅', ko: '인시', range: '새벽 3:30 ~ 5:30', mid: '04:30', animal: '호랑이' },
  { b: '卯', ko: '묘시', range: '아침 5:30 ~ 7:30', mid: '06:30', animal: '토끼' },
  { b: '辰', ko: '진시', range: '아침 7:30 ~ 9:30', mid: '08:30', animal: '용' },
  { b: '巳', ko: '사시', range: '오전 9:30 ~ 11:30', mid: '10:30', animal: '뱀' },
  { b: '午', ko: '오시', range: '낮 11:30 ~ 1:30', mid: '12:30', animal: '말' },
  { b: '未', ko: '미시', range: '오후 1:30 ~ 3:30', mid: '14:30', animal: '양' },
  { b: '申', ko: '신시', range: '오후 3:30 ~ 5:30', mid: '16:30', animal: '원숭이' },
  { b: '酉', ko: '유시', range: '저녁 5:30 ~ 7:30', mid: '18:30', animal: '닭' },
  { b: '戌', ko: '술시', range: '저녁 7:30 ~ 9:30', mid: '20:30', animal: '개' },
  { b: '亥', ko: '해시', range: '밤 9:30 ~ 11:30', mid: '22:30', animal: '돼지' },
];

export const LOADING_STEPS = {
  pillars: '태어난 날을 만세력으로 옮기는 중',
  elements: '다섯 기운의 크기를 재는 중',
  face: '얼굴의 선을 따라가는 중',
  merge: '얼굴과 사주를 겹쳐 보는 중',
  done: '풀이를 적는 중',
};

// 일간별 한 줄 성격: 표지 카드
export const TRAIT = {
  甲: '한번 정하면 끝까지 가는 사람', 乙: '휘어도 꺾이지 않는 사람', 丙: '있는 그대로 다 보여 주는 사람',
  丁: '조용히 오래 타오르는 사람', 戊: '흔들리지 않고 자리를 지키는 사람', 己: '사람과 살림을 키우는 사람',
  庚: '옳고 그름이 분명한 사람', 辛: '스스로에게 가장 엄격한 사람', 壬: '크게 보고 멀리 가는 사람',
  癸: '말없이 다 알아채는 사람',
};

export const TOPIC_TITLE = {
  love: name => (name ? `${name}님과 맞는 인연` : '나와 맞는 인연'),
  money: () => '돈은 어떻게 들어오고 나갈까',
  work: () => '나한테 맞는 일',
  year: (_, y) => `${y}년은 이렇게 흘러가요`,
  self: () => '나는 이런 사람',
};
