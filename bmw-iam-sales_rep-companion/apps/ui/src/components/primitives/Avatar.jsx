import React from 'react';

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function hashColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const colors = ['#A100FF', '#11834A', '#C8283C', '#1A73E8', '#A35F00', '#7B2FBE'];
  return colors[Math.abs(h) % colors.length];
}

export function Avatar({ name = '', size = 32, src, color, className = '', style = {} }) {
  const bg = color || hashColor(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.4),
        fontWeight: 700,
        letterSpacing: 0.5,
        flexShrink: 0,
        ...style,
      }}
    >
      {initials(name)}
    </div>
  );
}
