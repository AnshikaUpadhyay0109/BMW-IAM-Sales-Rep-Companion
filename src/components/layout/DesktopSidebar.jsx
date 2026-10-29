import React, { useState } from 'react';
import { Icon, Logo } from '../primitives/Icon';
import { useAppState, useAppDispatch } from '../../state/AppStateContext';

export default function DesktopSidebar() {
  const [wide, setWide] = useState(true);
  const state = useAppState();
  const dispatch = useAppDispatch();
  const user = state.user;
  const view = state.view;

  const navItems = [
    { id: 'home', icon: 'home', label: 'Home', view: 'home' },
    { id: 'dealers', icon: 'store', label: 'Dealers', view: 'home' },
    { id: 'reports', icon: 'doc', label: 'Visit Reports', view: 'home', soon: true },
  ];

  const ini = user?.name?.split(' ').map(w => w[0]).join('') || '??';

  return (
    <div className="sb" style={{ width: wide ? 224 : 52 }}>
      <div className="sb-top" style={{ padding: wide ? '14px 14px 12px' : '14px 10px 12px', justifyContent: wide ? 'flex-start' : 'center' }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--ac), var(--ac2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Logo size={18} />
        </div>
        {wide && <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>IAM Copilot</span>}
        <button onClick={() => setWide(!wide)} style={{ marginLeft: 'auto', background: 'none', border: 'none', padding: 4 }}>
          <Icon name="columns" size={15} color="var(--dim)" />
        </button>
      </div>

      {wide && (
        <div className="sb-user">
          <div className="ava" style={{ width: 28, height: 28, fontSize: 10, background: 'linear-gradient(135deg, var(--ac), var(--ac2))' }}>{ini}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{user?.name}</div>
            <div style={{ fontSize: 10.5, color: 'var(--dim)' }}>{user?.isManager ? 'Area Manager' : 'Sales Rep'}</div>
          </div>
        </div>
      )}

      <nav className="nav" style={{ padding: wide ? '8px 8px' : '8px 6px' }}>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nb${view === item.view && item.id === 'home' ? ' on' : ''}${item.soon ? ' soon' : ''}`}
            style={{ padding: wide ? '9px 10px' : '9px', justifyContent: wide ? 'flex-start' : 'center', gap: wide ? 10 : 0 }}
            onClick={() => !item.soon && dispatch({ type: 'SET_VIEW', view: item.view })}
          >
            <Icon name={item.icon} size={17} />
            {wide && <span>{item.label}</span>}
            {wide && item.soon && <span className="soon-tag" style={{ marginLeft: 'auto' }}>Soon</span>}
          </button>
        ))}
      </nav>

      <div className="sb-foot" style={{ padding: wide ? '8px 8px 12px' : '8px 6px 12px' }}>
        <button className="sbtn soon" style={{ padding: wide ? '8px 10px' : '8px', justifyContent: wide ? 'flex-start' : 'center', gap: wide ? 9 : 0, background: 'none', border: 'none', color: 'var(--dim)' }}>
          <Icon name="tool" size={15} />
          {wide && <span>Settings</span>}
        </button>
        <button
          className="sbtn"
          style={{ padding: wide ? '8px 10px' : '8px', justifyContent: wide ? 'flex-start' : 'center', gap: wide ? 9 : 0, background: 'none', border: 'none', color: 'var(--red)' }}
          onClick={() => dispatch({ type: 'LOGOUT' })}
        >
          <Icon name="logout" size={15} />
          {wide && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}
