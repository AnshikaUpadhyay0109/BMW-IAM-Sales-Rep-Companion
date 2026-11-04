export function autoSummary(n) {
  const t = (n || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  const ss = t.match(/[^.!?]+[.!?]+/g) || [t];
  let o = ss.slice(0, 2).join(' ').trim();
  if (o.length > 240) {
    o = o.slice(0, 237).replace(/\s+\S*$/, '') + '…';
  }
  return o;
}

export const phImg = (l1, l2, col) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220">` +
      `<rect width="320" height="220" fill="#EEF0F5"/>` +
      `<rect x="26" y="22" width="268" height="176" rx="6" fill="#fff" stroke="#CBD1DD"/>` +
      `<rect x="26" y="22" width="268" height="44" rx="6" fill="${col}"/>` +
      `<text x="42" y="51" font-family="Arial" font-size="17" font-weight="700" fill="#fff">${l1}</text>` +
      `<text x="42" y="104" font-family="Arial" font-size="26" font-weight="700" fill="#0A0E1A">${l2}</text>` +
      `<rect x="42" y="124" width="190" height="8" rx="4" fill="#DDE1EA"/>` +
      `<rect x="42" y="142" width="150" height="8" rx="4" fill="#DDE1EA"/>` +
      `<rect x="42" y="168" width="82" height="18" rx="9" fill="${col}"/>` +
      `</svg>`
  );

export function downscale(src, cb) {
  const im = new Image();
  im.onload = () => {
    try {
      const m = 900;
      const sc = Math.min(1, m / Math.max(im.width, im.height));
      const c = document.createElement('canvas');
      c.width = Math.round(im.width * sc);
      c.height = Math.round(im.height * sc);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      cb(c.toDataURL('image/jpeg', 0.82));
    } catch (e) {
      cb(src);
    }
  };
  im.onerror = () => cb(null);
  im.src = src;
}
