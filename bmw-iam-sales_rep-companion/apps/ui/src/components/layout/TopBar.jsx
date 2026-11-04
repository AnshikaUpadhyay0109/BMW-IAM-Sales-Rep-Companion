import React from 'react';
import { Icon } from '../primitives/Icon';
import { useAppDispatch } from '../../state/AppStateContext';

export default function TopBar({ title, subtitle, onBack }) {
  const dispatch = useAppDispatch();
  const handleBack = onBack || (() => dispatch({ type: 'RESET_VISIT' }));

  return (
    <div className="top">
      <button className="btn gho sm" onClick={handleBack}>
        <Icon name="chev" size={14} style={{ transform: 'rotate(90deg)' }} />
        Back
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11.5, color: 'var(--dim)', marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
  );
}
