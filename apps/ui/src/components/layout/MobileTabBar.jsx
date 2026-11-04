import React from 'react';
import { Icon } from '../primitives/Icon';
import { useAppState, useAppDispatch } from '../../state/AppStateContext';

export default function MobileTabBar() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const isManager = state.user?.isManager;

  const repTabs = [
    { id: 'home', icon: 'store', label: 'My Retailers', active: true },
    { id: 'plan', icon: 'zap', label: 'Plan', soon: true },
    { id: 'calendar', icon: 'cal', label: 'Calendar', soon: true },
    { id: 'compare', icon: 'columns', label: 'Compare', soon: true },
    { id: 'copilot', icon: 'chat', label: 'Copilot', soon: true },
  ];

  const managerTabs = [
    { id: 'home', icon: 'store', label: 'Dealers', active: true },
    { id: 'briefing', icon: 'home', label: 'Briefing', soon: true },
    { id: 'team', icon: 'users', label: 'Team', soon: true },
    { id: 'reports', icon: 'doc', label: 'Reports', soon: true },
    { id: 'copilot', icon: 'chat', label: 'Copilot', soon: true },
  ];

  const tabs = isManager ? managerTabs : repTabs;

  const handleSoon = (label) => {
    dispatch({ type: 'SHOW_TOAST', message: `${label} is coming soon in the full release`, toastType: 'info' });
  };

  return (
    <nav className="tabbar">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab${tab.active ? ' on' : ''}`}
          onClick={() => tab.active ? dispatch({ type: 'SET_VIEW', view: 'home' }) : handleSoon(tab.label)}
        >
          <Icon name={tab.icon} size={20} color={tab.active ? 'var(--ac)' : '#97A1B1'} />
          <span>{tab.label}</span>
          {tab.soon && <em>Soon</em>}
        </button>
      ))}
    </nav>
  );
}
