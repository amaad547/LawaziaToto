# Lawazia Toto Desk — Product Requirements Document

## 1. Product Overview

Lawazia has one Toto that transports students and employees between:

- College
- Station
- Office

The Toto can run only one trip at a time.

The system is a digital desk for managing ride requests, accepting one request for a given time, recording who actually boarded, completing trips, and maintaining history.

The application must solve one core problem:

> Take ride requests, manage the Toto's trip schedule, record actual boarding, and preserve trip history.

---

# 2. Primary Users

The system has two primary user types.

## 2.1 Requester / Person

A person can create a ride request for:

- From
- To
- Date/time
- Number of riders
- Name of every rider

One person submits the request for themselves or for a group.

A person can later view trips where their name appears as a rider.

---

## 2.2 Rider / Toto Operator

The rider operates the single Toto.

The rider can:

1. View ride requests.
2. Accept a request.
3. See clashes.
4. Start pickup.
5. Mark each requested person as Boarded or Missed.
6. Complete/drop the trip.
7. View every trip in rider history.

---

# 3. Core Business Rules

## Rule 1 — One Toto

There is exactly one Toto.

Therefore, the system must never allow two accepted trips that overlap.

---

## Rule 2 — Accept

When the rider accepts a request:

- The request becomes `ACCEPTED`.
- The Toto is reserved for that trip's scheduled time.
- The request can no longer be accepted as another active trip.
- Other conflicting requests cannot be accepted for the same time.

---

## Rule 3 — Clash

If two requests require the Toto at the same time:

- Only one can be accepted.
- The other must be marked or displayed as `CLASH`.
- The system must not allow both to become accepted.

The backend must enforce this rule. Frontend validation alone is not sufficient.

---

## Rule 4 — Pickup

When the trip reaches pickup:

Every requested rider must have an individual boarding status.

Each name must be either:

- `BOARDED`
- `MISSED`

Example:

```text
Trip #101

Rahul       BOARDED
Aman        BOARDED
Priya       MISSED
```

There is intentionally no assumption that everyone in the request actually boarded.

---

## Rule 5 — Done

After pickup/drop is completed:

- The trip becomes `COMPLETED`.
- The Toto becomes available for another trip.
- Boarding results are permanently stored.
- The trip appears in history.

---

# 4. Request Data

A ride request contains:

```text
Request
├── From
├── To
├── Scheduled date
├── Scheduled time
├── Number of people
└── People
    ├── Name 1
    ├── Name 2
    └── Name N
```

The number of people must match the number of names submitted.

---

# 5. Trip Lifecycle

A request follows this general lifecycle:

```text
REQUESTED
    │
    ├── accepted ──> ACCEPTED
    │                    │
    │                    ↓
    │                 PICKUP
    │                    │
    │                    ↓
    │               COMPLETED
    │
    └── clash ─────> CLASH
```

Possible status values:

```text
REQUESTED
ACCEPTED
CLASH
IN_PROGRESS
COMPLETED
```

A missed/cancelled request must not become an accepted trip.

---

# 6. Main Screens

## 6.1 Request Ride

Purpose:

Allow a person to create a ride request.

Fields:

- From
- To
- Date
- Time
- Number of people
- Names

The UI should dynamically create name fields based on the number of people.

Example:

```text
From: College
To: Station
Date: 03 Oct
Time: 10:30 AM

Number of people: 3

1. Rahul
2. Aman
3. Priya

[Submit Request]
```

---

# 6.2 Request Confirmation

After submission show:

- Request ID
- From
- To
- Date/time
- Names
- Current status

Example:

```text
Request #104

College → Station
03 Oct · 10:30 AM

Rahul
Aman
Priya

Status: REQUESTED
```

---

# 6.3 Rider Dashboard

The rider dashboard should show:

- Pending requests
- Accepted/current trip
- Conflicting requests
- Upcoming trips
- Trip status

Example:

```text
TODAY

Current Trip
College → Station
10:30 AM

3 People
2 Boarded
1 Pending

[Pickup]
[Complete]
```

---

# 6.4 Accept Request

The rider should be able to accept a pending request.

Before accepting:

The system checks whether the Toto is already reserved for that time.

If available:

```text
Request accepted.
```

If occupied:

```text
Clash
Toto already has a trip at this time.
```

The backend must perform the actual conflict check.

---

# 6.5 Pickup Screen

For every person in the accepted trip:

```text
Pickup

Rahul       [Boarded] [Missed]
Aman        [Boarded] [Missed]
Priya       [Boarded] [Missed]
```

Each person must have exactly one final boarding result.

---

# 6.6 Complete Trip

The rider can finish the trip after boarding has been recorded.

Example:

```text
College → Station

Rahul       Boarded
Aman        Boarded
Priya       Missed

[Complete Trip]
```

After completion:

```text
Trip completed.
Toto is now free.
```

---

# 6.7 Person History

A person history view shows every trip where that person's name appears.

Example:

```text
Rahul — Trip History

03 Oct
College → Station
Boarded

01 Oct
Station → College
Boarded

28 Sep
College → Office
Missed
```

Important:

History is based on the person's name appearing in the trip request.

---

# 6.8 Rider History

Rider history shows every trip operated by the Toto/rider.

Example:

```text
Rider History

#105
College → Station
03 Oct · 10:30 AM
3 requested
2 boarded
1 missed
Completed

#104
Station → Office
03 Oct · 09:00 AM
2 requested
2 boarded
Completed
```

---

# 7. Minimum Required Data

## Person

```text
id
name
```

A full authentication system is not required unless needed by the implementation.

---

## Ride Request

```text
id
from
to
scheduledDate
scheduledTime
people[]
status
createdAt
```

---

## Trip

```text
id
requestId
from
to
scheduledDate
scheduledTime
status
acceptedAt
completedAt
```

---

## Trip Passenger

```text
id
tripId
name
boardingStatus
```

Where:

```text
boardingStatus =
BOARDED | MISSED
```

---

# 8. Functional Requirements

### FR-01
A user must be able to submit a ride request.

### FR-02
A request must contain origin and destination.

### FR-03
A request must contain a scheduled date and time.

### FR-04
A request must contain every passenger's name.

### FR-05
The system must prevent mismatches between passenger count and submitted names.

### FR-06
The rider must be able to view pending requests.

### FR-07
The rider must be able to accept an available request.

### FR-08
The system must prevent conflicting accepted trips.

### FR-09
The rider must be able to mark every passenger as Boarded or Missed.

### FR-10
The rider must be able to complete a trip.

### FR-11
Completed trips must remain available in history.

### FR-12
Person history must show trips containing that person's name.

### FR-13
Rider history must show every trip.

---

# 9. Acceptance Tests

## Test 1 — Same-Time Clash

Given:

```text
Request A
10:00 AM
College → Station

Request B
10:00 AM
Station → Office
```

When the rider accepts Request A:

```text
Request A = ACCEPTED
```

Request B must not be accepted.

Expected:

```text
Request A → ACCEPTED
Request B → CLASH
```

There must never be two accepted trips for the same Toto at the same time.

---

## Test 2 — Boarding

Given:

```text
Trip #1

Rahul
Aman
Priya
```

The rider records:

```text
Rahul → BOARDED
Aman → BOARDED
Priya → MISSED
```

Expected:

```text
2 boarded
1 missed
```

---

## Test 3 — Person History

If Rahul participated in:

```text
Trip #1
Trip #4
Trip #7
```

Rahul's history must contain those trips.

---

## Test 4 — Rider History

The rider history must contain:

```text
Trip #1
Trip #2
Trip #3
...
```

Every completed/accepted trip must be represented.

---

# 10. Non-Goals

Do NOT build unnecessary features during the hackathon.

Do not add unless explicitly required:

- Multiple Totos
- Payments
- GPS tracking
- Live maps
- Driver ratings
- Chat
- Notifications
- Complex authentication
- Admin roles
- Ride pricing
- Route optimization
- AI chatbot
- Social features

The goal is a reliable Toto request, acceptance, boarding, completion, and history system.

---

# 11. MVP Priority

### P0 — Must Work

1. Create request.
2. Add multiple passenger names.
3. View requests.
4. Accept request.
5. Prevent time clash.
6. Record Boarded/Missed.
7. Complete trip.
8. Person history.
9. Rider history.

### P1 — Nice to Have

- Search/filter history.
- Better status indicators.
- Request details.
- Empty states.
- Loading/error states.
- Responsive/polished UI.

### P2 — Only If Time Remains

- Notifications.
- Advanced analytics.
- Authentication.
- Extra dashboard statistics.
- Animations.

---

# 12. Definition of Done

The MVP is considered complete only when these three scenarios work end-to-end:

### Scenario A

Two requests → same time → one accepted → one clash.

### Scenario B

One trip → three names → two boarded → one missed.

### Scenario C

The two boarded people can see the trip in their history, and the rider can see the trip in rider history.

The system should work reliably with real persisted data rather than only mock UI state.