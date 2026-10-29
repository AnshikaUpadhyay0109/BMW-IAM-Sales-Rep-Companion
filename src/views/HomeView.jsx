import React from 'react';
import { useAppState } from '../state/AppStateContext';
import { DEALERS, SIG, ABC_RANK } from '../data/dealers';
import { ME } from '../data/reps';
import StatsGrid from '../components/home/StatsGrid';
import TerritoryKPIs from '../components/home/TerritoryKPIs';
import SearchBar from '../components/home/SearchBar';
import RepChips from '../components/home/RepChips';
import DealerCard from '../components/home/DealerCard';
import { useIsMobile } from '../hooks/useIsMobile';

export default function HomeView() {
  const state = useAppState();
  const mobile = useIsMobile();
  const { user, repFilter, search, signalFilter, sortBy } = state;
  const isManager = user?.isManager;
  const repId = user?.repId || ME;

  let dealers = isManager
    ? (repFilter ? DEALERS.filter(d => d.rep === repFilter) : [...DEALERS])
    : DEALERS.filter(d => d.rep === repId);

  if (signalFilter !== 'all') {
    dealers = dealers.filter(d => d.signal === signalFilter);
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    dealers = dealers.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      d.contact.toLowerCase().includes(q)
    );
  }

  if (sortBy === 'signal') {
    dealers.sort((a, b) => (SIG[a.signal].r - SIG[b.signal].r) || (ABC_RANK[b.abc] - ABC_RANK[a.abc]));
  } else {
    dealers.sort((a, b) => a.lastDays - b.lastDays);
  }

  const title = isManager ? 'Territory Overview' : `My Territory`;
  const subtitle = isManager ? `Managing ${DEALERS.length} dealers across all reps` : `${dealers.length} dealers assigned`;

  return (
    <>
      <div className="top">
        <div style={{ flex: 1 }}>
          {mobile ? (
            <div className="mh">
              <div className="mh-t">{title}</div>
              <div className="mh-s">{subtitle}</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 2 }}>{subtitle}</div>
            </>
          )}
        </div>
      </div>
      <div className="scroll">
        <div className="wrap">
          <StatsGrid />
          {!isManager && <TerritoryKPIs />}
          <SearchBar />
          {isManager && <RepChips />}
          <div className="resrow">
            <span className="rescount">{dealers.length} dealer{dealers.length !== 1 ? 's' : ''}</span>
          </div>
          {dealers.length === 0 ? (
            <div className="card empty">No dealers match your filters.</div>
          ) : (
            dealers.map(d => <DealerCard key={d.id} dealer={d} />)
          )}
        </div>
      </div>
    </>
  );
}
