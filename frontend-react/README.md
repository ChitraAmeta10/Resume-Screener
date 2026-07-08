# Sift — React frontend

The web UI for the Resume Screener, built with **React + TypeScript + Vite**. It talks
to the FastAPI backend over its REST API (`/v1/...`).

## Structure

```
src/
  main.tsx            app entry (mounts <App/> inside <ToastProvider/>)
  App.tsx             auth gate + app shell (sidebar + view router) + new-job modal
  api.ts              fetch wrapper, token store, 401 handling
  types.ts            TypeScript interfaces mirroring the API responses
  utils.ts            fit-band helpers, weight formatting, pipeline stages
  toast.tsx           toast context/provider
  icons.tsx           inline SVG icon + logo components
  index.css           global styles (shared design system)
  components/
    AuthView.tsx      login / register
    Sidebar.tsx       brand · nav (Overview / All candidates) · jobs · user block
    Dashboard.tsx     KPIs, fit distribution, top skills, top candidates, job cards
    TalentPool.tsx    searchable cross-job candidate pool
    JobDetail.tsx     upload + ranked candidates + weight slider/sort/filter/export
    StageSelect.tsx   pipeline-stage pill (PATCHes candidate status)
```

## Develop

Two options:

**A. Served by the API (what production uses).** Build once, then the FastAPI server
serves `dist/` at `/`:

```bash
npm install
npm run build          # or: make web-build
# then run the API (make run) and open http://localhost:8001/
```

**B. Vite dev server with hot reload.** Runs on :5173 and proxies `/v1` to the API on
:8001 (start the API separately):

```bash
npm run dev            # or: make web-dev
# open http://localhost:5173/
```

## How it's wired to the backend

- Auth uses a JWT stored in `localStorage`; `api.ts` attaches it as a Bearer token and
  forces a logout on any `401`.
- No routing library — the shell switches between Overview / All candidates / Job views
  with React state.
- The design system (CSS) is shared with the original vanilla UI, so the look is identical.
