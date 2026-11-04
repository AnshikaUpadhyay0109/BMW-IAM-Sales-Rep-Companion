import React, { useState } from 'react';
import { Icon, Logo } from '../primitives/Icon';
import { useAppState, useAppDispatch } from '../../state/AppStateContext';
import { REPS, ME } from '../../data/reps';

export default function MobileTopBar() {
  const [showSheet, setShowSheet] = useState(false);
  const state = useAppState();
  const dispatch = useAppDispatch();
  const user = state.user;
  const isManager = user?.isManager;
  const rep = REPS[user?.repId || ME];
  const ini = user?.name?.split(' ').map(w => w[0]).join('') || '??';
  const territory = isManager ? 'Regional Manager · South England + Midlands' : rep?.territory;

  return (
    <>
      <div className="mtop">
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #0A0E1A, #2D3748)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Logo size={17} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>IAM Copilot</div>
          <div style={{ fontSize: 10.5, color: 'var(--dim)' }}>{isManager ? 'Regional manager' : 'Sales rep'} · BMW</div>
        </div>
        <button className="mav" onClick={() => setShowSheet(true)} aria-label="Account menu">{ini}</button>
      </div>

      {showSheet && (
        <div className="sheet-bg" onClick={() => setShowSheet(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
              <div className="ava" style={{ width: 40, height: 40, fontSize: 14, background: 'linear-gradient(135deg, var(--ac), var(--ac2))' }}>{ini}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--dim)' }}>{territory}</div>
              </div>
            </div>
            <button
              className="btn gho"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}
              onClick={() => {
                const newRole = isManager ? 'rep' : 'manager';
                dispatch({ type: 'LOGOUT' });
                setShowSheet(false);
              }}
            >
              <Icon name="swap" size={15} color="var(--ac)" />
              {isManager ? 'Switch to rep view' : 'Switch to manager view'}
            </button>
            <button
              className="btn gho"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => { dispatch({ type: 'LOGOUT' }); setShowSheet(false); }}
            >
              <Icon name="logout" size={15} color="var(--sub)" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
