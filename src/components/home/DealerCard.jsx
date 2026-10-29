import React from 'react';
import { Icon } from '../primitives/Icon';
import { useAppState, useAppDispatch } from '../../state/AppStateContext';
import { REPS } from '../../data/reps';
import { SIG } from '../../data/dealers';
import { SEED_REPORTS } from '../../data/seedReports';
import { useIsMobile } from '../../hooks/useIsMobile';
import { fmtEur, sgn, dCls, arw, ago, fmtD, TODAY, addDays } from '../../utils/formatters';

export default function DealerCard({ dealer }) {
  const { openDealerIds, user } = useAppState();
  const dispatch = useAppDispatch();
  const mobile = useIsMobile();
  const d = dealer;
  const open = openDealerIds.includes(d.id);
  const rep = REPS[d.rep];
  const sig = SIG[d.signal];
  const visitDate = addDays(TODAY, -d.lastDays);
  const hasReport = !!SEED_REPORTS[d.id];
  const isManager = user?.isManager;

  return (
    <div className={`card dc${open ? ' open' : ''}`}>
      <div className="dc-row" onClick={() => dispatch({ type: 'TOGGLE_DEALER', id: d.id })}>
        <div className="dc-id">
          <div className={`abc abc-${d.abc}`}>{d.abc}</div>
          <div>
            <div className="dc-name">
              {d.name}
              <span className="pill" style={{ background: sig.bg, color: sig.c }}>{sig.l}</span>
              {d.abcPrev !== d.abc && (
                <span className="pill" style={{ background: 'var(--ft)', color: 'var(--dim)', fontSize: 9 }}>
                  was {d.abcPrev}
                </span>
              )}
            </div>
            <div className="dc-sub">{d.code} · {d.contact}, {d.ctitle}</div>
          </div>
        </div>
        <div className="dc-meta">
          <div className="m">
            <span className="ml">Last visit</span>
            <span className="mv">
              {d.visited ? ago(visitDate) : <span className="dim">Not visited</span>}
            </span>
          </div>
          <div className="m">
            <span className="ml">Sales</span>
            <span className="mv">{fmtEur(d.sales)}</span>
          </div>
          {isManager && (
            <div className="m tg-name">
              <span className="ml">Rep</span>
              <span className="mv">
                <div className="ava" style={{ width: 18, height: 18, fontSize: 8, background: rep.color }}>{rep.ini}</div>
                {rep.first}
              </span>
            </div>
          )}
        </div>
        <div className="dc-act">
          <div className="dc-tags">
            {d.abc !== d.abcPrev && (
              <span className="pill s tg-band" style={{ background: sig.bg, color: sig.c }}>
                {d.abc} ← {d.abcPrev}
              </span>
            )}
          </div>
          <button className="chev" onClick={e => { e.stopPropagation(); dispatch({ type: 'TOGGLE_DEALER', id: d.id }); }}>
            <Icon name="chev" size={14} color="var(--dim)" />
          </button>
        </div>
      </div>

      {open && (
        <>
          <div className="mks">
            <span className="mk"><span className="mkl">Purchase</span> <b>{sgn(d.purch)}%</b> <span className={`kd ${dCls(d.purch)}`}>{arw(d.purch)}</span></span>
            <span className="mk"><span className="mkl">Customer</span> <b>{sgn(d.cust)}%</b> <span className={`kd ${dCls(d.cust)}`}>{arw(d.cust)}</span></span>
            <span className="mk"><span className="mkl">Sales</span> <b>{fmtEur(d.sales)}</b></span>
          </div>
          <div className="kpis">
            <div className="kpi">
              <div className="kl">Parts Purchases YoY</div>
              <div className="kv" style={{ color: d.purch >= 0 ? 'var(--green)' : 'var(--red)' }}>{sgn(d.purch)}%</div>
              <div className={`kd ${dCls(d.purch)}`}>{arw(d.purch)} prev {sgn(d.purchPrev)}%</div>
            </div>
            <div className="kpi">
              <div className="kl">Customer Trans. YoY</div>
              <div className="kv" style={{ color: d.cust >= 0 ? 'var(--green)' : 'var(--red)' }}>{sgn(d.cust)}%</div>
              <div className={`kd ${dCls(d.cust)}`}>{arw(d.cust)} prev {sgn(d.custPrev)}%</div>
            </div>
            <div className="kpi">
              <div className="kl">Monthly Sales</div>
              <div className="kv">{fmtEur(d.sales)}</div>
              <div className={`kd ${dCls(d.sales - d.salesPrev)}`}>vs {fmtEur(d.salesPrev)} prev</div>
            </div>
            <div className="kpi">
              <div className="kl">ABC Classification</div>
              <div className="kv"><span className={`abc abc-${d.abc}`} style={{ width: 20, height: 20, fontSize: 11 }}>{d.abc}</span></div>
              {d.abc !== d.abcPrev && <div className={`kd ${d.abc < d.abcPrev ? 'dn' : 'up'}`}>was {d.abcPrev}</div>}
            </div>
          </div>
          {d.visited && (
            <div className="dc-f">
              <div className="lv">
                <div className="m"><span className="ml">Visit date</span><span className="mv"><Icon name="cal" size={12} color="var(--dim)" />{fmtD(visitDate)}</span></div>
                <div className="m"><span className="ml">Time</span><span className="mv">{d.time}</span></div>
                <div className="m"><span className="ml">Contact</span><span className="mv">{d.contact}</span></div>
              </div>
              {SEED_REPORTS[d.id] && (
                <div className="sum">{SEED_REPORTS[d.id].summary.slice(0, 180)}...</div>
              )}
            </div>
          )}

          {/* Action buttons */}
          {mobile ? (
            <div className="dc-cta-m">
              {d.visited && hasReport ? (
                <button className="btn gho" onClick={() => { dispatch({ type: 'SET_REPORT', report: SEED_REPORTS[d.id] }); dispatch({ type: 'SET_VIEW', view: 'report' }); }}>
                  <Icon name="doc" size={14} /> View Report
                </button>
              ) : !isManager ? (
                <button className="btn pri" onClick={() => dispatch({ type: 'SELECT_DEALER', dealer: d })}>
                  <Icon name="edit" size={14} color="#fff" /> Start Visit
                </button>
              ) : null}
            </div>
          ) : (
            <div style={{ padding: '0 16px 14px', display: 'flex', gap: 8 }}>
              {d.visited && hasReport && (
                <button className="btn gho sm" onClick={() => { dispatch({ type: 'SET_REPORT', report: SEED_REPORTS[d.id] }); dispatch({ type: 'SET_VIEW', view: 'report' }); }}>
                  <Icon name="doc" size={13} /> View Report
                </button>
              )}
              {!isManager && (
                <button className="btn pri sm" onClick={() => dispatch({ type: 'SELECT_DEALER', dealer: d })}>
                  <Icon name="edit" size={13} color="#fff" /> {d.visited ? 'New Visit' : 'Start Visit'}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
