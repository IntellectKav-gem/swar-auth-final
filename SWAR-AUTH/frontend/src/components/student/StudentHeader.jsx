import React from 'react';
import { Menu, Bell, User } from 'lucide-react';
import Logo from '../common/Logo';

export const StudentHeader = ({ user, onToggleSidebar }) => {
  const studentName = user?.name || 'Student';

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1.25rem',
        marginBottom: '1.25rem',
        background: '#111827',
        border: '2px solid #1e293b',
        borderRadius: '16px',
        boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.5)',
        position: 'relative'
      }}
    >
      {/* Left branding & menu button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <button
          onClick={onToggleSidebar}
          type="button"
          aria-label="Toggle Navigation Menu"
          style={{
            background: '#151d2b',
            border: '2px solid #1e293b',
            borderRadius: '8px',
            padding: '0.35rem 0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '1px 1px 0px rgba(0,0,0,0.4)'
          }}
        >
          <Menu size={22} color="#00f5e4" />
        </button>

        <Logo size="sm" />
      </div>

      {/* Center Welcome Banner matching sketch */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '2px solid #00f5e4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2px',
            background: '#151d2b'
          }}
        >
          <User size={18} color="#00f5e4" />
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sketch-title)',
            fontSize: '1.3rem',
            fontWeight: 700,
            color: '#f8fafc',
            borderBottom: '2px solid #00f5e4',
            paddingBottom: '1px',
            lineHeight: 1.1
          }}
        >
          Welcome, {studentName}
        </div>
      </div>

      {/* Right Notifications & Profile icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <button
          type="button"
          title="Notifications"
          style={{
            background: '#151d2b',
            border: '2px solid #1e293b',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '1px 1px 0px rgba(0,0,0,0.4)',
            position: 'relative'
          }}
        >
          <Bell size={20} color="#cbd5e1" />
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#00f5e4',
              boxShadow: '0 0 6px #00f5e4'
            }}
          />
        </button>

        <div
          title={user?.email || 'Student Profile'}
          style={{
            background: '#151d2b',
            border: '2px solid #1e293b',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '1px 1px 0px rgba(0,0,0,0.4)'
          }}
        >
          <User size={20} color="#00f5e4" />
        </div>
      </div>
    </header>
  );
};

export default StudentHeader;
