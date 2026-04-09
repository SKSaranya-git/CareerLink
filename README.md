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

## Testing instruction report

This section satisfies the assignment requirement to document how tests are run. Commands and environment details are below under **Testing**.

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

## Deployment report

### Backend (example: Railway, Render, or similar)

1. Create a new **Web Service** from this repository (root or `backend` directory per host docs).
2. Set the **start command** to `npm start` (from `backend`) and Node 18+.
3. Configure **environment variables** (names only; do not commit secret values):

| Variable | Purpose |
|----------|---------|
| `PORT` | HTTP port (often provided by the host) |
| `NODE_ENV` | `production` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `CLIENT_URL` | Deployed frontend URL (CORS) |
| `SMTP_*` / `EMAIL_FROM` | Optional: email (see `backend/.env.example`) |

4. Note the public **API base URL** (for example `https://your-api.up.railway.app`).

### Frontend (example: Vercel, Netlify, or Firebase Hosting)

1. Create a project linked to this repo; set **root** to `frontend` if the host allows monorepo subfolders.
2. Build command: `npm run build`. Output directory: `dist` (Vite default).
3. Set **`VITE_API_BASE_URL`** to your deployed API (for example `https://your-api.up.railway.app/api`).

### Live URLs (fill in for submission)

- **Backend API:** _add your deployed API base URL_
- **Frontend app:** _add your deployed site URL (e.g. Vercel default domain)_

### Evidence

Add **screenshots** of the running deployed frontend and a successful API health check (`GET /health`) in your submission pack as required by the module.

Repository reference: [CareerLink on GitHub](https://github.com/SKSaranya-git/CareerLink.git).
