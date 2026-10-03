import React, { useEffect, useState } from 'react';
import { RiderHistoryItem } from '../types/api';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { History, Calendar, Clock, MapPin, ArrowRight, Users, CheckCircle2, XCircle } from 'lucide-react';

export const RiderHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<RiderHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRiderHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getRiderHistory();
      setHistory(data);
    } catch (err: any) {
      console.error('Failed to fetch rider history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiderHistory();
  }, []);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <History color="var(--primary)" /> Rider Operations History
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Comprehensive record of completed trips, passenger counts, and boarding stats.
        </p>
      </div>

      {loading ? (
        <div className="glass-panel state-container">
          <div className="spinner" />
          <p style={{ color: 'var(--text-muted)' }}>Loading rider history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="glass-panel state-container">
          <History size={40} color="var(--text-dim)" />
          <h3 style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>No history records yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Completed trips will automatically appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {history.map((item) => (
            <div key={item.id} className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.3rem' }}>Trip #{item.id}</h3>
                  <StatusBadge status={item.status} />
                </div>
                {item.completedAt && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Completed: {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Route</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginTop: '0.2rem' }}>
                    <MapPin size={16} color="var(--primary)" />
                    {item.from} <ArrowRight size={14} color="var(--text-muted)" /> {item.to}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date & Time</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginTop: '0.2rem' }}>
                    <Calendar size={16} color="var(--primary)" />
                    {item.date} {item.time}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Passengers</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginTop: '0.2rem' }}>
                    <Users size={16} />
                    {item.passengerCount} people
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Boarding Outcome</span>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#34d399',
                        background: 'rgba(16, 185, 129, 0.15)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <CheckCircle2 size={12} /> {item.boardedCount} Boarded
                    </span>
                    {item.missedCount > 0 && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: '#f87171',
                          background: 'rgba(239, 68, 68, 0.15)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <XCircle size={12} /> {item.missedCount} Missed
                      </span>
                    )}
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
