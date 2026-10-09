// gh-deck.js — 궁합 결과 카드
import { STEMS, BRANCHES, EL } from './saju/data.js?v=14';
import { NICK } from './copy.js?v=14';
import { RELATIONS } from './gunghap.js?v=14';
import { esc } from './util.js?v=14';

const but = t => t ? `<p class="but"><span>다만</span>${esc(t)}</p>` : '';
const card = (kicker, body) => `<article class="card">${kicker ? `<span class="kicker">${esc(kicker)}</span>` : ''}${body}</article>`;

function pair(A, B) {
  const a = A.saju.dayStem, b = B.saju.dayStem;
  return `<div class="matchrow">
    <span class="side" data-el="${STEMS[a].el}"><b>${a}</b>${esc(A.name || '나')}</span>
    <span class="x">×</span>
    <span class="side" data-el="${STEMS[b].el}"><b>${b}</b>${esc(B.name || '상대')}</span>
  </div>`;
}

function meter(score) {
  return `<div class="ghscore"><b>${score}</b><span>점</span></div>
    <div class="ghbar"><i style="width:${score}%"></i></div>`;
}

export function buildGhCards(A, B, g) {
  const rel = RELATIONS[g.rel];
  const cards = [];
  cards.push(card(`${rel.label} 궁합`, `
    ${pair(A, B)}
    ${meter(g.score)}
    <h2><em>${esc(g.verdict.title)}</em></h2>
    <p class="lead">${esc(g.line)}.</p>
    <p class="hint">옆으로 넘겨 보세요 →</p>`));

  cards.push(card('두 사람의 본성', `
    <h2>${esc(g.stem.title)}</h2>
    <span class="tone ${g.stem.score >= 70 ? 'good' : g.stem.score >= 55 ? 'neutral' : 'caution'}">${esc(g.stem.tag)}</span>
    <p class="lead">${esc(g.stem.text)}</p>
    <p class="hint">${esc(A.name || '나')}: ${NICK[A.saju.dayStem]} · ${esc(B.name || '상대')}: ${NICK[B.saju.dayStem]}</p>
    ${but(g.stem.caution)}`));

  cards.push(card('서로에게 필요한 기운', `
    <h2>${g.fill.score >= 70 ? '서로 <em>채워 주는</em> 사이' : g.fill.score <= 40 ? '서로 <em>지치게</em> 할 수 있는 사이' : '각자 채워야 하는 사이'}</h2>
    <div class="kv">
      <div data-el="${A.saju.yongsin.el}"><small>${esc(A.name || '나')}에게 필요한 기운</small><b style="color:var(--e)">${EL[A.saju.yongsin.el].ko}(${EL[A.saju.yongsin.el].hanja})</b></div>
      <div data-el="${B.saju.yongsin.el}"><small>${esc(B.name || '상대')}에게 필요한 기운</small><b style="color:var(--e)">${EL[B.saju.yongsin.el].ko}(${EL[B.saju.yongsin.el].hanja})</b></div>
      <div data-el="${g.fill.aTop}"><small>${esc(A.name || '나')}에게 많은 기운</small><b style="color:var(--e)">${EL[g.fill.aTop].ko}(${EL[g.fill.aTop].hanja})</b></div>
      <div data-el="${g.fill.bTop}"><small>${esc(B.name || '상대')}에게 많은 기운</small><b style="color:var(--e)">${EL[g.fill.bTop].ko}(${EL[g.fill.bTop].hanja})</b></div>
    </div>
    ${g.fill.lines.map(l => `<p>${esc(l)}</p>`).join('')}`));

  const ab = A.saju.cells.year.branch.char, bb = B.saju.cells.year.branch.char;
  cards.push(card('속마음과 생활', `
    <h2>일지는 <em>${esc(g.day.tag)}</em>, 띠는 <em>${esc(g.zodiac.tag)}</em></h2>
    <div class="yearrow"><div class="yh"><b>${A.saju.cells.day.branch.char} × ${B.saju.cells.day.branch.char}</b><span class="tone ${g.day.score >= 70 ? 'good' : g.day.score < 50 ? 'caution' : 'neutral'}">${esc(g.day.tag)}</span></div><p>${esc(g.day.text)}</p></div>
    <div class="yearrow"><div class="yh"><b>${BRANCHES[ab].animal}띠 × ${BRANCHES[bb].animal}띠</b><span class="tone ${g.zodiac.score >= 70 ? 'good' : g.zodiac.score < 50 ? 'caution' : 'neutral'}">${esc(g.zodiac.tag)}</span></div><p>${esc(g.zodiac.text)}</p></div>`));

  if (g.mbti) {
    cards.push(card('MBTI 궁합', `
      <div class="matchrow"><span class="side"><b class="mb">${A.mbti}</b>${esc(A.name || '나')}</span><span class="x">×</span><span class="side"><b class="mb">${B.mbti}</b>${esc(B.name || '상대')}</span></div>
      <h2>${g.mbti.score >= 80 ? '<em>잘 맞는</em> 조합' : g.mbti.score >= 60 ? '무난한 조합' : '<em>배울 게 많은</em> 조합'}</h2>
      <p class="lead">${esc(g.mbti.text)}</p>`));
  }

  cards.push(card('올해 두 사람', `
    <h2>${esc(g.yearLine.split('. ')[0])}.</h2>
    <p>${esc(g.yearLine.split('. ').slice(1).join('. '))}</p>`));

  cards.push(card('잘 지내는 법', `<h2>이것만 <em>기억</em>하세요</h2>
    <ol class="list3">${g.tips.map(t => `<li><span>${esc(t)}</span></li>`).join('')}</ol>
    <p class="hint">궁합은 정해진 답이 아니라 서로를 이해하는 실마리예요. 재미로 봐 주세요.</p>`));
  return cards;
}
