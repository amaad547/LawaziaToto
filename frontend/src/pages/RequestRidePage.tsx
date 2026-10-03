import React, { useState } from 'react';
import { Location, RideRequest } from '../types/api';
import { api } from '../services/api';
import { Send, Users, Calendar, Clock, MapPin, AlertCircle, Loader2 } from 'lucide-react';

interface RequestRidePageProps {
  onSuccess: (request: RideRequest) => void;
}

export const RequestRidePage: React.FC<RequestRidePageProps> = ({ onSuccess }) => {
  const locations: Location[] = ['College', 'Station', 'Office'];

  const todayStr = new Date().toISOString().split('T')[0];
  const nowStr = new Date().toTimeString().slice(0, 5);

  const [from, setFrom] = useState<Location>('College');
  const [to, setTo] = useState<Location>('Station');
  const [date, setDate] = useState<string>(todayStr);
  const [time, setTime] = useState<string>(nowStr);
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [passengers, setPassengers] = useState<string[]>(['']);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleCountChange = (count: number) => {
    const newCount = Math.max(1, Math.min(10, count));
    setPassengerCount(newCount);

    setPassengers((prev) => {
      const next = [...prev];
      if (newCount > next.length) {
        while (next.length < newCount) {
          next.push('');
        }
      } else {
        next.splice(newCount);
      }
      return next;
    });
  };

  const handleNameChange = (index: number, val: string) => {
    setPassengers((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
    // Clear individual passenger error
    if (errors[`passenger_${index}`]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[`passenger_${index}`];
        return copy;
      });
    }
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!from) errs.from = 'Pickup location is required';
    if (!to) errs.to = 'Destination location is required';
    if (from && to && from === to) errs.to = 'Destination must be different from pickup location';
    if (!date) errs.date = 'Date is required';
    if (!time) errs.time = 'Time is required';
    if (!passengerCount || passengerCount < 1) errs.passengerCount = 'At least 1 passenger is required';

    passengers.forEach((name, idx) => {
      if (!name || name.trim() === '') {
        errs[`passenger_${idx}`] = `Passenger ${idx + 1} name is required`;
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        from,
        to,
        date,
        time,
        passengerCount,
        passengers: passengers.map((p) => p.trim()),
      };

      const result = await api.createRequest(payload);
      onSuccess(result);
    } catch (err: any) {
      setApiError(err.message || 'Failed to submit ride request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Request a Toto Ride</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Submit transport request between College, Station, and Office
        </p>
      </div>

      {apiError && (
        <div className="alert-banner alert-clash animate-fade-in">
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Submission Error</strong>
            <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>{apiError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={14} color="var(--primary)" /> Pickup Location
            </label>
            <select
              className="form-select"
              value={from}
              onChange={(e) => setFrom(e.target.value as Location)}
            >
              {locations.map((loc) => (
                <option key={loc} value={loc} disabled={loc === to}>
                  {loc}
                </option>
              ))}
            </select>
            {errors.from && <span className="form-error">{errors.from}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={14} color="var(--accent)" /> Destination
            </label>
            <select
              className="form-select"
              value={to}
              onChange={(e) => setTo(e.target.value as Location)}
            >
              {locations.map((loc) => (
                <option key={loc} value={loc} disabled={loc === from}>
                  {loc}
                </option>
              ))}
            </select>
            {errors.to && <span className="form-error">{errors.to}</span>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={14} /> Date
            </label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {errors.date && <span className="form-error">{errors.date}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={14} /> Time
            </label>
            <input
              type="time"
              className="form-input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            {errors.time && <span className="form-error">{errors.time}</span>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Users size={14} /> Number of People
          </label>
          <input
            type="number"
            min="1"
            max="10"
            className="form-input"
            value={passengerCount}
            onChange={(e) => handleCountChange(parseInt(e.target.value, 10) || 1)}
          />
          {errors.passengerCount && <span className="form-error">{errors.passengerCount}</span>}
        </div>

        {/* Dynamic Passenger Names */}
        <div style={{ margin: '1.75rem 0', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
            Passenger Details ({passengerCount} {passengerCount === 1 ? 'person' : 'people'})
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {passengers.map((name, index) => (
              <div key={index} className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Person {index + 1} Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={`e.g. ${index === 0 ? 'Rahul' : index === 1 ? 'Aman' : 'Priya'}`}
                  value={name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                />
                {errors[`passenger_${index}`] && (
                  <span className="form-error">{errors[`passenger_${index}`]}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="spinner" style={{ width: 18, height: 18 }} />
              Submitting Request...
            </>
          ) : (
            <>
              <Send size={18} /> Submit Ride Request
            </>
          )}
        </button>
      </form>
    </div>
  );
};
