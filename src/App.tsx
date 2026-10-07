import React, { useEffect, useMemo, useState } from 'react';
import { authApi } from '../SWAR-AUTH/frontend/src/api/authApi';
import Sidebar from '../SWAR-AUTH/frontend/src/components/common/Sidebar';
import Navbar from '../SWAR-AUTH/frontend/src/components/common/Navbar';
import Toast from '../SWAR-AUTH/frontend/src/components/common/Toast';
import SwarBackground from './components/SwarBackground';
import { LoginPage } from '../SWAR-AUTH/frontend/src/pages/LoginPage';
import { FacultyDashboard } from '../SWAR-AUTH/frontend/src/pages/FacultyDashboard';
import { StudentDashboard } from '../SWAR-AUTH/frontend/src/pages/StudentDashboard';
import { AdminDashboard } from '../SWAR-AUTH/frontend/src/pages/AdminDashboard';
import './index.css';

export default function App() {
  const [user, setUser] = useState<any>(() => {
    try {
      const savedUser = localStorage.getItem('swar_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState<string>(() => localStorage.getItem('swar_token') || '');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    if (!token) {
      localStorage.removeItem('swar_token');
      localStorage.removeItem('swar_user');
      setUser(null);
      return;
    }

    localStorage.setItem('swar_token', token);
    if (user) {
      localStorage.setItem('swar_user', JSON.stringify(user));
    }
  }, [token, user]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleLoginSuccess = (nextToken: string, nextUser: any) => {
    setToken(nextToken);
    setUser(nextUser);
    setActiveTab('dashboard');
    setToast({ type: 'success', message: `Welcome back, ${nextUser?.name || 'User'}!` });
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await authApi.logout().catch(() => undefined);
      }
    } finally {
      localStorage.removeItem('swar_token');
      localStorage.removeItem('swar_user');
      setToken('');
      setUser(null);
      setActiveTab('dashboard');
      setToast({ type: 'info', message: 'You have been logged out.' });
    }
  };

  const content = useMemo(() => {
    if (!user) {
      return <LoginPage onLoginSuccess={handleLoginSuccess} setToast={setToast} />;
    }

    const role = user.role;
    const commonProps = { setToast, activeTab, setActiveTab };

    let currentTitle = 'Dashboard';
    if (role === 'faculty') currentTitle = 'Faculty Command Center';
    else if (role === 'student') currentTitle = 'Student Voice Workspace';
    else if (role === 'admin') currentTitle = 'System Administration Console';

    return (
      <div className="app-container">
        <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
        <div className="main-wrapper">
          <Navbar title={currentTitle} user={user} onLogout={handleLogout} />
          <main className="content-area">
            {role === 'faculty' ? (
              <FacultyDashboard {...commonProps} />
            ) : role === 'student' ? (
              <StudentDashboard {...commonProps} user={user} onLogout={handleLogout} />
            ) : role === 'admin' ? (
              <AdminDashboard {...commonProps} />
            ) : (
              <div className="card card-glass">
                <h2>Access restricted</h2>
                <p className="text-muted">This dashboard is reserved for authorized accounts.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }, [user, token, activeTab, toast]);

  return (
    <>
      <SwarBackground />
      {content}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </>
  );
}
