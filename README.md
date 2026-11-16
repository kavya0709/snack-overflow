# 🍿 Snack Overflow

> An office pantry management application built for the Bipolar Factory Full Stack Intern assignment.

Snack Overflow allows employees to view, consume, and vote for their favourite office snacks, while administrators manage the pantry inventory with full CRUD capabilities. The application handles concurrent stock operations correctly using atomic PostgreSQL queries.

---

## Features

### Member (Employee) Features
- 🔐 Secure login with JWT (HttpOnly cookie)
- 📊 Dashboard with pantry summary and Snack of the Week
- 📋 Browse all snacks with search, filters, sorting, and pagination
- 🍪 Consume snacks (with amount selection)
- ❤️ Vote/unvote for favourite snacks
- 📈 View snack availability and stock status

### Admin Features
- ➕ Add new snacks (name, category, quantity, threshold)
- ✏️ Edit snack details
- 🗑️ Delete snacks (preserves activity history)
- 📦 Restock snacks
- 📜 View full activity log with pagination
- All member functionality

---

## Technology Stack

| Layer       | Technology                                   |
|-------------|----------------------------------------------|
| Frontend    | React 18 · TypeScript · Vite · Tailwind CSS  |
| Routing     | React Router v6                              |
| HTTP Client | Axios                                        |
| Icons       | Lucide React                                 |
| Backend     | Node.js · Express.js · TypeScript            |
| Auth        | JWT (HttpOnly cookies) · bcrypt              |
| Validation  | Zod                                          |
| ORM         | Prisma                                       |
| Database    | PostgreSQL 16                                |
| Testing     | Jest · Supertest                             |
| Dev Tools   | ESLint · Prettier · Docker Compose           |

---

## Project Structure

```
snack-overflow/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI (SnackCard, Modal, Sidebar, etc.)
│   │   ├── pages/          # Route-level pages (Login, Dashboard, Snacks, Activities)
│   │   ├── layouts/        # AppLayout (sidebar + content)
│   │   ├── context/        # AuthContext (global user state)
│   │   ├── services/       # API service layer (axios wrappers)
│   │   ├── types/          # TypeScript interfaces
│   │   ├── utils/          # Helpers (status labels, error extraction)
│   │   ├── App.tsx         # Router
│   │   └── main.tsx        # Entry point
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Seed script
│   ├── src/
│   │   ├── config/         # Prisma client, env config
│   │   ├── controllers/    # Route handlers (auth, snacks, consume, restock, votes, activities)
│   │   ├── routes/         # Express routers
│   │   ├── middleware/      # auth.ts, validate.ts, errorHandler.ts
│   │   ├── validators/     # Zod schemas
│   │   ├── utils/          # AppError class, snackStatus calc
│   │   ├── app.ts          # Express app factory
│   │   └── server.ts       # Entry point
│   ├── tests/
│   │   ├── helpers/        # testDb.ts (setup/teardown/factories)
│   │   ├── auth.test.ts
│   │   ├── snacks.test.ts
│   │   ├── consume-restock-vote.test.ts
│   │   └── concurrency.test.ts
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Prerequisites

- Node.js >= 18
- npm >= 9
- PostgreSQL >= 14 (or Docker + Docker Compose)

---

## Installation

### 1. Clone and navigate

```bash
git clone https://github.com/kavya0709/snack-overflow.git
cd snack-overflow
```

### 2. Configure environment variables

```bash
# Backend
cp .env.example backend/.env
# Edit backend/.env with your DB credentials

# Frontend (optional, defaults to localhost:3001)
cp .env.example frontend/.env
```

### 3. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable        | Description                        | Default                              |
|-----------------|------------------------------------|--------------------------------------|
| `DATABASE_URL`  | PostgreSQL connection string       | `postgresql://postgres:postgres@...` |
| `JWT_SECRET`    | Secret for signing JWTs            | *(required in production)*           |
| `JWT_EXPIRES_IN`| JWT expiry duration                | `7d`                                 |
| `PORT`          | Backend server port                | `3001`                               |
| `NODE_ENV`      | Environment                        | `development`                        |
| `CORS_ORIGIN`   | Allowed frontend origin            | `http://localhost:5173`              |

### Frontend (`frontend/.env`)

| Variable       | Description            | Default                  |
|----------------|------------------------|--------------------------|
| `VITE_API_URL` | Backend API base URL   | `http://localhost:3001`  |

---

## Database Setup

### Option A: Docker (Recommended)

```bash
# Start PostgreSQL only
docker-compose up postgres -d

# Or start everything (DB + backend + frontend)
docker-compose up -d
```

### Option B: Local PostgreSQL

Create a database named `snack_overflow` and configure `DATABASE_URL` in `backend/.env`.

---

## Migrations & Seed

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate dev --name init

# Seed the database
npm run db:seed
```

---

## Running the Application

### Development Mode

```bash
# Terminal 1 – Backend
cd backend
npm run dev

# Terminal 2 – Frontend
cd frontend
npm run dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:5173

### From root (requires concurrently)

```bash
npm run dev
```

---

## Demo Credentials

| Role   | Email                           | Password    |
|--------|---------------------------------|-------------|
| Admin  | `admin@snackoverflow.com`       | `Admin@123` |
| Member | `member@snackoverflow.com`      | `Member@123`|

---

## Screen Recording

The 3–5 minute walkthrough covers the application flow and the concurrency and authorization implementation:

[Watch the Snack Overflow walkthrough](https://drive.google.com/file/d/1EopzkDZczQznVYy7VwVokKxLIUlK2Yl0/view?usp=drivesdk)

---

## API Endpoints

### Authentication

| Method | Endpoint      | Auth | Description             |
|--------|---------------|------|-------------------------|
| POST   | `/auth/login` | No   | Login and set cookie    |
| GET    | `/auth/me`    | Yes  | Get current user        |
| POST   | `/auth/logout`| No   | Clear auth cookie       |

### Snacks

| Method | Endpoint                   | Auth   | Role  | Description              |
|--------|----------------------------|--------|-------|--------------------------|
| GET    | `/snacks`                  | Yes    | Any   | List (with filters/page) |
| GET    | `/snacks/summary`          | Yes    | Any   | Dashboard summary        |
| GET    | `/snacks/:id`              | Yes    | Any   | Get one snack            |
| POST   | `/snacks`                  | Yes    | Admin | Create snack             |
| PATCH  | `/snacks/:id`              | Yes    | Admin | Update snack             |
| DELETE | `/snacks/:id`              | Yes    | Admin | Delete snack             |
| POST   | `/snacks/:id/consume`      | Yes    | Any   | Consume (atomic)         |
| POST   | `/snacks/:id/restock`      | Yes    | Admin | Restock (atomic)         |
| POST   | `/snacks/:id/vote`         | Yes    | Any   | Vote for snack           |
| DELETE | `/snacks/:id/vote`         | Yes    | Any   | Remove vote              |

### Activities (Admin only)

| Method | Endpoint       | Auth  | Role  | Description             |
|--------|----------------|-------|-------|-------------------------|
| GET    | `/activities`  | Yes   | Admin | Paginated activity log  |

### Query Parameters (GET /snacks)

| Param       | Type   | Description                              |
|-------------|--------|------------------------------------------|
| `page`      | number | Page number (default: 1)                 |
| `limit`     | number | Items per page (default: 10, max: 100)   |
| `search`    | string | Search by snack name (case-insensitive)  |
| `category`  | enum   | SWEET \| SAVOURY \| DRINK \| HEALTHY_ISH |
| `status`    | enum   | STOCKED \| RUNNING_LOW \| GONE           |
| `sortBy`    | enum   | name \| quantity \| votes                |
| `sortOrder` | enum   | asc \| desc                              |

### Error Response Format

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Someone beat you to the last packet! Please refresh the pantry."
  }
}
```

---

## Database Schema

### Users
```sql
id        UUID PRIMARY KEY DEFAULT gen_random_uuid()
name      TEXT NOT NULL
email     TEXT NOT NULL UNIQUE
password  TEXT NOT NULL            -- bcrypt hash
role      ENUM(ADMIN, MEMBER)
createdAt TIMESTAMPTZ DEFAULT now()
updatedAt TIMESTAMPTZ
```

### Snacks
```sql
id                UUID PRIMARY KEY
name              TEXT NOT NULL UNIQUE
category          ENUM(SWEET, SAVOURY, DRINK, HEALTHY_ISH)
quantity          INTEGER DEFAULT 0
lowStockThreshold INTEGER DEFAULT 5
createdAt         TIMESTAMPTZ
updatedAt         TIMESTAMPTZ
```

### Votes
```sql
id        UUID PRIMARY KEY
userId    UUID REFERENCES users(id) ON DELETE CASCADE
snackId   UUID REFERENCES snacks(id) ON DELETE CASCADE
createdAt TIMESTAMPTZ

UNIQUE(userId, snackId)   -- prevents duplicate votes at DB level
```

### Activities
```sql
id        UUID PRIMARY KEY
userId    UUID REFERENCES users(id) ON DELETE SET NULL    -- nullable
snackId   UUID REFERENCES snacks(id) ON DELETE SET NULL   -- nullable
action    ENUM(RESTOCKED, CONSUMED)
amount    INTEGER
createdAt TIMESTAMPTZ
```

**Design decisions:**
- `Activities.userId` and `Activities.snackId` are nullable with `ON DELETE SET NULL`. This preserves the full history of pantry events even after a user or snack is deleted.
- `Votes` cascades on delete since votes have no independent meaning without both user and snack.

---

## Snack Status Calculation

Status is **never stored** in the database. It is always calculated dynamically:

```typescript
function calculateStatus(quantity: number, lowStockThreshold: number): SnackStatus {
  if (quantity === 0) return 'GONE';
  if (quantity <= lowStockThreshold) return 'RUNNING_LOW';
  return 'STOCKED';
}
```

This logic is implemented identically in the backend API and the frontend utility functions.

---

## Authentication & Authorization

1. **Login**: User submits credentials → server validates with bcrypt → signs a JWT → stores it in an **HttpOnly, SameSite cookie** (not accessible from JavaScript).
2. **Protected routes**: Every protected API route runs the `authenticate` middleware, which reads and verifies the cookie's JWT.
3. **Role enforcement**: Admin-only routes additionally run `requireAdmin` middleware, which checks `user.role === 'ADMIN'` server-side.
4. **Frontend UI**: The frontend hides admin controls from members, but all authorization is enforced server-side regardless.

---

## Concurrency Handling

### The Problem

A naive read-check-write sequence is **unsafe** under concurrent load:

```
Thread A: READ quantity = 3
Thread B: READ quantity = 3
Thread A: Check 3 >= 2 → OK, UPDATE SET quantity = 1  ✅
Thread B: Check 3 >= 1 → OK (stale!), UPDATE SET quantity = 2  ❌ race condition!
```

Final quantity: `2` — but it should be `1`. Stock can even go negative.

### The Solution: Atomic Conditional UPDATE

```sql
UPDATE snacks
SET quantity = quantity - $amount, "updatedAt" = NOW()
WHERE id = $id AND quantity >= $amount
RETURNING *;
```

This executes atomically in PostgreSQL. The database acquires a row-level lock during the update. If `quantity < amount`, the WHERE clause fails and returns 0 rows — the application returns HTTP 409.

**Both the stock change and the activity record are written in the same transaction:**

```typescript
await prisma.$transaction(async (tx) => {
  const updated = await tx.$queryRaw`UPDATE snacks ...`;
  if (updated.length === 0) throw AppError.conflict(...);
  await tx.activity.create({ data: { action: 'CONSUMED', amount, userId, snackId } });
  return updated[0];
});
```

If either operation fails, the entire transaction rolls back — stock and activity records always stay consistent.

### Proof: Concurrency Test

The test `concurrency.test.ts` runs against a real PostgreSQL database:

1. Creates a snack with `quantity = 3`
2. Authenticates 10 different users
3. Fires 10 simultaneous `POST /snacks/:id/consume` requests
4. Asserts exactly **3 succeed** (HTTP 200) and **7 fail** (HTTP 409)
5. Asserts final `quantity = 0` in the database
6. Asserts exactly **3 CONSUMED activity records** exist

---

## Duplicate Vote Prevention

Votes have a database-level composite unique constraint:

```sql
UNIQUE(userId, snackId)
```

When two concurrent requests attempt to create the same vote, PostgreSQL's constraint causes one to fail with a unique violation (`PrismaClientKnownRequestError` code `P2002`). The application catches this and returns HTTP 409. No application-level locking or checks are needed.

---

## Running Tests

```bash
cd backend

# Ensure PostgreSQL is running and DATABASE_URL is configured
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

**Tests cover:**
- Login success, invalid credentials, unauthenticated access
- Admin vs member route access
- Snack CRUD, search, filters, pagination
- Consumption: success, insufficient stock, 404, bad amounts
- Restock: success, auth, bad amounts
- Voting: success, duplicate, concurrent duplicates, remove
- **Concurrency**: 10 simultaneous requests on 3-unit stock

---

## Design Decisions & Trade-offs

| Decision | Rationale |
|----------|-----------|
| HttpOnly cookies over `Authorization` header | Prevents XSS token theft; standard for web apps |
| Prisma ORM + raw SQL for consume | Prisma for ergonomics; raw SQL for atomic conditional update |
| Status computed at query time | Avoids stale data; status can change with every consume |
| Nullable activity FK (SET NULL) | Preserves audit trail after user/snack deletion |
| `maxWorkers: 1` in Jest | Prevents parallel tests from interfering with each other's DB state |
| Status filter in application layer | Small trade-off for correctness; a DB view could optimize this |

---

## What Could Break First at 100x Users

1. **Status filtering in app layer**: Currently loads all matching snacks, then filters by computed status in memory. At scale, a materialized view or indexed computed column would be needed.
2. **Single PostgreSQL instance**: No read replicas. High read load on the snack listing page would saturate the DB connection pool.
3. **No caching**: The `/snacks/summary` endpoint runs multiple aggregate queries on every request. Redis caching (5-10s TTL) would dramatically reduce load.
4. **No rate limiting**: The consume endpoint could be spammed without limits.
5. **JWT expiry**: 7-day JWTs with no refresh token or revocation mechanism.

---

## Future Improvements

- Redis caching for dashboard summary
- Rate limiting with `express-rate-limit`
- JWT refresh token rotation
- Server-Sent Events for real-time quantity updates
- Idempotency keys on consume to safely retry requests
- Materialized view for status-based filtering
- CI/CD pipeline with GitHub Actions
- Role management: allow admins to invite/manage users
- Snack request system: members can request new snacks

---

*Built for the Bipolar Factory Full Stack Intern assignment.*
