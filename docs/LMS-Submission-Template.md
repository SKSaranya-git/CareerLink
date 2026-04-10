# SE3040 — CareerLink — LMS submission document

**Instructions:** Open this file in a text editor, copy everything below the line into **Microsoft Word**, then replace all `[PLACEHOLDER]` fields and insert your screenshots (**Insert → Pictures**). Save as **.docx** and upload to the LMS submission link.

---

## Group details

| Group ID | `[PLACEHOLDER — e.g. Group 12]` |
|----------|----------------------------------|

| # | Full name | Student ID |
|---|-----------|------------|
| 1 | `[PLACEHOLDER]` | `[PLACEHOLDER]` |
| 2 | `[PLACEHOLDER]` | `[PLACEHOLDER]` |
| 3 | `[PLACEHOLDER]` | `[PLACEHOLDER]` |
| 4 | `[PLACEHOLDER]` | `[PLACEHOLDER]` |

## Git repository

**URL:** https://github.com/SKSaranya-git/CareerLink

All source code, README (setup, API documentation, deployment report, testing report), and evidence images are in this repository.

## Live application (deployment)

| Item | URL |
|------|-----|
| Deployed backend API | https://careerlink-production.up.railway.app |
| API health | https://careerlink-production.up.railway.app/health |
| API documentation (Swagger) | https://careerlink-production.up.railway.app/api/docs |
| Deployed frontend | https://career-link-wine.vercel.app |

*If your Vercel URL differs, replace the frontend link above and in the README on GitHub.*

## Documentation map (SE3040)

| Requirement | Where it is |
|-------------|-------------|
| Setup instructions | Repository `README.md` — section **Setup** |
| API endpoint documentation | `README.md` — **API documentation**; full interactive docs: **Swagger** (`/api/docs`); written reference: `backend/src/docs/README.md` |
| Deployment report | `README.md` — **Deployment report** |
| Testing instruction report | `README.md` — **Testing instruction report** and **Testing** |

## Screenshots (paste below)

1. **Production frontend** — browser showing the deployed Vercel app; address bar visible.  
   *[Insert picture here]*

2. **Production API health** — browser on `/health`; JSON shows healthy status and database connected.  
   *[Insert picture here]*

3. **API root** — browser on `https://careerlink-production.up.railway.app` (welcome JSON).  
   *[Insert picture here — same as repo `docs/evidence/03-api-root.png`]*

4. *(Optional)* **Swagger** at `/api/docs` or **Railway** deploy success.  
   *[Insert picture here]*

## Testing evidence (optional paste)

Run from `backend/` folder:

- Unit tests: `npm test`  
  *[Paste terminal output screenshot or summary here]*

- Integration tests (requires `MONGO_URI` and `RUN_INTEGRATION=1`): `npm run test:integration`  
  *[Optional screenshot]*

- Performance (API running + second terminal): `npm run test:perf`  
  *[Optional screenshot]*

---

**Declaration:** We confirm the submitted GitHub repository contains our own group’s work for SE3040 CareerLink, and that secrets are not committed (only variable names appear in documentation).

Group representative (name): `[PLACEHOLDER]`  
Date: `[PLACEHOLDER]`
