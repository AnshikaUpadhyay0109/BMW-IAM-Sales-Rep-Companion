import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Icon } from '../components/primitives/Icon';
import { useAppState, useAppDispatch } from '../state/AppStateContext';
import { TOPICS, TOPIC_IC, CHALLENGES, OPPS, TOOLS_OPTS, STATUSES, PRIOS, statusStyle, prioStyle } from '../data/pickLists';
import { REPS, ME } from '../data/reps';
import { SIG } from '../data/dealers';
import { fmtD, TODAY, nowT, ago, MONTH_NAME } from '../utils/formatters';
import { useIsMobile } from '../hooks/useIsMobile';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { api } from '../services/api';

function VisitHeader({ dealer, onBack }) {
  const mobile = useIsMobile();
  const sig = SIG[dealer.signal] || SIG.watch;
  return (
    <div className="vh">
      <button className="btn gho sm" onClick={onBack} aria-label="Back to dealers">
        {mobile ? '‹' : '‹ Dealers'}
      </button>
      <div className="hide-m" style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--ft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="store" size={16} color="var(--sub)" />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dealer.name}</div>
        <div style={{ fontSize: 11, color: 'var(--dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {dealer.contact}{dealer.ctitle ? ` · ${dealer.ctitle}` : ''}
        </div>
      </div>
      <div className="vmeta"><div className="ml">Dealer code</div><div className="mv">{dealer.code}</div></div>
      <div className="vmeta"><div className="ml">Last visit</div><div className="mv">{dealer.visited ? 'Recent' : '–'}</div></div>
      <div className="vmeta">
        <div className="ml">Performance</div>
        <div className="mv">
          <span className="pill" style={{ background: sig.bg, color: sig.c }}>{sig.l}</span>
        </div>
      </div>
    </div>
  );
}

function FormCard({ id, num, title, subtitle, children, warn, aiTag }) {
  return (
    <section className={`card fc${warn ? ' warn' : ''}`} id={`fc-${id}`}>
      <div className="fc-t">
        <span className="n">{num}.</span>
        {title}
        {aiTag && <span className="aitag">AI draft · review</span>}
      </div>
      <div className="fc-s">{subtitle}</div>
      {children}
    </section>
  );
}

function TopicChips({ selected, onToggle, otherText, onOtherChange }) {
  const otherSelected = selected.includes('Other');
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {TOPICS.map(t => {
          const on = selected.includes(t);
          return (
            <button key={t} className={`tchip${on ? ' on' : ''}`} onClick={() => onToggle(t)}>
              <Icon name={TOPIC_IC[t] || 'dots'} size={13} color={on ? 'var(--ac)' : 'var(--dim)'} />{t}
            </button>
          );
        })}
      </div>
      {otherSelected && (
        <input
          className="inp bg"
          style={{ marginTop: 8 }}
          placeholder="Please specify…"
          value={otherText || ''}
          onChange={e => onOtherChange(e.target.value)}
        />
      )}
    </>
  );
}

function OptGroup({ options, value, onChange, columns }) {
  return (
    <div className="optg" style={{ gridTemplateColumns: `repeat(${columns || options.length}, minmax(0, 1fr))` }}>
      {options.map(o => (
        <button key={o} className={`opt${value === o ? ' on' : ''}`} onClick={() => onChange(value === o ? '' : o)}>
          {o === 'Needs Support' ? 'Needs support' : o}
        </button>
      ))}
    </div>
  );
}

function SelectField({ value, onChange, options, icon, iconColor, placeholder }) {
  return (
    <div className="selw">
      <Icon name={icon} size={14} color={iconColor} />
      <select className="sel" value={value || ''} onChange={e => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function VisitFormView() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const mobile = useIsMobile();
  const dealer = state.selectedDealer;
  const form = state.form;
  const [generating, setGenerating] = useState(false);
  const [transcriptSegments, setTranscriptSegments] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const fileRef = useRef(null);
  const notesRef = useRef(null);
  const transcriptTextRef = useRef('');
  const autoSaveTimer = useRef(null);

  const visitId = form.visitId || (dealer ? `${dealer.code}-${TODAY}` : 'unknown');
  const notesValueRef = useRef(form.notes || '');
  notesValueRef.current = form.notes || '';

  // Load draft on mount
  useEffect(() => {
    if (!dealer?.code) return;
    setDraftLoading(true);
    api.getDraftVisitCapture(dealer.code, 'dealer')
      .then(res => {
        const visit = res?.draft || res?.visit;
        if (visit && visit.status === 'draft') {
          dispatch({ type: 'SET_DEALER_VISIT_STATUS', dealerCode: dealer.code, status: 'draft', visitDate: visit.visit_date });
          dispatch({ type: 'SET_FORM_FIELD', field: 'visitId', value: visit.visit_id });
          const fd = visit.form_data || {};
          if (fd.topics_discussed?.length) dispatch({ type: 'SET_FORM_FIELD', field: 'topics', value: fd.topics_discussed });
          if (fd.visit_notes) dispatch({ type: 'SET_FORM_FIELD', field: 'notes', value: fd.visit_notes });
          if (fd.biggest_challenge) dispatch({ type: 'SET_FORM_FIELD', field: 'challenge', value: fd.biggest_challenge });
          if (fd.biggest_opportunity) dispatch({ type: 'SET_FORM_FIELD', field: 'opportunity', value: fd.biggest_opportunity });
          if (fd.tools_usage?.pl24) dispatch({ type: 'SET_FORM_FIELD', field: 'pl24', value: fd.tools_usage.pl24 });
          if (fd.tools_usage?.aos) dispatch({ type: 'SET_FORM_FIELD', field: 'aos', value: fd.tools_usage.aos });
          if (fd.overall_status) dispatch({ type: 'SET_FORM_FIELD', field: 'status', value: fd.overall_status });
          if (fd.competitor_activity?.comment) dispatch({ type: 'SET_FORM_FIELD', field: 'competitors', value: fd.competitor_activity.comment });
          if (fd.actions_agreed?.length) {
            dispatch({ type: 'SET_FORM_FIELD', field: 'actionItems', value: fd.actions_agreed.map(a => ({
              text: a.action || '', owner: a.owner || '', due: a.dueDate || '', prio: a.priority || 'Medium',
            })) });
          }
          if (fd.voice_note_key) dispatch({ type: 'SET_FORM_FIELD', field: 'voiceNoteKey', value: fd.voice_note_key });
          if (fd.transcript?.segments?.length) {
            setTranscriptSegments(fd.transcript.segments);
            dispatch({ type: 'SET_FORM_FIELD', field: 'transcriptSegments', value: fd.transcript.segments });
          }
          if (fd.transcript?.full_transcription) {
            transcriptTextRef.current = fd.transcript.full_transcription;
            dispatch({ type: 'SET_FORM_FIELD', field: 'fullTranscript', value: fd.transcript.full_transcription });
          }
        } else {
          dispatch({ type: 'SET_FORM_FIELD', field: 'visitId', value: crypto.randomUUID() });
        }
      })
      .catch(() => {
        dispatch({ type: 'SET_FORM_FIELD', field: 'visitId', value: crypto.randomUUID() });
      })
      .finally(() => setDraftLoading(false));
  }, [dealer?.code, dispatch]);

  const applyExtraction = useCallback((ex) => {
    if (!ex) return;
    if (ex.topics_discussed?.length) {
      const merged = Array.from(new Set([...(form.topics || []), ...ex.topics_discussed]));
      dispatch({ type: 'SET_FORM_FIELD', field: 'topics', value: merged });
    }
    if (ex.biggest_challenge) dispatch({ type: 'SET_FORM_FIELD', field: 'challenge', value: ex.biggest_challenge });
    if (ex.biggest_opportunity) dispatch({ type: 'SET_FORM_FIELD', field: 'opportunity', value: ex.biggest_opportunity });
    if (ex.tools_usage?.pl24) dispatch({ type: 'SET_FORM_FIELD', field: 'pl24', value: ex.tools_usage.pl24 });
    if (ex.tools_usage?.aos) dispatch({ type: 'SET_FORM_FIELD', field: 'aos', value: ex.tools_usage.aos });
    if (ex.overall_status) dispatch({ type: 'SET_FORM_FIELD', field: 'status', value: ex.overall_status });
    if (ex.competitor_activity?.comment) dispatch({ type: 'SET_FORM_FIELD', field: 'competitors', value: ex.competitor_activity.comment });
    if (ex.actions_agreed?.length) {
      const items = ex.actions_agreed.map(a => ({
        text: a.action || '', owner: a.owner || '', due: a.dueDate || '', prio: a.priority || 'Medium',
      }));
      dispatch({ type: 'SET_FORM_FIELD', field: 'actionItems', value: items });
    }
  }, [dispatch, form.topics]);

  const autoFillFromTranscript = useCallback(async (fullText) => {
    if (!fullText?.trim()) return;
    setExtractError(null);
    setIsExtracting(true);
    try {
      const extracted = await api.extractVisit({ transcript: fullText, formType: 'dealer' });
      console.log('[VisitForm] extracted:', JSON.stringify(extracted, null, 2));
      applyExtraction(extracted);
    } catch (err) {
      setExtractError('Could not auto-fill fields from the recording.');
      console.error('[VisitForm] extractVisit error:', err.message);
    } finally {
      setIsExtracting(false);
    }
  }, [applyExtraction]);

  const onTranscript = useCallback((text) => {
    setTranscriptSegments(prev => [...prev, text]);
    const cur = notesValueRef.current;
    const sep = cur && !cur.endsWith(' ') && !cur.endsWith('\n') ? ' ' : '';
    dispatch({ type: 'SET_FORM_FIELD', field: 'notes', value: cur + sep + text });
    transcriptTextRef.current = (transcriptTextRef.current ? transcriptTextRef.current + ' ' : '') + text;
    autoFillFromTranscript(transcriptTextRef.current);
  }, [dispatch, autoFillFromTranscript]);

  const onAudioStored = useCallback((audioKey) => {
    dispatch({ type: 'SET_FORM_FIELD', field: 'voiceNoteKey', value: audioKey });
  }, [dispatch]);

  const { isRecording, isPaused, isTranscribing, error: voiceError, start, pause, resume, stop, pauseSupported } = useVoiceRecorder({
    visitId,
    folder: 'dealer',
    onTranscript,
    onAudioStored,
  });

  const micBusy = isTranscribing || isExtracting;

  if (!dealer) return null;

  const toggleArr = (field, value) => dispatch({ type: 'TOGGLE_FORM_ARRAY', field, value });
  const setField = (field, value) => dispatch({ type: 'SET_FORM_FIELD', field, value });
  const rep = REPS[state.user?.repId || ME];
  const owners = [rep?.name, 'Anna Weber'].filter(Boolean);

  const canGenerate = form.notes?.trim() && form.status;
  const hintMsg = canGenerate
    ? 'Everything is filled in. Generate the report to review it before submitting.'
    : (form.notes?.trim() ? 'Add the overall visit status to generate the report.' : 'Record the visit, or type your notes, to generate the report.');

  const buildPayload = (status) => ({
    form_type: 'dealer',
    status,
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
      tools_usage: { pl24: form.pl24, aos: form.aos },
      biggest_challenge: form.challenge,
      biggest_opportunity: form.opportunity,
      competitor_activity: {
        mode: form.competitors?.trim() ? 'Observed' : 'Not Observed',
        comment: form.competitors || '',
      },
      actions_agreed: form.actionItems.filter(a => a.text?.trim()).map(a => ({
        action: a.text, owner: a.owner, dueDate: a.due, priority: a.prio,
      })),
      overall_status: form.status,
      voice_note_key: form.voiceNoteKey || null,
      transcript: {
        full_transcription: transcriptTextRef.current,
        segments: transcriptSegments,
      },
      ai_summary: form.aiSummary || '',
      photos: (form.photos || []).filter(p => p.s3Key).map(p => ({ key: p.s3Key, name: p.name })),
    },
  });

  const handleSave = async () => {
    if (!visitId || saving) return;
    setSaving(true);
    setSaveStatus('');
    try {
      await api.saveVisitCapture(dealer.code, visitId, buildPayload('draft'));
      setSaveStatus('saved');
      dispatch({ type: 'SHOW_TOAST', message: 'Draft saved', toastType: 'success' });
    } catch {
      setSaveStatus('error');
      dispatch({ type: 'SHOW_TOAST', message: 'Could not save draft', toastType: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Auto-save draft 5s after last form change
  useEffect(() => {
    if (!form.notes?.trim() && !form.topics.length) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (visitId && dealer?.code) {
        api.saveVisitCapture(dealer.code, visitId, buildPayload('draft'))
          .then(() => setSaveStatus('saved'))
          .catch(() => setSaveStatus('error'));
      }
    }, 5000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [form.notes, form.topics, form.pl24, form.aos, form.challenge, form.opportunity, form.competitors, form.status, form.actionItems]);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    // Save draft before generating
    try {
      await api.saveVisitCapture(dealer.code, visitId, buildPayload('draft'));
    } catch { /* continue */ }
    try {
      const summary = await api.generate({
        systemPrompt: 'You are a BMW IAM visit report assistant. Generate a concise professional visit summary.',
        userPrompt: `Dealer: ${dealer.name} (${dealer.code}). Topics: ${form.topics.join(', ')}. Notes: ${form.notes}. Challenge: ${form.challenge || ''}. Opportunity: ${form.opportunity || ''}. PL24: ${form.pl24 || ''}. AOS: ${form.aos || ''}. Status: ${form.status}.`,
        maxTokens: 300,
      });
      setField('aiSummary', summary);
    } catch {
      // continue without AI summary
    }
    setGenerating(false);
    dispatch({ type: 'GO_REVIEW' });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (!/^image\//.test(file.type)) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result;
        const localPhoto = { src: base64, name: file.name.replace(/\.[^.]+$/, '') };
        dispatch({ type: 'ADD_PHOTO', photo: localPhoto });
        try {
          const { url, key } = await api.uploadPhoto(base64, file.name, 'dealer');
          localPhoto.s3Key = key;
          localPhoto.s3Url = url;
        } catch (err) {
          console.error('[VisitForm] photo upload failed:', err.message);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  return (
    <>
      <VisitHeader dealer={dealer} onBack={() => dispatch({ type: 'GO_HOME' })} />

      <div className="vgrid">
        <div className="scroll" id="scroll">
          <div className="wrap" style={{ maxWidth: 900 }}>
            <div className="tip">
              <Icon name="spark" size={14} color="var(--ac)" />
              The mic starts on its own. Just talk through the visit and each section fills in as it comes up.
            </div>

            {/* 1. Discussion topics */}
            <FormCard id="topics" num={1} title="Discussion topics" subtitle="Select everything you covered with the dealer.">
              <TopicChips selected={form.topics} onToggle={t => toggleArr('topics', t)} otherText={form.otherTopic} onOtherChange={v => setField('otherTopic', v)} />
            </FormCard>

            {/* 2. Overall visit notes */}
            <FormCard id="notes" num={2} title="Overall visit notes" subtitle="Voice or typed. The summary is written in English.">
              <textarea
                className="inp bg"
                id="notes"
                maxLength={1500}
                rows={6}
                style={{ resize: 'vertical', lineHeight: 1.55 }}
                placeholder="The English summary writes itself while you talk. You can also type here."
                value={form.notes || ''}
                onChange={e => setField('notes', e.target.value)}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 9, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11.5, color: 'var(--dim)', fontVariantNumeric: 'tabular-nums' }}>
                  {(form.notes || '').length} / 1500
                </span>
                {(isTranscribing || isExtracting) && (
                  <span style={{ fontSize: 11.5, color: 'var(--ac)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span className="spin" style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(161,0,255,.2)', borderTopColor: 'var(--ac)', display: 'inline-block' }} />
                    {isTranscribing ? 'Transcribing…' : 'Extracting fields…'}
                  </span>
                )}
                {voiceError && (
                  <span style={{ fontSize: 11.5, color: 'var(--red)', fontWeight: 500 }}>{voiceError}</span>
                )}
                {extractError && (
                  <span style={{ fontSize: 11.5, color: 'var(--amber)', fontWeight: 500 }}>{extractError}</span>
                )}
                <div style={{ flex: 1 }} />
                {!isRecording ? (
                  <button className="btn gho sm" onClick={start} disabled={micBusy}>
                    <Icon name="mic" size={14} color={micBusy ? 'var(--dim)' : 'var(--ac)'} />{micBusy ? 'Processing…' : 'Start recording'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {pauseSupported && (
                      <button className="btn gho sm" onClick={isPaused ? resume : pause}>
                        <Icon name={isPaused ? 'mic' : 'pause'} size={14} color="var(--ac)" />
                        {isPaused ? 'Resume' : 'Pause'}
                      </button>
                    )}
                    <button className="btn gho sm" onClick={stop} style={{ color: 'var(--red)', borderColor: 'rgba(200,40,60,.2)' }}>
                      <Icon name="x" size={14} color="var(--red)" />Stop
                    </button>
                  </div>
                )}
              </div>
            </FormCard>

            {/* 3. Tools usage */}
            <FormCard id="tools" num={3} title="Tools usage" subtitle="How is the dealer using PL24 and AOS?">
              <div className="two">
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>PL24</div>
                  <OptGroup options={TOOLS_OPTS} value={form.pl24 || ''} onChange={v => setField('pl24', v)} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>AOS</div>
                  <OptGroup options={TOOLS_OPTS} value={form.aos || ''} onChange={v => setField('aos', v)} />
                </div>
              </div>
            </FormCard>

            {/* 4 & 5. Challenge + Opportunity side by side */}
            <div className="two">
              <FormCard id="challenge" num={4} title="Biggest challenge" subtitle="What is holding the dealer back?">
                <SelectField
                  value={form.challenge || ''}
                  onChange={v => setField('challenge', v)}
                  options={CHALLENGES}
                  icon="alert"
                  iconColor="var(--amber)"
                  placeholder="Select challenge…"
                />
              </FormCard>
              <FormCard id="opportunity" num={5} title="Biggest opportunity" subtitle="Where is the best upside?">
                <SelectField
                  value={form.opportunity || ''}
                  onChange={v => setField('opportunity', v)}
                  options={OPPS}
                  icon="trend"
                  iconColor="var(--green)"
                  placeholder="Select opportunity…"
                />
              </FormCard>
            </div>

            {/* 6. Competitor activities */}
            <FormCard id="comp" num={6} title="Competitor activities" subtitle="Add notes and photos of promotions, flyers or pricing.">
              <textarea
                className="inp bg"
                rows={3}
                maxLength={800}
                style={{ resize: 'vertical', lineHeight: 1.55 }}
                placeholder="Anything you saw or heard about competitors: promotions, pricing, new branches…"
                value={form.competitors || ''}
                onChange={e => setField('competitors', e.target.value)}
              />
              <div className="thumbs" style={{ marginTop: 10 }}>
                {(form.photos || []).map((im, i) => (
                  <div key={i} className="thumb">
                    <img src={im.src} alt={im.name} />
                    <button onClick={() => dispatch({ type: 'REMOVE_PHOTO', index: i })}>
                      <Icon name="x" size={11} color="#fff" />
                    </button>
                  </div>
                ))}
                {(form.photos || []).length < 4 && (
                  <button onClick={() => fileRef.current?.click()} style={{
                    width: 104, height: 78, borderRadius: 9, border: '1.5px dashed #C9CFDB',
                    background: 'var(--bg)', color: 'var(--sub)', fontSize: 11.5, fontWeight: 500,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5
                  }}>
                    <Icon name="upload" size={17} color="var(--dim)" />Add photo
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileUpload} />
            </FormCard>

            {/* 7. Actions agreed */}
            <FormCard id="actions" num={7} title="Actions agreed" subtitle="Who does what, by when, and how urgent.">
              <div className="arow hd">
                <div>Action</div><div>Owner</div><div>Due date</div><div>Priority</div><div></div>
              </div>
              {form.actionItems.map((a, i) => (
                <div className="arow" key={i}>
                  <input
                    className="inp bg"
                    placeholder="What was agreed?"
                    value={a.text}
                    onChange={e => dispatch({ type: 'UPDATE_ACTION_ITEM', index: i, data: { text: e.target.value } })}
                    style={{ padding: '8px 10px' }}
                  />
                  <select
                    className="inp bg"
                    value={a.owner}
                    onChange={e => dispatch({ type: 'UPDATE_ACTION_ITEM', index: i, data: { owner: e.target.value } })}
                    style={{ padding: '8px 9px', cursor: 'pointer' }}
                  >
                    {(owners.includes(a.owner) ? owners : [...owners, a.owner]).map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <input
                    className="inp bg"
                    type="date"
                    value={a.due || ''}
                    onChange={e => dispatch({ type: 'UPDATE_ACTION_ITEM', index: i, data: { due: e.target.value } })}
                    style={{ padding: '7px 9px' }}
                  />
                  <select
                    className="inp bg"
                    value={a.prio}
                    onChange={e => dispatch({ type: 'UPDATE_ACTION_ITEM', index: i, data: { prio: e.target.value } })}
                    style={{ padding: '8px 9px', cursor: 'pointer', fontWeight: 600, color: prioStyle(a.prio).c }}
                  >
                    {PRIOS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_ACTION_ITEM', index: i })}
                    style={{
                      width: 30, height: 30, borderRadius: 8, border: 'none',
                      background: 'rgba(200,40,60,.07)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <Icon name="x" size={13} color="var(--red)" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => dispatch({ type: 'ADD_ACTION_ITEM' })}
                style={{ background: 'none', border: 'none', color: 'var(--ac)', fontSize: 12.5, fontWeight: 600, display: 'inline-flex', gap: 5, alignItems: 'center', marginTop: 2 }}
              >
                <Icon name="plus" size={13} color="var(--ac)" />Add another action
              </button>
            </FormCard>

            {/* 8. Overall visit status */}
            <FormCard id="status" num={8} title="Overall visit status" subtitle="How did the visit go overall?" warn={!form.status && form.notes?.trim()}>
              <OptGroup options={STATUSES} value={form.status || ''} onChange={v => setField('status', v)} columns={3} />
            </FormCard>
          </div>
        </div>

        {/* Live capture panel (desktop only) */}
        <aside className="lp" id="live-panel">
          <div className="lp-h">
            <div className={`orb${isRecording && !isPaused ? ' live' : micBusy ? ' pulse' : ''}`}>
              <Icon name="mic" size={20} color={isRecording && !isPaused ? '#fff' : 'var(--sub)'} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="lp-t">
                {isRecording ? (isPaused ? 'Paused' : 'Recording…') : isTranscribing ? 'Transcribing…' : isExtracting ? 'Extracting fields…' : 'Mic is off'}
              </div>
              <div className="lp-s">
                {isRecording
                  ? (isPaused ? 'Tap resume to continue capturing' : 'Listening — speak naturally')
                  : isTranscribing ? 'Processing your recording…'
                  : isExtracting ? 'Auto-filling form from transcript…'
                  : 'Start recording to capture the visit'}
              </div>
            </div>
          </div>
          <div className={`wave${isRecording && !isPaused ? '' : ' still'}`}>
            {Array.from({ length: 34 }, (_, i) => (
              <i key={i} style={{ animationDelay: `-${(i * 0.17).toFixed(2)}s`, animationDuration: `${(0.7 + (i % 6) * 0.13).toFixed(2)}s` }} />
            ))}
          </div>
          <div className="lp-btns">
            {!isRecording ? (
              <button className="btn pri" onClick={start} disabled={micBusy} style={micBusy ? { opacity: 0.5 } : undefined}>
                <Icon name="mic" size={14} color="#fff" />{micBusy ? 'Processing…' : 'Start recording'}
              </button>
            ) : (
              <>
                {pauseSupported && (
                  <button className="btn gho" onClick={isPaused ? resume : pause}>
                    <Icon name={isPaused ? 'mic' : 'pause'} size={14} color="var(--ac)" />
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                )}
                <button className="btn pri" onClick={stop} style={{ background: 'var(--red)' }}>
                  <Icon name="x" size={14} color="#fff" />Stop recording
                </button>
              </>
            )}
          </div>
          {voiceError && (
            <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--red)', background: 'rgba(200,40,60,.06)', borderRadius: 8, margin: '0 0 8px' }}>
              {voiceError}
            </div>
          )}
          <div className="cap">
            {transcriptSegments.length > 0 ? (
              transcriptSegments.map((seg, i) => (
                <div key={i} className="cap-line">{seg}</div>
              ))
            ) : (
              <div className="cap-empty">
                {isRecording ? 'Listening… captions will appear here.' : 'Live captions appear here while you record.'}
              </div>
            )}
          </div>
          {(() => {
            const checks = [
              ['topics', 'Discussion topics', form.topics.length > 0],
              ['notes', 'Visit notes', !!form.notes?.trim()],
              ['tools', 'Tools usage', !!(form.pl24 && form.aos)],
              ['challenge', 'Biggest challenge', !!form.challenge],
              ['opportunity', 'Biggest opportunity', !!form.opportunity],
              ['comp', 'Competitor activity', !!form.competitors?.trim()],
              ['actions', 'Actions agreed', form.actionItems.some(a => a.text?.trim())],
              ['status', 'Visit status', !!form.status],
            ];
            const filled = checks.filter(c => c[2]).length;
            return (
              <>
                <div className="lp-ct">
                  <b>Captured so far</b>
                  <span className="cnt-all">{filled} of {checks.length}</span>
                </div>
                <div className="live-checks">
                  {checks.map(([k, l, on]) => (
                    <div key={k} className={`chk${on ? ' on' : ''}`}>
                      <span className="chk-i">{on && <Icon name="check" size={11} color="#fff" />}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="chk-l">{l}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </aside>
      </div>

      {/* Generate bar */}
      <div className="gen" id="genbar">
        <div className="hint" style={{ flex: 1, minWidth: 200, fontSize: 12.5, color: canGenerate ? 'var(--green)' : 'var(--dim)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icon name={canGenerate ? 'check' : 'alert'} size={14} color={canGenerate ? 'var(--green)' : 'var(--dim)'} />
          {hintMsg}
          {saveStatus === 'saved' && <span style={{ color: 'var(--green)', fontSize: 11, marginLeft: 8 }}>Draft saved</span>}
          {saveStatus === 'error' && <span style={{ color: 'var(--red)', fontSize: 11, marginLeft: 8 }}>Save failed</span>}
        </div>
        <button className="btn gho" onClick={handleSave} disabled={saving}>
          <Icon name="check" size={14} color="var(--sub)" />{saving ? 'Saving…' : 'Save draft'}
        </button>
        <button className={`btn pri${canGenerate ? '' : ' off'}`} onClick={handleGenerate} disabled={!canGenerate || generating}>
          <Icon name="spark" size={15} color={canGenerate ? '#fff' : 'var(--dim)'} />
          {generating ? 'Generating…' : 'Generate visit report'}
        </button>
      </div>

      {/* Generating overlay */}
      {generating && (
        <div className="overlay">
          <div>
            <span className="spin" style={{ width: 22, height: 22, borderRadius: '50%', border: '3px solid rgba(161,0,255,.2)', borderTopColor: 'var(--ac)', display: 'inline-block' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Generating visit report…</div>
              <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 2 }}>Compiling notes, tools usage, actions and status</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
