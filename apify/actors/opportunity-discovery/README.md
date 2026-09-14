# AfriScout Opportunity Discovery Actor

Crawls a registered public opportunity source and returns normalised items
ready for the AfriScout ingestion pipeline.

## Input

- `sourceId` - AfriScout source identifier
- `sourceUrl` - listing URL
- `sourceType` - adapter family hint
- `adapter` - the adapter key that knows how to read this source
- `country`, `category` - optional hints
- `maxItems`, `requestTimeoutSeconds` - limits

## Output

Structured JSON items shaped to the AfriScout pipeline schema. Every item
carries `sourceUrl`, `sourceId`, and `adapter` for provenance.

## Adapters

Each adapter understands the shape of a specific source family. See
`src/adapters/`. New sources of an already supported family only require a
registry entry; new families require a new adapter.