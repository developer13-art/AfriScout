export interface PaginationInput {
  page?: number | string;
  pageSize?: number | string;
}

export interface PaginationOutput {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function parsePagination(
  input: PaginationInput,
  defaults: { pageSizeDefault: number; pageSizeMax: number },
): PaginationOutput {
  const page = Math.max(1, Number(input.page ?? 1) || 1);
  const requestedPageSize = Number(input.pageSize ?? defaults.pageSizeDefault) || defaults.pageSizeDefault;
  const pageSize = Math.min(defaults.pageSizeMax, Math.max(1, requestedPageSize));
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function buildPaginationMeta(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}