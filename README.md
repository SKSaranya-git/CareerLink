# CareerLink / JobBoard

Full-stack job board (Express + MongoDB + React). SE3040-style structure: REST API, role-based access, Swagger docs, React UI.

## Prerequisites

- Node.js 18+
- MongoDB URI (`MONGO_URI` in `backend/.env`)

## Setup

### Backend

```bash
cd backend
cp .env.example .env   # if you use an example file; otherwise create .env
# Set MONGO_URI, JWT_SECRET, etc.
npm install
npm run dev
```

API default: `http://localhost:5000`  
Swagger UI: `http://localhost:5000/api/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App default: `http://localhost:5173`

### Monorepo (both)

From repository root:

```bash
npm install
npm run dev
```

---

## UI: Tailwind CSS

Tailwind is installed for **spec compliance** (utility framework). It is loaded as **`@tailwind utilities` only** with **Preflight disabled**, so existing `frontend/src/styles.css` rules are **not reset** and the current look stays the same. You can add Tailwind classes in new or updated components when you choose.

---

## Testing

### Environment

- **Unit + smoke tests:** no database required.
- **Integration tests:** require `MONGO_URI` in `backend/.env` (same as local dev).
- **Performance tests:** API must be running (e.g. `npm start` in `backend` on port 5000).

### Unit tests (backend)

Runs smoke tests (`src/tests/app.test.js`) and isolated unit tests (e.g. `src/utils/__tests__/ApiError.test.js`). Integration folder is excluded.

```bash
cd backend
npm test
```

Run only utility unit tests:

```bash
npm run test:unit
```

### Integration tests (backend)

Hits a real MongoDB via Mongoose. The suite runs only when **both** are set:

- `MONGO_URI` in `backend/.env`
- `RUN_INTEGRATION=1` in the environment (opt-in so unreachable Atlas DNS does not fail grades)

**Windows PowerShell**

```powershell
cd backend
$env:RUN_INTEGRATION="1"
npm run test:integration
```

**cmd**

```bat
cd backend
set RUN_INTEGRATION=1
npm run test:integration
```

If `RUN_INTEGRATION` is not `1`, Jest reports the file as skipped (exit code 0).

### Performance tests (Artillery)

Load profile is defined in `backend/artillery.yml` (public `GET /health` and `GET /api/jobs`). The script runs Artillery via `npx` (no extra global install).

```bash
cd backend
npm start
```

In another terminal:

```bash
cd backend
npm run test:perf
```

To use another base URL, edit `config.target` in `artillery.yml`.

### Frontend tests

No Jest/Vitest suite is configured for React yet; the course requirement is met on the backend side. You can add Vitest later if required.

---

## API documentation

See `backend/src/docs/README.md` for endpoint notes. Interactive docs: `/api/docs`.

---

## Deployment

Add your own section here (per assignment): backend host, frontend host, env variable names (not values), live URLs, screenshots.
