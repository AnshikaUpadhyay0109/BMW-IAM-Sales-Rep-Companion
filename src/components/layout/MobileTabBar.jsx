import React from 'react';
import { Icon } from '../primitives/Icon';
import { useAppState, useAppDispatch } from '../../state/AppStateContext';

export default function MobileTabBar() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const tabs = [
    { id: 'home', icon: 'home', label: 'Home', active: true },
    { id: 'dealers', icon: 'store', label: 'Dealers', soon: true },
    { id: 'reports', icon: 'doc', label: 'Reports', soon: true },
    { id: 'chat', icon: 'chat', label: 'Chat', soon: true },
  ];

  return (
    <div className="tabbar">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab${tab.active ? ' on' : ''}`}
          onClick={() => tab.active && dispatch({ type: 'SET_VIEW', view: 'home' })}
        >
          <Icon name={tab.icon} size={20} />
          <span>{tab.label}</span>
          {tab.soon && <em>Soon</em>}
        </button>
      ))}
    </div>
  );
}
