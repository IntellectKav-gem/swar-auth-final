import React from 'react';
import { LogOut, User } from 'lucide-react';
import Logo from './Logo';

export const Navbar = ({ title = 'Dashboard', user, onLogout }) => {
  return (
    <header style={{
      height: '68px',
      background: 'rgba(8, 12, 22, 0.82)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(120, 170, 255, 0.14)',
      padding: '0 clamp(1.25rem, 3vw, 2rem)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Left Branding & Workspace Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Logo size="sm" />

        <span style={{ color: 'rgba(120, 170, 255, 0.25)', fontSize: '1.1rem' }}>|</span>

        <h2 style={{ fontSize: '0.98rem', fontWeight: 500, color: '#EAEEF7', fontFamily: "'Inter', sans-serif" }}>
          {user?.role === 'student' ? 'Student Voice Workspace' : title}
        </h2>
      </div>

      {/* Right Security Status & User Profile Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Voice Security Status Pill */}
        <div style={{
          padding: '0.35rem 0.8rem',
          borderRadius: '100px',
          background: 'rgba(63, 216, 224, 0.08)',
          border: '1px solid rgba(63, 216, 224, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontSize: '0.7rem',
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: '#3FD8E0'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#3FD8E0',
            boxShadow: '0 0 8px #3FD8E0'
          }} />
          <span>VOICE SECURITY ONLINE</span>
        </div>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* User Pill Badge */}
            <div style={{
              background: 'rgba(10, 14, 28, 0.75)',
              padding: '0.35rem 0.85rem',
              borderRadius: '100px',
              border: '1px solid rgba(120, 170, 255, 0.18)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              fontSize: '0.82rem',
              fontFamily: "'Inter', sans-serif"
            }}>
              <User size={14} color="#3FD8E0" />
              <span style={{ fontWeight: 600, color: '#EAEEF7', fontFamily: "'IBM Plex Mono', monospace" }}>
                {user.name ? user.name.toUpperCase() : 'STUDENT'}
              </span>
              <span style={{
                padding: '0.15rem 0.5rem',
                borderRadius: '100px',
                background: 'rgba(63, 216, 224, 0.15)',
                border: '1px solid rgba(63, 216, 224, 0.4)',
                color: '#3FD8E0',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontFamily: "'IBM Plex Mono', monospace"
              }}>
                {user.role}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(120, 170, 255, 0.18)',
                color: '#EAEEF7',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease',
                fontFamily: "'Inter', sans-serif"
              }}
              title="Log Out"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
