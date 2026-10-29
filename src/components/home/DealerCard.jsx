import React from 'react';
import { Icon } from '../primitives/Icon';
import { useAppState, useAppDispatch } from '../../state/AppStateContext';
import { REPS } from '../../data/reps';
import { SIG, ABC_RANK } from '../../data/dealers';
import { useIsMobile } from '../../hooks/useIsMobile';
import { fmtEur, fmtDM, sgn, dCls, arw, yoyCol, MONTH_NAME, TODAY } from '../../utils/formatters';

function abcDelta(abc, abcPrev) {
  if (!abcPrev || abc === abcPrev) return { t: '– no change', c: 'fl' };
  const x = (ABC_RANK[abc] || 0) - (ABC_RANK[abcPrev] || 0);
  return x > 0 ? { t: `▲ from ${abcPrev}`, c: 'up' } : { t: `▼ from ${abcPrev}`, c: 'dn' };
}

function MiniKpis({ d }) {
  const sd = d.salesPrev ? (d.sales - d.salesPrev) / d.salesPrev * 100 : 0;
  const pd = (d.purch || 0) - (d.purchPrev || 0);
  const cd = (d.cust || 0) - (d.custPrev || 0);
  const ab = abcDelta(d.abc, d.abcPrev);

  const chip = (label, val, delta, cls) => (
    <span className="mk">
      <span className="mkl">{label}</span>
      <b>{val}</b>
      <span className={`kd ${cls}`}>{delta}</span>
    </span>
  );

  return (
    <>
      {chip('Sales', fmtEur(d.sales || 0), `${arw(sd)} ${sgn(sd)}%`, dCls(sd))}
      {chip('Purchase YoY',
        <span style={{ color: yoyCol(d.purch || 0) }}>{sgn(d.purch || 0)}%</span>,
        `${arw(pd)} ${sgn(pd)} pp`, dCls(pd))}
      {chip('Customer YoY',
        <span style={{ color: yoyCol(d.cust || 0) }}>{sgn(d.cust || 0)}%</span>,
        `${arw(cd)} ${sgn(cd)} pp`, dCls(cd))}
      {chip('ABC',
        <span className={`abc abc-${d.abc}`} style={{ width: 18, height: 18, fontSize: 11, borderRadius: 5 }}>{d.abc}</span>,
        ab.t, ab.c)}
    </>
  );
}

function DealerKpis({ d }) {
  const sd = d.salesPrev ? (d.sales - d.salesPrev) / d.salesPrev * 100 : 0;
  const pd = (d.purch || 0) - (d.purchPrev || 0);
  const cd = (d.cust || 0) - (d.custPrev || 0);
  const ab = abcDelta(d.abc, d.abcPrev);

  return (
    <div className="kpis">
      <div className="kpi">
        <div className="kl">Sales</div>
        <div className="kv">{fmtEur(d.sales || 0)}</div>
        <div className={`kd ${dCls(sd)}`}>{arw(sd)} {sgn(sd)}%</div>
      </div>
      <div className="kpi">
        <div className="kl">Purchase YoY</div>
        <div className="kv" style={{ color: yoyCol(d.purch || 0) }}>{sgn(d.purch || 0)}%</div>
        <div className={`kd ${dCls(pd)}`}>{arw(pd)} {sgn(pd)} pp</div>
      </div>
      <div className="kpi">
        <div className="kl">Customer YoY</div>
        <div className="kv" style={{ color: yoyCol(d.cust || 0) }}>{sgn(d.cust || 0)}%</div>
        <div className={`kd ${dCls(cd)}`}>{arw(cd)} {sgn(cd)} pp</div>
      </div>
      <div className="kpi">
        <div className="kl">ABC segment</div>
        <div className="kv"><span className={`abc abc-${d.abc}`}>{d.abc}</span></div>
        <div className={`kd ${ab.c}`}>{ab.t}</div>
      </div>
    </div>
  );
}

export default function DealerCard({ dealer, onViewReport }) {
  const { openDealerIds, user, dealerVisitStatus } = useAppState();
  const dispatch = useAppDispatch();
  const mobile = useIsMobile();
  const d = dealer;
  const open = openDealerIds.includes(d.id);
  const rep = REPS[d.rep];
  const sig = SIG[d.signal] || SIG.watch;
  const isManager = user?.isManager;
  const mon = MONTH_NAME.slice(0, 3);

  const vs = dealerVisitStatus?.[d.code];
  const isDraft = vs?.status === 'draft';
  const isSubmitted = vs?.status === 'submitted';
  const visitDateLabel = vs?.visitDate === TODAY ? 'TODAY' : vs?.visitDate ? fmtDM(vs.visitDate).toUpperCase() : '';
  const isNewReport = isManager && isSubmitted && !vs?.managerViewed;

  const visitStatusText = isSubmitted ? `Visited ${visitDateLabel.toLowerCase()}` : d.visited ? 'Visited' : `Not visited in ${mon}`;
  const visitStatusColor = isSubmitted ? 'var(--green)' : d.visited ? 'var(--green)' : (d.signal === 'critical' ? '#C8283C' : '#A35F00');

  function handleViewReport(e) {
    e.stopPropagation();
    if (onViewReport) onViewReport(d);
  }

  const repButton = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button className="btn pri sm" onClick={e => { e.stopPropagation(); dispatch({ type: 'SELECT_DEALER', dealer: d }); }}>
        <Icon name={isDraft ? 'edit' : 'pin'} size={14} color="#fff" />
        {isDraft ? 'Resume visit' : 'Start visit'}
      </button>
      {isSubmitted && (
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Visited {visitDateLabel}
        </span>
      )}
    </div>
  );

  const mgrButton = isSubmitted ? (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button className="btn pri sm" onClick={handleViewReport}>
        <Icon name="doc" size={14} color="#fff" />
        View report
      </button>
      {isNewReport && (
        <span className="pill" style={{ background: 'var(--ac)', color: '#fff', fontSize: 9, padding: '1px 7px' }}>
          New report
        </span>
      )}
    </div>
  ) : null;

  return (
    <article className={`card dc${open ? ' open' : ''}`}>
      {/* Header row */}
      <div className={`dc-row${isManager ? '' : ' rp'}`} onClick={() => dispatch({ type: 'TOGGLE_DEALER', id: d.id })}>
        <div className="dc-id">
          <div className="dot" style={{ background: sig.c, width: 10, height: 10 }} />
          <div style={{ minWidth: 0 }}>
            <div className="dc-name">
              {d.name}
              <span className="pill" style={{ background: sig.bg, color: sig.c }}>{sig.l}</span>
            </div>
            <div className="dc-sub">{d.code}{d.contact !== '—' ? ` · ${d.contact}${d.ctitle ? `, ${d.ctitle}` : ''}` : ''}</div>
          </div>
        </div>

        <div className="dc-meta">
          <div className="m">
            <span className="ml">Last visit</span>
            <span className="mv">{d.visited ? 'Visited' : 'No visit yet'}</span>
          </div>
          {isManager && rep && (
            <div className="m">
              <span className="ml">Visited by</span>
              <span className="mv">
                <div className="ava" style={{ width: 18, height: 18, fontSize: 8, background: rep.color }}>{rep.ini}</div>
                {rep.name}
              </span>
            </div>
          )}
          <div className="m">
            <span className="ml">Visit status</span>
            <span className="mv" style={{ color: visitStatusColor, fontWeight: 600 }}>{visitStatusText}</span>
          </div>
        </div>

        <div className="dc-act">
          {!mobile && (isManager ? mgrButton : repButton)}
          <button className="chev" onClick={e => { e.stopPropagation(); dispatch({ type: 'TOGGLE_DEALER', id: d.id }); }}>
            <Icon name="chev" size={16} color="var(--sub)" />
          </button>
        </div>
      </div>

      {/* Collapsed: mini KPI chips */}
      {!open && (
        <div className="mks">
          <MiniKpis d={d} />
        </div>
      )}

      {/* Expanded: full KPI grid + footer */}
      {open && (
        <>
          <DealerKpis d={d} />
          {mobile && (
            <div className="dc-cta-m">
              {isManager ? (
                isSubmitted && (
                  <>
                    <button className="btn pri sm" onClick={handleViewReport}>
                      <Icon name="doc" size={14} color="#fff" />
                      View report
                    </button>
                    {isNewReport && (
                      <span className="pill" style={{ background: 'var(--ac)', color: '#fff', fontSize: 9, padding: '1px 7px', marginTop: 4 }}>
                        New report
                      </span>
                    )}
                  </>
                )
              ) : (
                <>
                  <button className="btn pri sm" onClick={e => { e.stopPropagation(); dispatch({ type: 'SELECT_DEALER', dealer: d }); }}>
                    <Icon name={isDraft ? 'edit' : 'pin'} size={14} color="#fff" />
                    {isDraft ? 'Resume visit' : 'Start visit'}
                  </button>
                  {isSubmitted && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Visited {visitDateLabel}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </article>
  );
}
