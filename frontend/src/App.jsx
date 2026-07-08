import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import KanbanBoard from './components/KanbanBoard.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import ProfilePanel from './components/ProfilePanel.jsx';
import AdminLogsPanel from './components/AdminLogsPanel.jsx';
import { Kanban, MessageSquare, User, ShieldAlert, LogOut, CheckCircle2 } from 'lucide-react';

function AppContent() {
  const { user, loading, login, register, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('USER');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name, role);
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleSeedLogin = async (seedEmail) => {
    setErrorMsg('');
    setEmail(seedEmail);
    setPassword('password123');
    try {
      await login(seedEmail, 'password123');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid rgba(99, 102, 241, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading Workspace Context...</p>
        </div>
      </div>
    );
  }

  // Not Logged In screen
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '36px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1 className="text-glow" style={{ fontSize: '28px', fontWeight: '800', color: 'white', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Kanban style={{ color: 'var(--primary)' }} /> Workspace
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>Month 2 Fullstack Review & Integration</p>
          </div>

          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.4)', padding: '4px', borderRadius: '8px', marginBottom: '24px' }}>
            <button
              style={{ flex: 1, padding: '8px', background: authMode === 'login' ? 'rgba(255,255,255,0.05)' : 'none', border: 'none', borderRadius: '6px', color: 'white', fontWeight: '600', cursor: 'pointer' }}
              onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
            >
              Sign In
            </button>
            <button
              style={{ flex: 1, padding: '8px', background: authMode === 'register' ? 'rgba(255,255,255,0.05)' : 'none', border: 'none', borderRadius: '6px', color: 'white', fontWeight: '600', cursor: 'pointer' }}
              onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
            >
              Sign Up
            </button>
          </div>

          {errorMsg && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {authMode === 'register' && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Full Name</label>
                  <input type="text" className="input-field" placeholder="Enter name..." value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Account Role</label>
                  <select className="input-field" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="USER">User (Standard)</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Email Address</label>
              <input type="email" className="input-field" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Password</label>
              <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
              {authMode === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          {/* Quick Seeding accounts for review convenience */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '10px' }}>
              Dev Seeding Accounts (SQLite/Prisma Seeding)
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => handleSeedLogin('user@example.com')} style={{ fontSize: '12px', padding: '8px 12px', justifyContent: 'flex-start' }}>
                <CheckCircle2 size={12} style={{ color: 'var(--success)' }} /> Login as Standard User
              </button>
              <button className="btn btn-secondary" onClick={() => handleSeedLogin('admin@example.com')} style={{ fontSize: '12px', padding: '8px 12px', justifyContent: 'flex-start' }}>
                <CheckCircle2 size={12} style={{ color: 'var(--success)' }} /> Login as Administrator (Audit Logs Access)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Main Render
  return (
    <div className="app-container">
      {/* Top Header */}
      <header style={{ height: '70px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Kanban style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em' }}>Workspace Board</span>
        </div>
        
        {/* User badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '14px', fontWeight: '700' }}>{user.name}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{user.role}</span>
          </div>
          {user.avatarUrl ? (
            <img src={`http://localhost:5000${user.avatarUrl}`} alt={user.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
          ) : (
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
              {user.name.charAt(0)}
            </div>
          )}
        </div>
      </header>

      {/* Main layout */}
      <div className="main-content">
        {/* Left Side Navigation */}
        <nav style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.15)', display: 'flex', flexDirection: 'column', gap: '8px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`btn ${activeTab === 'tasks' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <Kanban size={16} /> Task Board
          </button>
          
          <button
            onClick={() => setActiveTab('chat')}
            className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <MessageSquare size={16} /> Chat Room
          </button>
          
          <button
            onClick={() => setActiveTab('profile')}
            className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <User size={16} /> Profile Setting
          </button>

          {user.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', width: '100%' }}
            >
              <ShieldAlert size={16} /> Security Audit
            </button>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          <button onClick={logout} className="btn btn-secondary" style={{ justifyContent: 'flex-start', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </nav>

        {/* Tab Panel viewports */}
        <main style={{ height: '100%', overflow: 'hidden' }}>
          {activeTab === 'tasks' && <KanbanBoard />}
          {activeTab === 'chat' && <ChatWindow />}
          {activeTab === 'profile' && <ProfilePanel />}
          {activeTab === 'admin' && user.role === 'ADMIN' && <AdminLogsPanel />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}
