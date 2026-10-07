import React from 'react';
import { Home, BookOpen, Mic, Clock, BarChart3, User, Settings, LogOut } from 'lucide-react';

export const StudentSidebar = ({ activeTab, setActiveTab, onLogout, isMobileOpen }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'verification', label: 'Mark Attendance', icon: Mic },
    { id: 'history', label: 'Attendance History', icon: Clock },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'logout', label: 'Logout', icon: LogOut },
  ];

  const handleNavClick = (id) => {
    if (id === 'logout') {
      if (onLogout) onLogout();
    } else {
      setActiveTab(id);
    }
  };

  return (
    <aside
      className="sketch-sidebar"
      style={{
        width: '230px',
        flexShrink: 0,
        background: '#111827',
        border: '2px solid #1e293b',
        borderRadius: '16px',
        boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.5)',
        padding: '1.15rem 0.85rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        height: 'fit-content'
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            type="button"
            className={`sketch-nav-item ${isActive ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              border: '2px solid',
              borderColor: isActive ? '#00f5e4' : 'transparent',
              background: isActive
                ? 'repeating-linear-gradient(-45deg, rgba(0, 245, 228, 0.12), rgba(0, 245, 228, 0.12) 5px, transparent 5px, transparent 10px)'
                : 'transparent',
              color: isActive ? '#00f5e4' : '#cbd5e1',
              fontFamily: 'var(--font-sketch-title)',
              fontSize: '1.08rem',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 150ms ease',
              boxShadow: isActive ? '0 0 12px rgba(0, 245, 228, 0.15)' : 'none'
            }}
          >
            <Icon size={19} color={isActive ? '#00f5e4' : '#94a3b8'} strokeWidth={2.2} />
            <span style={{ flex: 1, letterSpacing: '0.01em' }}>{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
};

export default StudentSidebar;
