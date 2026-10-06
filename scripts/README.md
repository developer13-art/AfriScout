# AfriScout Scripts

Repository-level utilities for setup, development, and verification.

## Available scripts

| Script                        | Purpose                                                            |
| ----------------------------- | ------------------------------------------------------------------ |
| `setup.ts`                    | End-to-end local setup: install, env files, Docker, migrate, seed  |
| `dev.ts`                      | Run API, worker, and web concurrently with prefixed output         |
| `seed.ts`                     | Seed reference data and the initial super admin                    |
| `migrate.ts`                  | Run Prisma migrations in `dev`, `deploy`, or `reset` mode          |
| `reset-db.ts`                 | Drop, recreate, and reseed the database (development only)         |
| `generate-api-key.ts`         | Generate an API key prefix, plaintext, and SHA-256 hash            |
| `run-actor.ts`                | Trigger a single Apify actor run from the CLI                      |
| `test-apify-connection.ts`    | Verify the Apify token and connectivity                            |
| `test-ai-providers.ts`        | Verify the AI provider fallback chain end-to-end                   |
| `check-env.ts`                | Verify required environment files exist                            |
| `verify-build.ts`             | Build every workspace and confirm artifacts exist                  |

## Usage

From the repository root:
