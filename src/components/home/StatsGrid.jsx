import React from 'react';
import { DEALERS, SIG } from '../../data/dealers';
import { REPS, ME } from '../../data/reps';
import { useAppState } from '../../state/AppStateContext';
import { fmtEur, sum, MONTH_NAME } from '../../utils/formatters';

export default function StatsGrid() {
  const { user, repFilter } = useAppState();
  const isManager = user?.isManager;

  const ds = isManager
    ? (repFilter ? DEALERS.filter(d => d.rep === repFilter) : DEALERS)
    : DEALERS.filter(d => d.rep === (user?.repId || ME));

  const totalSales = sum(ds.map(d => d.sales));
  const totalPrevSales = sum(ds.map(d => d.salesPrev));
  const visitsDone = ds.filter(d => d.visited).length;
  const visitsPlanned = ds.length;
  const critical = ds.filter(d => d.signal === 'critical').length;
  const avgPurch = ds.length ? (sum(ds.map(d => d.purch)) / ds.length) : 0;

  const stats = [
    { label: `${MONTH_NAME.toUpperCase()} SALES`, value: fmtEur(totalSales), sub: `vs ${fmtEur(totalPrevSales)} prev year`, bar: Math.min(100, (totalSales / totalPrevSales) * 100), color: totalSales >= totalPrevSales ? 'var(--green)' : 'var(--red)' },
    { label: 'VISITS COMPLETED', value: `${visitsDone}/${visitsPlanned}`, sub: `${visitsPlanned - visitsDone} remaining`, bar: (visitsDone / visitsPlanned) * 100, color: 'var(--ac)' },
    { label: 'CRITICAL DEALERS', value: critical, sub: `of ${ds.length} total dealers`, color: critical > 0 ? 'var(--red)' : 'var(--green)' },
    { label: 'AVG PURCHASE TREND', value: `${avgPurch > 0 ? '+' : ''}${avgPurch.toFixed(1)}%`, sub: 'year-on-year', color: avgPurch >= 0 ? 'var(--green)' : 'var(--red)' },
  ];

  return (
    <div className="stats">
      {stats.map((s, i) => (
        <div key={i} className="card stat">
          <div className="sl">{s.label}</div>
          <div className="sv" style={{ color: s.color }}>{s.value}</div>
          <div className="ss">{s.sub}</div>
          {s.bar != null && (
            <div className="bar">
              <div style={{ width: `${Math.min(100, s.bar)}%`, background: s.color }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
