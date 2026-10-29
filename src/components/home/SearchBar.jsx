import React from 'react';
import { Icon } from '../primitives/Icon';
import { useAppState, useAppDispatch } from '../../state/AppStateContext';

export default function SearchBar() {
  const { search } = useAppState();
  const dispatch = useAppDispatch();

  return (
    <div className="card srch">
      <div className="srch-in">
        <Icon name="search" size={16} color="var(--dim)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          className="inp"
          placeholder="Search your dealers by name…"
          value={search}
          onChange={e => dispatch({ type: 'SET_SEARCH', search: e.target.value })}
          style={{ paddingLeft: 34, paddingRight: 32, background: 'var(--bg)' }}
        />
        {search && (
          <button
            className="srch-x"
            onClick={() => dispatch({ type: 'SET_SEARCH', search: '' })}
          >
            <Icon name="x" size={14} color="var(--dim)" />
          </button>
        )}
      </div>
      <span style={{ fontSize: '11.5px', color: 'var(--dim)', whiteSpace: 'nowrap' }} title="All KPI changes compare with last month">
        Changes vs last month
      </span>
    </div>
  );
}
