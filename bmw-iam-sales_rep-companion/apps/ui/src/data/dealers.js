export const SIG = {
  critical: { l: 'Critical', c: '#C8283C', bg: '#FDECEE', r: 0 },
  watch:    { l: 'Watch',    c: '#A35F00', bg: '#FFF4DC', r: 1 },
  positive: { l: 'Improving', c: '#11834A', bg: '#E8F7EF', r: 2 },
};

export const ABC_RANK = { A: 3, B: 2, C: 1 };

export const MARCUS_DEALER_CODES = [
  '23100', '10581', '33512', '16258', '11107', '16215', '16285', '25025',
];

export const REP_DEALER_MAP = {
  ms: MARCUS_DEALER_CODES,
  manager: MARCUS_DEALER_CODES,
};

function findBestMonth(purchaseRvt, saleRvt) {
  for (const m of ['M3', 'M2', 'M1']) {
    const pHas = purchaseRvt?.[`${m}_AchvPct`] != null || purchaseRvt?.[`${m}_Target`] != null;
    const sHas = saleRvt?.[`${m}_AchvPct`] != null || saleRvt?.[`${m}_Target`] != null;
    if (pHas || sHas) {
      const names = ['', 'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const idx = m === 'M1' ? 1 : m === 'M2' ? 2 : 3;
      const now = new Date();
      const mi = now.getMonth() + 1 - (3 - idx);
      return { month: m, monthName: names[mi > 0 ? mi : mi + 12] || m, purchaseRvt, saleRvt };
    }
  }
  return { month: 'M2', monthName: '', purchaseRvt, saleRvt };
}

function deriveSignal(yoyGrowth, revenueVsTarget, customerYoY) {
  const yoy = yoyGrowth ?? 0;
  const rvt = revenueVsTarget ?? 0;
  const cust = customerYoY ?? 0;
  if (yoy < -15 || rvt < -20 || cust < -15) return 'critical';
  if (yoy < 0 || rvt < 0 || cust < 0) return 'watch';
  return 'positive';
}

export function normalizeDealerFromApi(raw, repId = 'ms') {
  const kpis        = raw.kpis || {};
  const abc         = kpis.abc_segmentation           || {};
  const purchaseRvt = kpis.purchase_revenue_vs_target || {};
  const saleRvt     = kpis.sale_revenue_vs_target     || {};
  const legacyRvt   = kpis.revenue_vs_target          || {};
  const ryoy        = kpis.revenue_yoy                || {};
  const yoyComp     = kpis.yoy_comparison             || {};
  const momDecline  = kpis.mom_decline                || {};
  const custTrend   = kpis.customer_trend             || {};
  const compCust    = kpis.comp_customer_count        || {};

  const { month } = findBestMonth(purchaseRvt, saleRvt);
  const mKey = `${month}_AchvPct`;
  const mActualKey = `${month}_Actual`;
  const mTargetKey = `${month}_Target`;

  const hasPurchaseData = purchaseRvt?.[mKey] != null || purchaseRvt?.[mTargetKey] != null;
  const hasSaleData     = saleRvt?.[mKey] != null || saleRvt?.[mTargetKey] != null;
  const rvt             = hasPurchaseData ? purchaseRvt : hasSaleData ? saleRvt : legacyRvt;

  let revenueVsTarget = null;
  if (rvt?.[mKey] != null) {
    revenueVsTarget = rvt[mKey] - 100;
  } else if (rvt?.[mActualKey] != null && rvt?.[mTargetKey] != null && rvt[mTargetKey] !== 0) {
    revenueVsTarget = (rvt[mActualKey] / rvt[mTargetKey] - 1) * 100;
  }

  let yoyGrowth = ryoy.sales_growth_decline_pct != null ? ryoy.sales_growth_decline_pct : null;
  const cyRevenue = ryoy.cy_revenue_eur || 0;
  const lyRevenue = ryoy.ly_revenue_eur || 0;

  let partsYoY = null;
  const yoyVals = Object.values(yoyComp).map(v => parseFloat(v)).filter(v => !isNaN(v) && isFinite(v));
  if (yoyVals.length > 0) {
    const sorted = [...yoyVals].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    partsYoY = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  let customerYoY = null;
  let cyCustomerCount = null;
  let lyCustomerCount = null;
  if (compCust.current_month_customer_count != null) {
    cyCustomerCount = compCust.current_month_customer_count;
    lyCustomerCount = compCust.last_year_same_month_customer_count ?? null;
    if (compCust.growth_degrowth_pct != null) {
      customerYoY = Math.round(compCust.growth_degrowth_pct * 10) / 10;
    } else if (lyCustomerCount != null && lyCustomerCount !== 0) {
      customerYoY = Math.round((cyCustomerCount / lyCustomerCount - 1) * 100 * 10) / 10;
    }
  }

  const abcSegment = abc.segment || 'C';
  const signal = deriveSignal(yoyGrowth, revenueVsTarget, customerYoY);
  const dealerCode = raw.dealer_code || '';

  return {
    id: dealerCode,
    rep: repId,
    name: raw.dealer_name || `Dealer ${dealerCode}`,
    code: dealerCode,
    contact: '—',
    ctitle: '',
    signal,
    lastDays: 0,
    visited: false,
    time: '',
    sales: cyRevenue,
    salesPrev: lyRevenue,
    purch: partsYoY != null ? Math.round(partsYoY * 10) / 10 : 0,
    purchPrev: 0,
    cust: customerYoY ?? 0,
    custPrev: 0,
    abc: abcSegment,
    abcPrev: abcSegment,
    revenueVsTarget,
    yoyGrowth,
    cyCustomerCount,
    lyCustomerCount,
    country: abc.country || '—',
  };
}

export const dealerById = (id, dealers) => dealers.find(d => d.id === id);
