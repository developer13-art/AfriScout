# AfriScout API

Node.js + Express + TypeScript API and background workers for AfriScout.

## Scripts

- `npm run dev` - start the API with live reload (port 4000)
- `npm run dev:worker` - start the worker process with live reload
- `npm run build` - compile TypeScript to `dist/`
- `npm run start` - run the compiled API
- `npm run start:worker` - run the compiled worker
- `npm run typecheck` - TypeScript check, no emit
- `npm run lint` - ESLint
- `npm run test` - Vitest

## Database

Prisma schema and seed live under `src/database/prisma/`.

- `npm run db:generate` - generate the Prisma client
- `npm run db:migrate` - create and apply migrations (dev)
- `npm run db:migrate:deploy` - apply pending migrations (production)
- `npm run db:reset` - reset the database (destructive, dev only)
- `npm run db:seed` - seed reference data and the initial super admin
- `npm run db:studio` - open Prisma Studio

## Architecture

- `src/config/` - env, database, redis, apify, ai, mail, storage, cors, logger
- `src/constants/` - roles, permissions, lifecycles, categories, weights, limits
- `src/types/` - domain types and augmentations
- `src/utils/` - errors, helpers, slugify, pagination, hashing, crypto, sanitize
- `src/middleware/` - auth, api key, role, permission, validation, rate limiting
- `src/validators/` - Zod schemas for every payload
- `src/services/` - domain services (auth, users, dna, opportunities, apify, ai, etc.)
- `src/controllers/` - HTTP handlers, thin wrappers over services
- `src/routes/` - Express routers grouped by audience
- `src/jobs/` - BullMQ queues, workers, schedulers, and job definitions
- `src/workers/` - worker entry point
- `src/openapi/` - OpenAPI specification and serving helpers
- `src/database/` - Prisma client and schema/seed

## Environment

Every setting is validated on startup with Zod. See `.env.example` at the
repository root. Missing or invalid values cause the process to exit
immediately with a clear error.