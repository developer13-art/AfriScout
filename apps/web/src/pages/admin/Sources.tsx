import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { SourceHealthBadge } from "../../components/admin/SourceHealthBadge";
import { Loader } from "../../components/ui/Loader";
import { EmptyState } from "../../components/ui/EmptyState";
import { useSources } from "../../hooks/useSources";
import { Database, Plus } from "lucide-react";
import { formatDateTime } from "../../utils/formatDate";
import { africanCountries } from "../../config/countries";
import type { Source, SourceFilters } from "../../types/source";
import { SeoHead } from "../../components/common/SeoHead";

export function Sources() {
  const [filters, setFilters] = useState<SourceFilters>({});
  const query = useSources(filters, 1, 50);

  const columns: DataTableColumn<Source>[] = [
    {
      key: "name",
      header: "Source",
      cell: (source) => (
        <Link
          to={`/admin/sources/${source.id}`}
          className="font-medium text-neutral-900 hover:text-primary-700 hover:underline"
        >
          {source.name}
        </Link>
      ),
    },
    {
      key: "country",
      header: "Country",
      cell: (source) => source.countryCode ?? "-",
    },
    { key: "type", header: "Type", cell: (source) => source.sourceType },
    {
      key: "frequency",
      header: "Frequency",
      cell: (source) => source.crawlFrequency,
    },
    {
      key: "health",
      header: "Health",
      cell: (source) => <SourceHealthBadge health={source.health} />,
    },
    {
      key: "lastRun",
      header: "Last run",
      cell: (source) =>
        source.lastRunAt ? formatDateTime(source.lastRunAt) : "Never",
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (source) => (
        <Link to={`/admin/sources/${source.id}`}>
          <Button variant="outline" size="sm">
            View
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <>
      <SeoHead title="Sources" />
      <PageHeader
        title="Sources"
        description="Registered opportunity sources and their health."
        actions={
          <Link to="/admin/sources/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>Add source</Button>
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Input
          placeholder="Search by name"
          value={filters.q ?? ""}
          onChange={(e) => setFilters({ ...filters, q: e.target.value || undefined })}
        />
        <Select
          placeholder="All countries"
          value={filters.countryCode ?? ""}
          onChange={(e) =>
            setFilters({ ...filters, countryCode: e.target.value || undefined })
          }
          options={africanCountries.map((c) => ({ value: c.code, label: c.name }))}
        />
        <Select
          placeholder="All health states"
          value={filters.health ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              health: (e.target.value || undefined) as SourceFilters["health"],
            })
          }
          options={[
            { value: "HEALTHY", label: "Healthy" },
            { value: "WARNING", label: "Warning" },
            { value: "FAILED", label: "Failed" },
            { value: "INACTIVE", label: "Inactive" },
          ]}
        />
      </div>

      {query.isLoading ? (
        <Loader fullPage label="Loading sources" />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState
          icon={<Database className="h-6 w-6" />}
          title="No sources yet"
          description="Add the first source to begin discovery."
        />
      ) : (
        <DataTable columns={columns} rows={query.data ?? []} rowKey={(s) => s.id} />
      )}
    </>
  );
}