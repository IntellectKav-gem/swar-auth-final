import React from 'react';
import { LogOut, User, Mic } from 'lucide-react';

const Navbar = ({ title = 'Dashboard', user, onLogout }) => {
  return (
    <header style={{
      height: '64px',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--card-border)',
      padding: '0 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '1.2rem',
          fontWeight: 700,
          color: '#fff'
        }}>
          <div style={{
            background: 'var(--accent-primary)',
            padding: '0.3rem 0.5rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Mic size={18} color="#fff" />
          </div>
          SWAR-AUTH
        </div>
        <span style={{ color: 'var(--card-border)', fontSize: '1.2rem' }}>|</span>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>
          {title}
        </h2>
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: '#0f172a',
            padding: '0.4rem 0.85rem',
            borderRadius: '20px',
            border: '1px solid var(--card-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.85rem'
          }}>
            <User size={14} className="text-muted" />
            <span style={{ fontWeight: 500 }}>{user.name}</span>
            <span className={`badge ${
              user.role === 'admin' ? 'badge-danger' :
              user.role === 'faculty' ? 'badge-primary' : 'badge-success'
            }`}>
              {user.role}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            title="Log Out"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
