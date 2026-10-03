import React, { useState } from 'react';
import { RideRequest } from './types/api';
import { Navbar } from './components/Navbar';
import { RequestRidePage } from './pages/RequestRidePage';
import { RequestConfirmationPage } from './pages/RequestConfirmationPage';
import { RiderDashboardPage } from './pages/RiderDashboardPage';
import { CurrentTripPage } from './pages/CurrentTripPage';
import { PersonHistoryPage } from './pages/PersonHistoryPage';
import { RiderHistoryPage } from './pages/RiderHistoryPage';

export type NavigationTab =
  | 'request'
  | 'confirmation'
  | 'rider-dashboard'
  | 'current-trip'
  | 'person-history'
  | 'rider-history';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('request');
  const [submittedRequest, setSubmittedRequest] = useState<RideRequest | null>(null);

  const handleRequestSuccess = (request: RideRequest) => {
    setSubmittedRequest(request);
    setActiveTab('confirmation');
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'request':
        return <RequestRidePage onSuccess={handleRequestSuccess} />;
      case 'confirmation':
        return submittedRequest ? (
          <RequestConfirmationPage
            request={submittedRequest}
            onNewRequest={() => setActiveTab('request')}
            onGoToDashboard={() => setActiveTab('rider-dashboard')}
          />
        ) : (
          <RequestRidePage onSuccess={handleRequestSuccess} />
        );
      case 'rider-dashboard':
        return <RiderDashboardPage onSelectCurrentTrip={() => setActiveTab('current-trip')} />;
      case 'current-trip':
        return <CurrentTripPage onTripCompleted={() => setActiveTab('rider-history')} />;
      case 'person-history':
        return <PersonHistoryPage />;
      case 'rider-history':
        return <RiderHistoryPage />;
      default:
        return <RequestRidePage onSuccess={handleRequestSuccess} />;
    }
  };

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">{renderScreen()}</main>
    </div>
  );
};

export default App;
