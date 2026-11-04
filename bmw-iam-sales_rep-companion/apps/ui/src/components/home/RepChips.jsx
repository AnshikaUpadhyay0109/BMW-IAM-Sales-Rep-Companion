import React from 'react';
import { REPS } from '../../data/reps';
import { useAppState, useAppDispatch } from '../../state/AppStateContext';

export default function RepChips() {
  const { repFilter } = useAppState();
  const dispatch = useAppDispatch();
  const reps = Object.values(REPS);

  return (
    <div className="chips">
      <button
        className={`rchip${!repFilter ? ' on' : ''}`}
        onClick={() => dispatch({ type: 'SET_REP_FILTER', repFilter: null })}
      >
        All reps
      </button>
      {reps.map(r => (
        <button
          key={r.id}
          className={`rchip${repFilter === r.id ? ' on' : ''}`}
          onClick={() => dispatch({ type: 'SET_REP_FILTER', repFilter: repFilter === r.id ? null : r.id })}
        >
          <div className="ava" style={{ width: 22, height: 22, fontSize: 9, background: r.color }}>{r.ini}</div>
          {r.first}
        </button>
      ))}
    </div>
  );
}
