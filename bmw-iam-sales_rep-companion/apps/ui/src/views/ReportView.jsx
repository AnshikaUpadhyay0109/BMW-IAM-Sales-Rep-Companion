import React from 'react';
import { Icon } from '../components/primitives/Icon';
import { useAppState, useAppDispatch } from '../state/AppStateContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { REPS, ME } from '../data/reps';
import { dealerById } from '../data/dealers';
import { fmtD, TODAY } from '../utils/formatters';
import ReportDocument from '../components/report/ReportDocument';

export function ReportView() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const mobile = useIsMobile();
  const lastReport = state.lastViewedReport || state.reports[state.reports.length - 1];

  if (!lastReport) {
    return (
      <>
        <div className="top">
          <button className="btn gho sm" onClick={() => dispatch({ type: 'GO_HOME' })}>
            {mobile ? '‹' : <><Icon name="chev" size={13} style={{ transform: 'rotate(90deg)' }} /> Home</>}
          </button>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>Visit Report</div>
        </div>
        <div className="scroll"><div className="wrap"><div className="empty">No report to display.</div></div></div>
      </>
    );
  }

  const isSeed = !!lastReport.dealerName;
  const dealer = isSeed
    ? { name: lastReport.dealerName, code: lastReport.dealerCode, contact: lastReport.contact || '—', ctitle: lastReport.contactTitle }
    : (dealerById(lastReport.dealerId, state.dealers) || state.selectedDealer || {});

  const repId = lastReport.rep || ME;
  const reportDate = lastReport.visitDate || lastReport.date || TODAY;
  const isManagerView = state.user?.isManager && isSeed;

  // Build report in the shape ReportDocument expects
  const report = {
    rep: repId,
    date: reportDate,
    time: lastReport.time,
    topics: lastReport.topics || [],
    notes: lastReport.notes || lastReport.keyFindings,
    pl24: lastReport.pl24,
    challenges: lastReport.challenges || [],
    challengeOther: lastReport.challengeOther || '',
    opportunities: lastReport.opportunities || [],
    opportunityOther: lastReport.opportunityOther || '',
    comp: lastReport.comp,
    photos: lastReport.photos || [],
    status: lastReport.dealerStatus || lastReport.status,
    actions: (lastReport.actions || lastReport.actionItems || []).map(a => ({
      text: a.text || a.t || a.action,
      owner: a.owner,
      due: a.due || a.dueDate,
      prio: a.prio || a.pri || a.priority,
    })),
    submitted: true,
  };

  return (
    <>
      <div className="top">
        <button className="btn gho sm" onClick={() => dispatch({ type: 'GO_HOME' })}>
          {mobile ? '‹' : '‹ Dealers'}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Visit Report</div>
          <div style={{ fontSize: 12, color: 'var(--dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dealer.name} · {fmtD(reportDate)}</div>
        </div>
        {!mobile && (
          <button className="btn gho sm" onClick={() => window.print()}>
            <Icon name="download" size={13} /> Print
          </button>
        )}
      </div>
      <div className="scroll">
        <div className="wrap">
          {!isManagerView && (
            <div className="banner" style={{ borderColor: 'rgba(17,131,74,.3)', background: '#F7FDF9' }}>
              <Icon name="check" size={16} color="var(--green)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ color: 'var(--green)', fontWeight: 600 }}>Report submitted successfully</span>
            </div>
          )}
          <ReportDocument report={report} dealer={dealer} />
        </div>
      </div>
    </>
  );
}
