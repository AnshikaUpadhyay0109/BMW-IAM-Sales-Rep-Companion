import React, { useEffect, useRef } from 'react';
import { AppStateProvider, useAppState, useAppDispatch } from './state/AppStateContext';
import { LoginView } from './views/LoginView';
import HomeView from './views/HomeView';
import { VisitFormView } from './views/VisitFormView';
import { ReportView } from './views/ReportView';
import { VisitReviewView } from './views/VisitReviewView';
import AppShell from './components/layout/AppShell';
import { api } from './services/api';
import { REP_DEALER_MAP, normalizeDealerFromApi } from './data/dealers';

function AppContent() {
  const state = useAppState();

  const viewMap = {
    home: <HomeView />,
    visit: <VisitFormView />,
    review: <VisitReviewView />,
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
  const dispatch = useAppDispatch();
  const fetched = useRef(false);

  useEffect(() => {
    if (!state.user || fetched.current) return;
    fetched.current = true;

    const isManager = state.user.isManager;
    const repId = state.user.repId || 'ms';
    const mapKey = isManager ? 'manager' : repId;
    const codes = REP_DEALER_MAP[mapKey];
    if (!codes || codes.length === 0) return;

    dispatch({ type: 'SET_DEALERS_LOADING', loading: true });

    api.getAllDealerKpis(codes).then(results => {
      const dealers = results
        .filter(r => r != null)
        .map(r => normalizeDealerFromApi(r, isManager ? 'ms' : repId));
      dispatch({ type: 'SET_DEALERS', dealers });

      // Fetch visit status for each dealer: /draft for drafts, /search for submitted
      Promise.allSettled(
        codes.map(code => {
          const extract = (visit) => ({
            code, status: visit.status, visitDate: visit.visit_date || null,
            managerViewed: !!visit.manager_viewed, visitId: visit.visit_id || null,
            summary: visit.form_data?.visit_summary || null,
          });

          // Fetch draft and latest submitted in parallel
          return Promise.all([
            api.getDraftVisitCapture(code, 'dealer').then(r => r?.draft).catch(() => null),
            api.getLatestVisitCapture(code, 'dealer', 'submitted').then(r => r?.visit).catch(() => null),
          ]).then(([draft, submitted]) => {
            // Prefer submitted over draft for status display
            if (submitted) return extract(submitted);
            if (draft) return extract(draft);
            return null;
          });
        })
      ).then(results => {
        const statuses = {};
        results.forEach(r => {
          if (r.status === 'fulfilled' && r.value) {
            statuses[r.value.code] = { status: r.value.status, visitDate: r.value.visitDate, managerViewed: r.value.managerViewed, visitId: r.value.visitId, summary: r.value.summary };
          }
        });
        if (Object.keys(statuses).length > 0) {
          dispatch({ type: 'SET_DEALER_VISIT_STATUSES', statuses });
        }
      });
    }).catch(err => {
      console.error('Failed to fetch dealers:', err);
      dispatch({ type: 'SET_DEALERS_LOADING', loading: false });
    });
  }, [state.user, dispatch]);

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
