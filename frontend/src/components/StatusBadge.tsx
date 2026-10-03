import React from 'react';
import { RequestStatus, PassengerStatus } from '../types/api';
import { Clock, CheckCircle2, PlayCircle, XCircle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: RequestStatus | PassengerStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'REQUESTED':
      case 'PENDING':
        return {
          className: 'badge-requested',
          icon: <Clock size={12} />,
          label: status === 'REQUESTED' ? 'Requested' : 'Pending',
        };
      case 'ACCEPTED':
        return {
          className: 'badge-accepted',
          icon: <CheckCircle2 size={12} />,
          label: 'Accepted',
        };
      case 'IN_PROGRESS':
        return {
          className: 'badge-in_progress',
          icon: <PlayCircle size={12} />,
          label: 'In Pickup',
        };
      case 'COMPLETED':
        return {
          className: 'badge-completed',
          icon: <CheckCircle2 size={12} />,
          label: 'Completed',
        };
      case 'BOARDED':
        return {
          className: 'badge-boarded',
          icon: <CheckCircle2 size={12} />,
          label: 'Boarded',
        };
      case 'MISSED':
        return {
          className: 'badge-missed',
          icon: <XCircle size={12} />,
          label: 'Missed',
        };
      default:
        return {
          className: 'badge-requested',
          icon: <AlertCircle size={12} />,
          label: status,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span className={`badge ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
};
