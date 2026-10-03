import React from 'react';
import { NavigationTab } from '../App';
import { Car, Send, LayoutDashboard, Compass, UserCheck, History } from 'lucide-react';

interface NavbarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode }[] = [
    { id: 'request', label: 'Request Ride', icon: <Send size={18} /> },
    { id: 'rider-dashboard', label: 'Rider Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'current-trip', label: 'Current Trip', icon: <Compass size={18} /> },
    { id: 'person-history', label: 'Person History', icon: <UserCheck size={18} /> },
    { id: 'rider-history', label: 'Rider History', icon: <History size={18} /> },
  ];

  return (
    <header className="app-header">
      <div className="header-inner">
        <a href="#request" onClick={(e) => { e.preventDefault(); setActiveTab('request'); }} className="brand-logo">
          <div className="logo-badge">
            <Car size={22} />
          </div>
          <div>
            <span>Lawazia Toto</span>
            <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-muted)', fontWeight: 500, marginTop: '-3px' }}>
              Desk & Dispatch
            </span>
          </div>
        </a>

        <nav className="nav-links">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(item.id);
              }}
              className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
};
