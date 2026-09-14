# AfriScout Shared

Single source of truth for constants, enums, domain types, validators, Apify
I/O schemas, and pure utilities used by the API, the web app, and the Apify
actors.

Everything here is dependency-light and side-effect-free. No database,
network, filesystem, or environment access.

## Exports

- `@afriscout/shared/constants` - roles, permissions, lifecycles, categories, limits
- `@afriscout/shared/enums` - runtime enums mirroring Prisma enums
- `@afriscout/shared/types` - domain types shared across services and clients
- `@afriscout/shared/validators` - Zod schemas for API payloads
- `@afriscout/shared/apify` - Actor input and output schemas
- `@afriscout/shared/utils` - pure helpers (dates, currency, strings, slugs)