// detector.js — 사진에서 얼굴 랜드마크 68점을 찾습니다.
// 얼굴 인식 엔진(face-api, MIT)은 처음 사진을 올릴 때만 불러옵니다.
// 앱으로 옮길 때 기기 내장 엔진(iOS Vision, Android ML Kit 등)으로 바꾸려면 이 파일만 교체하면 됩니다.
// 반환 형식: { points: [{x,y} × 68], faceCount } 또는 얼굴이 없으면 null

let ready = null;

async function load(onProgress) {
  const faceapi = await import('../vendor/face-api.esm.js?v=11');
  const tf = faceapi.tf;
  // WebGL을 먼저 쓰고, 안 되면 CPU로 계산합니다.
  let ok = false;
  try { ok = await tf.setBackend('webgl'); } catch { ok = false; }
  if (!ok) await tf.setBackend('cpu');
  await tf.ready();
  onProgress?.('얼굴 모델을 불러오는 중입니다.');
  const base = new URL('../models/', import.meta.url).href;
  await faceapi.nets.tinyFaceDetector.loadFromUri(base);
  await faceapi.nets.faceLandmark68Net.loadFromUri(base);
  return faceapi;
}

export async function detectLandmarks(image, onProgress) {
  ready ??= load(onProgress).catch(e => { ready = null; throw e; });
  const faceapi = await ready;
  onProgress?.('얼굴을 찾고 비율을 재는 중입니다.');
  const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.4 });
  let dets = await faceapi.detectAllFaces(image, opts).withFaceLandmarks();
  if (!dets.length) {
    // 얼굴이 아주 작거나 큰 사진을 위해 한 번 더 시도
    dets = await faceapi.detectAllFaces(image, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 })).withFaceLandmarks();
  }
  if (!dets.length) return null;
  dets.sort((a, b) => b.detection.box.area - a.detection.box.area);
  return {
    points: dets[0].landmarks.positions.map(p => ({ x: p.x, y: p.y })),
    faceCount: dets.length,
  };
}
