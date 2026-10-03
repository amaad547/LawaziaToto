import React, { useEffect, useState } from 'react';
import { RideRequest, PassengerStatus, Passenger } from '../types/api';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Compass, CheckCircle2, XCircle, MapPin, Calendar, Clock, Users, ArrowRight, Loader2, AlertCircle, Check } from 'lucide-react';

interface CurrentTripPageProps {
  onTripCompleted: () => void;
}

export const CurrentTripPage: React.FC<CurrentTripPageProps> = ({ onTripCompleted }) => {
  const [trip, setTrip] = useState<RideRequest | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingBoarding, setSavingBoarding] = useState<boolean>(false);
  const [completing, setCompleting] = useState<boolean>(false);

  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCurrentTrip = async () => {
    setLoading(true);
    try {
      const data = await api.getCurrentTrip();
      setTrip(data);
      if (data) {
        setPassengers(data.passengers || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch current trip details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentTrip();
  }, []);

  const handleStatusToggle = (index: number, newStatus: PassengerStatus) => {
    setPassengers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], status: newStatus };
      return copy;
    });
  };

  const handleSaveBoarding = async () => {
    if (!trip) return;
    setSavingBoarding(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      const updated = await api.updateBoarding(trip.id, { passengers });
      setTrip(updated);
      setMessage('Passenger boarding status saved successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update boarding statuses.');
    } finally {
      setSavingBoarding(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!trip) return;

    // First ensure boarding statuses are saved
    setCompleting(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      await api.updateBoarding(trip.id, { passengers });
      const res = await api.completeTrip(trip.id);
      setMessage(res.message || 'Trip completed. Toto is now free.');
      setTrip(null);
      setTimeout(() => {
        onTripCompleted();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete trip.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel state-container" style={{ maxWidth: '700px', margin: '2rem auto' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)' }}>Loading active trip...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
            <Compass color="var(--primary)" /> Current Active Trip
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Pickup and passenger boarding control desk</p>
        </div>

        {message && (
          <div className="alert-banner alert-success animate-fade-in" style={{ marginBottom: '1.5rem' }}>
            <CheckCircle2 size={22} style={{ flexShrink: 0 }} />
            <div>
              <strong>Action Completed</strong>
              <p style={{ fontSize: '0.95rem' }}>{message}</p>
            </div>
          </div>
        )}

        <div className="glass-panel state-container" style={{ padding: '3rem 2rem' }}>
          <CheckCircle2 size={48} color="var(--accent)" />
          <h3 style={{ fontSize: '1.4rem' }}>Toto is Free</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
            There is no active trip currently in progress. You can accept a new ride request from the Rider Dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '750px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Compass color="var(--accent)" /> Current Trip #{trip.id}
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Manage passenger pickup boarding and complete the journey</p>
          </div>
          <StatusBadge status={trip.status} />
        </div>
      </div>

      {errorMsg && (
        <div className="alert-banner alert-clash animate-fade-in">
          <AlertCircle size={22} style={{ flexShrink: 0 }} />
          <div>
            <strong>Error</strong>
            <p style={{ fontSize: '0.95rem' }}>{errorMsg}</p>
          </div>
        </div>
      )}

      {message && (
        <div className="alert-banner alert-success animate-fade-in">
          <CheckCircle2 size={22} style={{ flexShrink: 0 }} />
          <div>
            <strong>Update Successful</strong>
            <p style={{ fontSize: '0.95rem' }}>{message}</p>
          </div>
        </div>
      )}

      {/* Trip Information Card */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Route
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700, marginTop: '0.3rem' }}>
              <MapPin size={18} color="var(--primary)" />
              {trip.from}
              <ArrowRight size={16} color="var(--text-muted)" />
              <MapPin size={18} color="var(--accent)" />
              {trip.to}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Scheduled Date
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginTop: '0.3rem' }}>
              <Calendar size={16} color="var(--primary)" />
              {trip.date}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Scheduled Time
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginTop: '0.3rem' }}>
              <Clock size={16} color="var(--primary)" />
              {trip.time}
            </div>
          </div>
        </div>
      </div>

      {/* Passenger Boarding Controls Screen */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} color="var(--primary)" /> Passenger Boarding Checklist ({passengers.length})
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Mark each passenger as Boarded or Missed
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {passengers.map((p, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                background: 'rgba(10, 13, 20, 0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  {index + 1}
                </div>
                <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>{p.name}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleStatusToggle(index, 'BOARDED')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease',
                    background: p.status === 'BOARDED' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    borderColor: p.status === 'BOARDED' ? '#10b981' : 'var(--border-color)',
                    color: p.status === 'BOARDED' ? '#34d399' : 'var(--text-muted)',
                  }}
                >
                  <CheckCircle2 size={16} /> Boarded
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusToggle(index, 'MISSED')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease',
                    background: p.status === 'MISSED' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    borderColor: p.status === 'MISSED' ? '#ef4444' : 'var(--border-color)',
                    color: p.status === 'MISSED' ? '#f87171' : 'var(--text-muted)',
                  }}
                >
                  <XCircle size={16} /> Missed
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSaveBoarding}
          disabled={savingBoarding || completing}
          className="btn btn-secondary"
          style={{ width: '100%' }}
        >
          {savingBoarding ? (
            <>
              <Loader2 size={16} className="spinner" style={{ width: 16, height: 16 }} /> Saving Boarding...
            </>
          ) : (
            <>
              <Check size={16} /> Save Boarding Statuses
            </>
          )}
        </button>
      </div>

      {/* Complete Trip Action Button */}
      <button
        onClick={handleCompleteTrip}
        disabled={completing}
        className="btn btn-success"
        style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem', boxShadow: '0 8px 25px rgba(16, 185, 129, 0.35)' }}
      >
        {completing ? (
          <>
            <Loader2 size={20} className="spinner" style={{ width: 20, height: 20 }} /> Completing Trip...
          </>
        ) : (
          <>
            <CheckCircle2 size={20} /> Complete Trip & Free Toto
          </>
        )}
      </button>
    </div>
  );
};
