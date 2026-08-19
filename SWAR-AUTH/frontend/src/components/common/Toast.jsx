import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const Toast = ({ type = 'info', message, onClose }) => {
  if (!message) return null;

  const bgColors = {
    success: 'rgba(16, 185, 129, 0.15)',
    error: 'rgba(239, 68, 68, 0.15)',
    info: 'rgba(99, 102, 241, 0.15)',
  };

  const borderColors = {
    success: 'rgba(16, 185, 129, 0.4)',
    error: 'rgba(239, 68, 68, 0.4)',
    info: 'rgba(99, 102, 241, 0.4)',
  };

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.85rem 1.25rem',
      borderRadius: 'var(--radius-md)',
      background: bgColors[type] || bgColors.info,
      border: `1px solid ${borderColors[type] || borderColors.info}`,
      color: '#fff',
      boxShadow: 'var(--shadow-lg)',
      backdropFilter: 'blur(8px)',
      maxWidth: '450px'
    }}>
      <Icon size={20} color={type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'} />
      <span style={{ fontSize: '0.9rem', flex: 1 }}>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Toast;
