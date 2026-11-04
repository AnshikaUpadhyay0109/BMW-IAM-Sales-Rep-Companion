import React, { useState } from 'react';
import { Icon } from '../components/primitives/Icon';
import { useAppState, useAppDispatch } from '../state/AppStateContext';
import { REPS, ME } from '../data/reps';
import { SIG } from '../data/dealers';
import { TOPIC_IC, statusStyle, toolStyle, prioStyle, statusLbl } from '../data/pickLists';
import { fmtD, fmtLong, fmtDM, TODAY, nowT } from '../utils/formatters';
import { useIsMobile } from '../hooks/useIsMobile';
import { api } from '../services/api';
import ReportDocument from '../components/report/ReportDocument';

export function VisitReviewView() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const mobile = useIsMobile();
  const dealer = state.selectedDealer;
  const form = state.form;
  const [saving, setSaving] = useState(false);

  if (!dealer) return null;

  const sig = SIG[dealer.signal] || SIG.watch;
  const repId = state.user?.repId || ME;
  const MANAGER = 'Anna Weber';

  const report = {
    date: TODAY,
    time: nowT(),
    rep: repId,
    topics: form.topics,
    notes: form.notes,
    pl24: form.pl24,
    challenges: form.challenges,
    challengeOther: form.challengeOther,
    opportunities: form.opportunities,
    opportunityOther: form.opportunityOther,
    comp: form.competitors,
    photos: form.photos,
    actions: form.actionItems?.filter(a => a.text?.trim()),
    status: form.status,
  };

  const visitId = form.visitId || `${dealer.code}-${TODAY}`;

  const handleSubmit = async () => {
    setSaving(true);
    const fullReport = {
      id: visitId,
      dealerId: dealer.id,
      ...report,
    };
    const rep = REPS[repId];
    const fullTranscript = form.fullTranscript || '';
    const visitSummary = await api.summarizeVisit({
      dealerName: dealer.name,
      topics: form.topics,
      notes: form.notes,
      actions: form.actionItems?.filter(a => a.text?.trim()),
      challenge: (form.challenges || []).join(', '),
      opportunity: (form.opportunities || []).join(', '),
      status: form.status,
    }).catch(() => null);
    const payload = {
      form_type: 'dealer',
      status: 'submitted',
      visit_date: TODAY,
      sales_rep_id: rep?.name?.toLowerCase().replace(/\s+/g, '.') || '',
      submitted_by: api.getUser()?.email || '',
      updated_at: new Date().toISOString(),
      form_data: {
        dealer_name: dealer.name,
        dealer_code: dealer.code,
        topics_discussed: form.topics,
        other_topic: form.otherTopic || '',
        visit_notes: form.notes,
        tools_usage: { pl24: form.pl24 },
        biggest_challenges: form.challenges || [],
        biggest_challenge_other: form.challengeOther || '',
        biggest_opportunities: form.opportunities || [],
        biggest_opportunity_other: form.opportunityOther || '',
        competitor_activity: {
          mode: form.competitors?.trim() ? 'Observed' : 'Not Observed',
          comment: form.competitors || '',
        },
        actions_agreed: (form.actionItems || []).filter(a => a.text?.trim()).map(a => ({
          action: a.text, owner: a.owner, dueDate: a.due, priority: a.prio,
        })),
        overall_status: form.status,
        voice_note_key: form.voiceNoteKey || null,
        overall_transcription: fullTranscript,
        overall_visit_note: form.visitNoteSummary || '',
        ai_summary: form.aiSummary || '',
        visit_summary: visitSummary || '',
        photos: (form.photos || []).filter(p => p.s3Key).map(p => ({ key: p.s3Key, name: p.name })),
      },
    };
    try {
      await api.saveVisitCapture(dealer.code, visitId, payload);
      dispatch({ type: 'SHOW_TOAST', message: 'Visit report submitted', toastType: 'success' });
    } catch {
      dispatch({ type: 'SHOW_TOAST', message: 'Saved locally (offline)', toastType: 'info' });
    }
    dispatch({ type: 'SAVE_REPORT', report: fullReport, summary: visitSummary || '' });
    setSaving(false);
  };

  return (
    <>
      <div className="vh">
        <button className="btn gho sm" onClick={() => dispatch({ type: 'SET_VIEW', view: 'visit' })}>
          {mobile ? '‹' : '‹ Edit details'}
        </button>
        <div className="hide-m" style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--ft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="store" size={16} color="var(--sub)" />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dealer.name}</div>
          <div style={{ fontSize: 11, color: 'var(--dim)' }}>{dealer.contact}{dealer.ctitle ? ` · ${dealer.ctitle}` : ''}</div>
        </div>
        <div className="vmeta"><div className="ml">Dealer code</div><div className="mv">{dealer.code}</div></div>
        <div className="vmeta"><div className="ml">Last visit</div><div className="mv">{dealer.visited ? 'Recent' : '–'}</div></div>
        <div className="vmeta">
          <div className="ml">Performance</div>
          <div className="mv"><span className="pill" style={{ background: sig.bg, color: sig.c }}>{sig.l}</span></div>
        </div>
      </div>

      <div className="scroll" id="scroll" style={{ background: '#E9ECF2' }}>
        <div className="wrap" style={{ maxWidth: 860 }}>
          <div className="banner">
            <Icon name="doc" size={17} color="var(--ac)" style={{ flexShrink: 0 }} />
            <div>
              <b style={{ color: 'var(--ink)' }}>Review your visit report.</b> This is exactly what {MANAGER} will see. Go back to edit anything, or submit when it looks right.
            </div>
          </div>
          <ReportDocument report={report} dealer={dealer} draft={true} />
        </div>
      </div>

      <div className="gen row">
        <div className="hint" style={{ flex: 1, minWidth: 200, fontSize: 12.5, color: 'var(--dim)' }}>
          Submitting shares this report with {MANAGER} and returns you to your dealers.
        </div>
        <button className="btn gho" onClick={() => dispatch({ type: 'SET_VIEW', view: 'visit' })}>
          <Icon name="edit" size={14} color="var(--sub)" />Edit details
        </button>
        <button className="btn pri" onClick={handleSubmit} disabled={saving}>
          <Icon name="check" size={15} color="#fff" />{saving ? 'Submitting…' : 'Submit report'}
        </button>
      </div>
    </>
  );
}
