# 🛺 Lawazia Toto Desk

> **Electric Rickshaw Transportation & Dispatch Management Platform**  
> Built for the Lawazia Campus Hackathon.

---

## 📌 Overview

Lawazia operates **exactly one electric rickshaw ("Toto")** that provides shuttle transportation between three core locations:
- **College**
- **Station**
- **Office**

Because there is only one vehicle, the system strictly enforces that **only one trip can operate at any given time**. When multiple ride requests conflict for the same departure time, the platform prevents double-booking, detects clashes, and allows the driver (Rider) to manage passenger boarding (`BOARDED` vs `MISSED`) in real time.

---

## 🚀 Key Features

### 1. 👥 Multi-Role Authentication & Access
- **Passenger (USER)**: Book individual or group rides, track real-time request statuses, view personal ride history.
- **Driver (RIDER)**: View pending dispatch requests, accept trips with clash prevention, start pickups, log passenger boarding status, complete journeys.
- **Administrator (ADMIN)**: Monitor fleet operations, view total users/riders, audit request conflicts, inspect trip records and passenger boarding metrics.

### 2. ⚡ Real-Time Trip Lifecycle & Business Rules
- **Single Active Trip Constraint**: Enforced at both application and database layers via a SQLite partial unique index (`WHERE status IN ('ACCEPTED', 'IN_PROGRESS')`).
- **Conflict & Clash Detection**: Conflicting requests for the same date/time are cleanly flagged as `CLASH` (HTTP 409) with instant feedback.
- **Boarding Tracking**: Each passenger in an accepted trip is tracked individually (`PENDING` ➔ `BOARDED` or `MISSED`).
- **Safe Completion Guard**: A trip cannot be completed until all passengers have been marked as either `BOARDED` or `MISSED`.

### 3. 📱 Modern, Responsive Frontend
- **Mobile Friendly**: Full slide-out hamburger navigation drawer on mobile viewports.
- **Theme Switcher**: Seamless Dark & Light mode toggle with local persistence.
- **Live State Updates**: Real-time status indicators (`REQUESTED`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `CLASH`).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Lucide Icons, CSS Modules / Glassmorphism |
| **Backend** | Node.js (v20+ / v24), Express 5, JWT (`jsonwebtoken`) |
| **Database** | Native SQLite via `node:sqlite` (`DatabaseSync`, WAL mode enabled) |
| **Security** | `scryptSync` password hashing with timing-safe comparisons |
| **Testing** | Node.js native test runner (`node --test`), 57 passing tests |

---

## ⚙️ Quick Start Guide

### Prerequisites
- **Node.js** (v20.0.0 or higher recommended, tested on Node v24)
- **npm** (v9+)

---

### Step 1: Install Dependencies

```powershell
# In terminal 1: Install backend dependencies
cd backend
npm install

# In terminal 2: Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2: Start the Application

Open two separate terminals:

#### Terminal 1 — Backend API (Port 5000):
```powershell
cd backend
npm start
```
> Starts Express server at **`http://localhost:5000`** and initializes SQLite database (`toto.db`).

#### Terminal 2 — Frontend Application (Port 3000):
```powershell
cd frontend
npm run dev
```
> Starts Vite development server at **`http://localhost:3000`** with proxy forwarding `/api` to port 5000.

---

## 🔐 Default Credentials

The database automatically initializes the master administrator account on startup:

| Portal | Email | Password | Role |
|---|---|---|---|
| **Admin Portal** | `admin@lawazia.com` | `Admin@123456` | `ADMIN` |
| **Admin Portal (Alt)** | `admin@lawazia.edu` | `Admin@123456` | `ADMIN` |
| **User Portal** | Register new account or sign in | Any valid password | `USER` |
| **Rider Portal** | Register new account or sign in | Any valid password | `RIDER` |

*(Tip: The Admin Login page includes a one-click **"Autofill Credentials"** button).*

---

## 🧪 Running Automated Tests

The backend includes a comprehensive suite of **57 automated tests** verifying all business rules, clash prevention, boarding logic, and authorization:

```powershell
cd backend
npm test
```

### Test Coverage Highlights:
- ✅ **Phase 1**: Request submission validation, passenger payload parsing, required fields, date formatting.
- ✅ **Phase 2**: Single-active-trip enforcement, simultaneous clash detection, boarding status transitions (`BOARDED` / `MISSED`), completion validation.
- ✅ **Phase 2 Auth**: Role registration, duplicate email rejection, JWT authorization, protected route guards.
- ✅ **Phase 3 End-to-End**: Full lifecycle walkthroughs, passenger history lookup, rider history summary, edge case error handling.

---

## 📡 API Contract Overview

All endpoints adhere to `/docs/API.md`:

### Authentication (`/api/auth`)
- `POST /api/auth/signup` — Register a passenger account (`USER`)
- `POST /api/auth/rider/signup` — Register a driver account (`RIDER`)
- `POST /api/auth/login` — Authenticate and receive JWT token
- `GET /api/auth/me` — Retrieve current authenticated session

### Ride Requests (`/api/requests`)
- `POST /api/requests` — Submit a new ride request with passenger list
- `GET /api/requests` — List ride requests (supports `?mine=true` and `?status=REQUESTED`)
- `GET /api/requests/:id` — Retrieve request details
- `POST /api/requests/:id/accept` — Accept request & create active trip (enforces clash checks)

### Trip Operations (`/api/trips`)
- `GET /api/trips/current` — Get active trip (`ACCEPTED` or `IN_PROGRESS`)
- `POST /api/trips/:tripId/start` — Start pickup journey (transitions to `IN_PROGRESS`)
- `POST /api/trips/:tripId/boarding` — Record passenger boarding (`BOARDED` / `MISSED`)
- `POST /api/trips/:tripId/complete` — Complete journey and free the Toto

### History & Auditing (`/api/history` & `/api/admin`)
- `GET /api/history/person/:name` — Query trip records for any passenger name
- `GET /api/history/rider` — View all historical trips with boarding metrics
- `GET /api/admin/overview` — High-level statistics across users, trips, and boarding
- `GET /api/admin/users` — List registered users and drivers

---

## 📁 Project Structure

```text
LawaziaToto/
├── backend/
│   ├── src/
│   │   ├── middleware/      # auth.js (JWT validation, requireRole)
│   │   ├── routes/          # auth.js, requests.js, trips.js, history.js, admin.js
│   │   ├── scripts/         # seedAdmin.js
│   │   ├── utils/           # crypto.js (scryptSync password hashing)
│   │   ├── app.js           # Express app setup & route mounting
│   │   ├── db.js            # SQLite schema initialization & WAL mode
│   │   └── server.js        # Server listener (Port 5000)
│   ├── tests/               # 57 unit & E2E tests
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, StatusBadge, etc.
│   │   ├── context/         # AuthContext, ThemeContext
│   │   ├── pages/           # Dashboard & Auth pages for User, Rider, Admin
│   │   ├── services/        # api.ts (backend client), auth.ts
│   │   ├── types/           # api.ts, auth.ts
│   │   ├── App.tsx          # Role-based screen router & Error Boundary
│   │   └── main.tsx
│   ├── vite.config.ts       # Vite proxy config (Port 3000 -> 5000)
│   └── package.json
│
├── docs/                    # PRD.md, RULES.md, API.md
└── README.md
```

---

## 🏆 Hackathon Notes
- **Zero Mock Dependencies**: All functionality connects to the real SQLite database and Express backend.
- **Fault-Tolerant UI**: Components utilize defensive array unwrapping and React error boundaries to prevent runtime crashes.
- **Production Ready**: Clean separation of concerns, WAL-mode SQLite database, and strict adherence to API contracts.
