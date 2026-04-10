# Deployment evidence (screenshots)

Add **PNG** (or JPG) files here so they show in the root **`README.md`** on GitHub.

| Save as | What to capture |
|---------|-----------------|
| `01-frontend-vercel.png` | Vercel dashboard: **Production** deployment, domains, site preview |
| `02-api-health.png` | Browser on **`/health`** with `"status":"ok"` and **`database.connected": true`** |
| `03-api-root.png` | Browser on API **root** (`/`) showing welcome JSON |

After saving, commit from the repo root:

```bash
git add docs/evidence/
git commit -m "docs: add deployment evidence screenshots"
git push origin main
```

If a file is missing, GitHub may show a broken image for that line in the README until you add it.
