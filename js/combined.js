// 사주와 관상을 엮는 종합 풀이. 위치별 상세 읽기는 reading.js에서 만듭니다.
import { EL } from './saju/data.js?v=18';
import { buildReading, questionReading, yearReading } from './saju/reading.js?v=18';
import { ILJU } from './content/ilju.js?v=18';

function faceSajuMatch(faceResult, saju) {
  const face = faceResult.face;
  const fe = face.primary.id;
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

export function combine(saju, face, years) {
  const reading = buildReading(saju);
  const section = (id, title, topic, featureId) => {
    const r = questionReading(reading, topic).shared;
    const feature = face?.features.find(f => f.id === featureId);
    return { id, title,
      text: r.lead + ' ' + r.text + (feature ? ' 관상에서는 ‘' + feature.band.tag + '’로 읽어요. ' + feature.band.text : ''),
      caution: r.caution + ' ' + r.action, evidence: r.evidence,
    };
  };
  const sections = [
    { id: 'nature', title: '타고난 기질', text: reading.pattern.text, caution: reading.pattern.caution + ' ' + reading.pattern.action, evidence: reading.pattern.evidence },
    section('money', '재물', 'money', 'noseWidth'),
    section('work', '일과 적성', 'work', 'eyeShape'),
    section('people', '사람과 인연', 'love', 'mouthCorner'),
  ];
  const ilju = ILJU[saju.dayStem + saju.cells.day.branch.char];
  const work = sections.find(s => s.id === 'work');
  work.text = ilju.work + ' ' + reading.capacity.text;
  work.evidence = `일주 ${saju.dayStem}${saju.cells.day.branch.char} · ${saju.strength.tag} · 월지 ${reading.environmentGod}`;
  const people = sections.find(s => s.id === 'people');
  people.text = reading.intimate.love + ' ' + ilju.love;
  people.evidence = reading.inside.evidence;
  const match = face ? faceSajuMatch(face, saju) : null;
  const yearCards = years.map(y => {
    const detail = yearReading(saju, y, reading);
    return { ...y, title: y.year + '년 ' + y.stemKo + y.branchKo + '년',
      text: detail.text, caution: detail.caution, action: detail.action,
      evidence: detail.evidence, decade: detail.decade,
    };
  });
  const cautions = [...new Set([
    reading.pattern.caution, reading.capacity.risk, reading.links[0]?.action,
    face?.standouts?.[0] ? '관상: ' + face.standouts[0].band.caution : null,
  ].filter(Boolean))];
  return {
    headline: reading.headline, summary: reading.hook + ' ' + reading.capacity.text,
    sections, match, years: yearCards, cautions, reading,
    lucky: { el: saju.yongsin.el, ...saju.yongsin.lucky },
  };
}
