import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { Badge } from "../../components/ui/Badge";
import { Loader } from "../../components/ui/Loader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Building2 } from "lucide-react";
import { organizationService } from "../../services/organization.service";
import { formatDate } from "../../utils/formatDate";
import type { Organization } from "../../types/organization";
import { SeoHead } from "../../components/common/SeoHead";

export function Organizations() {
  const query = useQuery({
    queryKey: ["admin", "organizations"],
    queryFn: () => organizationService.list(1, 50),
  });

  const columns: DataTableColumn<Organization>[] = [
    {
      key: "name",
      header: "Name",
      cell: (org) => (
        <Link
          to={`/admin/organizations/${org.id}`}
          className="font-medium text-neutral-900 hover:text-primary-700"
        >
          {org.name}
        </Link>
      ),
    },
    { key: "type", header: "Type", cell: (org) => org.type ?? "-" },
    { key: "country", header: "Country", cell: (org) => org.countryCode ?? "-" },
    {
      key: "verified",
      header: "Verified",
      cell: (org) => (
        <Badge tone={org.verified ? "success" : "neutral"}>
          {org.verified ? "Verified" : "Unverified"}
        </Badge>
      ),
    },
    {
      key: "created",
      header: "Created",
      cell: (org) => formatDate(org.createdAt),
    },
  ];

  return (
    <>
      <SeoHead title="Organizations" />
      <PageHeader title="Organizations" description="Registered organizations." />

      {query.isLoading ? (
        <Loader fullPage label="Loading organizations" />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="No organizations yet"
        />
      ) : (
        <DataTable columns={columns} rows={query.data ?? []} rowKey={(o) => o.id} />
      )}
    </>
  );
}