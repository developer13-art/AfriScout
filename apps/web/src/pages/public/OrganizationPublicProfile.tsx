import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, BadgeCheck, Building2, ExternalLink } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SeoHead } from "../../components/common/SeoHead";
import { Container } from "../../components/layout/Container";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Alert } from "../../components/ui/Alert";
import { ErrorState } from "../../components/ui/ErrorState";
import { Loader } from "../../components/ui/Loader";
import { organizationService } from "../../services/organization.service";
import { useAuthStore } from "../../stores/authStore";

export function OrganizationPublicProfile() {
  const { slug = "" } = useParams();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ["public-organization", slug],
    queryFn: () => organizationService.publicProfile(slug),
    enabled: Boolean(slug),
  });
  const membership = useQuery({
    queryKey: ["organization-membership", profile.data?.id, user?.id],
    queryFn: () => organizationService.membership(profile.data!.id),
    enabled: Boolean(user?.id && profile.data?.id),
  });
  const join = useMutation({
    mutationFn: (organizationId: string) => organizationService.join(organizationId),
    onSuccess: async (_membership, organizationId) => {
      organizationService.setActive(organizationId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["organization"] }),
        queryClient.invalidateQueries({ queryKey: ["organizations"] }),
        queryClient.invalidateQueries({ queryKey: ["organization-membership", organizationId] }),
      ]);
      navigate("/org/profile");
    },
  });

  if (profile.isLoading) {
    return <Container className="py-10"><Loader label="Loading organization profile" /></Container>;
  }
  if (profile.isError || !profile.data) {
    return (
      <Container className="py-10">
        <ErrorState
          title="Organization profile unavailable"
          description="This public profile could not be loaded. It may have been removed or the service may be temporarily unavailable."
          action={<Button variant="outline" onClick={() => void profile.refetch()}>Retry</Button>}
        />
      </Container>
    );
  }

  const organization = profile.data;
  const websiteUrl = safeWebsiteUrl(organization.website);
  const openWorkspace = () => {
    organizationService.setActive(organization.id);
    navigate("/org/profile");
  };
  return (
    <>
      <SeoHead
        title={`${organization.name} · Organization`}
        description={organization.description || `Review ${organization.name}'s public Scout opportunity and bounty history.`}
      />
      <Container className="py-8">
        <PageHeader
          title={organization.name}
          description={organization.description || "Public organization profile and published opportunities."}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {websiteUrl ? (
                <a href={websiteUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" rightIcon={<ExternalLink className="h-4 w-4" />}>
                    Organization website
                  </Button>
                </a>
              ) : null}
              {user ? (
                membership.data?.isMember ? (
                  <Button onClick={openWorkspace}>Open workspace</Button>
                ) : (
                  <Button
                    onClick={() => join.mutate(organization.id)}
                    loading={join.isPending}
                    disabled={membership.isLoading}
                  >
                    Join workspace
                  </Button>
                )
              ) : (
                <Link to="/login">
                  <Button variant="outline">Sign in to join</Button>
                </Link>
              )}
            </div>
          }
        />
        {join.isError ? (
          <Alert tone="danger" className="mb-5">
            {join.error instanceof Error ? join.error.message : "Could not join this organization workspace."}
          </Alert>
        ) : null}

        <Card className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
              <Building2 className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-neutral-900">{organization.name}</h2>
                {organization.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                    Scout verified
                  </span>
                ) : (
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                    Not Scout verified
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                {[organization.type?.replaceAll("_", " "), organization.countryCode].filter(Boolean).join(" · ") || "Organization"}
                {organization.verifiedAt ? ` · Verified ${new Date(organization.verifiedAt).toLocaleDateString()}` : ""}
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Published opportunities" value={organization.publishedOpportunityCount} />
            <Metric label="Completed bounties" value={organization.completedBountyCount} />
            <Metric label="Verified direct payouts" value={organization.directPayoutCount} />
            <Metric label="Funding transaction references" value={organization.fundingTransactionReferenceCount} />
          </div>
          <p className="mt-4 text-xs leading-5 text-neutral-500">
            Verification is a Scout organization status. Bounty rewards are paid directly after review; a funding reference does not mean funds are held in escrow.
          </p>
        </Card>

        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Published opportunities</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Review eligibility and terms before applying. Showing up to 30 recent listings.
            </p>
          </div>
          <Link to="/bounties" className="text-sm font-medium text-primary-700 hover:text-primary-900">
            Browse bounty marketplace
          </Link>
        </div>

        {organization.opportunities.length === 0 ? (
          <Card className="py-10 text-center text-sm text-neutral-600">
            No published opportunities are listed for this organization.
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {organization.opportunities.map((opportunity) => (
              <Card key={opportunity.id} className="flex flex-col">
                <p className="text-xs font-medium uppercase tracking-wide text-primary-700">
                  {opportunity.opportunityType.replaceAll("_", " ")} · {opportunity.category.replaceAll("_", " ")}
                </p>
                <h3 className="mt-2 text-base font-semibold text-neutral-900">
                  <Link to={`/opportunities/${opportunity.slug}`} className="hover:text-primary-700">
                    {opportunity.title}
                  </Link>
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-600">
                  {opportunity.summaryShort || "Open the listing to review the full description and requirements."}
                </p>
                {opportunity.bounty ? (
                  <div className="mt-3 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600">
                    Listed reward: {opportunity.bounty.rewardAmount} {opportunity.bounty.rewardCurrency}
                    <p className="mt-1">Direct payment after organization review; not escrow.</p>
                    {opportunity.bounty.fundingTxSignature ? (
                      <a
                        className="mt-1 inline-flex underline"
                        href={`https://explorer.solana.com/tx/${opportunity.bounty.fundingTxSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View funding transaction reference <ExternalLink className="ml-1 h-3 w-3" aria-hidden />
                      </a>
                    ) : null}
                  </div>
                ) : null}
                <Link
                  to={`/opportunities/${opportunity.slug}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-900"
                >
                  Review opportunity <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

function safeWebsiteUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}
