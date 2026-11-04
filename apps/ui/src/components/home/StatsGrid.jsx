import React from 'react';
import { REPS, ME } from '../../data/reps';
import { useAppState } from '../../state/AppStateContext';
import { fmtEur, sum, sgn, dCls, arw, yoyCol, MONTH_NAME } from '../../utils/formatters';
import { Icon } from '../primitives/Icon';

export default function StatsGrid() {
  const { user, repFilter, dealers, dealerVisitStatus } = useAppState();
  const isManager = user?.isManager;
  const repId = user?.repId || ME;
  const rep = REPS[repId];

  const ds = isManager
    ? (repFilter ? dealers.filter(d => d.rep === repFilter) : dealers)
    : dealers.filter(d => d.rep === repId);

  if (isManager) {
    const total = ds.length;
    const repCount = Object.keys(REPS).length;
    const visited = ds.filter(d => {
      const vs = dealerVisitStatus?.[d.code];
      return vs?.status === 'submitted' || d.visited;
    }).length;
    const visitPct = total ? Math.round((visited / total) * 100) : 0;

    return (
      <div className="stats">
        <div className="card stat">
          <div className="sl">TOTAL DEALERS</div>
          <div className="sv">{total}</div>
          <div className="ss">Across {repCount} sales reps</div>
        </div>
        <div className="card stat">
          <div className="sl">DEALERS VISITED</div>
          <div className="sv">
            {visited}<span style={{ fontSize: 18, fontWeight: 500, color: 'var(--dim)' }}> / {total}</span>
          </div>
          <div className="ss">{visitPct}% visited in {MONTH_NAME}</div>
          <div className="bar"><div style={{ width: `${visitPct}%` }} /></div>
        </div>
      </div>
    );
  }

  const totalSales = sum(ds.map(d => d.sales || 0));
  const totalPrevSales = sum(ds.map(d => d.salesPrev || 0));
  const salesDelta = totalPrevSales ? ((totalSales - totalPrevSales) / totalPrevSales * 100) : 0;

  const weightedPurch = totalSales ? sum(ds.map(d => (d.purch || 0) * (d.sales || 0))) / totalSales : 0;
  const weightedPurchPrev = totalPrevSales ? sum(ds.map(d => (d.purchPrev || 0) * (d.salesPrev || 0))) / totalPrevSales : 0;
  const avgCust = ds.length ? sum(ds.map(d => d.cust || 0)) / ds.length : 0;
  const avgCustPrev = ds.length ? sum(ds.map(d => d.custPrev || 0)) / ds.length : 0;

  const purchDelta = weightedPurch - weightedPurchPrev;
  const custDelta = avgCust - avgCustPrev;

  const aCount = ds.filter(d => d.abc === 'A').length;
  const bCount = ds.filter(d => d.abc === 'B').length;
  const cCount = ds.filter(d => d.abc === 'C').length;
  const movedUp = ds.filter(d => d.abcPrev && d.abc < d.abcPrev).length;
  const movedDown = ds.filter(d => d.abcPrev && d.abc > d.abcPrev).length;

  const abcDelta = [];
  if (movedUp > 0) abcDelta.push(<span key="up" style={{ color: 'var(--green)' }}>▲ {movedUp} moved up</span>);
  if (movedUp > 0 && movedDown > 0) abcDelta.push(' · ');
  if (movedDown > 0) abcDelta.push(<span key="dn" style={{ color: 'var(--red)' }}>▼ {movedDown} moved down</span>);
  if (!movedUp && !movedDown) abcDelta.push('– no change');

  const visitsDone = ds.filter(d => {
    const vs = dealerVisitStatus?.[d.code];
    return vs?.status === 'submitted';
  }).length;
  const visitsPlanned = ds.length;
  const visitPct = visitsPlanned ? Math.round((visitsDone / visitsPlanned) * 100) : 0;

  return (
    <>
      <div className="tk-cap">
        <Icon name="target" size={14} color="var(--dim)" />
        <span>Your territory · {rep?.territory} · {ds.length} dealers</span>
      </div>

      <div className="card tk">
        <div>
          <div className="kl">Sales</div>
          <div className="kv" style={{ fontSize: 22 }}>{fmtEur(totalSales)}</div>
          <div className={`kd ${dCls(salesDelta)}`}>{arw(salesDelta)} {sgn(salesDelta)}%</div>
        </div>
        <div>
          <div className="kl">Purchase YoY</div>
          <div className="kv" style={{ fontSize: 22, color: yoyCol(weightedPurch) }}>{sgn(weightedPurch)}%</div>
          <div className={`kd ${dCls(purchDelta)}`}>{arw(purchDelta)} {sgn(purchDelta)} pp</div>
        </div>
        <div>
          <div className="kl">Customer YoY</div>
          <div className="kv" style={{ fontSize: 22, color: yoyCol(avgCust) }}>{sgn(avgCust)}%</div>
          <div className={`kd ${dCls(custDelta)}`}>{arw(custDelta)} {sgn(custDelta)} pp</div>
        </div>
        <div>
          <div className="kl">ABC segment mix</div>
          <div className="kv" style={{ minHeight: 30 }}>
            {['A', 'B', 'C'].map(k => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span className={`abc abc-${k}`} style={{ width: 20, height: 20, fontSize: 11, borderRadius: 6 }}>{k}</span>
                <span style={{ fontSize: 16 }}>{k === 'A' ? aCount : k === 'B' ? bCount : cCount}</span>
              </span>
            ))}
          </div>
          <div className="kd fl" style={{ fontWeight: 600 }}>{abcDelta}</div>
        </div>
      </div>

      <div className="stats">
        <div className="card stat">
          <div className="sl">TOTAL VISITS</div>
          <div className="sv">{visitsPlanned}</div>
          <div className="ss">Planned in {MONTH_NAME}</div>
        </div>
        <div className="card stat">
          <div className="sl">VISITS COMPLETED</div>
          <div className="sv">
            {visitsDone}<span style={{ fontSize: 18, fontWeight: 500, color: 'var(--dim)' }}> / {visitsPlanned}</span>
          </div>
          <div className="ss">{visitPct}% of plan complete</div>
          <div className="bar"><div style={{ width: `${visitPct}%` }} /></div>
        </div>
      </div>
    </>
  );
}
