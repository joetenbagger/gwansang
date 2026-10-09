// deck.js — 결과 카드 묶음. 고른 질문을 맨 앞(표지 다음)에 둡니다.
import { STEMS, BRANCHES, EL, ELEMENTS, GROUPS } from './saju/data.js?v=9';
import { NICK, TRAIT, STRENGTH_FRIENDLY, TOPICS, TOPIC_TITLE } from './copy.js?v=9';
import { esc } from './util.js?v=9';

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

function flowChart(saju) {
  const list = saju.daYun.slice(0, 9);
  if (!list.length) return '';
  const W = 320, H = 150, pad = { l: 8, r: 8, t: 20, b: 34 };
  const x = i => pad.l + (i + 0.5) * ((W - pad.l - pad.r) / list.length);
  const sc = list.map(d => Math.max(-4, Math.min(4, d.score)));
  const y = v => pad.t + (1 - (v + 4) / 8) * (H - pad.t - pad.b);
  const path = sc.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${path} L${x(sc.length - 1).toFixed(1)},${y(-4)} L${x(0).toFixed(1)},${y(-4)} Z`;
  return `<svg class="flow" viewBox="0 0 ${W} ${H}" role="img" aria-label="대운 흐름">
    <line x1="${pad.l}" x2="${W - pad.r}" y1="${y(0)}" y2="${y(0)}" stroke="var(--rule)" stroke-dasharray="3 3"/>
    <path d="${area}" fill="var(--seal)" fill-opacity=".08"/>
    <path d="${path}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/>
    ${list.map((d, i) => `<circle cx="${x(i)}" cy="${y(sc[i])}" r="${d.current ? 6 : 3.5}" fill="${d.current ? 'var(--seal)' : 'var(--paper-2)'}" stroke="${d.current ? 'var(--seal)' : 'var(--ink)'}" stroke-width="1.5"/>
      <text x="${x(i)}" y="${H - 18}" text-anchor="middle" font-size="11" fill="${d.current ? 'var(--seal)' : 'var(--ink-2)'}" font-weight="${d.current ? 700 : 400}">${d.startAge}</text>
      <text x="${x(i)}" y="${H - 4}" text-anchor="middle" font-size="12" font-family="Song Myung, serif" fill="var(--ink-2)">${d.stem}${d.branch}</text>
      ${d.current ? `<text x="${x(i)}" y="${y(sc[i]) - 11}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--seal)">지금</text>` : ''}`).join('')}
  </svg>`;
}

function card(id, kicker, body) {
  return { id, html: `<article class="card" data-card="${id}" aria-roledescription="카드">${kicker ? `<span class="kicker">${esc(kicker)}</span>` : ''}${body}</article>` };
}

function sectionCard(total, id, kicker, title) {
  const s = total.sections.find(x => x.id === id);
  return card(id, kicker, `<h2>${title}</h2><p class="lead">${esc(firstSentence(s.text))}</p><p>${esc(s.text.slice(firstSentence(s.text).length).trim())}</p>${but(s.caution)}`);
}

export function buildCards({ input, chart, saju, face, total, years, faceImage }) {
  const name = input.name || '';
  const dm = saju.dayStem;
  const dmEl = STEMS[dm].el;
  const cards = [];
  const topic = TOPICS.find(t => t.id === input.topic) || TOPICS[4];

  // 1. 표지
  cards.push(card('cover', name ? `${name}님의 팔자` : '나의 팔자', `
    <div class="bigglyph" data-el="${dmEl}"><span class="g">${dm}</span>
      <span class="meta"><b>${NICK[dm]}</b><span>${STEMS[dm].ko}${EL[dmEl].ko} 일간</span><span>${STRENGTH_FRIENDLY[saju.strength.key]}</span></span></div>
    <h2><em>${TRAIT[dm]}</em></h2>
    ${mini8(saju)}
    <p>${esc(saju.dayMaster.text.split('. ').slice(1, 3).join('. '))}${face ? ` 얼굴은 ${esc(face.result.face.primary.shape)}의 ${face.result.face.primary.name}(${face.result.face.primary.hanja})이에요.` : ''}</p>
    <p class="hint">옆으로 넘겨 보세요 →</p>`));

  // 2. 고른 질문
  const t = topic.id;
  const yr = years[0];
  if (t === 'year') {
    const cur = saju.daYun.find(d => d.current);
    cards.push(card('topic', `궁금했던 것 · ${topic.label}`, `
      <h2>${TOPIC_TITLE.year(name, yr.year)}</h2>
      <div class="yearrow"><div class="yh"><b>${yr.year} ${yr.stemKo}${yr.branchKo}년</b>${toneTag(yr.tone)}</div><p>${esc(yr.text)}</p>${but(yr.caution)}</div>
      ${cur ? `<div class="yearrow"><div class="yh"><b>지금 10년 · ${STEMS[cur.stem].ko}${BRANCHES[cur.branch].ko} 대운</b>${toneTag(cur.tone)}</div><p>${esc(cur.theme)}</p></div>` : ''}
      <div class="yearrow"><div class="yh"><b>${years[1].year} ${years[1].stemKo}${years[1].branchKo}년</b>${toneTag(years[1].tone)}</div><p>${esc(years[1].theme)}</p></div>`));
  } else if (t === 'love') {
    const s = total.sections.find(x => x.id === 'people');
    const peach = saju.shinsal.find(x => x.key === 'peach');
    const spouseStar = input.gender === 'F' ? saju.groups.find(g => g.id === 'gwanseong') : saju.groups.find(g => g.id === 'jaeseong');
    const starLine = { high: '사주에 배우자를 뜻하는 기운이 강해 인연이 일찍, 또는 자주 찾아오는 편이에요.', mid: '배우자를 뜻하는 기운이 알맞게 있어 인연이 자연스럽게 이어지는 편이에요.', low: '배우자를 뜻하는 기운이 약한 편이라 인연을 직접 찾아 나서야 잘 만나요.', none: '사주에 배우자를 뜻하는 기운이 잘 보이지 않아요. 늦게 만나거나, 운에서 들어올 때 인연이 생기는 편이에요.' }[spouseStar.level];
    cards.push(card('topic', `궁금했던 것 · ${topic.label}`, `
      <h2>${TOPIC_TITLE.love(name)}</h2>
      <p class="lead">${esc(starLine)}</p>
      <p>${esc(s.text)}</p>
      ${peach ? `<p>도화살이 있어 사람을 끄는 매력이 있어요. ${esc(peach.caution)}</p>` : ''}
      ${but(s.caution)}
      <p class="hint">${yr.year}년 흐름: ${TONE[yr.tone]} · ${esc(yr.god)}의 해</p>`));
  } else {
    const map = { money: 'money', work: 'work', self: 'nature' };
    const c = sectionCard(total, map[t], `궁금했던 것 · ${topic.label}`, TOPIC_TITLE[t](name, yr.year));
    c.id = 'topic';
    if (t === 'self') c.html = c.html.replace('</h2>', `</h2><p class="lead">${esc(saju.strength.text.split('. ')[0])}.</p>`);
    cards.push(c);
  }

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
      ${years.map(v => `<div class="yearrow"><div class="yh"><b>${v.year} ${v.stemKo}${v.branchKo}년</b>${toneTag(v.tone)}</div><p>${esc(v.text)}</p>${but(v.caution)}</div>`).join('')}`));
  }

  // 11. 대운 흐름
  const future = saju.daYun.filter(d => d.startYear >= new Date().getFullYear() - 9);
  const best = [...future].sort((a, b) => b.score - a.score)[0];
  const worst = [...future].sort((a, b) => a.score - b.score)[0];
  cards.push(card('flow', '인생의 큰 흐름', `
    <h2>${best ? `<em>${best.startAge}세</em>부터 10년이 가장 순해요` : '10년마다 바뀌는 큰 운'}</h2>
    ${flowChart(saju)}
    ${best ? `<p>${best.startYear}년부터 ${best.stem}${best.branch}(${STEMS[best.stem].ko}${BRANCHES[best.branch].ko}) 대운. ${esc(best.theme)}</p>` : ''}
    ${worst && worst !== best && worst.score < 0 ? but(`${worst.startAge}세 무렵 ${worst.stem}${worst.branch} 대운은 사주가 꺼리는 기운이 들어와요. ${worst.theme}`) : ''}
    <p class="hint">선이 위로 갈수록 사주에 필요한 기운이 들어오는 시기예요.</p>`));

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

  return cards;
}
