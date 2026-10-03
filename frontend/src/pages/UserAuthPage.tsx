import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogIn, UserPlus, AlertCircle, Loader2, CheckCircle2, Lock, Mail } from 'lucide-react';

interface UserAuthPageProps {
  onSuccess: () => void;
  onSwitchPortal: (portal: 'USER' | 'RIDER' | 'ADMIN') => void;
}

export const UserAuthPage: React.FC<UserAuthPageProps> = ({ onSuccess, onSwitchPortal }) => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    setLoading(true);
    try {
      if (mode === 'LOGIN') {
        await login({ email, password }, 'USER');
        onSuccess();
      } else {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        await signup({ name, email, password, confirmPassword }, 'USER');
        setSuccessMsg('Account created successfully! Welcome to Lawazia Toto Desk.');
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '480px', margin: '1.5rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          <User size={28} />
        </div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>User Portal</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          For Students & Employees requesting Toto transportation
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(10, 13, 20, 0.6)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-color)',
        }}
      >
        <button
          type="button"
          onClick={() => { setMode('LOGIN'); setError(null); }}
          style={{
            padding: '0.65rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: mode === 'LOGIN' ? 'var(--primary)' : 'transparent',
            color: mode === 'LOGIN' ? '#fff' : 'var(--text-muted)',
          }}
        >
          User Login
        </button>
        <button
          type="button"
          onClick={() => { setMode('SIGNUP'); setError(null); }}
          style={{
            padding: '0.65rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: mode === 'SIGNUP' ? 'var(--primary)' : 'transparent',
            color: mode === 'SIGNUP' ? '#fff' : 'var(--text-muted)',
          }}
        >
          User Sign Up
        </button>
      </div>

      {error && (
        <div className="alert-banner alert-clash animate-fade-in">
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Authentication Error</strong>
            <p style={{ fontSize: '0.9rem' }}>{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="alert-banner alert-success animate-fade-in">
          <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Success</strong>
            <p style={{ fontSize: '0.9rem' }}>{successMsg}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem' }}>
        {mode === 'SIGNUP' && (
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                required
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="email"
              required
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="e.g. rahul@lawazia.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Password *</label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="password"
              required
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Enter password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {mode === 'SIGNUP' && (
          <div className="form-group">
            <label className="form-label">Confirm Password *</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                required
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '0.75rem', padding: '0.9rem' }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="spinner" style={{ width: 18, height: 18 }} />
              Processing...
            </>
          ) : mode === 'LOGIN' ? (
            <>
              <LogIn size={18} /> Sign In as User
            </>
          ) : (
            <>
              <UserPlus size={18} /> Create User Account
            </>
          )}
        </button>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>Looking for driver or administrative access?</span>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => onSwitchPortal('RIDER')}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
            >
              Rider Portal →
            </button>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <button
              type="button"
              onClick={() => onSwitchPortal('ADMIN')}
              style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontWeight: 600 }}
            >
              Admin Portal →
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
