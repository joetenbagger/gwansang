// invite.js — 궁합 초대 링크: 보내는 사람의 정보를 주소 뒤(#)에 담습니다.
// 서버로 가지 않고(# 뒤는 서버에 전달되지 않음) 받은 사람의 브라우저에서만 읽습니다.
// 암호화는 아니므로, 링크를 받은 사람은 보낸 사람의 생년월일을 알 수 있습니다(화면에서 안내).
import { TYPES } from './mbti.js?v=15';
import { PLACES } from './saju/calendar.js?v=15';

const PREFIX = 'g1.';

function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s) {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(pad);
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}

/** 보낼 사람(나)의 계산용 입력값(toCalcInput 결과 + name, mbti) → 링크 토큰 */
export function encodeInvite(v, rel) {
  const hour = v.hour == null ? null : +v.hour, minute = +(v.minute || 0);
  const data = {
    n: (v.name || '').slice(0, 12), g: v.gender === 'F' ? 'F' : 'M', c: v.calendar === 'lunar' ? 'L' : 'S', l: v.leap ? 1 : 0,
    y: +v.year, m: +v.month, d: +v.day, h: hour, i: minute, p: v.place || 'seoul', z: v.ziMode === 'same' ? 's' : 'p',
    b: v.mbti || '', r: rel || 'friend',
  };
  return PREFIX + b64urlEncode(JSON.stringify(data));
}

/** 링크 토큰 → 검증된 데이터 (잘못된 링크면 null) */
export function decodeInvite(token) {
  try {
    if (!token || !token.startsWith(PREFIX)) return null;
    const o = JSON.parse(b64urlDecode(token.slice(PREFIX.length)));
    const now = new Date().getFullYear();
    const int = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
    if (!int(o.y, 1900, now) || !int(o.m, 1, 12) || !int(o.d, 1, 31)) return null;
    if (o.h != null && !int(o.h, 0, 23)) return null;
    if (o.i != null && !int(o.i, 0, 59)) return null;
    return {
      name: String(o.n || '').replace(/[<>"&]/g, '').slice(0, 12),
      gender: o.g === 'F' ? 'F' : 'M',
      calendar: o.c === 'L' ? 'lunar' : 'solar',
      leap: o.l === 1,
      year: o.y, month: o.m, day: o.d,
      hour: o.h == null ? null : o.h, minute: o.i || 0,
      place: PLACES.some(p => p.id === o.p) ? o.p : 'seoul',
      ziMode: o.z === 's' ? 'same' : 'split',
      mbti: TYPES.includes(o.b) ? o.b : null,
      rel: ['lover', 'friend', 'work'].includes(o.r) ? o.r : 'friend',
    };
  } catch { return null; }
}

export function inviteUrl(token) {
  const base = location.origin + location.pathname.replace(/index\.html$/, '');
  return `${base}#${token}`;
}

export function readInviteFromLocation() {
  const h = location.hash.replace(/^#/, '');
  return h.startsWith(PREFIX) ? decodeInvite(h) : null;
}
