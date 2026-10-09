// combined.js — 사주와 관상을 엮어 종합 풀이를 만듭니다 (순수 함수)
import { EL, GENERATES, CONTROLS, GROUPS } from './saju/data.js?v=11';

const FACE_EL = { wood: 'wood', fire: 'fire', earth: 'earth', metal: 'metal', water: 'water' };

const elWithJosa = (el, a, b) => { const k = EL[el].ko; return `${k}(${EL[el].hanja})` + josa(k, a, b).slice(k.length); };
const josa = (word, a, b) => {
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return word + a;
  return word + ((c - 0xac00) % 28 ? a : b);
};

function faceSajuMatch(faceResult, saju) {
  const face = faceResult.face;
  const fe = FACE_EL[face.primary.id];
  const y = saju.yongsin;
  const name = `${face.primary.name}(${EL[fe].hanja})`;
  if (fe === y.el) return { tone: 'good', title: '얼굴이 사주를 채워 줍니다',
    text: `사주에 필요한 기운(용신)이 ${EL[y.el].ko}(${EL[y.el].hanja})인데, 얼굴이 바로 그 기운의 ${name}입니다. 타고난 사주의 빈자리를 얼굴이 메워 주는 좋은 조합으로 봅니다.`,
    caution: '좋은 조합이라도 사주가 한쪽으로 기울어 있다는 사실은 그대로입니다. 얼굴의 장점을 살리는 생활(표정·태도)을 유지해야 효과가 납니다.' };
  if (fe === y.heeEl) return { tone: 'good', title: '얼굴이 사주를 거들어 줍니다',
    text: `얼굴의 ${name} 기운이 사주에 필요한 ${EL[y.el].ko}(${EL[y.el].hanja}) 기운을 낳아 줍니다. 직접 채우지는 않아도 뒤에서 받쳐 주는 조합입니다.`,
    caution: '도움이 간접적이라 결과가 늦게 나타납니다. 조급해하지 말고 꾸준함으로 승부해야 합니다.' };
  if (fe === y.giEl) return { tone: 'caution', title: '얼굴과 사주가 서로 부딪힙니다',
    text: `사주에 필요한 ${EL[y.el].ko}(${EL[y.el].hanja}) 기운을 얼굴의 ${name} 기운이 누릅니다. 겉으로 보이는 인상과 속에 필요한 것이 엇갈리는 조합입니다.`,
    caution: `남들이 기대하는 모습과 실제 내게 맞는 길이 다를 수 있습니다. 인상에 맞춰 무리하기보다 ${EL[y.el].ko} 기운을 채우는 쪽(${EL[y.el].color}, ${EL[y.el].direction})을 의식해 보세요.` };
  if (saju.excess.some(x => x.el === fe)) return { tone: 'caution', title: '얼굴도 같은 쪽으로 기울었습니다',
    text: `사주에 이미 많은 ${EL[fe].ko}(${EL[fe].hanja}) 기운이 얼굴에도 강하게 드러납니다. 장점이 분명한 대신 한쪽으로 치우친 조합입니다.`,
    caution: saju.excess.find(x => x.el === fe).text };
  return { tone: 'neutral', title: '얼굴과 사주가 무난하게 어울립니다',
    text: `얼굴의 ${name} 기운은 사주의 균형에 크게 보태지도 해치지도 않습니다. 사주의 흐름이 그대로 삶에 드러나는 편입니다.`,
    caution: '얼굴이 사주의 약점을 덮어 주지 않으니, 사주에서 짚은 조심할 점을 그대로 챙겨야 합니다.' };
}

const featureOf = (face, id) => face?.features.find(f => f.id === id);

/**
 * @param saju analyzeSaju 결과 (필수)
 * @param face  관상 interpret 결과 (없으면 null)
 * @param years [analyzeYear(올해), analyzeYear(내년)]
 */
export function combine(saju, face, years) {
  const dm = saju.dayMaster;
  const g = id => saju.groups.find(x => x.id === id);
  const sections = [];

  // 1. 기질
  {
    const eye = featureOf(face, 'eyeShape');
    sections.push({
      id: 'nature', title: '타고난 기질',
      text: `${dm.text}` + (eye ? ` 관상에서 보이는 눈은 ‘${eye.band.tag}’입니다. ${eye.band.text}` : ''),
      caution: dm.caution + (eye ? ' ' + eye.band.caution : ''),
    });
  }
  // 2. 재물
  {
    const j = g('jaeseong'); const nose = featureOf(face, 'noseWidth');
    const lvl = { high: '재물을 뜻하는 기운(재성)이 강합니다.', mid: '재물을 뜻하는 기운(재성)이 알맞게 있습니다.', low: '재물을 뜻하는 기운(재성)이 약한 편입니다.', none: '사주에 재물을 뜻하는 기운(재성)이 거의 드러나지 않습니다.' }[j.level];
    sections.push({
      id: 'money', title: '재물',
      text: lvl + (j.text ? ' ' + j.text : '') + (nose ? ` 관상에서 재물을 보는 콧볼은 ‘${nose.band.tag}’입니다. ${nose.band.text}` : ''),
      caution: (j.caution || '재물은 들어오는 것보다 지키는 구조가 중요합니다. 고정 지출을 먼저 줄이세요.') + (nose ? ' ' + nose.band.caution : ''),
    });
  }
  // 3. 일·적성
  {
    const d = saju.dominant;
    sections.push({
      id: 'work', title: '일과 적성',
      text: `사주에서 가장 강한 기운은 ${(([x, y]) => josa(x, '과', '와') + ' ' + josa(y, '을', '를'))(GROUPS[d.id].about.split('·'))} 뜻하는 ${d.name}(${d.hanja})입니다. 그래서 ${saju.career} 쪽이 잘 맞습니다.` + (face ? ` 얼굴은 ${face.face.primary.shape}의 ${face.face.primary.name}입니다. ${face.face.primary.text.split('. ').slice(1).join('. ')}` : ''),
      caution: (d.caution || '') + (face ? ' ' + face.face.primary.caution : ''),
    });
  }
  // 4. 사람·인연
  {
    const b = g('bigeop'), gw = g('gwanseong'); const brow = featureOf(face, 'browLen'); const corner = featureOf(face, 'mouthCorner');
    const rel = b.level === 'high' ? '주변에 동료와 친구가 많고 의리를 중시합니다.' : b.level === 'none' || b.level === 'low' ? '사람을 넓게 사귀기보다 소수와 깊게 지냅니다.' : '사람 관계가 넓지도 좁지도 않게 고릅니다.';
    const spouse = saju.cells.day.branch.god;
    sections.push({
      id: 'people', title: '사람과 인연',
      text: `${rel} 배우자 자리(일지)에 ${josa(spouse, '이', '가')} 있어 ${spouseText(spouse)}` + (brow ? ` 관상에서 형제·동료 인연을 보는 눈썹은 ‘${brow.band.tag}’입니다. ${brow.band.text}` : ''),
      caution: [b, gw].find(x => x.level === 'high' && x.id !== saju.dominant.id)?.caution
        || '관계에서 서운한 일이 생기면 쌓아 두지 말고 바로 말하는 것이 오래 가는 비결입니다.' + (corner ? ' ' + corner.band.caution : ''),
    });
  }
  // 5. 관상과 사주의 궁합
  const match = face ? faceSajuMatch(face, saju) : null;

  // 6. 올해·내년
  const yearCards = years.map(y => ({
    ...y,
    title: `${y.year}년 ${y.stemKo}${y.branchKo}년`,
    text: `${y.god}의 해입니다. ${y.theme}` + (y.tone === 'good' ? ' 사주에 필요한 기운이 들어와 전체적으로 순풍입니다.' : y.tone === 'caution' ? ' 사주가 꺼리는 기운이 들어와 무리하면 탈이 나는 해입니다.' : ' 크게 좋거나 나쁘지 않아, 하기에 따라 결과가 갈립니다.'),
    caution: (y.clashDay ? '그해의 지지가 일지(배우자 자리)와 충돌합니다. 이사·이직·관계 변화가 생기기 쉬우니 큰 결정은 신중하게 하세요. ' : '') +
      ({ 겁재: '돈 거래와 보증은 피하세요.', 상관: '윗사람과의 말다툼을 조심하세요.', 편재: '투기성 투자는 규모를 줄이세요.', 편관: '과로와 무리한 책임을 경계하세요.', 편인: '생각만 하다 기회를 놓치지 않게 하세요.', 비견: '고집으로 협업을 망치지 않게 하세요.', 식신: '편안함에 젖어 게을러지지 않게 하세요.', 정재: '아끼다 필요한 투자를 놓치지 않게 하세요.', 정관: '체면 때문에 손해 보는 선택을 하지 않게 하세요.', 정인: '남의 도움에만 기대지 않게 하세요.' }[y.god]),
  }));

  // 7. 꼭 기억할 조심할 점
  const cautions = [saju.strength.caution];
  if (saju.excess[0]) cautions.push(saju.excess[0].text);
  if (saju.relations.find(r => r.type === 'clash')) cautions.push(saju.relations.find(r => r.type === 'clash').text);
  if (face?.standouts?.[0]) cautions.push(`관상: ${face.standouts[0].band.caution}`);

  const headline = `${dm.image}(${dm.char}) 일간 · ${saju.strength.tag}` + (face ? ` · ${face.face.primary.name}(${face.face.primary.hanja}) 얼굴` : '');
  const summary = `${elWithJosa(saju.yongsin.el, '이', '가')} 필요한 사주입니다. ${saju.yongsin.reason}` +
    (match ? ` ${match.title}.` : '');

  return { headline, summary, sections, match, years: yearCards, cautions, lucky: { el: saju.yongsin.el, ...saju.yongsin.lucky } };
}

function spouseText(god) {
  return {
    비견: '배우자와 친구처럼 대등한 관계를 맺습니다. 다만 서로 고집이 부딪히기 쉽습니다.',
    겁재: '배우자와 경쟁하듯 지내기 쉽습니다. 돈 관리는 분명히 나누는 편이 낫습니다.',
    식신: '배우자와 편안하고 다정한 관계를 만듭니다. 서로 챙겨 주는 정이 깊습니다.',
    상관: '배우자에게 바라는 기준이 높아 말로 상처를 주기 쉽습니다. 칭찬을 아끼지 마세요.',
    편재: '활동적이고 매력 있는 배우자와 인연이 있습니다. 바깥 일로 가정이 소홀해지지 않게 하세요.',
    정재: '알뜰하고 성실한 배우자와 안정된 가정을 꾸립니다. 지나친 통제는 갈등이 됩니다.',
    편관: '배우자로 인해 긴장하거나 책임이 커질 수 있습니다. 서로 숨 쉴 틈을 주는 것이 중요합니다.',
    정관: '반듯하고 믿음직한 배우자와 인연이 있습니다. 체면을 앞세우면 속마음을 못 나눕니다.',
    편인: '배우자와 생각이 깊게 통하지만, 표현이 부족해 서운함이 쌓이기 쉽습니다.',
    정인: '배우자가 나를 보살펴 주는 관계입니다. 받는 데 익숙해지지 않게 주의하세요.',
  }[god];
}
