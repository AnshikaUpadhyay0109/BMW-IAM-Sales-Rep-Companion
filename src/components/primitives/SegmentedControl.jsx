import React from 'react';

export function SegmentedControl({ options, value, onChange, className = '' }) {
  return (
    <div
      className={`seg ${className}`}
      style={{
        display: 'inline-flex',
        background: 'var(--card, #1e1e30)',
        borderRadius: 10,
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`seg-btn ${value === opt.value ? 'seg-btn--active' : ''}`}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'inherit',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'all .15s',
            background: value === opt.value ? 'var(--accent, #a78bfa)' : 'transparent',
            color: value === opt.value ? '#fff' : 'var(--muted, #8a8fa8)',
            whiteSpace: 'nowrap',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
