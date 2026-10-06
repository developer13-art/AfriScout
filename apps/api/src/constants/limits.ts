export const LIMITS = {
  PAGE_SIZE_DEFAULT: 20,
  PAGE_SIZE_MAX: 100,
  SEARCH_QUERY_MIN_LENGTH: 2,
  SEARCH_QUERY_MAX_LENGTH: 200,

  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,

  TITLE_MAX_LENGTH: 400,
  DESCRIPTION_MAX_LENGTH: 20000,
  NOTE_MAX_LENGTH: 4000,

  TAG_MAX_COUNT: 50,
  TAG_MAX_LENGTH: 100,

  DOCUMENT_MAX_MB: 25,

  API_KEY_PREFIX_LENGTH: 12,
  API_KEY_SECRET_LENGTH: 48,

  JOB_MAX_ATTEMPTS: 5,
  OUTBOUND_WEBHOOK_MAX_ATTEMPTS: 6,

  SOURCE_TEST_ITEMS: 5,
} as const;

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/html",
  "text/plain",
] as const;

export type AllowedDocumentMimeType = (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number];