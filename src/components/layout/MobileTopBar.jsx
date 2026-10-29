import React, { useState } from 'react';
import { Icon } from '../primitives/Icon';
import { useAppState, useAppDispatch } from '../../state/AppStateContext';

export default function MobileTopBar() {
  const [showSheet, setShowSheet] = useState(false);
  const state = useAppState();
  const dispatch = useAppDispatch();
  const user = state.user;
  const ini = user?.name?.split(' ').map(w => w[0]).join('') || '??';

  return (
    <>
      <div className="mtop">
        <button className="mav" onClick={() => setShowSheet(true)}>{ini}</button>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>IAM Copilot</span>
        <Icon name="alert" size={18} color="var(--dim)" />
      </div>

      {showSheet && (
        <div className="sheet-bg" onClick={() => setShowSheet(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div className="ava" style={{ width: 40, height: 40, fontSize: 14, background: 'linear-gradient(135deg, var(--ac), var(--ac2))' }}>{ini}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{user?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--dim)' }}>{user?.isManager ? 'Area Manager' : 'Sales Rep'}</div>
              </div>
            </div>
            <button
              className="btn dan"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => { dispatch({ type: 'LOGOUT' }); setShowSheet(false); }}
            >
              <Icon name="logout" size={15} color="#fff" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
