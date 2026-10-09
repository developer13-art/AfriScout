export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
  };
}

export interface ApiSuccess<T> {
  data: T;
}

export type SortDirection = "asc" | "desc";

export interface SortOptions {
  field: string;
  direction: SortDirection;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type AsyncStatus = "idle" | "loading" | "success" | "error";