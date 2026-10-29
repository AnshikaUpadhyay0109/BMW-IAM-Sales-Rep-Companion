import React, { useState } from 'react';
import { Icon, Card, Pill } from '../components/primitives';
import { useAppState, useAppDispatch } from '../state/AppStateContext';
import { REPS, ME } from '../data/reps';
import { fmtD, fmtLong, TODAY, nowT } from '../utils/formatters';
import { statusStyle, prioStyle, toolStyle, TOPIC_IC } from '../data/pickLists';
import { api } from '../services/api';

function ReportDocument({ dealer, form }) {
  const rep = REPS[ME];
  return (
    <div className="paper">
      <div className="ph">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.3 }}>{dealer.name}</div>
          <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 4 }}>Dealer Visit Report · {fmtLong(TODAY)}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--dim)', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{rep.name}</div>
          {rep.territory}<br />{dealer.code}
        </div>
      </div>

      <div className="pgrid">
        <div><div className="ml">Contact</div><div className="mv">{dealer.contact}</div></div>
        <div><div className="ml">Role</div><div className="mv">{dealer.ctitle}</div></div>
        <div><div className="ml">Status</div><div className="mv">{form.status && <Pill label={form.status} color={form.status === 'Good' ? 'green' : form.status === 'Monitor' ? 'amber' : 'red'} />}</div></div>
        <div><div className="ml">Priority</div><div className="mv">{form.priority && <Pill label={form.priority} color={form.priority === 'High' ? 'red' : form.priority === 'Medium' ? 'amber' : 'grey'} />}</div></div>
      </div>

      <div className="ps">
        <h4>Topics Discussed</h4>
        {form.topics.length > 0 ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {form.topics.map(t => (
              <span key={t} className="tchip on" style={{ cursor: 'default' }}><Icon name={TOPIC_IC[t]} size={12} />{t}</span>
            ))}
          </div>
        ) : <p className="none">No topics selected</p>}
      </div>

      <div className="ps">
        <h4>Challenges</h4>
        {form.challenges.length > 0 ? (
          <ul style={{ paddingLeft: 18, fontSize: 13, lineHeight: 1.8, color: 'var(--ink)' }}>
            {form.challenges.map(c => <li key={c}>{c}</li>)}
          </ul>
        ) : <p className="none">No challenges recorded</p>}
      </div>

      <div className="ps">
        <h4>Opportunities</h4>
        {form.opportunities.length > 0 ? (
          <ul style={{ paddingLeft: 18, fontSize: 13, lineHeight: 1.8, color: 'var(--ink)' }}>
            {form.opportunities.map(o => <li key={o}>{o}</li>)}
          </ul>
        ) : <p className="none">No opportunities identified</p>}
      </div>

      <div className="ps">
        <h4>Digital Tools Assessment</h4>
        <table className="ptbl">
          <thead><tr><th>Tool</th><th>Status</th></tr></thead>
          <tbody>
            {Object.entries(form.tools).filter(([, v]) => v).map(([k, v]) => {
              const s = toolStyle(v);
              return (
                <tr key={k}>
                  <td>{k === 'connectDrive' ? 'ConnectDrive' : k === 'partsOnline' ? 'PartsOnline' : 'RetailOnline'}</td>
                  <td><Pill label={v} color={v === 'Using well' ? 'green' : v === 'Needs help' ? 'amber' : 'red'} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="ps">
        <h4>Notes</h4>
        {form.notes ? <p>{form.notes}</p> : <p className="none">No notes</p>}
      </div>

      {form.aiSummary && (
        <div className="ps">
          <h4><Icon name="spark" size={12} color="var(--ac)" style={{ display: 'inline', verticalAlign: -1, marginRight: 4 }} />AI Summary</h4>
          <p>{form.aiSummary}</p>
        </div>
      )}

      <div className="ps">
        <h4>Action Items</h4>
        {form.actionItems.filter(a => a.text).length > 0 ? (
          <table className="ptbl">
            <thead><tr><th>Action</th><th>Owner</th><th>Due</th><th>Priority</th></tr></thead>
            <tbody>
              {form.actionItems.filter(a => a.text).map((a, i) => (
                <tr key={i}>
                  <td>{a.text}</td>
                  <td>{a.owner || '—'}</td>
                  <td>{a.due ? fmtD(a.due) : '—'}</td>
                  <td>{a.prio && <Pill label={a.prio} color={a.prio === 'High' ? 'red' : a.prio === 'Medium' ? 'amber' : 'grey'} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="none">No action items</p>}
      </div>
    </div>
  );
}

export function VisitReviewView() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const dealer = state.selectedDealer;
  const form = state.form;
  const [saving, setSaving] = useState(false);

  if (!dealer) return null;

  const handleSubmit = async () => {
    setSaving(true);
    const report = {
      dealerId: dealer.id,
      date: TODAY,
      rep: ME,
      ...form,
    };
    try {
      await api.saveVisit(dealer.code, `v-${Date.now()}`, {
        form_type: 'dealer',
        form_data: form,
        visit_date: TODAY,
      });
      dispatch({ type: 'SHOW_TOAST', message: 'Visit report saved', toastType: 'success' });
    } catch {
      dispatch({ type: 'SHOW_TOAST', message: 'Saved locally (offline)', toastType: 'info' });
    }
    dispatch({ type: 'SAVE_REPORT', report });
    setSaving(false);
  };

  return (
    <>
      <div className="top">
        <button className="btn gho sm" onClick={() => dispatch({ type: 'SET_VIEW', view: 'visit' })}>
          <Icon name="chev" size={13} style={{ transform: 'rotate(90deg)' }} /> Back to Form
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Review Report</div>
          <div style={{ fontSize: 12, color: 'var(--dim)' }}>{dealer.name} · {fmtD(TODAY)}</div>
        </div>
      </div>
      <div className="scroll">
        <div className="wrap">
          <div className="banner">
            <Icon name="alert" size={16} color="var(--ac)" style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Review the report below before submitting. You can go back to edit any section.</span>
          </div>
          <ReportDocument dealer={dealer} form={form} />
        </div>
      </div>
      <div className="gen">
        <span className="hint" style={{ flex: 1, fontSize: 12.5, color: 'var(--dim)', minWidth: 200 }}>
          <Icon name="check" size={13} color="var(--green)" style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
          Ready to submit
        </span>
        <button className="btn gho" onClick={() => dispatch({ type: 'SET_VIEW', view: 'visit' })}>
          <Icon name="edit" size={14} /> Edit
        </button>
        <button className="btn pri" onClick={handleSubmit} disabled={saving}>
          <Icon name="check" size={14} />{saving ? 'Saving...' : 'Submit Report'}
        </button>
      </div>
    </>
  );
}
