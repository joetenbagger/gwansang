import { esc } from './util.js?v=18';

// 카드와 전체 풀이가 같은 개인별 해석을 표시합니다. 모든 데이터 문자열은 escape합니다.
export function readingBody(r) {
  return `${r.lead ? `<p class="lead">${esc(r.lead)}</p>` : ''}
    ${r.text ? `<p>${esc(r.text)}</p>` : ''}
    ${r.caution ? `<p class="but"><span>다만</span>${esc(r.caution)}</p>` : ''}
    ${r.action ? `<p class="reading-action"><b>해 보면 좋은 것</b>${esc(r.action)}</p>` : ''}
    ${r.evidence ? `<p class="reading-basis">읽은 자리 · ${esc(r.evidence)}</p>` : ''}`;
}
