import React from 'react';

export function ProgressBar({ value = 0, color = 'var(--accent, #a78bfa)', height = 4, className = '', style = {} }) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height,
        borderRadius: height,
        background: 'var(--border, rgba(255,255,255,0.08))',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          height: '100%',
          borderRadius: height,
          background: color,
          transition: 'width .4s ease',
        }}
      />
    </div>
  );
}
