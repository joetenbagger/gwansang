// util.js — 화면 공용 도우미
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const fmt = (v, d = 2) => (Math.round(v * 10 ** d) / 10 ** d).toFixed(d);
export const tok = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
export const pct = v => `${Math.round(v * 100)}%`;
