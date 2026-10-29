import React from 'react';
import { AppStateProvider, useAppState } from './state/AppStateContext';
import { LoginView } from './views/LoginView';
import HomeView from './views/HomeView';
import { VisitFormView } from './views/VisitFormView';
import CaptureView from './views/CaptureView';
import ReviewView from './views/ReviewView';
import { ReportView } from './views/ReportView';
import { VisitReviewView } from './views/VisitReviewView';
import AppShell from './components/layout/AppShell';

function AppContent() {
  const state = useAppState();

  const viewMap = {
    home: <HomeView />,
    visit: <VisitFormView />,
    capture: <CaptureView />,
    review: <ReviewView />,
    'visit-review': <VisitReviewView />,
    report: <ReportView />,
  };

  return (
    <AppShell>
      {viewMap[state.view] || <HomeView />}
    </AppShell>
  );
}

function AppInner() {
  const state = useAppState();

  if (!state.user) {
    return <LoginView />;
  }

  return <AppContent />;
}

export default function App() {
  return (
    <AppStateProvider>
      <AppInner />
    </AppStateProvider>
  );
}
