import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth';
import { api } from '../services/api';
import { RideRequest } from '../types/api';
import { AuthUser } from '../types/auth';
import { StatusBadge } from '../components/StatusBadge';
import {
  ShieldCheck,
  Users,
  Car,
  Compass,
  Clock,
  Calendar,
  MapPin,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'RIDERS' | 'REQUESTS' | 'TRIPS'>('OVERVIEW');
  const [accounts, setAccounts] = useState<AuthUser[]>([]);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stored = authService.getAllAccounts();
        setAccounts(stored);
        const reqList = await api.getRequests();
        setRequests(reqList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const registeredUsers = accounts.filter((a) => a.role === 'USER');
  const registeredRiders = accounts.filter((a) => a.role === 'RIDER');
  const activeTrips = requests.filter((r) => r.status === 'ACCEPTED' || r.status === 'IN_PROGRESS');
  const completedTrips = requests.filter((r) => r.status === 'COMPLETED');

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(22, 30, 46, 0.9) 100%)',
          borderLeft: '4px solid #f59e0b',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <ShieldCheck size={12} /> ADMINISTRATOR OVERSIGHT
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email}</span>
            </div>
            <h1 style={{ fontSize: '2rem' }}>Admin Control Center</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Fleet status, user accounts, and trip dispatch governance
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Admin Shell */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.5rem',
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'OVERVIEW', label: 'Overview', icon: <ShieldCheck size={16} /> },
          { id: 'USERS', label: `Users (${registeredUsers.length})`, icon: <Users size={16} /> },
          { id: 'RIDERS', label: `Riders (${registeredRiders.length})`, icon: <Car size={16} /> },
          { id: 'REQUESTS', label: `All Requests (${requests.length})`, icon: <Clock size={16} /> },
          { id: 'TRIPS', label: `Completed Trips (${completedTrips.length})`, icon: <Compass size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === tab.id ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: activeTab === tab.id ? '#fbbf24' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid #f59e0b' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'OVERVIEW' && (
        <div className="animate-fade-in">
          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registered Users</span>
              <h2 style={{ fontSize: '2.2rem', color: 'var(--primary)', marginTop: '0.3rem' }}>{registeredUsers.length}</h2>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Toto Riders</span>
              <h2 style={{ fontSize: '2.2rem', color: 'var(--accent)', marginTop: '0.3rem' }}>{registeredRiders.length}</h2>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Ride Requests</span>
              <h2 style={{ fontSize: '2.2rem', color: '#fbbf24', marginTop: '0.3rem' }}>{requests.length}</h2>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Trips Now</span>
              <h2 style={{ fontSize: '2.2rem', color: activeTrips.length > 0 ? '#34d399' : 'var(--text-muted)', marginTop: '0.3rem' }}>
                {activeTrips.length}
              </h2>
            </div>
          </div>

          {/* Quick Snapshot */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Compass size={18} color="var(--primary)" /> System Operations Status
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Single Toto Dispatch engine is operational. Enforcing strict single-trip concurrency and backend conflict checks.
            </p>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'USERS' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Registered Users / Students / Staff</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {registeredUsers.map((u) => (
              <div
                key={u.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(10, 13, 20, 0.5)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '1rem' }}>{u.name}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.email}</span>
                </div>
                <span className="badge badge-accepted">USER</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Riders Tab */}
      {activeTab === 'RIDERS' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Toto Drivers & Operators</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {registeredRiders.map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(10, 13, 20, 0.5)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '1rem' }}>{r.name}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.email}</span>
                </div>
                <span className="badge badge-in_progress">RIDER</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'REQUESTS' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>All System Requests ({requests.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {requests.map((req) => (
              <div
                key={req.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(10, 13, 20, 0.5)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong>Request #{req.id}</strong>
                    <StatusBadge status={req.status} />
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {req.from} → {req.to} | {req.date} at {req.time} ({req.passengerCount} people)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trips Tab */}
      {activeTab === 'TRIPS' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Completed Trips & Records</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {completedTrips.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No completed trips logged yet.</p>
            ) : (
              completedTrips.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: '1rem',
                    background: 'rgba(10, 13, 20, 0.5)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <strong>Trip #{t.id} ({t.from} → {t.to})</strong>
                    <StatusBadge status={t.status} />
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Passengers: {t.passengers.map((p) => `${p.name} (${p.status})`).join(', ')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
