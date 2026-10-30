import React from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useAppState, useAppDispatch } from '../../state/AppStateContext';
import DesktopSidebar from './DesktopSidebar';
import MobileTopBar from './MobileTopBar';
import MobileTabBar from './MobileTabBar';
import { Toast } from '../primitives/Toast';

function ConnectedToast() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  if (!state.toast) return null;
  return (
    <Toast
      message={state.toast.message}
      type={state.toast.type}
      visible={true}
      onClose={() => dispatch({ type: 'HIDE_TOAST' })}
    />
  );
}

export default function AppShell({ children }) {
  const mobile = useIsMobile();
  const state = useAppState();
  const fullScreen = state.view !== 'home';

  if (mobile) {
    return (
      <div className="shell m">
        {!fullScreen && <MobileTopBar />}
        <div className="main">
          {children}
        </div>
        {!fullScreen && <MobileTabBar />}
        <ConnectedToast />
      </div>
    );
  }

  return (
    <div className="shell">
      <DesktopSidebar />
      <div className="main">
        {children}
      </div>
      <ConnectedToast />
    </div>
  );
}
