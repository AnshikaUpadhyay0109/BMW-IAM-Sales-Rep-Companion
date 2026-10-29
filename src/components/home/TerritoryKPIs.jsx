import React from 'react';
import { Icon } from '../primitives/Icon';
import { DEALERS } from '../../data/dealers';
import { REPS, ME } from '../../data/reps';
import { useAppState } from '../../state/AppStateContext';
import { fmtEur, sum, sgn, dCls, arw } from '../../utils/formatters';

export default function TerritoryKPIs() {
  const { user } = useAppState();
  const repId = user?.repId || ME;
  const ds = DEALERS.filter(d => d.rep === repId);

  const totalSales = sum(ds.map(d => d.sales));
  const avgPurch = ds.length ? sum(ds.map(d => d.purch)) / ds.length : 0;
  const avgCust = ds.length ? sum(ds.map(d => d.cust)) / ds.length : 0;
  const aCount = ds.filter(d => d.abc === 'A').length;
  const bCount = ds.filter(d => d.abc === 'B').length;
  const cCount = ds.filter(d => d.abc === 'C').length;

  const kpis = [
    { label: 'Total Sales', value: fmtEur(totalSales), icon: 'trend' },
    { label: 'Avg Purchase Trend', value: `${sgn(avgPurch)}%`, delta: avgPurch, icon: 'trend' },
    { label: 'Avg Customer Trend', value: `${sgn(avgCust)}%`, delta: avgCust, icon: 'users' },
    { label: 'ABC Split', value: `${aCount}A · ${bCount}B · ${cCount}C`, icon: 'target' },
  ];

  return (
    <div className="card tk">
      {kpis.map((k, i) => (
        <div key={i}>
          <div className="tk-cap"><Icon name={k.icon} size={13} />{k.label}</div>
          <div style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 6 }}>
            {k.value}
            {k.delta != null && <span className={`kd ${dCls(k.delta)}`}>{arw(k.delta)}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
