import React, { useState, useEffect } from 'react';
import { PersonHistoryItem } from '../types/api';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { UserCheck, Search, Calendar, Clock, MapPin, ArrowRight, Loader2, User } from 'lucide-react';

export const PersonHistoryPage: React.FC = () => {
  const [searchName, setSearchName] = useState<string>('Rahul');
  const [activeQuery, setActiveQuery] = useState<string>('Rahul');
  const [history, setHistory] = useState<PersonHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searched, setSearched] = useState<boolean>(false);

  const fetchHistory = async (name: string) => {
    if (!name.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.getPersonHistory(name.trim());
      setHistory(data);
      setActiveQuery(name.trim());
    } catch (err: any) {
      console.error('Failed to fetch person history:', err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory('Rahul');
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory(searchName);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
          <UserCheck color="var(--primary)" /> Person History Lookup
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Search ride history by passenger name to see past trips and boarding statuses.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <User
              size={18}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.75rem' }}
              placeholder="Enter person name (e.g. Rahul, Aman, Priya)"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading || !searchName.trim()} className="btn btn-primary">
            {loading ? <Loader2 size={18} className="spinner" style={{ width: 18, height: 18 }} /> : <Search size={18} />}
            Search
          </button>
        </div>
      </form>

      {/* Results Header */}
      {searched && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Trips for "{activeQuery}" ({history.length})
          </h2>
        </div>
      )}

      {/* Content States */}
      {loading ? (
        <div className="glass-panel state-container">
          <div className="spinner" />
          <p style={{ color: 'var(--text-muted)' }}>Searching trips for {searchName}...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="glass-panel state-container">
          <UserCheck size={40} color="var(--text-dim)" />
          <h3 style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>No trips found</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            No ride history found where "{activeQuery}" appears as a passenger.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {history.map((item) => (
            <div key={item.id} className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.2rem' }}>Trip #{item.id}</h3>
                  <StatusBadge status={item.tripStatus} />
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>Boarding Status:</span>
                  <StatusBadge status={item.passengerStatus} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Route</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginTop: '0.2rem' }}>
                    <MapPin size={16} color="var(--primary)" />
                    {item.from} <ArrowRight size={14} color="var(--text-muted)" /> {item.to}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginTop: '0.2rem' }}>
                    <Calendar size={16} color="var(--primary)" />
                    {item.date}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginTop: '0.2rem' }}>
                    <Clock size={16} color="var(--primary)" />
                    {item.time}
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
