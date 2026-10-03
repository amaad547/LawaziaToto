export type Location = 'College' | 'Station' | 'Office';

export type PassengerStatus = 'PENDING' | 'BOARDED' | 'MISSED';

export type RequestStatus = 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

export interface Passenger {
  name: string;
  status: PassengerStatus;
}

export interface RideRequest {
  id: string;
  from: Location;
  to: Location;
  date: string;
  time: string;
  passengerCount: number;
  passengers: Passenger[];
  status: RequestStatus;
  createdAt: string;
  completedAt?: string;
}

export interface CreateRideRequestPayload {
  from: Location;
  to: Location;
  date: string;
  time: string;
  passengerCount: number;
  passengers: string[];
}

export interface BoardingUpdatePayload {
  passengers: Passenger[];
}

export interface PersonHistoryItem {
  id: string;
  date: string;
  time: string;
  from: Location;
  to: Location;
  passengerStatus: PassengerStatus;
  tripStatus: RequestStatus;
}

export interface RiderHistoryItem {
  id: string;
  date: string;
  time: string;
  from: Location;
  to: Location;
  passengerCount: number;
  boardedCount: number;
  missedCount: number;
  status: RequestStatus;
  completedAt?: string;
}

export interface ApiError {
  error: string;
  message: string;
}
