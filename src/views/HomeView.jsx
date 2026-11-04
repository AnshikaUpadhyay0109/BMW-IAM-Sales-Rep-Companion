import React, { useCallback } from 'react';
import { useAppState, useAppDispatch } from '../state/AppStateContext';
import { SIG, ABC_RANK } from '../data/dealers';
import { REPS, ME } from '../data/reps';
import StatsGrid from '../components/home/StatsGrid';
import SearchBar from '../components/home/SearchBar';
import RepChips from '../components/home/RepChips';
import DealerCard from '../components/home/DealerCard';
import { useIsMobile } from '../hooks/useIsMobile';
import { MONTH_YEAR } from '../utils/formatters';
import { api } from '../services/api';

export default function HomeView() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const mobile = useIsMobile();
  const { user, repFilter, search, signalFilter, sortBy, dealers, dealersLoading } = state;
  const isManager = user?.isManager;
  const repId = user?.repId || ME;
  const rep = REPS[repId];

  let allDealers = isManager
    ? (repFilter ? dealers.filter(d => d.rep === repFilter) : [...dealers])
    : dealers.filter(d => d.rep === repId);

  let filtered = [...allDealers];

  if (signalFilter !== 'all') {
    filtered = filtered.filter(d => d.signal === signalFilter);
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => (SIG[a.signal]?.r ?? 2) - (SIG[b.signal]?.r ?? 2) || (ABC_RANK[b.abc] || 0) - (ABC_RANK[a.abc] || 0));

  const title = isManager ? 'Dealer overview' : 'My Retailers';
  const subtitle = isManager
    ? `Anna Weber · South England + Midlands · ${MONTH_YEAR}`
    : `${rep?.name} · ${rep?.territory} · ${MONTH_YEAR}`;

  const countText = search.trim()
    ? `Showing ${filtered.length} of ${allDealers.length} dealers`
    : `${allDealers.length} dealers · critical first, then longest since last visit`;

  const allOpen = filtered.length > 0 && filtered.every(d => state.openDealerIds.includes(d.id));

  function handleExpandAll() {
    const allIds = filtered.map(d => d.id);
    allIds.forEach(id => {
      if (allOpen) {
        dispatch({ type: 'TOGGLE_DEALER', id });
      } else if (!state.openDealerIds.includes(id)) {
        dispatch({ type: 'TOGGLE_DEALER', id });
      }
    });
  }

  const handleViewReport = useCallback((dealer) => {
    const vs = state.dealerVisitStatus?.[dealer.code];
    // Fetch latest submitted visit via /search?status=submitted (sorted by updated_at desc in backend)
    api.getLatestVisitCapture(dealer.code, 'dealer', 'submitted')
      .then(res => {
        const visit = res?.visit;
        if (!visit) {
          dispatch({ type: 'SHOW_TOAST', message: 'No report found for this dealer', type2: 'error' });
          return;
        }
        const fd = visit.form_data || {};
        const report = {
          dealerName: dealer.name,
          dealerCode: dealer.code,
          contact: dealer.contact,
          contactTitle: dealer.ctitle,
          rep: dealer.rep || ME,
          visitDate: visit.visit_date,
          dealerStatus: fd.overall_status,
          topics: fd.topics_discussed || [],
          notes: fd.visit_notes,
          pl24: fd.tools_usage?.pl24,
          aos: fd.tools_usage?.aos,
          challenge: fd.biggest_challenge,
          opportunity: fd.biggest_opportunity,
          comp: fd.competitor_activity?.comment,
          photos: [],
          actions: (fd.actions_agreed || []).map(a => ({
            text: a.text || a.action,
            owner: a.owner,
            due: a.due || a.dueDate,
            prio: a.prio || a.priority,
          })),
        };
        // Resolve photo S3 keys to pre-signed URLs
        const photoRefs = fd.photos || [];
        if (photoRefs.length > 0) {
          Promise.all(photoRefs.map(p =>
            api.getPhotoUrl(p.key).then(url => ({ src: url, name: p.name })).catch(() => null)
          )).then(photos => {
            report.photos = photos.filter(Boolean);
            dispatch({ type: 'SET_REPORT', report });
          });
        }
        dispatch({ type: 'VIEW_REPORT', dealer, report });
        const visitId = vs?.visitId || visit.visit_id;
        if (visitId && !vs?.managerViewed) {
          api.patchVisitCapture(dealer.code, visitId, { manager_viewed: true }).catch(() => {});
        }
      })
      .catch(() => {
        dispatch({ type: 'SHOW_TOAST', message: 'Failed to load report', type2: 'error' });
      });
  }, [dispatch, state.dealerVisitStatus]);

  return (
    <>
      {!mobile && (
        <div className="top">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</div>
            <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 2 }}>{subtitle}</div>
          </div>
        </div>
      )}
      <div className="scroll">
        <div className="wrap">
          {mobile && (
            <div className="mh">
              <div className="mh-t">{title}</div>
              <div className="mh-s">{subtitle}</div>
            </div>
          )}
          <StatsGrid />
          {isManager && <RepChips />}
          <SearchBar />
          <div className="resrow">
            <div className="rescount">{countText}</div>
            {filtered.length > 0 && (
              <button className="lnk" onClick={handleExpandAll}>
                {allOpen ? 'Collapse all' : 'Expand all'}
              </button>
            )}
          </div>
          {dealersLoading ? (
            <div className="card empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span className="spin" style={{ width: 22, height: 22, borderRadius: '50%', border: '2.5px solid rgba(161,0,255,.2)', borderTopColor: 'var(--ac)', display: 'inline-block' }} />
              Loading dealers from API…
            </div>
          ) : filtered.length === 0 ? (
            <div className="card empty">No dealers match your filters.</div>
          ) : (
            filtered.map(d => <DealerCard key={d.id} dealer={d} onViewReport={handleViewReport} />)
          )}
        </div>
      </div>
    </>
  );
}
