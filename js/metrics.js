// metrics.js — 얼굴 랜드마크 68점 → 관상용 측정값
// DOM에 의존하지 않는 순수 함수만 둡니다. 웹·앱(Capacitor, React Native 등) 어디서든 그대로 재사용할 수 있습니다.
//
// 랜드마크 번호 (iBUG 68점 표준)
//   0–16 턱선 · 17–21 사진 왼쪽 눈썹 · 22–26 사진 오른쪽 눈썹
//   27–30 콧대 · 31–35 콧볼/코끝 아래 · 36–41 사진 왼쪽 눈 · 42–47 사진 오른쪽 눈
//   48–59 입술 바깥선 · 60–67 입술 안쪽선

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

function mean(points, idx) {
  let x = 0, y = 0;
  for (const i of idx) { x += points[i].x; y += points[i].y; }
  return { x: x / idx.length, y: y / idx.length };
}

const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);

/** 두 눈을 잇는 선이 수평이 되도록 회전시켜, 고개 기울기의 영향을 없앱니다. */
export function alignByEyes(points) {
  const l = mean(points, range(36, 41));
  const r = mean(points, range(42, 47));
  const angle = Math.atan2(r.y - l.y, r.x - l.x);
  const cx = (l.x + r.x) / 2, cy = (l.y + r.y) / 2;
  const c = Math.cos(-angle), s = Math.sin(-angle);
  return {
    rollDeg: (angle * 180) / Math.PI,
    points: points.map(p => {
      const dx = p.x - cx, dy = p.y - cy;
      return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
    }),
  };
}

/**
 * @param {{x:number,y:number}[]} raw  68개 랜드마크 (이미지 좌표, y는 아래로 증가)
 * @returns 측정값 객체. 모든 비율은 얼굴 크기에 무관하도록 정규화돼 있습니다.
 */
export function computeMetrics(raw) {
  if (!raw || raw.length !== 68) throw new Error('랜드마크 68개가 필요합니다.');
  const { points: P, rollDeg } = alignByEyes(raw);
  const d = (a, b) => dist(P[a], P[b]);

  // 눈
  const eyeL = mean(P, range(36, 41));
  const eyeR = mean(P, range(42, 47));
  const pupilDist = dist(eyeL, eyeR);
  const eyeW = (d(36, 39) + d(42, 45)) / 2;
  const eyeH = ((d(37, 41) + d(38, 40)) / 2 + (d(43, 47) + d(44, 46)) / 2) / 2;
  const innerGap = d(39, 42);
  // 눈꼬리 각도: +면 바깥 눈꼬리가 안쪽보다 높음(올라간 눈)
  const tiltL = Math.atan2(P[36].y - P[39].y, P[39].x - P[36].x);
  const tiltR = Math.atan2(P[45].y - P[42].y, P[45].x - P[42].x);
  const eyeTiltDeg = (((tiltL + tiltR) / 2) * 180) / Math.PI * -1;

  // 눈썹
  const browPeakY = (P[19].y + P[24].y) / 2;
  const browY = mean(P, [18, 19, 20, 23, 24, 25]).y;
  const eyeTopY = mean(P, [37, 38, 43, 44]).y;
  const browLen = (d(17, 21) + d(22, 26)) / 2;
  const glabella = d(21, 22);

  // 삼정 중 측정 가능한 중정·하정 (상정은 머리카락 때문에 사진으로는 신뢰도가 낮아 제외)
  const noseBaseY = P[33].y;
  const chinY = P[8].y;
  const midH = noseBaseY - browPeakY;
  const lowH = chinY - noseBaseY;

  // 코
  const noseLen = d(27, 33);
  const noseW = d(31, 35);

  // 입
  const mouthW = d(48, 54);
  const lipCenterY = (P[62].y + P[66].y) / 2;
  const cornerY = (P[48].y + P[54].y) / 2;
  const upperLip = d(51, 62);
  const lowerLip = d(66, 57);

  // 얼굴형
  const faceW = d(0, 16);
  const jawW = d(4, 12);
  const chinW = d(6, 10);
  const faceH = chinY - browPeakY;

  // 좌우 대칭: 정중선 기준으로 짝 점들의 거리 차이
  const midX = mean(P, [27, 28, 29, 30, 33, 51, 57, 8]).x;
  const pairs = [[0, 16], [2, 14], [4, 12], [6, 10], [17, 26], [19, 24], [21, 22],
    [36, 45], [39, 42], [31, 35], [48, 54]];
  let asym = 0;
  for (const [a, b] of pairs) {
    asym += Math.abs((midX - P[a].x) - (P[b].x - midX)) + Math.abs(P[a].y - P[b].y);
  }
  asym /= pairs.length * faceW;

  // 고개 돌림(yaw) 추정: 코끝이 턱선 중앙에서 얼마나 벗어났는지
  const yaw = (P[30].x - (P[0].x + P[16].x) / 2) / faceW;

  return {
    // 품질
    rollDeg, yaw,
    // 삼정
    midLowRatio: midH / lowH,
    // 눈
    eyeAspect: eyeH / eyeW,
    eyeTiltDeg,
    eyeGapRatio: innerGap / eyeW,
    // 눈썹 · 궁
    glabellaRatio: glabella / eyeW,
    browEyeGap: (eyeTopY - browY) / eyeW,
    browLenRatio: browLen / eyeW,
    // 코
    noseLenRatio: noseLen / (chinY - P[27].y),
    noseWidthRatio: noseW / innerGap,
    // 입
    mouthWidthRatio: mouthW / pupilDist,
    mouthCornerLift: (lipCenterY - cornerY) / mouthW,
    lipThickness: (upperLip + lowerLip) / mouthW,
    // 얼굴형
    faceAspect: faceH / faceW,
    jawRatio: jawW / faceW,
    chinRatio: chinW / faceW,
    // 대칭 (0~100)
    symmetry: Math.max(0, Math.min(100, 100 - asym * 500)),
    // 오버레이용 정렬 전 기준선 (이미지 좌표)
    guides: {
      browY: (raw[19].y + raw[24].y) / 2,
      noseBaseY: raw[33].y,
      chinY: raw[8].y,
    },
  };
}
