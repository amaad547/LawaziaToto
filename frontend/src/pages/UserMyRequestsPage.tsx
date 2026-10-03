import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RideRequest } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { Clock, Calendar, MapPin, ArrowRight, Users, PlusCircle } from 'lucide-react';

interface UserMyRequestsPageProps {
  onRequestRide: () => void;
}

export const UserMyRequestsPage: React.FC<UserMyRequestsPageProps> = ({ onRequestRide }) => {
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
        setRequests(userReqs.length > 0 ? userReqs : safeAll);
      } catch (err) {
        console.error(err);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    loadRequests();
  }, [user]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Clock color="var(--primary)" /> My Ride Requests
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Track all ride reservations and their real-time acceptance status
          </p>
        </div>
        <button onClick={onRequestRide} className="btn btn-primary">
          <PlusCircle size={18} /> New Request
        </button>
      </div>

      {loading ? (
        <div className="glass-panel state-container">
          <div className="spinner" />
          <p style={{ color: 'var(--text-muted)' }}>Loading your requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="glass-panel state-container">
          <Clock size={40} color="var(--text-dim)" />
          <h3 style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>No Requests Found</h3>
          <p style={{ color: 'var(--text-muted)' }}>You haven't submitted any ride requests yet.</p>
          <button onClick={onRequestRide} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            Request a Ride Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {requests.map((r) => (
            <div key={r.id} className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.2rem' }}>Request #{r.id}</h3>
                  <StatusBadge status={r.status} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <Calendar size={16} /> {r.date} at {r.time}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Route</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: 600, marginTop: '0.2rem' }}>
                    <MapPin size={16} color="var(--primary)" /> {r.from}
                    <ArrowRight size={14} color="var(--text-muted)" />
                    <MapPin size={16} color="var(--accent)" /> {r.to}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Passengers ({r.passengerCount})
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                    <Users size={16} color="var(--text-muted)" />
                    {r.passengers.map((p, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                        }}
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
