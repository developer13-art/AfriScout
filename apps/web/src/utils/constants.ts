export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const DEBOUNCE_MS = 300;
export const MIN_SEARCH_LENGTH = 2;

export const MAX_FILE_UPLOAD_MB = 20;

export const API_BASE_PATH = "/api/v1";

export const PIPELINE_STAGE_ORDER = [
  "DISCOVERED",
  "REVIEWING",
  "QUALIFIED",
  "PREPARING",
  "SUBMITTED",
  "UNDER_REVIEW",
  "WON",
  "LOST",
  "WITHDRAWN",
  "DISQUALIFIED",
  "EXPIRED",
] as const;

export const LOCAL_STORAGE_KEYS = {
  authToken: "afriscout.auth.token",
  refreshToken: "afriscout.auth.refresh",
  uiTheme: "afriscout.ui.theme",
  lastSearch: "afriscout.search.last",
  filters: "afriscout.filters",
} as const;