import React, { useState } from 'react';
import { Logo, Icon } from '../components/primitives';
import { useAppDispatch } from '../state/AppStateContext';
import { api } from '../services/api';

const CARDS = [
  {
    id: 'rep',
    name: 'Marcus Schmidt',
    title: 'Territory Sales Rep',
    sub: 'South England · 7 Dealers',
    ini: 'MS',
    col: '#A100FF',
    label: 'Sales Rep',
    email: 'marcus.demo@corporate.com',
    pw: 'Marcus@2026',
    isManager: false,
  },
  {
    id: 'manager',
    name: 'Anna Weber',
    title: 'Regional Manager',
    sub: 'South England + Midlands · 3 Reps · 16 Dealers',
    ini: 'AW',
    col: '#460073',
    label: 'Manager',
    email: 'manager.demo@corporate.com',
    pw: 'Manager@2026',
    isManager: true,
  },
];

export function LoginView() {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  async function handleLogin(card) {
    setLoading(true);
    const result = await api.login(card.email, card.pw);
    setLoading(false);
    if (result.success) {
      dispatch({ type: 'LOGIN', user: { ...result.user, name: card.name, isManager: card.isManager } });
    }
  }

  return (
    <div className="login">
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(161,0,255,.1) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', bottom: '-15%', left: '-5%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(117,0,192,.12) 0%, transparent 65%)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 44, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #0A0E1A, #2D3748)', border: '1.5px solid rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Logo size={30} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-.03em' }}>IAM Copilot</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>BMW Group · Powered by Accenture</div>
          </div>
        </div>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.4)', textAlign: 'center', maxWidth: 340, lineHeight: 1.6 }}>
          Intelligent field sales companion for the Independent Aftermarket programme
        </p>
      </div>

      <div className="login-cards">
        {CARDS.map((r) => (
          <button key={r.id} className="lc" onClick={() => handleLogin(r)} disabled={loading}>
            <div>
              <div className="ava" style={{ width: 54, height: 54, background: `linear-gradient(135deg, ${r.col}, ${r.col}BB)`, marginBottom: 16, fontSize: 18, boxShadow: `0 4px 16px ${r.col}30` }}>
                {r.ini}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{r.name}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.55)', marginBottom: 5 }}>{r.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginBottom: 22, lineHeight: 1.4 }}>{r.sub}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,.07)', borderRadius: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.65)' }}>Sign in as {r.label}</span>
                <span style={{ color: 'rgba(255,255,255,.35)', fontSize: 18 }}>›</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 40, fontSize: 11, color: 'rgba(255,255,255,.2)', position: 'relative', zIndex: 1 }}>
        BMW Group Confidential · IAM 2026 · Accenture
      </div>
    </div>
  );
}
