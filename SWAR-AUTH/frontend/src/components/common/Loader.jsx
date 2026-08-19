import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ text = 'Loading...' }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    gap: '0.75rem',
    color: 'var(--text-muted)'
  }}>
    <Loader2 size={32} className="animate-spin" style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
    <span style={{ fontSize: '0.9rem' }}>{text}</span>
    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

export default Loader;
