# TaskSentinel

**Smart task monitoring system that automatically detects risk, inactivity, and deadlines.**

Unlike traditional to-do apps where you manage everything manually, TaskSentinel **actively watches your tasks** and warns you when things are going wrong — overdue deadlines, inactive projects, and escalating risk levels are all detected automatically.

---

## Features

### Automatic Risk Detection Engine
- Tasks are classified in real-time as **Red** (at risk), **Yellow** (warning), or **Green** (on track)
- Risk is computed based on deadline proximity, inactivity duration, and priority level
- Risk recalculates on every task mutation and every monitoring sweep

### Google Apps Script Cron Integration
- External cron job runs every 10 minutes via Google Apps Script
- Calls the backend `/monitoring/sweep` endpoint to batch-recalculate all task risks
- Sends **email alerts** when tasks escalate to critical status
- Health check endpoint monitored hourly

### Dashboard with Real-Time Analytics
- **Productivity Score** — speedometer gauge showing % of tasks on track
- **Risk Distribution** — interactive donut chart with animated segments
- **Calendar Streak** — monthly calendar highlighting days with completed tasks
- **Motivational Quotes** — rotating curated quotes from 50+ entries
- **Activity Feed** — real-time log of all task changes
- **Stat Cards** — total tasks, at-risk, in-progress, completed counts

### Smart Notifications
- In-app notifications when risk levels change
- Unread count badge with 30-second polling
- Email alerts via Google Apps Script for critical tasks

### Full Task Management
- Create, edit, delete tasks with title, description, priority, deadline, tags
- Quick actions: mark done or start working directly from task cards
- Filter by status, risk level, priority
- Activity log per task showing all changes

### User Profile & Auth
- JWT authentication with access + refresh tokens
- Profile page to update name, email, phone
- Password change with current password verification

### Dark Mode
- Full dark/light theme toggle
- CSS custom properties for seamless switching
- Preference saved in localStorage

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), TypeScript, CSS Modules |
| **Backend** | FastAPI, Python 3.10+, Pydantic, PyMongo |
| **Database** | MongoDB Atlas (cloud-hosted) |
| **Auth** | JWT (python-jose), bcrypt password hashing |
| **Cron** | Google Apps Script (external time-driven triggers) |
| **Styling** | CSS Modules only (no Tailwind), CSS custom properties |

---

## Project Structure

```
TaskSentinel/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, lifespan
│   │   ├── config.py            # Settings via pydantic-settings
│   │   ├── database.py          # MongoDB connection + indexes
│   │   ├── models/              # (MongoDB is schemaless — schemas in schemas/)
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── routers/             # API routes (auth, tasks, monitoring, notifications, dashboard)
│   │   ├── services/            # Business logic (risk_engine, task_service, monitor_service)
│   │   ├── data/quotes.json     # 50+ curated motivational quotes
│   │   └── utils/               # Time helpers
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/                     # Next.js pages (dashboard, tasks, notifications, profile, login, register)
│   ├── components/              # Reusable components (layout, dashboard, tasks, notifications, shared)
│   ├── context/                 # React contexts (Auth, Toast)
│   ├── lib/                     # API layer (typed fetch wrapper, per-domain API helpers)
│   ├── hooks/                   # Custom React hooks
│   └── .env.example
└── scripts/gas/
    └── monitor.js               # Google Apps Script for cron monitoring + email alerts
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # Edit with your MONGODB_URL and SECRET_KEY
python -m uvicorn app.main:app --port 8001 --reload
```

The API will be available at `http://localhost:8001` with Swagger docs at `/docs`.

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev -- -p 3001
```

The app will be available at `http://localhost:3001`.

### Google Apps Script Setup (Optional)

1. Go to [script.google.com](https://script.google.com) and create a new project
2. Paste the contents of `scripts/gas/monitor.js`
3. Add Script Properties:
   - `API_BASE` = your deployed backend URL
   - `MONITOR_API_KEY` = matching key from backend `.env`
   - `ALERT_EMAIL` = your email for alerts
4. Create time-driven triggers:
   - `runMonitoringSweep` → every 10 minutes
   - `checkHealth` → every 1 hour

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile (name, email, phone) |
| POST | `/api/auth/change-password` | Change password |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (filterable, paginated) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/{id}` | Get single task |
| PUT | `/api/tasks/{id}` | Update task |
| PATCH | `/api/tasks/{id}/status` | Change status |
| DELETE | `/api/tasks/{id}` | Delete task |
| GET | `/api/tasks/{id}/activity` | Task activity log |

### Monitoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/monitoring/sweep` | Trigger risk recalculation (API key required) |
| GET | `/api/monitoring/health` | Health check |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Task counts, risk distribution, productivity score |
| GET | `/api/dashboard/risk-trend` | Risk snapshots over time |
| GET | `/api/dashboard/recent-activity` | Latest 20 activity entries |
| GET | `/api/dashboard/quote` | Random motivational quote |
| GET | `/api/dashboard/streak` | Current completion streak |
| GET | `/api/dashboard/calendar-streak` | Monthly calendar with active dates |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications |
| GET | `/api/notifications/count` | Unread count |
| PATCH | `/api/notifications/{id}/read` | Mark as read |
| POST | `/api/notifications/read-all` | Mark all as read |

---

## Risk Detection Algorithm

```
compute_risk(task) -> "red" | "yellow" | "green"

  if status is done/cancelled → green

  Deadline rules:
    overdue or due ≤ 24h         → red
    due ≤ 72h + critical/high    → red
    due ≤ 72h                    → yellow

  Inactivity rules:
    inactive ≥ 5 days            → red
    inactive ≥ 2 days            → yellow

  Priority boost:
    critical + deadline ≤ 7 days → yellow

  default → green
```

---

## How It Works

```
You add tasks with deadlines and priorities
         ↓
Every 10 minutes, Google Apps Script triggers a sweep
         ↓
Backend recalculates risk for ALL active tasks:
  - "DB Assignment" due in 12h → RED (at risk)
  - "React Project" no activity for 3 days → YELLOW (warning)
  - "OS Notes" just created → GREEN (on track)
         ↓
Risk changes generate in-app notifications
         ↓
Critical tasks trigger email alerts via Apps Script
         ↓
Dashboard updates: risk chart, productivity score, activity feed
```

You don't check anything. The system does the thinking.

---

## License

MIT
