import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Input } from "../../components/ui/Input";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { Badge } from "../../components/ui/Badge";
import { Loader } from "../../components/ui/Loader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Layers } from "lucide-react";
import { useOpportunities } from "../../hooks/useOpportunities";
import { formatDate } from "../../utils/formatDate";
import type { Opportunity } from "../../types/opportunity";
import { SeoHead } from "../../components/common/SeoHead";

export function Opportunities() {
  const [query, setQuery] = useState("");
  const opportunities = useOpportunities({ q: query || undefined }, 1, 50);

  const columns: DataTableColumn<Opportunity>[] = [
    {
      key: "title",
      header: "Title",
      cell: (opp) => (
        <Link
          to={`/admin/opportunities/${opp.id}`}
          className="font-medium text-neutral-900 hover:text-primary-700"
        >
          {opp.title}
        </Link>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (opp) => <Badge tone="neutral">{opp.category}</Badge>,
    },
    { key: "country", header: "Country", cell: (opp) => opp.countryCode ?? "-" },
    {
      key: "deadline",
      header: "Deadline",
      cell: (opp) => (opp.deadline ? formatDate(opp.deadline) : "-"),
    },
    {
      key: "state",
      header: "State",
      cell: (opp) => <Badge tone="info">{opp.systemState}</Badge>,
    },
  ];

  return (
    <>
      <SeoHead title="Opportunities" />
      <PageHeader title="Opportunities" description="Every canonical opportunity." />

      <div className="mb-4">
        <Input
          placeholder="Search opportunities"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {opportunities.isLoading ? (
        <Loader fullPage label="Loading opportunities" />
      ) : (opportunities.data?.items ?? []).length === 0 ? (
        <EmptyState
          icon={<Layers className="h-6 w-6" />}
          title="No opportunities"
          description="Run a discovery to populate the database."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={opportunities.data?.items ?? []}
          rowKey={(o) => o.id}
        />
      )}
    </>
  );
}