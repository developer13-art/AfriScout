import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../../components/layout/PageHeader";
import { Loader } from "../../components/ui/Loader";
import { EmptyState } from "../../components/ui/EmptyState";
import { OpportunityGrid } from "../../components/opportunities/OpportunityGrid";
import { Layers } from "lucide-react";
import { opportunityService } from "../../services/opportunity.service";
import { useUserStore } from "../../stores/userStore";
import { SeoHead } from "../../components/common/SeoHead";

export function OrganizationOpportunities() {
  const organization = useUserStore((s) => s.business);
  const query = useQuery({
    queryKey: ["organization-opportunities", organization?.id],
    queryFn: () =>
      opportunityService.list({ organizationId: organization?.id } as never),
    enabled: Boolean(organization?.id),
  });

  return (
    <>
      <SeoHead title="Organization opportunities" />
      <PageHeader
        title="Organization opportunities"
        description="Opportunities published or associated with your organization."
      />

      {query.isLoading ? (
        <Loader fullPage label="Loading" />
      ) : (query.data?.items ?? []).length === 0 ? (
        <EmptyState
          icon={<Layers className="h-6 w-6" />}
          title="No opportunities yet"
          description="Publish an opportunity from your organization dashboard."
        />
      ) : (
        <OpportunityGrid opportunities={query.data?.items ?? []} />
      )}
    </>
  );
}