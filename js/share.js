// share.js — 공유용 한 장 이미지 (1080×1440)
import { STEMS, EL, ELEMENTS } from './saju/data.js?v=9';
import { NICK, TRAIT, APP_NAME, STRENGTH_FRIENDLY } from './copy.js?v=9';

const C = {
  paper: '#EED89A', card: '#F7EBC4', ink: '#241A10', ink2: '#5A4A36', rule: '#C9AE68', seal: '#B92D1A',
  wood: '#2F7A4B', fire: '#C23A22', earth: '#93650F', metal: '#5F6673', water: '#24497E',
};
const SERIF = '"Song Myung", serif';
const SANS = '"Pretendard Variable", Pretendard, -apple-system, "Apple SD Gothic Neo", sans-serif';

function wrap(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = []; let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

export async function makeShareImage({ input, saju, face, years }) {
  try { await Promise.all([document.fonts.load(`400 80px ${SERIF}`), document.fonts.load(`700 40px ${SANS}`)]); } catch {}
  const W = 1080, H = 1440;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
  // 종이 결
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(110,80,30,${Math.random() * 0.05})`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
  g.fillStyle = C.card; g.fillRect(60, 60, W - 120, H - 120);
  g.strokeStyle = C.seal; g.lineWidth = 4; g.strokeRect(60, 60, W - 120, H - 120);
  g.lineWidth = 1.5; g.strokeRect(76, 76, W - 152, H - 152);

  const dm = saju.dayStem, el = STEMS[dm].el;
  const name = input.name || '';
  g.textBaseline = 'alphabetic';
  g.fillStyle = C.seal; g.font = `700 34px ${SANS}`;
  g.fillText(name ? `${name}님의 팔자` : '나의 팔자', 130, 175);

  // 큰 글자
  g.fillStyle = C[el]; g.font = `400 330px ${SERIF}`;
  g.fillText(dm, 110, 500);
  g.fillStyle = C.ink; g.font = `700 44px ${SANS}`;
  g.fillText(NICK[dm], 500, 330);
  g.fillStyle = C.ink2; g.font = `500 32px ${SANS}`;
  g.fillText(`${STEMS[dm].ko}${EL[el].ko} 일간 · ${STRENGTH_FRIENDLY[saju.strength.key]}`, 500, 385);
  if (face) g.fillText(`얼굴 ${face.result.face.primary.name}(${face.result.face.primary.hanja})`, 500, 435);

  // 한 줄
  g.fillStyle = C.ink; g.font = `400 64px ${SERIF}`;
  wrap(g, TRAIT[dm], W - 260).forEach((l, i) => g.fillText(l, 130, 640 + i * 82));

  // 여덟 글자
  const top = 790, colW = (W - 260) / 4;
  g.strokeStyle = C.ink; g.lineWidth = 3;
  g.beginPath(); g.moveTo(130, top); g.lineTo(W - 130, top); g.moveTo(130, top + 250); g.lineTo(W - 130, top + 250); g.stroke();
  [['hour', '시'], ['day', '일'], ['month', '월'], ['year', '년']].forEach(([k, n], i) => {
    const x = 130 + colW * i + colW / 2;
    const c = saju.cells[k];
    g.textAlign = 'center';
    g.fillStyle = C.ink2; g.font = `500 26px ${SANS}`; g.fillText(n, x, top + 40);
    g.font = `400 92px ${SERIF}`;
    g.fillStyle = c ? C[c.stem.el] : C.rule; g.fillText(c ? c.stem.char : '?', x, top + 135);
    g.fillStyle = c ? C[c.branch.el] : C.rule; g.fillText(c ? c.branch.char : '?', x, top + 228);
    if (i) { g.strokeStyle = C.rule; g.lineWidth = 1.5; g.beginPath(); g.moveTo(130 + colW * i, top + 14); g.lineTo(130 + colW * i, top + 236); g.stroke(); }
  });
  g.textAlign = 'left';

  // 오행 막대
  const by = 1110, bw = (W - 260 - 4 * 18) / 5;
  ELEMENTS.forEach((e, i) => {
    const x = 130 + i * (bw + 18);
    g.fillStyle = 'rgba(201,174,104,.45)'; g.fillRect(x, by, bw, 16);
    g.fillStyle = C[e]; g.fillRect(x, by, bw * Math.min(1, saju.powerPct[e] / 0.45), 16);
    g.font = `400 40px ${SERIF}`; g.fillText(EL[e].hanja, x, by + 66);
    g.fillStyle = C.ink2; g.font = `500 26px ${SANS}`; g.fillText(`${Math.round(saju.powerPct[e] * 100)}%`, x + 52, by + 62);
  });

  // 올해
  const y0 = years[0];
  const toneWord = { good: '순풍', neutral: '보통', caution: '조심' }[y0.tone];
  g.fillStyle = C.ink; g.font = `700 34px ${SANS}`;
  g.fillText(`${y0.year}년 ${y0.stemKo}${y0.branchKo}년은 ${toneWord}`, 130, 1240);
  g.fillStyle = C.ink2; g.font = `500 28px ${SANS}`;
  g.fillText(`필요한 기운 ${EL[saju.yongsin.el].ko}(${EL[saju.yongsin.el].hanja}) · ${EL[saju.yongsin.el].color}`, 130, 1286);

  // 도장
  g.save(); g.translate(W - 200, 1252); g.rotate(-0.1);
  g.fillStyle = C.seal; g.fillRect(-60, -60, 120, 120);
  g.strokeStyle = '#FBE9D2'; g.lineWidth = 4; g.strokeRect(-50, -50, 100, 100);
  g.fillStyle = '#FBE9D2'; g.font = `400 40px ${SERIF}`; g.textAlign = 'center';
  g.fillText('相', -20, -6); g.fillText('命', 22, -6); g.fillText('四', -20, 40); g.fillText('柱', 22, 40);
  g.restore();

  g.fillStyle = C.ink2; g.font = `500 24px ${SANS}`; g.textAlign = 'left';
  g.fillText(`${APP_NAME} · ${location.host}${location.pathname.replace(/index\.html$/, '')}`, 130, H - 100);
  return new Promise(res => cv.toBlob(b => res(b), 'image/png'));
}

export async function shareOrSave(blob, filename) {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: APP_NAME }); return 'shared'; }
    catch (e) { if (e.name === 'AbortError') return 'cancelled'; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'saved';
}
