import React from 'react';
import { Icon } from '../primitives/Icon';
import { useAppState, useAppDispatch } from '../../state/AppStateContext';

export default function SearchBar() {
  const { search, signalFilter, sortBy } = useAppState();
  const dispatch = useAppDispatch();
  const signals = ['all', 'critical', 'watch', 'positive'];
  const labels = { all: 'All', critical: 'Critical', watch: 'Watch', positive: 'Positive' };

  return (
    <div className="card srch">
      <div className="srch-in">
        <Icon name="search" size={15} color="var(--dim)" className="si" />
        <input
          className="inp bg"
          placeholder="Search dealers..."
          value={search}
          onChange={e => dispatch({ type: 'SET_SEARCH', search: e.target.value })}
        />
        {search && (
          <button className="srch-x" onClick={() => dispatch({ type: 'SET_SEARCH', search: '' })}>
            <Icon name="x" size={13} color="var(--dim)" />
          </button>
        )}
      </div>
      <div className="seg">
        {signals.map(s => (
          <button
            key={s}
            className={signalFilter === s ? 'on' : ''}
            onClick={() => dispatch({ type: 'SET_SIGNAL_FILTER', signalFilter: s })}
          >
            {labels[s]}
          </button>
        ))}
      </div>
      <span style={{ fontSize: 12, color: 'var(--dim)' }}>
        <button
          className="btn gho sm"
          onClick={() => dispatch({ type: 'SET_SORT', sortBy: sortBy === 'signal' ? 'recent' : 'signal' })}
        >
          <Icon name="swap" size={13} />
          {sortBy === 'signal' ? 'By signal' : 'Recent'}
        </button>
      </span>
    </div>
  );
}
