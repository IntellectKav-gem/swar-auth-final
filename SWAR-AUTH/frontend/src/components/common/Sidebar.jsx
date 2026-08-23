import React from 'react';
import { LayoutDashboard, Mic, Clock, BarChart3, Users, BookOpen, UserCircle, LogOut, ClipboardCheck } from 'lucide-react';

const Sidebar = ({ user, activeTab, setActiveTab, onLogout }) => {
  if (!user) return null;

  const role = user.role;

  const navItems = role === 'faculty'
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'subjects', label: 'My Subjects', icon: BookOpen },
        { id: 'sessions', label: 'Take Attendance', icon: Mic },
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
          { id: 'verification', label: 'Mark Attendance', icon: Mic },
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
      width: '240px',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--card-border)',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      <div style={{ padding: '0 0.5rem 1rem 0.5rem', borderBottom: '1px solid var(--card-border)', marginBottom: '0.5rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Navigation Menu
        </div>
      </div>

      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => item.id === 'logout' ? onLogout?.() : setActiveTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: isActive ? 'var(--accent-primary)' : 'transparent',
              color: isActive ? '#fff' : 'var(--text-muted)',
              fontWeight: isActive ? 600 : 400,
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 150ms ease'
            }}
          >
            <Icon size={18} color={isActive ? '#fff' : 'var(--text-muted)'} />
            {item.label}
          </button>
        );
      })}
    </aside>
  );
};

export default Sidebar;
