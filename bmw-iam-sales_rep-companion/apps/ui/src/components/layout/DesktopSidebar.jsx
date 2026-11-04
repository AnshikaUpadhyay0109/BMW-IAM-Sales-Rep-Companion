import React, { useState } from 'react';
import { Icon, Logo } from '../primitives/Icon';
import { useAppState, useAppDispatch } from '../../state/AppStateContext';
import { REPS, ME } from '../../data/reps';

export default function DesktopSidebar() {
  const [wide, setWide] = useState(true);
  const state = useAppState();
  const dispatch = useAppDispatch();
  const user = state.user;
  const view = state.view;
  const isManager = user?.isManager;
  const rep = REPS[user?.repId || ME];

  const repNav = [
    { id: 'dealers', icon: 'store', label: 'My Retailers', view: 'home', active: true },
    { id: 'plan', icon: 'zap', label: "Today's plan", soon: true },
    { id: 'calendar', icon: 'cal', label: 'Calendar', soon: true },
    { id: 'compare', icon: 'columns', label: 'Compare', soon: true },
    { id: 'copilot', icon: 'chat', label: 'Ask Copilot', soon: true },
  ];

  const managerNav = [
    { id: 'dealers', icon: 'store', label: 'Dealers', view: 'home', active: true },
    { id: 'briefing', icon: 'doc', label: 'Briefing', soon: true },
    { id: 'compare', icon: 'columns', label: 'Compare', soon: true },
    { id: 'team', icon: 'users', label: 'Team', soon: true },
    { id: 'campaigns', icon: 'mega', label: 'Campaigns', soon: true },
    { id: 'reports', icon: 'doc', label: 'Reports', soon: true },
    { id: 'copilot', icon: 'chat', label: 'Ask Copilot', soon: true },
  ];

  const navItems = isManager ? managerNav : repNav;

  const ini = user?.name?.split(' ').map(w => w[0]).join('') || '??';

  return (
    <div className="sb" style={{ width: wide ? 224 : 52 }}>
      <div className="sb-top" style={{ padding: wide ? '14px 14px 12px' : '14px 10px 12px', justifyContent: wide ? 'flex-start' : 'center' }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--ac), var(--ac2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Logo size={18} />
        </div>
        {wide && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>IAM Copilot</div>
            <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 1 }}>{isManager ? 'Manager · BMW' : 'Rep · BMW'}</div>
          </div>
        )}
        <button onClick={() => setWide(!wide)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--dim)', fontSize: 16 }}>
          {wide ? '‹' : '›'}
        </button>
      </div>

      {wide && (
        <div className="sb-user">
          <div className="ava" style={{ width: 28, height: 28, fontSize: 10, background: isManager ? 'linear-gradient(135deg, #460073, #460073BB)' : `linear-gradient(135deg, ${rep?.color || 'var(--ac)'}, ${rep?.color || 'var(--ac)'}BB)` }}>{ini}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{user?.name}</div>
            <div style={{ fontSize: 10.5, color: 'var(--dim)' }}>{isManager ? 'Regional Manager' : rep?.territory}</div>
          </div>
        </div>
      )}

      <nav className="nav" style={{ padding: wide ? '8px 8px' : '8px 6px' }}>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nb${item.active ? ' on' : ''}${item.soon ? ' soon' : ''}`}
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
        <button
          className="sbtn"
          style={{ padding: wide ? '8px 10px' : '8px', justifyContent: wide ? 'flex-start' : 'center', gap: wide ? 9 : 0, background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}
          onClick={() => dispatch({ type: 'LOGOUT' })}
        >
          <Icon name="logout" size={15} />
          {wide && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}
