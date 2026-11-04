export const pad = (n) => String(n).padStart(2, '0');

export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const NOW = new Date();
export const TODAY = iso(NOW);
export const MONTH_START = TODAY.slice(0, 8) + '01';
export const DAY_IDX = NOW.getDate() - 1;
export const MONTH_NAME = NOW.toLocaleDateString('en-GB', { month: 'long' });
export const MONTH_YEAR = NOW.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

export const addDays = (s, n) => {
  const d = new Date(s + 'T12:00');
  d.setDate(d.getDate() + n);
  return iso(d);
};

export const diffDays = (a, b) =>
  Math.round((new Date(a + 'T12:00') - new Date(b + 'T12:00')) / 864e5);

export const fmtD = (s) =>
  new Date(s + 'T12:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

export const fmtLong = (s) =>
  new Date(s + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export const fmtDM = (s) =>
  new Date(s + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export const nowT = () => pad(new Date().getHours()) + ':' + pad(new Date().getMinutes());

export const ago = (s) => {
  const n = diffDays(TODAY, s);
  return n <= 0 ? 'today' : n === 1 ? 'yesterday' : n + ' days ago';
};

export const esc = (t) =>
  String(t == null ? '' : t)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const fmtEur = (n) => '€' + (n / 1000).toFixed(1) + 'K';

export const sgn = (n, dp = 1) =>
  (n > 0.049 ? '+' : n < -0.049 ? '−' : '') + Math.abs(n).toFixed(dp);

export const dCls = (n) => (n > 0.049 ? 'up' : n < -0.049 ? 'dn' : 'fl');

export const arw = (n) => (n > 0.049 ? '▲' : n < -0.049 ? '▼' : '–');

export const yoyCol = (n) => (n > 0 ? 'var(--green)' : n < 0 ? 'var(--red)' : 'var(--ink)');

export const sum = (a) => a.reduce((x, y) => x + y, 0);

export const fmtClock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return pad(Math.floor(s / 60)) + ':' + pad(s % 60);
};

export const fmtK = (n) => {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
};

export const fmtPct = (n) => (n > 0 ? '+' : '') + n.toFixed(1) + '%';

export const delta = (cur, prev) => {
  if (!prev) return { label: '—', dir: 'fl' };
  const pct = ((cur - prev) / prev * 100).toFixed(1);
  const dir = cur >= prev ? 'up' : 'dn';
  return { label: (cur >= prev ? '+' : '') + pct + '%', dir };
};
