import React from 'react';

const COLORS = {
  green:  { c: '#11834A', bg: '#E8F7EF' },
  amber:  { c: '#A35F00', bg: '#FFF4DC' },
  red:    { c: '#C8283C', bg: '#FDECEE' },
  blue:   { c: '#1A73E8', bg: '#E8F0FE' },
  grey:   { c: '#3D4A5C', bg: '#F0F2F7' },
  purple: { c: '#7B2FBE', bg: '#F3E8FF' },
};

export function Pill({ label, color = 'grey', size = 'sm', className = '', style = {} }) {
  const palette = COLORS[color] || COLORS.grey;
  return (
    <span
      className={`pill ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        fontSize: size === 'sm' ? 11 : 12,
        fontWeight: 600,
        borderRadius: 20,
        color: palette.c,
        background: palette.bg,
        whiteSpace: 'nowrap',
        letterSpacing: 0.2,
        ...style,
      }}
    >
      {label}
    </span>
  );
}
