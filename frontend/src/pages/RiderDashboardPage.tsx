import React, { useEffect, useState } from 'react';
import { RideRequest } from '../types/api';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { LayoutDashboard, CheckCircle2, AlertCircle, Clock, Calendar, MapPin, Users, ArrowRight, Loader2, Compass } from 'lucide-react';

interface RiderDashboardPageProps {
  onSelectCurrentTrip: () => void;
}

export const RiderDashboardPage: React.FC<RiderDashboardPageProps> = ({ onSelectCurrentTrip }) => {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [currentTrip, setCurrentTrip] = useState<RideRequest | null>(null);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(true);
  const [loadingTrip, setLoadingTrip] = useState<boolean>(true);

  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [clashError, setClashError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoadingRequests(true);
    setLoadingTrip(true);
    try {
      const [reqList, currTrip] = await Promise.all([
        api.getRequests(),
        api.getCurrentTrip(),
      ]);
      setRequests(reqList);
      setCurrentTrip(currTrip);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoadingRequests(false);
      setLoadingTrip(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAccept = async (req: RideRequest) => {
    setClashError(null);
    setSuccessMsg(null);
    setAcceptingId(req.id);

    try {
      const acceptedTrip = await api.acceptRequest(req.id);
      setSuccessMsg(`Request #${req.id} accepted successfully!`);
      setCurrentTrip(acceptedTrip);
      await fetchData();
    } catch (err: any) {
      if (err.status === 409 || err.code === 'CLASH' || err.message?.toLowerCase().includes('accepted')) {
        setClashError('Toto unavailable: Another trip has already been accepted for this time.');
      } else {
        setClashError(err.message || 'Failed to accept request.');
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'REQUESTED');

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <LayoutDashboard color="var(--primary)" /> Rider Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Manage incoming ride requests and control active Toto operations.
        </p>
      </div>

      {/* Clash Alert Display */}
      {clashError && (
        <div className="alert-banner alert-clash animate-fade-in">
          <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ fontSize: '1rem' }}>Toto Conflict / Clash Detected</strong>
            <p style={{ fontSize: '0.95rem', marginTop: '0.25rem', color: '#fca5a5' }}>{clashError}</p>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {successMsg && (
        <div className="alert-banner alert-success animate-fade-in">
          <CheckCircle2 size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ fontSize: '1rem' }}>Trip Accepted</strong>
            <p style={{ fontSize: '0.95rem', marginTop: '0.25rem' }}>{successMsg}</p>
          </div>
        </div>
      )}

      {/* Current Active Trip Card */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Active Trip Status
        </h2>

        {loadingTrip ? (
          <div className="glass-panel state-container">
            <div className="spinner" />
            <p style={{ color: 'var(--text-muted)' }}>Loading current trip state...</p>
          </div>
        ) : currentTrip ? (
          <div
            className="glass-panel"
            style={{
              padding: '1.5rem 2rem',
              borderLeft: '4px solid var(--accent)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(22, 30, 46, 0.8) 100%)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="badge badge-accepted">CURRENT TRIP</span>
                <h3 style={{ fontSize: '1.3rem' }}>Trip #{currentTrip.id}</h3>
              </div>
              <StatusBadge status={currentTrip.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Route</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginTop: '0.2rem' }}>
                  <MapPin size={16} color="var(--primary)" /> {currentTrip.from} <ArrowRight size={14} /> {currentTrip.to}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Schedule</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginTop: '0.2rem' }}>
                  <Calendar size={16} /> {currentTrip.date} at {currentTrip.time}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Passengers</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginTop: '0.2rem' }}>
                  <Users size={16} /> {currentTrip.passengerCount} people ({currentTrip.passengers.map(p => p.name).join(', ')})
                </div>
              </div>
            </div>

            <button onClick={onSelectCurrentTrip} className="btn btn-success" style={{ width: '100%' }}>
              <Compass size={18} /> Open Boarding & Pickup Controls
            </button>
          </div>
        ) : (
          <div className="glass-panel state-container" style={{ padding: '2rem' }}>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)' }}>Toto is currently free. No active trip in progress.</p>
          </div>
        )}
      </div>

      {/* Pending Requests List */}
      <div>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Pending Requests ({pendingRequests.length})
        </h2>

        {loadingRequests ? (
          <div className="glass-panel state-container">
            <div className="spinner" />
            <p style={{ color: 'var(--text-muted)' }}>Loading pending ride requests...</p>
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="glass-panel state-container">
            <Clock size={36} color="var(--text-dim)" />
            <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)' }}>No pending ride requests at the moment.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {pendingRequests.map((req) => (
              <div key={req.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.2rem' }}>Request #{req.id}</h3>
                      <StatusBadge status={req.status} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={16} color="var(--primary)" />
                        <strong>{req.from}</strong>
                        <ArrowRight size={14} color="var(--text-muted)" />
                        <strong>{req.to}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                        <Calendar size={16} />
                        {req.date} at {req.time}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                        <Users size={16} />
                        {req.passengerCount} {req.passengerCount === 1 ? 'person' : 'people'}
                      </div>
                    </div>

                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {req.passengers.map((p, i) => (
                        <span
                          key={i}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAccept(req)}
                    disabled={acceptingId === req.id || !!currentTrip}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 1.25rem' }}
                  >
                    {acceptingId === req.id ? (
                      <>
                        <Loader2 size={16} className="spinner" style={{ width: 16, height: 16 }} /> Accepting...
                      </>
                    ) : (
                      'Accept Request'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
