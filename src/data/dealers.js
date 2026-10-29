export const SIG = {
  critical: { l: 'Critical', c: '#C8283C', bg: '#FDECEE', r: 0 },
  watch:    { l: 'Watch',    c: '#A35F00', bg: '#FFF4DC', r: 1 },
  positive: { l: 'Improving', c: '#11834A', bg: '#E8F7EF', r: 2 },
};

export const ABC_RANK = { A: 3, B: 2, C: 1 };

export const DEALERS = [
  { id: 'g1r', rep: 'ms', name: 'Group 1 Reading',      code: 'GB-R-4821',  contact: 'James Fletcher',  ctitle: 'Parts Manager',    signal: 'critical', lastDays: 14, visited: true,  time: '11:20', sales: 48300, salesPrev: 50300, purch: -31.4, purchPrev: -27.8, cust: -26.2, custPrev: -23.0, abc: 'B', abcPrev: 'A' },
  { id: 'hj',  rep: 'ms', name: 'Halliwell Jones BMW',  code: 'GB-C-3301',  contact: 'Sarah Knowles',   ctitle: 'Parts Director',   signal: 'watch',    lastDays: 8,  visited: true,  time: '14:05', sales: 72100, salesPrev: 74800, purch: -12.9, purchPrev: -10.4, cust: -8.1,  custPrev: -6.6,  abc: 'B', abcPrev: 'B' },
  { id: 'syn', rep: 'ms', name: 'Sytner Birmingham',    code: 'GB-B-1144',  contact: 'Mohammed Patel',  ctitle: 'Parts Manager',    signal: 'positive', lastDays: 21, visited: true,  time: '10:15', sales: 91400, salesPrev: 88900, purch: 7.6,   purchPrev: 5.9,   cust: 4.2,   custPrev: 3.1,   abc: 'A', abcPrev: 'A' },
  { id: 'end', rep: 'ms', name: 'Endeavour BMW',        code: 'GB-M-7702',  contact: 'Peter Walsh',     ctitle: 'Parts Manager',    signal: 'critical', lastDays: 21, visited: false, time: '15:40', sales: 41200, salesPrev: 43900, purch: -24.8, purchPrev: -21.2, cust: -19.4, custPrev: -17.9, abc: 'C', abcPrev: 'B' },
  { id: 'ry',  rep: 'ms', name: 'Rybrook BMW',          code: 'GB-L-5501',  contact: 'Gary Rhodes',     ctitle: 'Parts Director',   signal: 'watch',    lastDays: 11, visited: true,  time: '10:30', sales: 58300, salesPrev: 61100, purch: -16.2, purchPrev: -14.8, cust: -7.6,  custPrev: -6.1,  abc: 'B', abcPrev: 'B' },
  { id: 'li',  rep: 'ms', name: 'Listers BMW',          code: 'GB-CV-2204', contact: 'Claire Abbott',   ctitle: 'Parts Manager',    signal: 'positive', lastDays: 18, visited: true,  time: '13:15', sales: 83700, salesPrev: 81600, purch: 5.1,   purchPrev: 4.6,   cust: 6.8,   custPrev: 6.9,   abc: 'A', abcPrev: 'A' },
  { id: 'st',  rep: 'ms', name: 'Stratstone BMW',       code: 'GB-N-3301',  contact: 'Brian Nkosi',     ctitle: 'Parts Supervisor', signal: 'watch',    lastDays: 14, visited: true,  time: '09:50', sales: 67800, salesPrev: 69100, purch: -8.9,  purchPrev: -7.2,  cust: -4.2,  custPrev: -4.4,  abc: 'B', abcPrev: 'B' },
  { id: 'hen', rep: 'jb', name: 'Hendy BMW Exeter',     code: 'GB-EX-1101', contact: 'Helen Marsh',     ctitle: 'Parts Manager',    signal: 'positive', lastDays: 7,  visited: true,  time: '11:10', sales: 92400, salesPrev: 90100, purch: 3.9,   purchPrev: 2.2,   cust: 3.8,   custPrev: 3.1,   abc: 'A', abcPrev: 'A' },
  { id: 'sno', rep: 'jb', name: 'Snows BMW Southampton', code: 'GB-S-2201', contact: 'Tony Bale',       ctitle: 'Parts Director',   signal: 'watch',    lastDays: 12, visited: true,  time: '09:45', sales: 81200, salesPrev: 83800, purch: -2.6,  purchPrev: -1.1,  cust: -1.2,  custPrev: -0.3,  abc: 'A', abcPrev: 'A' },
  { id: 'bat', rep: 'jb', name: 'Bath BMW',             code: 'GB-BA-3301', contact: 'Sue Patel',       ctitle: 'Parts Manager',    signal: 'positive', lastDays: 9,  visited: true,  time: '16:40', sales: 71900, salesPrev: 68300, purch: 9.4,   purchPrev: 7.0,   cust: 8.1,   custPrev: 6.2,   abc: 'B', abcPrev: 'C' },
  { id: 'bri', rep: 'jb', name: 'BMW Bristol West',     code: 'GB-BR-4401', contact: 'Roy Atkins',      ctitle: 'Parts Supervisor', signal: 'watch',    lastDays: 18, visited: false, time: '10:00', sales: 61300, salesPrev: 64900, purch: -7.8,  purchPrev: -5.9,  cust: -3.3,  custPrev: -2.0,  abc: 'B', abcPrev: 'B' },
  { id: 'loo', rep: 'tk', name: 'Lookers BMW Leeds',    code: 'GB-Y-5501',  contact: 'Diane Marsh',     ctitle: 'Parts Manager',    signal: 'critical', lastDays: 28, visited: false, time: '14:30', sales: 38200, salesPrev: 46900, purch: -33.4, purchPrev: -26.1, cust: -22.4, custPrev: -17.5, abc: 'C', abcPrev: 'B' },
  { id: 'bow', rep: 'tk', name: 'Bowker BMW Preston',   code: 'GB-PR-6601', contact: 'Peter Shaw',      ctitle: 'Parts Director',   signal: 'critical', lastDays: 21, visited: false, time: '15:20', sales: 44100, salesPrev: 47600, purch: -21.3, purchPrev: -17.9, cust: -11.7, custPrev: -9.8,  abc: 'C', abcPrev: 'C' },
  { id: 'syl', rep: 'tk', name: 'Sytner Leeds',         code: 'GB-LS-7701', contact: 'Claire Wu',       ctitle: 'Parts Manager',    signal: 'watch',    lastDays: 14, visited: true,  time: '14:30', sales: 61800, salesPrev: 63600, purch: -8.3,  purchPrev: -6.0,  cust: -2.1,  custPrev: -1.5,  abc: 'B', abcPrev: 'B' },
  { id: 'she', rep: 'tk', name: 'BMW Sheffield',        code: 'GB-SH-8801', contact: 'Gary Moore',      ctitle: 'Parts Manager',    signal: 'watch',    lastDays: 16, visited: true,  time: '11:45', sales: 47300, salesPrev: 49800, purch: -15.7, purchPrev: -13.9, cust: -8.9,  custPrev: -8.1,  abc: 'C', abcPrev: 'C' },
  { id: 'jct', rep: 'tk', name: 'JCT600 BMW Bradford',  code: 'GB-BD-9901', contact: 'Priya Singh',     ctitle: 'Parts Manager',    signal: 'watch',    lastDays: 11, visited: true,  time: '13:00', sales: 55200, salesPrev: 56600, purch: -10.2, purchPrev: -8.4,  cust: -5.4,  custPrev: -4.5,  abc: 'B', abcPrev: 'B' },
];

export const dealerById = (id) => DEALERS.find((d) => d.id === id);
