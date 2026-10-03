import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogIn, AlertCircle, Loader2, Lock, Mail, ShieldAlert } from 'lucide-react';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onSwitchPortal: (portal: 'USER' | 'RIDER' | 'ADMIN') => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess, onSwitchPortal }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password }, 'ADMIN');
      onSuccess();
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
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          <ShieldCheck size={28} />
        </div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>Administrator Portal</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Authorized system management and fleet oversight
        </p>
      </div>

      {/* Security notice banner */}
      <div
        style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          marginBottom: '1.5rem',
          fontSize: '0.85rem',
          color: '#fbbf24',
        }}
      >
        <ShieldAlert size={18} style={{ flexShrink: 0 }} />
        <span>Restricted Area: Public administrator registration is prohibited. Existing credentials required.</span>
      </div>

      {error && (
        <div className="alert-banner alert-clash animate-fade-in">
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Access Denied</strong>
            <p style={{ fontSize: '0.9rem' }}>{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem' }}>
        <div className="form-group">
          <label className="form-label">Admin Email *</label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="email"
              required
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="e.g. admin@lawazia.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@lawazia.com');
                setPassword('Admin@123456');
              }}
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#fbbf24',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Fill Default Credentials (admin@lawazia.com)
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Admin Password *</label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="password"
              required
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Enter master password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn"
          style={{
            width: '100%',
            marginTop: '0.75rem',
            padding: '0.9rem',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#000',
            fontWeight: 700,
          }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="spinner" style={{ width: 18, height: 18 }} />
              Verifying Security Token...
            </>
          ) : (
            <>
              <LogIn size={18} /> Authenticate as Admin
            </>
          )}
        </button>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>Switch to standard portal:</span>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => onSwitchPortal('USER')}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
            >
              ← User Portal
            </button>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <button
              type="button"
              onClick={() => onSwitchPortal('RIDER')}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
            >
              Rider Portal →
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
