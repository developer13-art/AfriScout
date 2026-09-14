export const SEARCH_INTENT_PROMPT_VERSION = "search-intent.v1";

export function SEARCH_INTENT_PROMPT(input: { query: string }): string {
  return `Convert the following natural language search into structured filters.

Query: ${input.query}

Return strict JSON with optional fields:
- q
- category
- countryCode
- region
- city
- deadlineBefore
- deadlineAfter
- isRemote
- minValue
- maxValue
- currency`;
}