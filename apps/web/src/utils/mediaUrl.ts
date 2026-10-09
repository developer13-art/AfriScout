const imageId = "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const legacyMediaImagePath = new RegExp(`/media/images/(${imageId})(?:[?#]|$)`, "i");

export function normalizeMediaImageUrl(value?: string | null): string | null | undefined {
  if (!value) return value;
  if (/^\/api\/v1\/media\/images\//i.test(value)) return value;
  const match = value.match(legacyMediaImagePath);
  if (match) return `/api/v1/media/images/${match[1]}`;
  return value;
}
