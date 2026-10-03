import React from 'react';
import { RideRequest } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { CheckCircle2, ArrowRight, Calendar, Clock, MapPin, Users, PlusCircle, LayoutDashboard } from 'lucide-react';

interface RequestConfirmationPageProps {
  request: RideRequest;
  onNewRequest: () => void;
  onGoToDashboard: () => void;
}

export const RequestConfirmationPage: React.FC<RequestConfirmationPageProps> = ({
  request,
  onNewRequest,
  onGoToDashboard,
}) => {
  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          <CheckCircle2 size={36} />
        </div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>Request Submitted!</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Your Toto ride request has been registered and is pending acceptance.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Request ID
            </span>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>Request #{request.id}</h3>
          </div>
          <StatusBadge status={request.status} />
        </div>

        {/* Route */}
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Route
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginTop: '0.5rem',
              background: 'rgba(10, 13, 20, 0.5)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <MapPin size={18} color="var(--primary)" />
              {request.from}
            </div>
            <ArrowRight size={18} color="var(--text-muted)" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <MapPin size={18} color="var(--accent)" />
              {request.to}
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              background: 'rgba(10, 13, 20, 0.5)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Date</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginTop: '0.2rem' }}>
              <Calendar size={16} color="var(--primary)" />
              {request.date}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(10, 13, 20, 0.5)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Time</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginTop: '0.2rem' }}>
              <Clock size={16} color="var(--primary)" />
              {request.time}
            </div>
          </div>
        </div>

        {/* Passengers */}
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Passengers ({request.passengerCount})
          </span>
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {request.passengers.map((p, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.6rem 0.85rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
              >
                <Users size={16} color="var(--text-muted)" />
                {p.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <button onClick={onNewRequest} className="btn btn-secondary">
          <PlusCircle size={18} /> Request Another Ride
        </button>
        <button onClick={onGoToDashboard} className="btn btn-primary">
          <LayoutDashboard size={18} /> Go to Dashboard
        </button>
      </div>
    </div>
  );
};
