import { useCallback, useMemo, useState } from "react";

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export function usePagination({
  initialPage = 1,
  initialPageSize = 20,
}: UsePaginationOptions = {}) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const next = useCallback(() => setPage((p) => p + 1), []);
  const prev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const reset = useCallback(() => setPage(1), []);
  const goTo = useCallback((nextPage: number) => setPage(Math.max(1, nextPage)), []);

  return useMemo(
    () => ({ page, pageSize, setPage: goTo, setPageSize, next, prev, reset }),
    [page, pageSize, goTo, next, prev, reset],
  );
}