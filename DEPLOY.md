# Deploying (frontend on Vercel + backend on Render)

Two separate deploys that talk over HTTPS:

- **Backend (FastAPI) → Render** — a normal long-lived server
- **Frontend (React/Vite) → Vercel** — a static build that calls the Render API

---

## 0. Get hosted databases (required)

A cloud server can't reach your laptop, so you need hosted DBs (free tiers):

- **PostgreSQL** → [Neon](https://neon.tech) or [Supabase](https://supabase.com).
  Copy the connection string and make it SQLAlchemy-friendly:
  `postgresql+psycopg2://USER:PASSWORD@HOST/DB?sslmode=require`
- **MongoDB** → [MongoDB Atlas](https://www.mongodb.com/atlas).
  Copy the SRV string: `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
  (In Atlas → Network Access, allow `0.0.0.0/0` so Render can connect.)

---

## 1. Backend → Render

1. Push this repo to GitHub (already done).
2. Render Dashboard → **New → Blueprint** → connect the repo. Render reads
   [`render.yaml`](render.yaml) and creates the `resume-screener-api` web service.
   *(Or New → Web Service, runtime **Python**, build `pip install -r backend/requirements.txt`,
   start `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`.)*
3. In the service's **Environment**, set the secret vars (`sync: false` in the blueprint):
   - `DATABASE_URL` = your Neon string (with `postgresql+psycopg2://` + `?sslmode=require`)
   - `MONGODB_URL` = your Atlas SRV string
   - `CORS_ORIGINS` = your Vercel URL **as a JSON list**, e.g. `["https://your-app.vercel.app"]`
     *(you'll know this after step 2 below — come back and set it, then redeploy)*
   - `JWT_SECRET` is auto-generated; `LLM_PROVIDER=mock` works with no key.
4. Deploy. When it's live, note the URL, e.g. `https://resume-screener-api.onrender.com`.
   Check `https://…onrender.com/v1/health` → `{"status":"ok"}`.

> Free Render services sleep when idle and cold-start in ~30–60s on first hit — normal.

---

## 2. Frontend → Vercel

1. Vercel → **Add New → Project** → import the same GitHub repo.
2. **Root Directory:** `frontend-react` (important — not the repo root).
   Framework preset auto-detects **Vite** (build `npm run build`, output `dist`).
3. **Environment Variables:** add
   - `VITE_API_BASE` = your Render backend URL (no trailing slash),
     e.g. `https://resume-screener-api.onrender.com`
4. Deploy. You'll get `https://your-app.vercel.app`.

> ⚠️ The backend env vars (`DATABASE_URL`, `MONGODB_URL`, `JWT_SECRET`, …) belong on
> **Render, not Vercel**. On Vercel the frontend only needs `VITE_API_BASE`.

---

## 3. Connect the two (CORS)

Go back to **Render → `CORS_ORIGINS`** and set it to your Vercel URL as a JSON list:

```
["https://your-app.vercel.app"]
```

Save and let Render redeploy. Now the browser on `your-app.vercel.app` is allowed to
call the API on `…onrender.com`.

---

## 4. Verify

1. Open `https://your-app.vercel.app` → the sign-in page loads.
2. Register an account → the dashboard appears.
3. Create a job, upload a resume → it ranks. If a call fails, open the browser
   DevTools → Network tab:
   - **CORS error** → fix `CORS_ORIGINS` on Render (exact Vercel origin, JSON list).
   - **404 / connection refused** → check `VITE_API_BASE` points at the Render URL.
   - **500 on first request** → check `DATABASE_URL` / `MONGODB_URL` (Atlas IP allowlist).

---

## Notes
- **Migrations:** `render.yaml` sets `AUTO_CREATE_TABLES=true`, so tables are created on
  first boot. For stricter prod, set it to `false` and run `alembic upgrade head` once.
- **Redeploys:** pushing to GitHub redeploys both (Render + Vercel watch the repo).
- **Local dev is unchanged:** with `VITE_API_BASE` empty, the app uses relative `/v1`
  (Vite proxy in dev, or the backend serving the build).
