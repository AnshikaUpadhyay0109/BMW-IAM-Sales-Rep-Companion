import React from 'react';

export function Card({ children, className = '', style = {}, onClick }) {
  return (
    <div
      className={`card ${className}`}
      onClick={onClick}
      style={{
        background: 'var(--card, #1e1e30)',
        borderRadius: 14,
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        padding: 20,
        cursor: onClick ? 'pointer' : undefined,
        transition: 'border-color .15s',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
