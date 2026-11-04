export const TOPICS = ['Stock', 'Delivery', 'PL24', 'Parts Basket', 'Trade Oil', 'Timing Chain Kits', 'Consumables', 'BWIR Principles', 'Local Campaigns', 'Resource', 'Focus Customers', 'MUI', 'Marketing', 'Competition', 'Pricing', 'Reporting', 'NSC Campaign', 'Other'];

export const TOPIC_IC = {
  Stock: 'box',
  Delivery: 'truck',
  PL24: 'tool',
  'Parts Basket': 'box',
  'Trade Oil': 'tool',
  'Timing Chain Kits': 'tool',
  Consumables: 'box',
  'BWIR Principles': 'doc',
  'Local Campaigns': 'mega',
  Resource: 'users',
  'Focus Customers': 'target',
  MUI: 'alert',
  Marketing: 'tag',
  Competition: 'users',
  Pricing: 'euro',
  Reporting: 'doc',
  'NSC Campaign': 'mega',
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
  'Resources',
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
