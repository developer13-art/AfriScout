import { useMemo } from "react";
import { useDebounce } from "./useDebounce";
import { useSearchStore } from "../stores/searchStore";

export function useSearch() {
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const filters = useSearchStore((s) => s.filters);
  const patchFilters = useSearchStore((s) => s.patchFilters);
  const setFilters = useSearchStore((s) => s.setFilters);
  const reset = useSearchStore((s) => s.reset);
  const layout = useSearchStore((s) => s.layout);
  const setLayout = useSearchStore((s) => s.setLayout);
  const sort = useSearchStore((s) => s.sort);
  const setSort = useSearchStore((s) => s.setSort);

  const debouncedQuery = useDebounce(query, 300);

  return useMemo(
    () => ({
      query,
      debouncedQuery,
      setQuery,
      filters,
      setFilters,
      patchFilters,
      layout,
      setLayout,
      sort,
      setSort,
      reset,
    }),
    [
      query,
      debouncedQuery,
      setQuery,
      filters,
      setFilters,
      patchFilters,
      layout,
      setLayout,
      sort,
      setSort,
      reset,
    ],
  );
}