import React, { useState, useRef } from 'react';
import { Icon, Card, Pill } from '../components/primitives';
import { useAppState, useAppDispatch } from '../state/AppStateContext';
import { TOPICS, TOPIC_IC, CHALLENGES, OPPS, TOOLS_OPTS, STATUSES, PRIOS, statusStyle, toolStyle, prioStyle } from '../data/pickLists';
import { REPS, ME } from '../data/reps';
import { fmtD, TODAY, nowT } from '../utils/formatters';
import { api } from '../services/api';

function FormSection({ num, title, subtitle, icon, children, aiTag, warn }) {
  return (
    <Card className={`fc${warn ? ' warn' : ''}`} id={`sec-${num}`}>
      <div className="fc-t">
        <span className="n">{num}</span>
        <Icon name={icon} size={15} />
        {title}
        {aiTag && <span className="aitag">AI populated</span>}
      </div>
      {subtitle && <div className="fc-s">{subtitle}</div>}
      <div style={{ marginTop: 12 }}>{children}</div>
    </Card>
  );
}

function TopicChips({ selected, onToggle }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {TOPICS.map(t => (
        <button key={t} className={`tchip${selected.includes(t) ? ' on' : ''}`} onClick={() => onToggle(t)}>
          <Icon name={TOPIC_IC[t]} size={13} />{t}
        </button>
      ))}
    </div>
  );
}

function OptionGrid({ options, selected, onToggle, columns = 2 }) {
  return (
    <div className="optg" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {options.map(o => (
        <button key={o} className={`opt${selected.includes(o) ? ' on' : ''}`} onClick={() => onToggle(o)}>{o}</button>
      ))}
    </div>
  );
}

function ToolRow({ label, value, onChange }) {
  const st = value ? toolStyle(value) : null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 500, minWidth: 120, color: 'var(--sub)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 6, flex: 1 }}>
        {TOOLS_OPTS.map(o => (
          <button key={o} className={`opt${value === o ? ' on' : ''}`} style={{ flex: 1, fontSize: 12 }} onClick={() => onChange(o)}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function StatusSelect({ label, options, value, onChange, styleFn }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--dim)', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {options.map(o => {
          const s = styleFn(o);
          return (
            <button key={o} className={`opt${value === o ? ' on' : ''}`}
              style={{ flex: 1, fontSize: 12, ...(value === o ? { background: s.bg, color: s.c, borderColor: s.c + '55' } : {}) }}
              onClick={() => onChange(o)}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ActionItemRow({ item, index, onChange, onRemove }) {
  return (
    <div className="arow">
      <input className="inp" placeholder="Action item..." value={item.text} onChange={e => onChange({ text: e.target.value })} />
      <input className="inp" placeholder="Owner" value={item.owner} onChange={e => onChange({ owner: e.target.value })} />
      <input className="inp" type="date" value={item.due} onChange={e => onChange({ due: e.target.value })} />
      <select className="sel" value={item.prio} onChange={e => onChange({ prio: e.target.value })} style={{ paddingLeft: 11 }}>
        {PRIOS.map(p => <option key={p}>{p}</option>)}
      </select>
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--dim)', padding: 0 }}>
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}

function PhotoUpload({ photos, onAdd, onRemove }) {
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onAdd({ src: reader.result, name: file.name });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div>
      <div className="thumbs">
        {photos.map((p, i) => (
          <div key={i} className="thumb">
            <img src={p.src} alt={p.name} />
            <button onClick={() => onRemove(i)}><Icon name="x" size={10} color="#fff" /></button>
          </div>
        ))}
      </div>
      <button className="btn gho sm" style={{ marginTop: 10 }} onClick={() => inputRef.current?.click()}>
        <Icon name="image" size={13} /> Add Photo
      </button>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  );
}

function GenerateBar({ onGenerate, onReview, generating }) {
  return (
    <div className="gen">
      <span className="hint" style={{ flex: 1, fontSize: 12.5, color: 'var(--dim)', minWidth: 200 }}>
        <Icon name="spark" size={13} color="var(--ac)" style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
        AI can generate a summary from your notes
      </span>
      <button className="btn gho" onClick={onGenerate} disabled={generating}>
        <Icon name="spark" size={14} />{generating ? 'Generating...' : 'Generate Summary'}
      </button>
      <button className="btn pri" onClick={onReview}>
        Review Report <Icon name="chev" size={13} style={{ transform: 'rotate(-90deg)' }} />
      </button>
    </div>
  );
}

export function VisitFormView() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const dealer = state.selectedDealer;
  const form = state.form;
  const [generating, setGenerating] = useState(false);

  if (!dealer) return null;

  const toggleArr = (field, value) => dispatch({ type: 'TOGGLE_FORM_ARRAY', field, value });
  const setField = (field, value) => dispatch({ type: 'SET_FORM_FIELD', field, value });
  const setTool = (tool, value) => dispatch({ type: 'SET_TOOL', tool, value });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const summary = await api.generate({
        systemPrompt: 'You are a BMW IAM visit report assistant. Generate a concise professional visit summary.',
        userPrompt: `Dealer: ${dealer.name} (${dealer.code}). Topics: ${form.topics.join(', ')}. Challenges: ${form.challenges.join(', ')}. Opportunities: ${form.opportunities.join(', ')}. Notes: ${form.notes}`,
        maxTokens: 300,
      });
      setField('aiSummary', summary);
      dispatch({ type: 'SHOW_TOAST', message: 'Summary generated', toastType: 'success' });
    } catch {
      dispatch({ type: 'SHOW_TOAST', message: 'Generation failed — check connection', toastType: 'error' });
    }
    setGenerating(false);
  };

  return (
    <>
      <div className="vh">
        <button className="btn gho sm" onClick={() => dispatch({ type: 'GO_HOME' })}>
          <Icon name="x" size={13} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dealer.name}</div>
        </div>
        <div className="vmeta"><div className="ml">Date</div><div className="mv">{fmtD(TODAY)}</div></div>
        <div className="vmeta"><div className="ml">Contact</div><div className="mv">{dealer.contact}</div></div>
        <div className="vmeta"><div className="ml">Signal</div><div className="mv"><Pill label={dealer.signal} color={dealer.signal === 'critical' ? 'red' : dealer.signal === 'watch' ? 'amber' : 'green'} /></div></div>
      </div>

      <div className="scroll">
        <div className="wrap">
          <FormSection num="1" title="Topics Discussed" icon="chat" subtitle="Select all topics covered during the visit">
            <TopicChips selected={form.topics} onToggle={(t) => toggleArr('topics', t)} />
          </FormSection>

          <FormSection num="2" title="Challenges" icon="alert" subtitle="Issues raised by the dealer">
            <OptionGrid options={CHALLENGES} selected={form.challenges} onToggle={(c) => toggleArr('challenges', c)} />
          </FormSection>

          <FormSection num="3" title="Opportunities" icon="zap" subtitle="Growth or improvement opportunities identified">
            <OptionGrid options={OPPS} selected={form.opportunities} onToggle={(o) => toggleArr('opportunities', o)} />
          </FormSection>

          <FormSection num="4" title="Digital Tools" icon="tool" subtitle="Assess adoption of BMW digital platforms">
            <ToolRow label="ConnectDrive" value={form.tools.connectDrive} onChange={(v) => setTool('connectDrive', v)} />
            <ToolRow label="PartsOnline" value={form.tools.partsOnline} onChange={(v) => setTool('partsOnline', v)} />
            <ToolRow label="RetailOnline" value={form.tools.retailOnline} onChange={(v) => setTool('retailOnline', v)} />
          </FormSection>

          <FormSection num="5" title="Status & Priority" icon="target">
            <div className="two">
              <StatusSelect label="Overall Status" options={STATUSES} value={form.status} onChange={(v) => setField('status', v)} styleFn={statusStyle} />
              <StatusSelect label="Follow-up Priority" options={PRIOS} value={form.priority} onChange={(v) => setField('priority', v)} styleFn={prioStyle} />
            </div>
          </FormSection>

          <FormSection num="6" title="Notes" icon="edit" subtitle="Detailed observations and discussion points">
            <textarea
              className="inp"
              rows={5}
              placeholder="Add your visit notes here..."
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              style={{ resize: 'vertical', minHeight: 100 }}
            />
          </FormSection>

          <FormSection num="7" title="Photos" icon="image" subtitle="Attach photos from the visit">
            <PhotoUpload photos={form.photos} onAdd={(p) => dispatch({ type: 'ADD_PHOTO', photo: p })} onRemove={(i) => dispatch({ type: 'REMOVE_PHOTO', index: i })} />
          </FormSection>

          <FormSection num="8" title="Action Items" icon="check" subtitle="Follow-up tasks and responsibilities">
            <div className="arow hd">
              <div>Action</div><div>Owner</div><div>Due Date</div><div>Priority</div><div></div>
            </div>
            {form.actionItems.map((a, i) => (
              <ActionItemRow
                key={i}
                item={a}
                index={i}
                onChange={(data) => dispatch({ type: 'UPDATE_ACTION_ITEM', index: i, data })}
                onRemove={() => dispatch({ type: 'REMOVE_ACTION_ITEM', index: i })}
              />
            ))}
            <button className="btn gho sm" onClick={() => dispatch({ type: 'ADD_ACTION_ITEM' })} style={{ marginTop: 8 }}>
              <Icon name="plus" size={13} /> Add Action
            </button>
          </FormSection>
        </div>
      </div>

      <GenerateBar onGenerate={handleGenerate} onReview={() => dispatch({ type: 'SET_VIEW', view: 'visit-review' })} generating={generating} />
    </>
  );
}
