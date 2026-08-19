import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { authApi } from './api/authApi';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import Toast from './components/common/Toast';
import SplineBackground from './components/common/SplineBackground';
import { LoginPage } from './pages/LoginPage';
import { FacultyDashboard } from './pages/FacultyDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import './index.css';

const App = () => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('swar_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('swar_token') || '');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);

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

  const handleLoginSuccess = async (nextToken, nextUser) => {
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
    const commonProps = { setToast, activeTab };

    return (
      <div className="app-container">
        <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="main-wrapper">
          <Navbar title={role === 'faculty' ? 'Faculty Dashboard' : role === 'student' ? 'Student Dashboard' : 'Admin Dashboard'} user={user} onLogout={handleLogout} />
          <main className="content-area">
            {role === 'faculty' ? (
              <FacultyDashboard {...commonProps} />
            ) : role === 'student' ? (
              <StudentDashboard {...commonProps} user={user} />
            ) : (
              <div className="card">
                <h2>Access restricted</h2>
                <p className="text-muted">This dashboard is reserved for faculty and student accounts.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }, [user, token, activeTab, toast]);

  return (
    <>
      {content}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SplineBackground />
    <App />
  </React.StrictMode>
);
