import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Car,
  Send,
  LayoutDashboard,
  Compass,
  History,
  Clock,
  ShieldCheck,
  LogOut,
  User,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';

export type ScreenId =
  // User screens
  | 'user-dashboard'
  | 'request'
  | 'confirmation'
  | 'user-my-requests'
  | 'person-history'
  // Rider screens
  | 'rider-dashboard'
  | 'current-trip'
  | 'rider-history'
  // Admin screens
  | 'admin-dashboard'
  // Auth screens
  | 'auth-user'
  | 'auth-rider'
  | 'auth-admin';

interface NavbarProps {
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeScreen, setActiveScreen }) => {
  const { user, role, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    setActiveScreen('auth-user');
  };

  const handleNavClick = (screenId: ScreenId) => {
    setActiveScreen(screenId);
    setMobileMenuOpen(false);
  };

  const getUserNavItems = () => [
    { id: 'user-dashboard' as ScreenId, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'request' as ScreenId, label: 'Request Ride', icon: <Send size={18} /> },
    { id: 'user-my-requests' as ScreenId, label: 'My Requests', icon: <Clock size={18} /> },
    { id: 'person-history' as ScreenId, label: 'History', icon: <History size={18} /> },
  ];

  const getRiderNavItems = () => [
    { id: 'rider-dashboard' as ScreenId, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'current-trip' as ScreenId, label: 'Current Trip', icon: <Compass size={18} /> },
    { id: 'rider-history' as ScreenId, label: 'Rider History', icon: <History size={18} /> },
    { id: 'person-history' as ScreenId, label: 'Person History', icon: <User size={18} /> },
  ];

  const getAdminNavItems = () => [
    { id: 'admin-dashboard' as ScreenId, label: 'Dashboard', icon: <ShieldCheck size={18} /> },
    { id: 'person-history' as ScreenId, label: 'Person Lookup', icon: <User size={18} /> },
  ];

  const getUnauthNavItems = () => [
    { id: 'auth-user' as ScreenId, label: 'User Portal', icon: <User size={18} /> },
    { id: 'auth-rider' as ScreenId, label: 'Rider Desk', icon: <Car size={18} /> },
    { id: 'auth-admin' as ScreenId, label: 'Admin', icon: <ShieldCheck size={18} /> },
    { id: 'person-history' as ScreenId, label: 'Ride History', icon: <History size={18} /> },
  ];

  const navItems = !isAuthenticated
    ? getUnauthNavItems()
    : role === 'USER'
    ? getUserNavItems()
    : role === 'RIDER'
    ? getRiderNavItems()
    : getAdminNavItems();

  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Brand Logo */}
        <div
          onClick={() => {
            if (!isAuthenticated) handleNavClick('auth-user');
            else if (role === 'USER') handleNavClick('user-dashboard');
            else if (role === 'RIDER') handleNavClick('rider-dashboard');
            else handleNavClick('admin-dashboard');
          }}
          className="brand-logo"
          style={{ cursor: 'pointer' }}
        >
          <div className="logo-badge">
            <Car size={22} />
          </div>
          <div>
            <span>Lawazia Toto</span>
            <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-muted)', fontWeight: 500, marginTop: '-3px' }}>
              Desk & Dispatch
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="nav-links desktop-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`nav-link ${activeScreen === item.id ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem 0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginLeft: '0.25rem',
            }}
          >
            {theme === 'dark' ? <Sun size={17} color="#fbbf24" /> : <Moon size={17} color="#6366f1" />}
          </button>

          {/* User profile & Logout */}
          {isAuthenticated && user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: role === 'ADMIN' ? '#f59e0b' : role === 'RIDER' ? '#34d399' : 'var(--primary)',
                  }}
                >
                  {role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="nav-link"
                title="Logout"
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: 'none', cursor: 'pointer' }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </nav>

        {/* Mobile Controls: Theme + Hamburger Button */}
        <div className="mobile-controls" style={{ display: 'none', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              borderRadius: 'var(--radius-md)',
              padding: '0.45rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {theme === 'dark' ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="#6366f1" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="hamburger-btn"
            aria-label="Toggle navigation menu"
            style={{
              background: mobileMenuOpen ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-color)',
              color: mobileMenuOpen ? '#ffffff' : 'var(--text-main)',
              borderRadius: 'var(--radius-md)',
              padding: '0.45rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer animate-fade-in"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--panel-bg)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border-color)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
            padding: '1.25rem',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {/* User Profile in Mobile Drawer */}
          {isAuthenticated && user && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.8rem 1rem',
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                marginBottom: '0.5rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  background: role === 'ADMIN' ? 'rgba(245, 158, 11, 0.2)' : role === 'RIDER' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                  color: role === 'ADMIN' ? '#f59e0b' : role === 'RIDER' ? '#34d399' : 'var(--primary)',
                }}
              >
                {role}
              </span>
            </div>
          )}

          {/* Nav Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.8rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: activeScreen === item.id ? '1px solid var(--primary)' : '1px solid transparent',
                  background: activeScreen === item.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: activeScreen === item.id ? 'var(--primary)' : 'var(--text-main)',
                  fontWeight: activeScreen === item.id ? 700 : 500,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Logout in Mobile Drawer */}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                marginTop: '0.5rem',
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          )}
        </div>
      )}
    </header>
  );
};
