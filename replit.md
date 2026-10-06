# Running Scout on Replit

The `Start application` workflow runs the React/Vite frontend on port 5000. Start
or restart that workflow to open the app in Replit Preview.

The frontend can render without the API, but API-backed pages and live totals
will not load until the API is available at `http://localhost:4000`. The API
prefers `NEON_DATABASE_URL` when present, otherwise it uses `DATABASE_URL`.
Keep `NEON_DATABASE_URL` and `NEON_DATABASE_URL_DIRECT` on the same Neon branch;
Prisma migration commands require the matching direct endpoint. The API also
requires Redis and the other environment settings listed in
`apps/api/src/config/env.ts`. These services are not started by the frontend
workflow.
