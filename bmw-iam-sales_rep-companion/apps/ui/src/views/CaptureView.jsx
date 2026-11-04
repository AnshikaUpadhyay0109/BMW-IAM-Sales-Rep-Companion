import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '../components/primitives/Icon';
import { useAppState, useAppDispatch } from '../state/AppStateContext';
import { VOICE_SCRIPTS } from '../data/voiceScripts';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useIsMobile } from '../hooks/useIsMobile';
import { TOPICS, TOPIC_IC, CHALLENGES, OPPS, STATUSES, statusStyle } from '../data/pickLists';
import { fmtClock } from '../utils/formatters';

const CHECKLIST = [
  { id: 'topics', label: 'Discussion Topics' },
  { id: 'notes', label: 'Key Notes' },
  { id: 'challenges', label: 'Challenges' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'status', label: 'Dealer Status' },
  { id: 'actions', label: 'Action Items' },
];

export default function CaptureView() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const mobile = useIsMobile();
  const dealer = state.selectedDealer;
  const [mode, setMode] = useState('idle');
  const [caption, setCaption] = useState('');
  const [prevCaption, setPrevCaption] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const timersRef = useRef([]);
  const clockRef = useRef(null);
  const startTimeRef = useRef(0);

  const form = state.form || {};

  const onTranscript = useCallback((text) => {
    const existing = form.notes || '';
    dispatch({ type: 'UPDATE_FORM', updates: { notes: existing + (existing ? ' ' : '') + text } });
  }, [form.notes, dispatch]);

  const recorder = useVoiceRecorder({
    onTranscript,
    visitId: dealer?.id,
    folder: 'dealer',
  });

  const startSim = () => {
    const script = VOICE_SCRIPTS[dealer?.id];
    if (!script) {
      startReal();
      return;
    }
    setMode('sim');
    setCaption('');
    setPrevCaption('');
    startTimeRef.current = Date.now();

    clockRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 200);

    script.forEach(evt => {
      const timer = setTimeout(() => {
        if (evt.field === '_caption') {
          setPrevCaption(prev => prev ? prev : '');
          setCaption(evt.text);
        } else {
          dispatch({ type: 'UPDATE_FORM', updates: { [evt.field]: evt.value || ((form[evt.field] || '') + evt.text) } });
        }
      }, evt.t);
      timersRef.current.push(timer);
    });

    const lastT = script[script.length - 1].t;
    const endTimer = setTimeout(() => {
      setMode('done');
      clearInterval(clockRef.current);
    }, lastT + 2000);
    timersRef.current.push(endTimer);
  };

  const startReal = async () => {
    setMode('real');
    startTimeRef.current = Date.now();
    clockRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 200);
    await recorder.start();
  };

  const stopCapture = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    clearInterval(clockRef.current);
    if (mode === 'real') recorder.stop();
    setMode('done');
  };

  const pauseCapture = () => {
    if (mode === 'real') recorder.pause();
    clearInterval(clockRef.current);
    setMode('paused');
  };

  const resumeCapture = () => {
    if (mode === 'real') recorder.resume();
    startTimeRef.current = Date.now() - elapsed;
    clockRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 200);
    setMode('real');
  };

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      clearInterval(clockRef.current);
    };
  }, []);

  const isLive = mode === 'sim' || mode === 'real';
  const checkedFields = CHECKLIST.map(c => {
    const val = form[c.id];
    return { ...c, done: Array.isArray(val) ? val.length > 0 : !!val, value: Array.isArray(val) ? val.join(', ') : (typeof val === 'string' ? val.slice(0, 80) : '') };
  });
  const doneCount = checkedFields.filter(c => c.done).length;

  const capturePanel = (
    <div>
      <div className="lp-h">
        <div className={`orb${isLive ? ' live pulse' : mode === 'done' ? ' done' : ''}`}>
          {isLive ? <Icon name="mic" size={18} color="#fff" /> : mode === 'done' ? <Icon name="check" size={18} color="var(--green)" /> : <Icon name="mic" size={18} color="var(--dim)" />}
        </div>
        <div>
          <div className="lp-t">{isLive ? 'Recording...' : mode === 'done' ? 'Capture Complete' : 'Live Capture'}</div>
          <div className="lp-s">{isLive ? fmtClock(elapsed) : mode === 'done' ? `${fmtClock(elapsed)} captured` : 'Ready to start'}</div>
        </div>
      </div>

      <div className={`wave${isLive ? '' : ' still'}`} style={{ margin: '14px 0 4px', height: 38 }}>
        {Array.from({ length: 24 }, (_, i) => (
          <i key={i} style={{ animationDelay: `${i * 0.07}s` }} />
        ))}
      </div>

      <div className="lp-btns">
        {mode === 'idle' && (
          <>
            <button className="btn pri" onClick={startSim}><Icon name="play" size={14} color="#fff" /> Start Capture</button>
            <button className="btn gho" onClick={startReal}><Icon name="mic" size={14} /> Real Mic</button>
          </>
        )}
        {isLive && (
          <>
            <button className="btn dan" onClick={stopCapture}><Icon name="stop" size={14} color="#fff" /> Stop</button>
            {mode === 'real' && recorder.pauseSupported && (
              <button className="btn gho" onClick={pauseCapture}><Icon name="pause" size={14} /> Pause</button>
            )}
          </>
        )}
        {mode === 'paused' && (
          <>
            <button className="btn pri" onClick={resumeCapture}><Icon name="play" size={14} color="#fff" /> Resume</button>
            <button className="btn dan" onClick={stopCapture}><Icon name="stop" size={14} color="#fff" /> Stop</button>
          </>
        )}
        {mode === 'done' && (
          <button className="btn pri" onClick={() => dispatch({ type: 'SET_VIEW', view: 'visit' })}>
            <Icon name="check" size={14} color="#fff" /> Back to Form
          </button>
        )}
      </div>

      <div className="cap">
        {prevCaption && <div className="cap-prev">{prevCaption}</div>}
        {caption ? <div className={`cap-cur${isLive ? ' typing' : ''}`}>{caption}</div> : (
          <div className="cap-empty">{isLive ? 'Listening...' : 'Captions will appear here'}</div>
        )}
      </div>

      <div className="lp-ct">
        <span>Capture checklist</span>
        <span className="cnt-all">{doneCount}/{CHECKLIST.length}</span>
      </div>
      <div>
        {checkedFields.map(c => (
          <div key={c.id} className={`chk${c.done ? ' on' : ''}`}>
            <div className="chk-i">{c.done && <Icon name="check" size={10} color="#fff" />}</div>
            <div>
              <div className="chk-l">{c.label}</div>
              {c.done && c.value && <div className="chk-v">{c.value}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="vh">
        <button className="btn gho sm" onClick={() => dispatch({ type: 'SET_VIEW', view: 'visit' })}>
          <Icon name="chev" size={14} style={{ transform: 'rotate(90deg)' }} /> Form
        </button>
        <div style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>Live Capture — {dealer?.name}</div>
      </div>

      {mobile ? (
        <>
          <div className="scroll">
            <div className="wrap" style={{ maxWidth: 820 }}>
              {capturePanel}
            </div>
          </div>
        </>
      ) : (
        <div className="vgrid">
          <div className="scroll">
            <div className="wrap" style={{ maxWidth: 820 }}>
              <div className="tip"><Icon name="spark" size={14} color="var(--ac)" /> Form fields auto-fill as the conversation is captured</div>
              {/* Simplified form sections showing current values */}
              {CHECKLIST.map(c => {
                const val = form[c.id];
                const hasVal = Array.isArray(val) ? val.length > 0 : !!val;
                return (
                  <div key={c.id} className={`card fc${hasVal ? '' : ''}`} style={{ marginBottom: 10 }}>
                    <div className="fc-t">
                      {c.label}
                      {hasVal && <span className="aitag">AI filled</span>}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, color: hasVal ? 'var(--ink)' : 'var(--dim)' }}>
                      {Array.isArray(val) ? val.join(', ') : (val || 'Waiting for capture...')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="lp">
            {capturePanel}
          </div>
        </div>
      )}
    </>
  );
}
