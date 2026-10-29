import React from 'react';
import { Icon } from './Icon';

const VARIANTS = {
  primary:   { bg: '#fff', color: '#1a1a2e', border: '1px solid var(--border, #e2e4ea)' },
  secondary: { bg: 'transparent', color: 'var(--text, #e0e0e0)', border: '1px solid var(--border, rgba(255,255,255,0.12))' },
  ghost:     { bg: 'transparent', color: 'var(--text, #e0e0e0)', border: '1px solid transparent' },
  danger:    { bg: '#C8283C', color: '#fff', border: '1px solid #C8283C' },
};

const SIZES = {
  sm: { padding: '5px 12px', fontSize: 12, height: 30, iconSize: 13 },
  md: { padding: '7px 16px', fontSize: 13, height: 36, iconSize: 14 },
  lg: { padding: '10px 24px', fontSize: 14, height: 42, iconSize: 16 },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  disabled = false,
  loading = false,
  onClick,
  className = '',
  type = 'button',
  style = {},
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;

  return (
    <button
      type={type}
      className={`btn btn--${variant} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 600,
        fontFamily: 'inherit',
        borderRadius: 10,
        border: v.border,
        background: v.bg,
        color: v.color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background .15s, opacity .15s',
        whiteSpace: 'nowrap',
        minHeight: s.height,
        ...style,
      }}
    >
      {loading && <span className="spinner" />}
      {!loading && icon && <Icon name={icon} size={s.iconSize} />}
      {children}
      {!loading && iconRight && <Icon name={iconRight} size={s.iconSize} />}
    </button>
  );
}
