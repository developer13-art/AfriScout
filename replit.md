# Running Scout on Replit

The `Start application` workflow runs the React/Vite frontend on port 5000. Start
or restart that workflow to open the app in Replit Preview.

The frontend can render without the API, but API-backed pages and live totals
will not load until the API is available at `http://localhost:4000`. The API
also requires a reachable PostgreSQL database, Redis, and its required
environment settings (see `apps/api/src/config/env.ts`). These services are not
started by the frontend workflow.
