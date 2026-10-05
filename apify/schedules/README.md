# Apify Schedules

Schedules on Apify run the `opportunity-discovery` actor per source on the
configured cadence. The backend stores the desired cadence on each Source
record and the actual Apify schedule IDs are configured through the Apify
console or API.

## Recommended cadences

| Source importance | Cadence        |
| ----------------- | -------------- |
| High              | Every 6 hours  |
| Medium            | Every 12 hours |
| Standard          | Daily          |
| Low               | Weekly         |
| Manual            | None           |

## Schedule shape

Each schedule targets the `opportunity-discovery` actor with the source's
`sourceId`, `sourceUrl`, `adapter`, and `sourceType`. The backend does not
embed scheduling logic in the actor itself; the actor always runs against a
single source when invoked.

## Webhook contract

Every schedule run posts back to the API endpoint
`POST /api/webhooks/apify`. The backend verifies the HMAC signature against
`APIFY_WEBHOOK_SECRET`, records the run in `source_runs`, fetches the dataset,
and enqueues ingestion through BullMQ.

## Operating notes

- The Apify token lives in the backend environment only. It is never sent to
  the browser and is never committed to the repository.
- If a schedule repeatedly fails, the backend marks the source `FAILED` and
  the admin dashboard surfaces it for investigation.
- Schedules are managed per source, not per adapter, so a source can be paused
  or throttled without touching code.