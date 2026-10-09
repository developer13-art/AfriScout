import { env } from "../config/env";

const imageId = "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const legacyMediaImagePath = new RegExp(`/media/images/(${imageId})(?:[?#]|$)`, "i");
const canonicalMediaImagePath = new RegExp(`^/api/v1/media/images/(${imageId})(?:[?#]|$)`, "i");

function imageEndpoint(id: string): string {
  const apiBase = env.apiUrl.replace(/\/+$/, "");
  if (/^https?:\/\//i.test(apiBase)) return `${apiBase}/media/images/${id}`;
  return `/api/v1/media/images/${id}`;
}

export function normalizeMediaImageUrl(value?: string | null): string | null | undefined {
  if (!value) return value;
  const canonicalMatch = value.match(canonicalMediaImagePath);
  if (canonicalMatch?.[1]) return imageEndpoint(canonicalMatch[1]);
  const match = value.match(legacyMediaImagePath);
  if (match?.[1]) return imageEndpoint(match[1]);
  return value;
}
