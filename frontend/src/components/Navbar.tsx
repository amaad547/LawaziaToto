import React from 'react';
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
  Users,
  Sun,
  Moon,
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

  const handleLogout = () => {
    logout();
    setActiveScreen('auth-user');
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
    { id: 'rider-history' as ScreenId, label: 'History', icon: <History size={18} /> },
  ];

  const getAdminNavItems = () => [
    { id: 'admin-dashboard' as ScreenId, label: 'Dashboard', icon: <ShieldCheck size={18} /> },
  ];

  const getUnauthNavItems = () => [
    { id: 'auth-user' as ScreenId, label: 'User Portal', icon: <User size={18} /> },
    { id: 'auth-rider' as ScreenId, label: 'Rider Desk', icon: <Car size={18} /> },
    { id: 'auth-admin' as ScreenId, label: 'Admin', icon: <ShieldCheck size={18} /> },
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
        <div
          onClick={() => {
            if (!isAuthenticated) setActiveScreen('auth-user');
            else if (role === 'USER') setActiveScreen('user-dashboard');
            else if (role === 'RIDER') setActiveScreen('rider-dashboard');
            else setActiveScreen('admin-dashboard');
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

        <nav className="nav-links">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className={`nav-link ${activeScreen === item.id ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          {/* Theme switcher toggle */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle theme"
            type="button"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
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
      </div>
    </header>
  );
};
