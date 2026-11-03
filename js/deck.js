// deck.js — 결과 카드 묶음. 고른 질문을 맨 앞(표지 다음)에 둡니다.
import { STEMS, BRANCHES, EL, ELEMENTS } from './saju/data.js?v=18';
import { NICK, STRENGTH_FRIENDLY, TOPICS } from './copy.js?v=18';
import { esc } from './util.js?v=18';
import { topicCards } from './topic.js?v=18';
import { ILJU } from './content/ilju.js?v=18';
import { gyeokOf, unseongOf } from './content/gyeok.js?v=18';
import { findCelebs } from './celeb-match.js?v=18';
import { predictMbti, compareMbti, goodMatches, MBTI_ADJ, MBTI_LINE, DAY_NOUN, LETTER_KO } from './mbti.js?v=18';
import { buildReading, mbtiReading } from './saju/reading.js?v=18';
import { readingBody } from './view-reading.js?v=18';
import { buildLifeFlow } from './saju/life-flow.js?v=18';
import { lifeFlowBody } from './view-flow.js?v=18';

const but = t => t ? `<p class="but"><span>다만</span>${esc(t)}</p>` : '';
const TONE = { good: '순풍', neutral: '보통', caution: '조심' };
const toneTag = t => `<span class="tone ${t}">${TONE[t]}</span>`;
const firstSentence = t => { const m = String(t).match(/^.+?[.!?](\s|$)/); return m ? m[0].trim() : t; };

function mini8(saju) {
  return `<div class="mini8">${[['hour', '시'], ['day', '일'], ['month', '월'], ['year', '년']].map(([k, n]) => {
    const c = saju.cells[k];
    if (!c) return `<div class="none"><small>${n}</small><b>?</b><b>?</b></div>`;
    return `<div class="${k === 'day' ? 'me' : ''}"><small>${n}</small><b data-el="${c.stem.el}">${c.stem.char}</b><b data-el="${c.branch.el}">${c.branch.char}</b></div>`;
  }).join('')}</div>`;
}

function ring(saju) {
  const cx = 130, cy = 128, R = 84;
  const pos = ELEMENTS.map((e, i) => { const a = -Math.PI / 2 + i * (2 * Math.PI / 5); return { e, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }; });
  return `<svg class="ring" viewBox="0 0 260 262" role="img" aria-label="오행 분포: ${ELEMENTS.map(e => `${EL[e].ko} ${Math.round(saju.powerPct[e] * 100)}%`).join(', ')}">
    ${pos.map((p, i) => { const q = pos[(i + 1) % 5]; return `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="var(--rule)" stroke-width="1"/>`; }).join('')}
    ${pos.map(p => {
      const r = 12 + saju.powerPct[p.e] * 72;
      const yong = p.e === saju.yongsin.el;
      return `<g data-el="${p.e}"><circle cx="${p.x}" cy="${p.y}" r="${r.toFixed(1)}" fill="var(--e)" fill-opacity=".16" stroke="var(--e)" stroke-width="${yong ? 3 : 1.5}" ${yong ? 'stroke-dasharray="5 3"' : ''}/>
        <text x="${p.x}" y="${p.y + 7}" text-anchor="middle" font-family="Song Myung, serif" font-size="21" fill="var(--e)">${EL[p.e].hanja}</text>
        <text x="${p.x}" y="${p.y + (p.y < cy ? -r - 6 : r + 16)}" text-anchor="middle" font-size="12" fill="var(--ink-2)">${Math.round(saju.powerPct[p.e] * 100)}%</text></g>`;
    }).join('')}
  </svg>`;
}


function card(id, kicker, body) {
  return { id, html: `<article class="card" data-card="${id}" aria-roledescription="카드">${kicker ? `<span class="kicker">${esc(kicker)}</span>` : ''}${body}</article>` };
}

function sectionCard(total, id, kicker, title) {
  const s = total.sections.find(x => x.id === id);
  return card(id, kicker, `<h2>${title}</h2><p class="lead">${esc(firstSentence(s.text))}</p><p>${esc(s.text.slice(firstSentence(s.text).length).trim())}</p>${but(s.caution)}${s.evidence ? `<p class="reading-basis">읽은 자리 · ${esc(s.evidence)}</p>` : ''}`);
}

function axisBars(cmp) {
  return `<div class="axes">${cmp.rows.map(r => `
    <div class="ax${r.same === false ? ' diff' : ''}">
      <span class="l${r.letter === r.a ? ' on' : ''}">${r.a}<small>${LETTER_KO[r.a]}</small></span>
      <span class="track"><b style="left:${(1 - r.pA) * 100}%"></b>${r.actual ? `<i style="left:${r.actual === r.a ? 8 : 92}%" title="실제"></i>` : ''}</span>
      <span class="r${r.letter === r.b ? ' on' : ''}">${r.b}<small>${LETTER_KO[r.b]}</small></span>
    </div>`).join('')}</div>`;
}

function mbtiCards({ input, saju }) {
  const pred = predictMbti(saju);
  const actual = input.mbti;
  const cmp = compareMbti(pred, actual);
  const dm = saju.dayStem;
  const reading = buildReading(saju);
  const out = [];
  out.push(card('mbti', '사주 × MBTI', `
    <h2>사주로 보면 <em>${pred.type}</em></h2>
    ${axisBars(cmp)}
    <p class="legend2"><span class="dotp"></span>사주가 기운 쪽${actual ? '<span class="dota"></span>실제 MBTI' : ''}</p>
    <p>${esc(MBTI_LINE[pred.type])} 오행과 십신의 비율로 계산한 결과예요.</p>
    ${actual ? `<p class="lead">실제 MBTI는 ${actual}${input.mbtiFromQuiz ? '(간이 테스트)' : ''}. 네 글자 중 ${cmp.same}개가 같아요.</p>` : '<p class="hint">MBTI를 알려 주면 타고난 나와 지금의 나를 비교해 드려요.</p>'}`));
  if (actual) {
    const diffs = cmp.rows.filter(r => !r.same), sames = cmp.rows.filter(r => r.same);
    out.push(card('mbti', '타고난 나 vs 지금의 나', `
      <h2><em>${cmp.match.title}</em></h2>
      <p class="lead">${esc(cmp.match.text)}</p>
      ${diffs.map(r => `<div class="yearrow"><div class="yh"><b>${r.letter} → ${r.actual}</b><span class="tone caution">다름</span></div><p>${esc(r.text)}</p></div>`).join('')}
      ${sames.map(r => `<div class="yearrow"><div class="yh"><b>${r.letter} = ${r.actual}</b><span class="tone good">같음</span></div><p>${esc(r.text)}</p></div>`).join('')}`));
  }
  const t = actual || pred.type;
  const blend = mbtiReading(saju, t);
  const [m1, m2] = goodMatches(t);
  out.push(card('mbti', `${t} × ${dm}`, `
    <h2><em>${MBTI_ADJ[t]}</em> ${DAY_NOUN[dm]}</h2>
    <p class="lead">${esc(MBTI_LINE[t])}</p>
    <p>${esc(blend.text)}</p>
    <p>${esc(blend.action)}</p>
    <p>${actual ? (cmp.same >= 3 ? '알려 준 MBTI와 사주식 분류가 비슷한 쪽이에요. 그래도 가까운 관계와 일하는 자리에서 같은 모습일 필요는 없어요.' : '알려 준 MBTI와 사주식 분류가 갈리는 축이 있어요. 위의 생활 장면이 실제 나와 맞는지 비교해 보세요.') : '실제 MBTI를 입력하지 않아 두 분류가 같은지는 비교하지 않았어요.'}</p>
    <div class="kv"><div><small>잘 맞는 MBTI</small><b>${m1}, ${m2}</b></div><div><small>사주로 잘 맞는 기운</small><b>${EL[saju.yongsin.el].ko}(${EL[saju.yongsin.el].hanja}) 기운의 사람</b></div></div>
    ${but(reading.intimate.risk)}<p class="reading-basis">${esc(blend.evidence)}. 성격 검사를 대신하는 분류는 아니에요.</p>`));
  return out;
}

export function buildCards({ input, chart, saju, face, total, years, faceImage }) {
  const name = input.name || '';
  const dm = saju.dayStem;
  const dmEl = STEMS[dm].el;
  const reading = total.reading || buildReading(saju);
  const cards = [];
  const topic = TOPICS.find(t => t.id === input.topic) || TOPICS[4];

  // 1. 표지
  cards.push(card('cover', name ? `${name}님의 팔자` : '나의 팔자', `
    <div class="bigglyph" data-el="${dmEl}"><span class="g">${dm}</span>
      <span class="meta"><b>${NICK[dm]}</b><span>${STEMS[dm].ko}${EL[dmEl].ko} 일간</span><span>${STRENGTH_FRIENDLY[saju.strength.key]}</span></span></div>
    <h2><em>${esc(reading.headline)}</em></h2>
    ${input.mbti ? `<p class="mbtitag"><b>${input.mbti}</b> · ${MBTI_ADJ[input.mbti]} ${DAY_NOUN[dm]}</p>` : ''}
    ${mini8(saju)}
    <p>${esc(reading.hook)}</p>
    <p class="reading-basis">${esc(reading.evidence)}</p>
    <p class="hint">옆으로 넘겨 보세요 →</p>`));

  // 1-1. 60일주 · 격국 · 12운성
  for (const c of natureCards(saju)) cards.push(c);

  // 같은 일주도 월주·시주가 다르면 달라지는 부분을 별도 카드로 보여 줍니다.
  cards.push(card('birth-month', '태어난 달 × 나', `<h2>${esc(reading.outside.title)}</h2>${readingBody(reading.outside)}`));
  cards.push(card('birth-hour', '태어난 시간 × 장기 계획', `<h2>${esc(reading.future.title)}</h2>${readingBody(reading.future)}`));

  // 2. 고른 질문: 심층 카드 4장
  const t = topic.id;
  const yr = years[0];
  for (const tc of topicCards({ input, saju, chart, face, years, total })) {
    cards.push(card('topic', `궁금했던 것 · ${tc.kicker}`, `<h2>${tc.title}</h2>${tc.body}`));
  }

  // 2-1. MBTI
  for (const c of mbtiCards({ input, saju })) cards.push(c);
  cards.push(celebCard(saju));

  // 3. 여덟 글자와 다섯 기운
  const top = ELEMENTS.reduce((a, e) => (saju.powerPct[e] > saju.powerPct[a] ? e : a));
  const y = saju.yongsin;
  cards.push(card('elements', '다섯 기운', `
    <h2><em>${EL[top].ko}(${EL[top].hanja})</em> 기운이 가장 커요</h2>
    ${ring(saju)}
    <p>필요한 기운은 <b>${EL[y.el].ko}(${EL[y.el].hanja})</b>이에요. ${esc(y.reason)}</p>
    ${saju.excess[0] ? but(saju.excess[0].text) : saju.lack[0] ? but(saju.lack[0].text) : ''}`));

  // 4~5. 관상과 궁합
  if (face) {
    const r = face.result;
    cards.push(card('face', '얼굴', `
      ${faceImage ? `<img class="facepic" src="${faceImage}" alt="분석한 얼굴과 측정선">` : ''}
      <h2><em>${r.face.primary.name}</em> ${r.face.primary.hanja}, ${esc(r.face.primary.shape)}</h2>
      <ol class="list3">${r.standouts.map(f => `<li><span><b>${esc(f.band.tag)}</b> · ${esc(firstSentence(f.band.text))}</span></li>`).join('')}</ol>
      ${but(r.standouts[0].band.caution)}`));
    const m = total.match;
    cards.push(card('match', '얼굴 × 사주', `
      <div class="matchrow">
        <span class="side" data-el="${r.face.primary.id}"><b>${EL[r.face.primary.id].hanja}</b>얼굴</span>
        <span class="x">×</span>
        <span class="side" data-el="${y.el}"><b>${EL[y.el].hanja}</b>필요한 기운</span>
      </div>
      <h2>${esc(m.title)}</h2>${toneTag(m.tone)}
      <p>${esc(m.text)}</p>${but(m.caution)}`));
  }

  // 6~9. 나머지 주제
  const rest = [['nature', '타고난 기질', '나는 이런 사람'], ['money', '재물', '돈의 흐름'], ['work', '일과 적성', '잘 맞는 일'], ['people', '사람과 인연', '사람과 인연']];
  const skip = { self: 'nature', money: 'money', work: 'work', love: 'people' }[t];
  for (const [id, k, title] of rest) if (id !== skip) cards.push(sectionCard(total, id, k, title));

  // 10. 올해·내년 (올해를 이미 골랐으면 생략)
  if (t !== 'year') {
    cards.push(card('years', '올해와 내년', `<h2>${yr.year}년은 <em>${TONE[yr.tone]}</em></h2>
      ${years.map(v => `<div class="yearrow"><div class="yh"><b>${v.year} ${v.stemKo}${v.branchKo}년</b>${toneTag(v.tone)}</div><p>${esc(v.text)}</p>${but(v.caution)}${v.action ? `<p class="reading-action">${esc(v.action)}</p>` : ''}${v.evidence ? `<p class="reading-basis">읽은 자리 · ${esc(v.evidence)}</p>` : ''}</div>`).join('')}`));
  }

  // 11. 지금의 대운과 앞으로 5년을 먼저 읽고, 전체 흐름은 펼쳐서 봅니다.
  cards.push(card('flow', '인생의 큰 흐름', lifeFlowBody(buildLifeFlow(saju, chart))));

  // 12. 조심할 것
  cards.push(card('cautions', '꼭 기억할 것', `<h2>이건 <em>조심</em>하세요</h2>
    <ol class="list3">${total.cautions.slice(0, 3).map(c => `<li><span>${esc(c.replace(/^관상: /, ''))}</span></li>`).join('')}</ol>`));

  // 13. 행운
  const L = total.lucky;
  cards.push(card('lucky', '가까이하면 좋은 것', `
    <div class="bigglyph" data-el="${L.el}"><span class="g">${L.hanja}</span><span class="meta"><b>${L.ko}(${L.name}) 기운</b><span>나에게 모자란 기운을 채워 줘요</span></span></div>
    <div class="kv">
      <div><small>색</small><b>${L.color}</b></div><div><small>방향</small><b>${L.direction}</b></div>
      <div><small>숫자</small><b>${L.numbers}</b></div><div><small>계절</small><b>${L.season}</b></div>
    </div>
    <p class="hint">재미로 보는 풀이예요. 전체 풀이에서 사주 원국, 십신, 신살, 대운을 자세히 볼 수 있어요.</p>`));

  // 14. 친구와 궁합으로 이어 가기
  cards.push(card('gh', '이제 둘이 볼 차례', `
    <h2>친구랑, 그 사람이랑<br><em>궁합</em>은 어떨까?</h2>
    <p>상대의 생일만 넣으면 본성, 서로 필요한 기운, 띠, MBTI까지 엮어서 점수로 보여 드려요.</p>
    <button class="cta red cardcta" type="button" data-open-gh>지금 같이 보기</button>
    <button class="ghost cardcta" type="button" data-send-invite>궁합 링크 보내기</button>
    <p class="hint">링크를 받은 사람은 자기 생일만 넣으면 둘의 궁합을 바로 볼 수 있어요.</p>`));

  return cards;
}

function natureCards(saju) {
  const dc = saju.cells.day;
  const key = dc.stem.char + dc.branch.char;
  const il = ILJU[key];
  const gy = gyeokOf(saju);
  const un = unseongOf(dc.stem.char, dc.branch.char);
  const out = [];
  if (il) {
    out.push(card('ilju', `60일주 중 ${STEMS[key[0]].ko}${BRANCHES[key[1]].ko}일주`, `
      <span class="iljubig" data-el="${dc.stem.el}" style="color:var(--e)">${key}</span>
      <h2><em>${esc(il.img)}</em></h2>
      <p class="lead">${esc(il.core)}</p>
      <div class="area"><b>연애</b><p>${esc(il.love)}</p></div>
      <div class="area"><b>재물</b><p>${esc(il.money)}</p></div>
      <div class="area"><b>일</b><p>${esc(il.work)}</p></div>
      ${but(il.caution)}
      <p class="hint">태어난 날의 기둥(일주)은 60가지예요. 같은 일간이어도 일주에 따라 성향이 달라져요.</p>`));
  }
  out.push(card('gyeok', '타고난 그릇과 기운의 상태', `
    <h2><em>${esc(gy.name)}</em> · ${esc(gy.img)}</h2>
    <p class="lead">${esc(gy.core)}</p>
    <div class="kv"><div class="wide"><small>강점</small><b>${esc(gy.strong)}</b></div><div class="wide"><small>잘 맞는 자리</small><b>${esc(gy.career)}</b></div></div>
    ${but(gy.caution)}
    <hr>
    <p><b>12운성 · ${un.name}(${un.hanja})</b>, ${esc(un.img)}의 기운이에요. ${esc(un.text)}</p>
    ${but(un.caution)}
    <p class="hint">격국은 태어난 달이 정해 주는 사회적 그릇, 12운성은 나를 나타내는 글자가 앉은 자리에서 얼마나 힘을 쓰는지를 봐요.</p>`));
  return out;
}

function celebCard(saju) {
  const { ilju, same, similar } = findCelebs(saju);
  const dm = saju.dayStem;
  const li = c => `<li><b>${esc(c.name)}</b><small>${esc(c.field)} · ${c.date.replace(/-/g, '.')}</small></li>`;
  return card('celeb', '나와 닮은 유명인', `
    <span class="iljubig" data-el="${STEMS[dm].el}" style="color:var(--e)">${ilju}</span>
    <h2>${same.length ? `<em>${STEMS[ilju[0]].ko}${BRANCHES[ilju[1]].ko}일주</em>가 같은 사람` : `<em>${STEMS[dm].ko}${EL[STEMS[dm].el].ko}</em> 일간이 같은 사람`}</h2>
    ${same.length ? `<p>태어난 날의 기둥(일주)이 같으면 타고난 성향이 가장 닮았다고 봐요.</p><ul class="celebs">${same.map(li).join('')}</ul>` : ''}
    ${similar.length ? `${same.length ? '<hr><p><b>기운까지 비슷한 사람</b></p>' : '<p>일주가 같은 유명인은 목록에 없지만, 나를 나타내는 글자가 같고 다섯 기운의 비율이 비슷한 사람들이에요.</p>'}<ul class="celebs">${similar.map(li).join('')}</ul>` : ''}
    <p class="hint">공개된 양력 생일 기준이고, 태어난 시각은 반영하지 않았어요. 재미로만 봐 주세요.</p>`);
}
