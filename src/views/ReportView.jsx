import React from 'react';
import { Icon, Pill, Card } from '../components/primitives';
import { useAppState, useAppDispatch } from '../state/AppStateContext';
import { REPS, ME } from '../data/reps';
import { DEALERS, dealerById } from '../data/dealers';
import { fmtLong, fmtD, TODAY } from '../utils/formatters';
import { TOPIC_IC, statusStyle, toolStyle } from '../data/pickLists';

export function ReportView() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const lastReport = state.lastViewedReport || state.reports[state.reports.length - 1];

  if (!lastReport) {
    return (
      <>
        <div className="top">
          <button className="btn gho sm" onClick={() => dispatch({ type: 'GO_HOME' })}>
            <Icon name="chev" size={13} style={{ transform: 'rotate(90deg)' }} /> Home
          </button>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>Visit Report</div>
        </div>
        <div className="scroll"><div className="wrap"><div className="empty">No report to display.</div></div></div>
      </>
    );
  }

  const isSeed = !!lastReport.dealerName;
  const dealer = isSeed
    ? { name: lastReport.dealerName, code: lastReport.dealerCode, contact: lastReport.contact, ctitle: lastReport.contactTitle }
    : (dealerById(lastReport.dealerId) || state.selectedDealer || {});
  const rep = isSeed ? { name: lastReport.repName } : REPS[lastReport.rep || ME];
  const reportDate = lastReport.visitDate || lastReport.date || TODAY;
  const reportStatus = lastReport.dealerStatus || lastReport.status;
  const actions = lastReport.actions || lastReport.actionItems || [];

  return (
    <>
      <div className="top">
        <button className="btn gho sm" onClick={() => dispatch({ type: 'GO_HOME' })}>
          <Icon name="chev" size={13} style={{ transform: 'rotate(90deg)' }} /> Home
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Visit Report</div>
          <div style={{ fontSize: 12, color: 'var(--dim)' }}>{dealer.name} · {fmtD(reportDate)}</div>
        </div>
        <button className="btn gho sm" onClick={() => window.print()}>
          <Icon name="download" size={13} /> Print
        </button>
      </div>
      <div className="scroll">
        <div className="wrap">
          {!isSeed && (
            <div className="banner" style={{ borderColor: 'rgba(17,131,74,.3)', background: '#F7FDF9' }}>
              <Icon name="check" size={16} color="var(--green)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ color: 'var(--green)', fontWeight: 600 }}>Report submitted successfully</span>
            </div>
          )}

          <div className="paper">
            <div className="ph">
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.3 }}>{dealer.name}</div>
                <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 4 }}>Dealer Visit Report · {fmtLong(reportDate)}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--dim)', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{rep?.name}</div>
                {rep?.territory && <>{rep.territory}<br /></>}{dealer.code}
              </div>
            </div>

            <div className="pgrid">
              <div><div className="ml">Contact</div><div className="mv">{dealer.contact}</div></div>
              <div><div className="ml">Role</div><div className="mv">{dealer.ctitle}</div></div>
              <div><div className="ml">Status</div><div className="mv">{reportStatus && <Pill label={reportStatus} color={reportStatus === 'Good' ? 'green' : reportStatus === 'Monitor' ? 'amber' : 'red'} />}</div></div>
              {lastReport.priority && <div><div className="ml">Priority</div><div className="mv"><Pill label={lastReport.priority} color={lastReport.priority === 'High' ? 'red' : lastReport.priority === 'Medium' ? 'amber' : 'grey'} /></div></div>}
            </div>

            {lastReport.topics?.length > 0 && (
              <div className="ps">
                <h4>Topics Discussed</h4>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {lastReport.topics.map(t => (
                    <span key={t} className="tchip on" style={{ cursor: 'default' }}><Icon name={TOPIC_IC[t] || 'dots'} size={12} />{t}</span>
                  ))}
                </div>
              </div>
            )}

            {(lastReport.summary || lastReport.aiSummary) && (
              <div className="ps">
                <h4><Icon name="spark" size={12} color="var(--ac)" style={{ display: 'inline', verticalAlign: -1, marginRight: 4 }} />Summary</h4>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--ink)' }}>{lastReport.summary || lastReport.aiSummary}</p>
              </div>
            )}

            {(lastReport.keyFindings || lastReport.notes) && (
              <div className="ps">
                <h4>{isSeed ? 'Key Findings' : 'Notes'}</h4>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--ink)' }}>{lastReport.keyFindings || lastReport.notes}</p>
              </div>
            )}

            {lastReport.challenges && (
              <div className="ps">
                <h4>Challenges</h4>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--ink)' }}>{typeof lastReport.challenges === 'string' ? lastReport.challenges : lastReport.challenges.join(', ')}</p>
              </div>
            )}

            {lastReport.opportunities && (
              <div className="ps">
                <h4>Opportunities</h4>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--ink)' }}>{typeof lastReport.opportunities === 'string' ? lastReport.opportunities : lastReport.opportunities.join(', ')}</p>
              </div>
            )}

            {actions.length > 0 && (
              <div className="ps">
                <h4>Action Items</h4>
                <table className="ptbl">
                  <thead><tr><th>Action</th><th>Owner</th><th>Due</th><th>Priority</th></tr></thead>
                  <tbody>
                    {actions.map((a, i) => {
                      const label = a.action || a.text;
                      const prio = a.priority || a.prio;
                      if (!label) return null;
                      return (
                        <tr key={i}>
                          <td>{label}</td>
                          <td>{a.owner || '—'}</td>
                          <td>{a.due ? fmtD(a.due) : '—'}</td>
                          <td>{prio && <Pill label={prio} color={prio === 'High' ? 'red' : prio === 'Medium' ? 'amber' : 'grey'} />}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {lastReport.nextVisit && (
              <div className="pgrid" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--bd)', borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
                <div><span className="ml">Next Visit</span><span className="mv">{fmtD(lastReport.nextVisit)}</span></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
