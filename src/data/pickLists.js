export const TOPICS = ['Stock', 'Delivery', 'PL24', 'AOS', 'Marketing', 'Competition', 'Pricing', 'Reporting', 'Q4 Campaign', 'Other'];

export const TOPIC_IC = {
  Stock: 'box',
  Delivery: 'truck',
  PL24: 'tool',
  AOS: 'mega',
  Marketing: 'tag',
  Competition: 'users',
  Pricing: 'euro',
  Reporting: 'doc',
  'Q4 Campaign': 'mega',
  Other: 'dots',
};

export const CHALLENGES = [
  'Stock shortages',
  'Competitive pressure',
  'Pricing concerns',
  'Training needs',
  'CRM burden',
  'Delivery delays',
  'Budget constraints',
  'Seasonal slowdown',
];

export const OPPS = [
  'Fleet renewal',
  'Accessories bundle',
  'Maintenance restock',
  'Campaign qualification',
  'New account',
  'Warranty upsell',
  'Volume discount',
];

export const TOOLS_OPTS = ['Using well', 'Needs help', 'Not using'];

export const STATUSES = ['Good', 'Monitor', 'Needs Support'];

export const PRIOS = ['High', 'Medium', 'Low'];

export const statusStyle = (s) =>
  s === 'Good'
    ? { c: '#11834A', bg: '#E8F7EF' }
    : s === 'Monitor'
      ? { c: '#A35F00', bg: '#FFF4DC' }
      : { c: '#C8283C', bg: '#FDECEE' };

export const toolStyle = (s) =>
  s === 'Using well'
    ? { c: '#11834A', bg: '#E8F7EF' }
    : s === 'Needs help'
      ? { c: '#A35F00', bg: '#FFF4DC' }
      : { c: '#C8283C', bg: '#FDECEE' };

export const prioStyle = (s) =>
  s === 'High'
    ? { c: '#C8283C', bg: '#FDECEE' }
    : s === 'Medium'
      ? { c: '#A35F00', bg: '#FFF4DC' }
      : { c: '#3D4A5C', bg: '#F0F2F7' };

export const statusLbl = (s) => (s === 'Needs Support' ? 'Needs support' : s);
