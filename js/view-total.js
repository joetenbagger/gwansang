// view-total.js — 종합 풀이 화면
import { EL } from './saju/data.js?v=8';
import { esc } from './util.js?v=8';
import { caution } from './view-face.js?v=8';

const TONE = { good: ['순풍', 'good'], neutral: ['보통', 'neutral'], caution: ['주의', 'bad'] };

export function renderTotal(total, { hasFace, name }) {
  const L = total.lucky;
  return `
  <div class="verdict">
    <h2>${name ? `<em>${esc(name)}</em>님은 ` : ''}${esc(total.headline)}</h2>
    <p class="summary">${esc(total.summary)}</p>
  </div>

  ${total.match ? `<section class="block match" data-tone="${total.match.tone}">
    <h3>얼굴과 사주의 궁합 <small>相·命</small></h3>
    <p class="mtitle"><span class="pill ${TONE[total.match.tone][1]}">${TONE[total.match.tone][0]}</span> <b>${esc(total.match.title)}</b></p>
    <p>${esc(total.match.text)}</p>${caution(total.match.caution)}
  </section>` : (hasFace ? '' : `<p class="hint">사진을 넣으면 관상까지 함께 엮어서 풀이합니다.</p>`)}

  ${total.sections.map(s => `<section class="block">
    <h3>${esc(s.title)}</h3>
    <p>${esc(s.text)}</p>${caution(s.caution)}
  </section>`).join('')}

  <section class="block">
    <h3>올해와 내년</h3>
    <div class="years">${total.years.map(y => `<div class="yearcard" data-tone="${y.tone}">
      <div class="yhead"><b>${esc(y.title)}</b><span class="pill ${TONE[y.tone][1]}">${TONE[y.tone][0]}</span></div>
      <p>${esc(y.text)}</p>${caution(y.caution)}</div>`).join('')}</div>
  </section>

  <section class="block warnbox">
    <h3>꼭 기억할 조심할 점</h3>
    <ol>${total.cautions.map(c => `<li>${esc(c)}</li>`).join('')}</ol>
  </section>

  <section class="block">
    <h3>나에게 맞는 기운 <small>${L.hanja}</small></h3>
    <div class="lucky" data-el="${L.el}">
      <div><span class="lbl">오행</span><b>${L.ko}(${L.hanja}) · ${L.name}</b></div>
      <div><span class="lbl">색</span><b>${L.color}</b></div>
      <div><span class="lbl">방향</span><b>${L.direction}</b></div>
      <div><span class="lbl">숫자</span><b>${L.numbers}</b></div>
      <div><span class="lbl">계절</span><b>${L.season}</b></div>
    </div>
    <p class="fine">사주에 필요한 기운(용신)을 생활에서 가까이하라는 전통적인 권유입니다. 재미로만 참고하세요.</p>
  </section>`;
}
