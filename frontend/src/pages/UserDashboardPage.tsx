import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RideRequest } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { Send, Clock, History, Calendar, MapPin, ArrowRight, User } from 'lucide-react';

interface UserDashboardPageProps {
  onRequestRide: () => void;
  onViewMyRequests: () => void;
  onViewHistory: () => void;
}

export const UserDashboardPage: React.FC<UserDashboardPageProps> = ({
  onRequestRide,
  onViewMyRequests,
  onViewHistory,
}) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const all = await api.getRequests();
        const safeAll = Array.isArray(all) ? all : [];
        const userNameLower = (user?.name || '').toLowerCase();
        const userReqs = safeAll.filter((r) =>
          Array.isArray(r.passengers) && r.passengers.some((p) => p && p.name && p.name.toLowerCase() === userNameLower)
        );
        setRequests(userReqs.length > 0 ? userReqs : safeAll.slice(0, 3));
      } catch (err) {
        console.error(err);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    loadRequests();
  }, [user]);

  const safeRequests = Array.isArray(requests) ? requests : [];
  const pendingCount = safeRequests.filter((r) => r && r.status === 'REQUESTED').length;
  const completedCount = safeRequests.filter((r) => r && r.status === 'COMPLETED').length;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Welcome Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(22, 30, 46, 0.9) 100%)',
          borderLeft: '4px solid var(--primary)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <span className="badge badge-accepted" style={{ background: 'rgba(99, 102, 241, 0.2)' }}>
                PASSENGER ACCOUNT
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email}</span>
            </div>
            <h1 style={{ fontSize: '2rem' }}>Welcome, {user?.name || 'Passenger'}!</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Easily book Toto rides across College, Station, and Office campuses.
            </p>
          </div>

          <button onClick={onRequestRide} className="btn btn-primary" style={{ padding: '0.9rem 1.5rem' }}>
            <Send size={18} /> Request a Ride
          </button>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div
          onClick={onRequestRide}
          className="glass-panel"
          style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <Send size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>Book Toto</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Create a new ride request</p>
          </div>
        </div>

        <div
          onClick={onViewMyRequests}
          className="glass-panel"
          style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
            }}
          >
            <Clock size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>My Requests</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{pendingCount} pending requests</p>
          </div>
        </div>

        <div
          onClick={onViewHistory}
          className="glass-panel"
          style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}
          >
            <History size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>Trip History</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{completedCount} completed trips</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recent Ride Bookings
          </h2>
          <button
            onClick={onViewMyRequests}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
          >
            View all →
          </button>
        </div>

        {loading ? (
          <div className="glass-panel state-container">
            <div className="spinner" />
            <p style={{ color: 'var(--text-muted)' }}>Loading bookings...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="glass-panel state-container">
            <User size={36} color="var(--text-dim)" />
            <p style={{ color: 'var(--text-muted)' }}>You haven't requested any rides yet.</p>
            <button onClick={onRequestRide} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Request Your First Ride
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {requests.slice(0, 3).map((r) => (
              <div key={r.id} className="glass-panel" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>Request #{r.id}</h3>
                    <StatusBadge status={r.status} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <Calendar size={14} /> {r.date} at {r.time}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.95rem' }}>
                  <MapPin size={16} color="var(--primary)" /> {r.from}
                  <ArrowRight size={14} color="var(--text-muted)" />
                  <MapPin size={16} color="var(--accent)" /> {r.to}
                  <span style={{ marginLeft: 'auto', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                    {r.passengerCount} {r.passengerCount === 1 ? 'passenger' : 'passengers'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
