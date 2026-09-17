import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Filter, LayoutGrid, List, Sparkles } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { PageHeader } from "../../components/layout/PageHeader";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { FilterBar } from "../../components/ui/FilterBar";
import { Pagination } from "../../components/ui/Pagination";
import { Drawer } from "../../components/ui/Drawer";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { OpportunityGrid } from "../../components/opportunities/OpportunityGrid";
import { OpportunityList } from "../../components/opportunities/OpportunityList";
import { OpportunityFilterPanel } from "../../components/opportunities/OpportunityFilterPanel";
import { AfricaOpportunityMap } from "../../components/map/AfricaOpportunityMap";
import { useOpportunities } from "../../hooks/useOpportunities";
import { useSearchStore } from "../../stores/searchStore";
import { useSaved } from "../../hooks/useSaved";
import { useDebounce } from "../../hooks/useDebounce";
import { usePagination } from "../../hooks/usePagination";
import { usePublicCountryBreakdown, usePublicTotals } from "../../hooks/usePublicAnalytics";
import { SeoHead } from "../../components/common/SeoHead";
import { Loader } from "../../components/ui/Loader";
import { ErrorState } from "../../components/ui/ErrorState";
import { labelForCategory } from "../../config/categories";
import type { OpportunityFilters } from "../../types/opportunity";

const PAGE_SIZE = 20;

export function Explore() {
  const [params, setParams] = useSearchParams();
  const store = useSearchStore();
  const { add: addSaved } = useSaved();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const { page, setPage, reset: resetPage } = usePagination();

  const filters: OpportunityFilters = useMemo(
    () => ({
      category: (params.get("category") as OpportunityFilters["category"]) ?? undefined,
      countryCode: params.get("countryCode") ?? undefined,
      opportunityType: (params.get("opportunityType") as OpportunityFilters["opportunityType"]) ?? undefined,
      city: params.get("city") ?? undefined,
      deadlineBefore: params.get("deadlineBefore") ?? undefined,
      minValue: params.get("minValue") ? Number(params.get("minValue")) : undefined,
      maxValue: params.get("maxValue") ? Number(params.get("maxValue")) : undefined,
      isRemote: params.get("isRemote") === "true" ? true : undefined,
      q: params.get("q") ?? undefined,
    }),
    [params],
  );

  const debouncedQuery = useDebounce(filters.q ?? "", 300);

  const query = useOpportunities(
    { ...filters, q: debouncedQuery || undefined },
    page,
    PAGE_SIZE,
  );

  const countryQuery = usePublicCountryBreakdown();
  const totalsQuery = usePublicTotals();

  const countryData = countryQuery.data ?? [];
  const categoryRows = totalsQuery.data?.byCategory ?? [];

  const savedIds = useMemo(() => new Set<string>(), []);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    const update = (key: string) => {
      const next = new URLSearchParams(params);
      next.delete(key);
      setParams(next, { replace: true });
      resetPage();
    };
    for (const [key, value] of params.entries()) {
      if (key === "page" || key === "pageSize") continue;
      chips.push({
        key,
        label: `${key}: ${value}`,
        onRemove: () => update(key),
      });
    }
    return chips;
  }, [params, setParams, resetPage]);

  const clearAll = () => {
    setParams(new URLSearchParams(), { replace: true });
    resetPage();
    store.reset();
  };

  return (
    <>
      <SeoHead
        title="Explore opportunities"
        description="Search tenders, grants, jobs, scholarships, and more from trusted African sources."
      />

      <Container className="py-8">
        <PageHeader
          title="Explore Opportunities"
          description="Discover and access the best opportunities across Africa."
        />

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = new FormData(event.currentTarget).get("q")?.toString() ?? "";
            const next = new URLSearchParams(params);
            if (value) next.set("q", value);
            else next.delete("q");
            setParams(next, { replace: true });
            resetPage();
          }}
          className="mb-4 flex gap-2"
        >
          <Input
            name="q"
            defaultValue={filters.q}
            placeholder="Search opportunities"
            className="flex-1"
          />
          <Button type="submit">Search</Button>
        </form>

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
          <aside className="hidden lg:block">
            <div className="sticky top-20 rounded-xl border border-neutral-200 bg-white p-4">
              <OpportunityFilterPanel
                value={filters}
                onChange={(next) => {
                  const search = new URLSearchParams();
                  for (const [key, value] of Object.entries(next)) {
                    if (value === undefined || value === null || value === "") continue;
                    search.set(key, String(value));
                  }
                  setParams(search, { replace: true });
                  resetPage();
                }}
                onReset={clearAll}
              />
            </div>
          </aside>

          <div className="min-w-0">
            <FilterBar
              chips={activeChips}
              onClearAll={clearAll}
              rightSlot={
                <>
                  <span className="text-xs text-neutral-500">
                    {query.data ? `${query.data.total} results` : "Loading"}
                  </span>
                  <IconButton
                    icon={<Filter className="h-4 w-4" />}
                    label="Open filters"
                    tone="ghost"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setFilterDrawerOpen(true)}
                  />
                  <IconButton
                    icon={<LayoutGrid className="h-4 w-4" />}
                    label="Grid view"
                    tone={store.layout === "grid" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => store.setLayout("grid")}
                  />
                  <IconButton
                    icon={<List className="h-4 w-4" />}
                    label="List view"
                    tone={store.layout === "list" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => store.setLayout("list")}
                  />
                </>
              }
            />

            <div className="mt-4">
              {query.isLoading ? (
                <Loader fullPage label="Loading opportunities" />
              ) : query.isError ? (
                <ErrorState
                  title="Could not load opportunities"
                  description="Please try again in a moment."
                  action={<Button onClick={() => query.refetch()}>Retry</Button>}
                />
              ) : store.layout === "grid" ? (
                <OpportunityGrid
                  opportunities={query.data?.items ?? []}
                  savedIds={savedIds}
                  onSave={(id) => addSaved.mutate(id)}
                />
              ) : (
                <OpportunityList
                  opportunities={query.data?.items ?? []}
                  savedIds={savedIds}
                  onSave={(id) => addSaved.mutate(id)}
                />
              )}
            </div>

            {query.data && query.data.total > PAGE_SIZE ? (
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={query.data.total}
                onPageChange={setPage}
              />
            ) : null}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <Card>
                <CardHeader
                  title="Opportunities across Africa"
                  actions={
                    <Link
                      to="/explore?map=true"
                      className="text-xs font-medium text-primary-700 hover:underline"
                    >
                      View map
                    </Link>
                  }
                />
                <CardBody>
                  <AfricaOpportunityMap
                    data={countryData}
                    height={320}
                    compact
                    onSelectCountry={(code) => {
                      const next = new URLSearchParams(params);
                      next.set("countryCode", code);
                      setParams(next, { replace: true });
                      resetPage();
                    }}
                  />
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title="Top categories"
                  actions={
                    <Link
                      to="/explore"
                      className="text-xs font-medium text-primary-700 hover:underline"
                    >
                      View all
                    </Link>
                  }
                />
                <CardBody>
                  {categoryRows.length > 0 ? (
                    <ul className="space-y-2">
                      {categoryRows.slice(0, 6).map((row) => (
                        <li key={row.category}>
                          <Link
                            to={`/explore?category=${row.category}`}
                            className="flex items-center justify-between text-sm text-neutral-700 hover:text-primary-700"
                          >
                            <span>{labelForCategory(row.category)}</span>
                            <span className="text-xs text-neutral-500">
                              {row.count.toLocaleString()}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-neutral-500">
                      Category counts will appear as opportunities are discovered.
                    </p>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        Let AI find the right opportunities for you
                      </p>
                      <p className="mt-1 text-xs text-neutral-600">
                        Use our smart matching and AI analysis to discover
                        opportunities that fit your profile and goals.
                      </p>
                      <Link to="/ask" className="mt-3 inline-block">
                        <Button size="sm" rightIcon={<Sparkles className="h-3.5 w-3.5" />}>
                          Try AI Search
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </aside>
        </div>
      </Container>

      <Drawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filters"
      >
        <OpportunityFilterPanel
          value={filters}
          onChange={(next) => {
            const search = new URLSearchParams();
            for (const [key, value] of Object.entries(next)) {
              if (value === undefined || value === null || value === "") continue;
              search.set(key, String(value));
            }
            setParams(search, { replace: true });
            resetPage();
          }}
          onReset={clearAll}
        />
      </Drawer>
    </>
  );
}