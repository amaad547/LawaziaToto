import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, ScreenId } from './components/Navbar';
import { UserAuthPage } from './pages/UserAuthPage';
import { RiderAuthPage } from './pages/RiderAuthPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { UserMyRequestsPage } from './pages/UserMyRequestsPage';
import { RequestRidePage } from './pages/RequestRidePage';
import { RequestConfirmationPage } from './pages/RequestConfirmationPage';
import { RiderDashboardPage } from './pages/RiderDashboardPage';
import { CurrentTripPage } from './pages/CurrentTripPage';
import { RiderHistoryPage } from './pages/RiderHistoryPage';
import { PersonHistoryPage } from './pages/PersonHistoryPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { RideRequest } from './types/api';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('UI Error caught by boundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel" style={{ maxWidth: '600px', margin: '3rem auto', padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.4rem', color: '#f87171', marginBottom: '0.5rem' }}>Unable to display this screen</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {this.state.error?.message || 'A temporary rendering error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="btn btn-primary"
          >
            Reload Screen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { isAuthenticated, role, loading } = useAuth();
  const [activeScreen, setActiveScreen] = useState<ScreenId>('auth-user');
  const [submittedRequest, setSubmittedRequest] = useState<RideRequest | null>(null);

  // Sync default landing screen when authentication state changes
  React.useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        // If user just logged in from any auth-* screen, direct them to their role's dashboard
        if (activeScreen.startsWith('auth-')) {
          if (role === 'USER') setActiveScreen('user-dashboard');
          else if (role === 'RIDER') setActiveScreen('rider-dashboard');
          else if (role === 'ADMIN') setActiveScreen('admin-dashboard');
        }
      } else {
        // If not authenticated and on a protected screen (other than public history), send to user login
        if (!activeScreen.startsWith('auth-') && activeScreen !== 'person-history') {
          setActiveScreen('auth-user');
        }
      }
    }
  }, [isAuthenticated, role, loading]);

  const handleRequestSuccess = (req: RideRequest) => {
    setSubmittedRequest(req);
    setActiveScreen('confirmation');
  };

  if (loading) {
    return (
      <div className="state-container" style={{ minHeight: '80vh' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)' }}>Loading session...</p>
      </div>
    );
  }

  // Unauthorized Access Guard Component
  const renderUnauthorized = (requiredRole: string) => (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
      <div className="glass-panel" style={{ padding: '2.5rem', borderLeft: '4px solid var(--danger)' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
          }}
        >
          <ShieldAlert size={32} />
        </div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          This section requires <strong>{requiredRole}</strong> privileges. Your current account role is{' '}
          <strong>{role || 'Guest'}</strong>.
        </p>
        <button
          onClick={() => {
            if (role === 'USER') setActiveScreen('user-dashboard');
            else if (role === 'RIDER') setActiveScreen('rider-dashboard');
            else if (role === 'ADMIN') setActiveScreen('admin-dashboard');
            else setActiveScreen('auth-user');
          }}
          className="btn btn-primary"
        >
          Go to Your Authorized Dashboard <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  // Screen Routing based on activeScreen and Role protection
  const renderScreen = () => {
    // Public / General screens accessible to anyone
    if (activeScreen === 'person-history') {
      return <PersonHistoryPage />;
    }

    // 1. Unauthenticated Auth Screens
    if (activeScreen === 'auth-user') {
      return (
        <UserAuthPage
          onSuccess={() => setActiveScreen('user-dashboard')}
          onSwitchPortal={(portal) => setActiveScreen(`auth-${portal.toLowerCase()}` as ScreenId)}
        />
      );
    }
    if (activeScreen === 'auth-rider') {
      return (
        <RiderAuthPage
          onSuccess={() => setActiveScreen('rider-dashboard')}
          onSwitchPortal={(portal) => setActiveScreen(`auth-${portal.toLowerCase()}` as ScreenId)}
        />
      );
    }
    if (activeScreen === 'auth-admin') {
      return (
        <AdminLoginPage
          onSuccess={() => setActiveScreen('admin-dashboard')}
          onSwitchPortal={(portal) => setActiveScreen(`auth-${portal.toLowerCase()}` as ScreenId)}
        />
      );
    }

    // 2. Protected Screen Access Guards
    if (!isAuthenticated) {
      return (
        <UserAuthPage
          onSuccess={() => setActiveScreen('user-dashboard')}
          onSwitchPortal={(portal) => setActiveScreen(`auth-${portal.toLowerCase()}` as ScreenId)}
        />
      );
    }

    // 3. USER Screens
    if (activeScreen === 'user-dashboard') {
      if (role !== 'USER') return renderUnauthorized('USER');
      return (
        <UserDashboardPage
          onRequestRide={() => setActiveScreen('request')}
          onViewMyRequests={() => setActiveScreen('user-my-requests')}
          onViewHistory={() => setActiveScreen('person-history')}
        />
      );
    }

    if (activeScreen === 'request') {
      if (role !== 'USER') return renderUnauthorized('USER');
      return <RequestRidePage onSuccess={handleRequestSuccess} />;
    }

    if (activeScreen === 'confirmation') {
      if (role !== 'USER') return renderUnauthorized('USER');
      return submittedRequest ? (
        <RequestConfirmationPage
          request={submittedRequest}
          onNewRequest={() => setActiveScreen('request')}
          onGoToDashboard={() => setActiveScreen('user-my-requests')}
        />
      ) : (
        <RequestRidePage onSuccess={handleRequestSuccess} />
      );
    }

    if (activeScreen === 'user-my-requests') {
      if (role !== 'USER') return renderUnauthorized('USER');
      return <UserMyRequestsPage onRequestRide={() => setActiveScreen('request')} />;
    }

    // 4. RIDER Screens
    if (activeScreen === 'rider-dashboard') {
      if (role !== 'RIDER') return renderUnauthorized('RIDER');
      return <RiderDashboardPage onSelectCurrentTrip={() => setActiveScreen('current-trip')} />;
    }

    if (activeScreen === 'current-trip') {
      if (role !== 'RIDER') return renderUnauthorized('RIDER');
      return <CurrentTripPage onTripCompleted={() => setActiveScreen('rider-history')} />;
    }

    if (activeScreen === 'rider-history') {
      if (role !== 'RIDER' && role !== 'ADMIN') return renderUnauthorized('RIDER or ADMIN');
      return <RiderHistoryPage />;
    }

    // 5. ADMIN Screens
    if (activeScreen === 'admin-dashboard') {
      if (role !== 'ADMIN') return renderUnauthorized('ADMIN');
      return <AdminDashboardPage />;
    }

    // Fallback default
    if (role === 'ADMIN') return <AdminDashboardPage />;
    if (role === 'RIDER') return <RiderDashboardPage onSelectCurrentTrip={() => setActiveScreen('current-trip')} />;
    return (
      <UserDashboardPage
        onRequestRide={() => setActiveScreen('request')}
        onViewMyRequests={() => setActiveScreen('user-my-requests')}
        onViewHistory={() => setActiveScreen('person-history')}
      />
    );
  };

  return (
    <div className="app-container">
      <Navbar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
      <main className="main-content">
        <ErrorBoundary>{renderScreen()}</ErrorBoundary>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
