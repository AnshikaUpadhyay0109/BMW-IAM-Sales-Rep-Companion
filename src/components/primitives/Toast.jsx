import React, { useEffect } from 'react';
import { Icon } from './Icon';

const TYPES = {
  success: { icon: 'check', bg: '#11834A', color: '#fff' },
  error:   { icon: 'alert', bg: '#C8283C', color: '#fff' },
  info:    { icon: 'zap',   bg: '#1A73E8', color: '#fff' },
};

export function Toast({ message, type = 'info', visible, onClose, duration = 3500 }) {
  useEffect(() => {
    if (visible && onClose) {
      const t = setTimeout(onClose, duration);
      return () => clearTimeout(t);
    }
  }, [visible, onClose, duration]);

  if (!visible) return null;

  const t = TYPES[type] || TYPES.info;

  return (
    <div
      className="toast-wrap"
      style={{
        position: 'fixed',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        animation: 'slideUp .3s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 20px',
          borderRadius: 12,
          background: t.bg,
          color: t.color,
          fontSize: 13,
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}
      >
        <Icon name={t.icon} size={16} />
        {message}
        {onClose && (
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, marginLeft: 8 }}
          >
            <Icon name="x" size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
