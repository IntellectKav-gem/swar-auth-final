import React from 'react';
import { LayoutDashboard, Mic, Clock, BarChart3, Users, BookOpen, UserCircle, LogOut, ClipboardCheck, Shield } from 'lucide-react';
import Logo from './Logo';

export const Sidebar = ({ user, activeTab, setActiveTab, onLogout }) => {
  if (!user) return null;

  const role = user.role;

  const handleNavClick = (id) => {
    if (id === 'logout') {
      if (onLogout) onLogout();
    } else {
      setActiveTab(id);
    }
  };

  const navItems = role === 'faculty'
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'subjects', label: 'My Subjects', icon: BookOpen },
        { id: 'sessions', label: 'Take Attendance', icon: Mic, highlight: true },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'enrollment', label: 'Voice Enrollment', icon: ClipboardCheck },
        { id: 'records', label: 'Attendance Records', icon: Clock },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
        { id: 'profile', label: 'Profile', icon: UserCircle },
        { id: 'logout', label: 'Logout', icon: LogOut },
      ]
    : role === 'student'
      ? [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'verification', label: 'Mark Attendance', icon: Mic, highlight: true },
          { id: 'reports', label: 'My Attendance', icon: BarChart3 },
          { id: 'subjects', label: 'My Subjects', icon: BookOpen },
          { id: 'history', label: 'Attendance History', icon: Clock },
          { id: 'profile', label: 'Profile', icon: UserCircle },
          { id: 'logout', label: 'Logout', icon: LogOut },
        ]
      : [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'faculty', label: 'Faculty', icon: UserCircle },
          { id: 'subjects', label: 'Subjects', icon: BookOpen },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
          { id: 'profile', label: 'Profile', icon: UserCircle },
          { id: 'logout', label: 'Logout', icon: LogOut },
        ];

  return (
    <aside style={{
      width: '260px',
      background: 'rgba(8, 12, 22, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(120, 170, 255, 0.14)',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.35rem',
      zIndex: 10
    }}>
      {/* Top Header Label with Brand Logo */}
      <div style={{ padding: '0 0.5rem 0.85rem 0.5rem', borderBottom: '1px solid rgba(120, 170, 255, 0.1)', marginBottom: '0.65rem' }}>
        <Logo size="sm" subtitle={true} style={{ marginBottom: '0.5rem' }} />
        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#8A93A8', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'IBM Plex Mono', monospace" }}>
          SYSTEM CONSOLE NAVIGATION
        </div>
      </div>

      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const isHighlight = item.highlight;

        return (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.9rem',
              borderRadius: '8px',
              border: isActive
                ? '1px solid rgba(63, 216, 224, 0.4)'
                : isHighlight
                ? '1px solid rgba(63, 216, 224, 0.25)'
                : '1px solid transparent',
              background: isActive
                ? 'rgba(63, 216, 224, 0.12)'
                : isHighlight
                ? 'rgba(63, 216, 224, 0.05)'
                : 'transparent',
              color: isActive
                ? '#3FD8E0'
                : isHighlight
                ? '#EAEEF7'
                : '#8A93A8',
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.88rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 160ms ease',
              boxShadow: isActive ? '0 0 16px rgba(63, 216, 224, 0.15)' : 'none',
              fontFamily: "'Space Grotesk', 'Inter', sans-serif"
            }}
          >
            <Icon size={18} color={isActive ? '#3FD8E0' : isHighlight ? '#3FD8E0' : '#8A93A8'} />
            <span style={{ flex: 1 }}>{item.label}</span>
            {isHighlight && (
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#3FD8E0',
                  boxShadow: '0 0 8px #3FD8E0'
                }}
              />
            )}
          </button>
        );
      })}

      {/* Footer info matching reference image */}
      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(120, 170, 255, 0.1)', paddingLeft: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: '#5B6376', fontFamily: "'IBM Plex Mono', monospace" }}>
          <Shield size={14} color="#3FD8E0" />
          <span>Pure Sound Zero v2.4</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
