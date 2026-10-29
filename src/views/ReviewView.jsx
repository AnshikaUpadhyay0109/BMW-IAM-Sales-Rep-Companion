import React, { useState, useEffect } from 'react';
import { Icon } from '../components/primitives/Icon';
import { useAppState, useAppDispatch } from '../state/AppStateContext';
import { REPS, ME } from '../data/reps';
import { statusStyle, prioStyle } from '../data/pickLists';
import { fmtLong, TODAY, addDays } from '../utils/formatters';
import { autoSummary } from '../utils/helpers';
import { api } from '../services/api';

export default function ReviewView() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [generating, setGenerating] = useState(true);
  const [report, setReport] = useState(null);
  const d = state.selectedDealer;
  const form = state.form || {};
  const user = state.user;
  const repId = user?.repId || ME;
  const rep = REPS[repId];

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const summary = await api.generate({
        systemPrompt: 'You are a BMW IAM visit report writer. Write a professional 2-3 paragraph executive summary based on the visit data provided. Be specific about metrics and action items. Do not use markdown.',
        userPrompt: `Dealer: ${d.name} (${d.code})\nContact: ${d.contact}\nTopics: ${(form.topics || []).join(', ')}\nNotes: ${form.notes || 'No notes'}\nChallenges: ${(form.challenges || []).join(', ')}\nOpportunities: ${(form.opportunities || []).join(', ')}\nStatus: ${form.status || 'Not set'}`,
        maxTokens: 400,
        temperature: 0.6,
      });
      setReport({
        dealerName: d.name,
        dealerCode: d.code,
        contact: d.contact,
        contactTitle: d.ctitle,
        repName: rep.name,
        visitDate: TODAY,
        topics: form.topics || [],
        summary: summary || autoSummary(form.notes),
        keyFindings: form.notes || '',
        challenges: (form.challenges || []).join('. '),
        opportunities: (form.opportunities || []).join('. '),
        actions: form.actions || [],
        dealerStatus: form.status || 'Monitor',
        nextVisit: addDays(TODAY, 14),
        notes: form.competitors || '',
      });
    } catch {
      setReport({
        dealerName: d.name,
        dealerCode: d.code,
        contact: d.contact,
        contactTitle: d.ctitle,
        repName: rep.name,
        visitDate: TODAY,
        topics: form.topics || [],
        summary: autoSummary(form.notes) || 'Visit report summary — AI generation unavailable.',
        keyFindings: form.notes || '',
        challenges: (form.challenges || []).join('. '),
        opportunities: (form.opportunities || []).join('. '),
        actions: form.actions || [],
        dealerStatus: form.status || 'Monitor',
        nextVisit: addDays(TODAY, 14),
        notes: form.competitors || '',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = () => {
    dispatch({ type: 'SET_REPORT', report });
    dispatch({ type: 'SHOW_TOAST', text: 'Visit report submitted successfully' });
    dispatch({ type: 'SET_VIEW', view: 'report' });
  };

  if (generating) {
    return (
      <>
        <div className="top">
          <button className="btn gho sm" onClick={() => dispatch({ type: 'SET_VIEW', view: 'visit' })}>
            <Icon name="chev" size={14} style={{ transform: 'rotate(90deg)' }} /> Back
          </button>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Generating Report...</div>
        </div>
        <div className="scroll" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="overlay" style={{ position: 'static', background: 'none' }}>
            <div style={{ background: 'var(--sf)', borderRadius: 14, padding: '26px 34px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="spin" style={{ width: 28, height: 28, border: '3px solid var(--ft)', borderTopColor: 'var(--ac)', borderRadius: '50%' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Generating report...</div>
                <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 2 }}>AI is analyzing your visit data</div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!report) return null;
  const st = statusStyle(report.dealerStatus);

  return (
    <>
      <div className="top">
        <button className="btn gho sm" onClick={() => dispatch({ type: 'SET_VIEW', view: 'visit' })}>
          <Icon name="chev" size={14} style={{ transform: 'rotate(90deg)' }} /> Edit
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Review Report</div>
          <div style={{ fontSize: 11.5, color: 'var(--dim)' }}>{report.dealerName}</div>
        </div>
        <button className="btn pri" onClick={handleSubmit}>
          <Icon name="check" size={14} color="#fff" /> Submit Report
        </button>
      </div>
      <div className="scroll">
        <div className="wrap">
          <div className="banner">
            <Icon name="alert" size={16} color="var(--ac)" style={{ flexShrink: 0, marginTop: 2 }} />
            <span>This report was generated by AI. Please review all sections for accuracy before submitting.</span>
          </div>
          <ReportDocument report={report} />
        </div>
      </div>
    </>
  );
}

function ReportDocument({ report }) {
  const r = report;
  const st = statusStyle(r.dealerStatus);
  return (
    <div className="paper">
      <div className="ph">
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, var(--ac), var(--ac2))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="doc" size={18} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Dealer Visit Report</div>
          <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 2 }}>{r.dealerName} — {fmtLong(r.visitDate)}</div>
        </div>
        <span className="pill s" style={{ background: st.bg, color: st.c }}>{r.dealerStatus}</span>
      </div>

      <div className="pgrid">
        <div><span className="ml">Dealer</span><span className="mv">{r.dealerName}</span></div>
        <div><span className="ml">Code</span><span className="mv">{r.dealerCode}</span></div>
        <div><span className="ml">Contact</span><span className="mv">{r.contact}</span></div>
        <div><span className="ml">Rep</span><span className="mv">{r.repName}</span></div>
      </div>

      <div className="ps"><h4>Topics Discussed</h4><p>{(r.topics || []).join(', ') || <span className="none">None recorded</span>}</p></div>
      <div className="ps"><h4>Executive Summary</h4><p>{r.summary || <span className="none">No summary</span>}</p></div>
      <div className="ps"><h4>Key Findings</h4><p>{r.keyFindings || <span className="none">No findings recorded</span>}</p></div>
      <div className="ps"><h4>Challenges</h4><p>{r.challenges || <span className="none">None identified</span>}</p></div>
      <div className="ps"><h4>Opportunities</h4><p>{r.opportunities || <span className="none">None identified</span>}</p></div>

      {r.actions?.length > 0 && (
        <div className="ps">
          <h4>Action Items</h4>
          <table className="ptbl">
            <thead>
              <tr><th>Action</th><th>Owner</th><th>Due</th><th>Priority</th></tr>
            </thead>
            <tbody>
              {r.actions.map((a, i) => {
                const ps = prioStyle(a.priority);
                return (
                  <tr key={i}>
                    <td>{a.action}</td>
                    <td>{a.owner}</td>
                    <td>{a.due}</td>
                    <td><span className="pill s" style={{ background: ps.bg, color: ps.c }}>{a.priority}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {r.notes && <div className="ps"><h4>Additional Notes</h4><p>{r.notes}</p></div>}

      <div className="pgrid" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--bd)', borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
        <div><span className="ml">Status</span><span className="mv"><span className="pill s" style={{ background: st.bg, color: st.c }}>{r.dealerStatus}</span></span></div>
        <div><span className="ml">Next Visit</span><span className="mv">{r.nextVisit}</span></div>
      </div>
    </div>
  );
}
