# Integration tests

Tests that exercise services against a real Postgres instance
(started via `docker-compose.test.yml`). They validate routing, middleware,
permissions, and end-to-end service flows without hitting external services
(Apify, AI providers).

Use `npm run test:integration` to run only these.