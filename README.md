# Fair Share

A mobile-first Progressive Web App for group expense management using a **pre-funded group wallet** model. Built with **React** and **FastAPI**, backed by **PostgreSQL on Neon**.

## Wallet Model

Instead of tracking who owes whom, members deposit funds into a shared group pool:

- **`total_group_balance`** on each group tracks the combined pool
- **`individual_remaining_balance`** on each member tracks their share of the pool
- **Deposits** increase both the member balance and group total
- **Expenses** deduct split amounts from each participant's balance and from the group total

Negative individual balances are shown in red — a signal to top up.

## Architecture

```
Group (wallet pool)
 ├── GroupMember (individual balance)
 ├── Deposit
 └── Event
      ├── EventParticipant (linked to GroupMember)
      └── Expense → ExpenseSplit
```

## Quick Start

### 1. Neon Database

Create a project at [neon.tech](https://neon.tech) and copy your connection string.

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set DATABASE_URL to your Neon connection string
uvicorn app.main:app --reload --port 8000
```

`.env` example:

```
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
CORS_ORIGINS=http://localhost:5173
```

API docs: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/groups` | List groups with pool balance |
| POST | `/api/groups` | Create group with members |
| GET | `/api/groups/{id}` | Group details + member wallets |
| POST | `/api/groups/{id}/deposits` | Deposit funds to a member |
| GET | `/api/groups/{id}/deposits` | Deposit history |
| GET | `/api/groups/{id}/events` | List events |
| POST | `/api/groups/{id}/events` | Create event |
| GET | `/api/events/{id}/expenses` | Expense ledger |
| POST | `/api/events/{id}/expenses` | Add expense (deducts from wallets) |

## Split Logic

- **Equal**: Backend divides amount evenly among event participants
- **Unequal**: Exact amounts or percentages, validated before submission

All expense deductions run inside atomic SQLAlchemy transactions with row-level locks (`SELECT FOR UPDATE`) to prevent balance desyncs.

## PWA

The frontend uses `vite-plugin-pwa` with a web manifest and service worker for offline asset caching.
