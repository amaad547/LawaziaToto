# Lawazia Toto Desk — Product Requirements Document (PRD)

## 1. Context & Purpose
Lawazia has one Toto (electric rickshaw). Students and employees need transportation between three key locations:
- **College**
- **Station**
- **Office**

Lawazia Toto Desk is a web application enabling users to submit ride requests for themselves or groups, and allowing the Toto rider to accept requests, manage boarding statuses (BOARDED/MISSED), handle schedule clashes, complete trips, and view comprehensive ride histories.

## 2. Key User Roles & Workflows

### Requester (Student / Employee)
1. **Request Ride**: Select `From`, `To`, `Date`, `Time`, and `Number of People`. Dynamically enter name for every passenger.
2. **View Confirmation**: See Request ID, route, time, list of passengers, and real-time status.
3. **Person History**: Search history by person name to view past trips, routes, dates, and boarding status (`BOARDED` / `MISSED`).

### Rider (Toto Driver)
1. **Rider Dashboard**: View all pending ride requests and current active trip status.
2. **Accept Request**: Accept a ride request. If another trip is already scheduled for that time, receive immediate notification of the clash.
3. **Current Trip & Pickup**: View accepted trip details, initiate pickup, and explicitly mark each passenger as `BOARDED` or `MISSED`.
4. **Complete Trip**: Finalize the trip, mark Toto as free, and update historical records.
5. **Rider History**: View completed trip history with passenger counts, boarding breakdown, routes, and dates.

## 3. Key Data Model & Entities

### Locations
- `College`
- `Station`
- `Office`

### Request / Trip Entity
- `id`: string/number
- `from`: "College" | "Station" | "Office"
- `to`: "College" | "Station" | "Office"
- `date`: "YYYY-MM-DD"
- `time`: "HH:mm"
- `passengerCount`: number
- `passengers`: array of passenger objects `[{ name: string, status: "PENDING" | "BOARDED" | "MISSED" }]`
- `status`: "REQUESTED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "CANCELLED"
- `createdAt`: ISO Timestamp
- `completedAt`: ISO Timestamp (optional)
