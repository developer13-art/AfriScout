import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, BadgeCheck, Copy, ExternalLink, Share2 } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { PageHeader } from "../../components/layout/PageHeader";
import { SeoHead } from "../../components/common/SeoHead";
import { BountyParticipationPanel } from "../../components/opportunities/BountyParticipationPanel";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Loader } from "../../components/ui/Loader";
import { bountyService } from "../../services/bounty.service";
import { opportunityService } from "../../services/opportunity.service";
import { useSaved } from "../../hooks/useSaved";
import { useAuthStore } from "../../stores/authStore";

function formatDeadline(deadline?: string | null) {
  if (!deadline) return "Not listed";
  const date = new Date(deadline);
  return Number.isNaN(date.getTime())
    ? "Not listed"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function OpportunityBlink() {
  const { slug = "" } = useParams<{ slug: string }>();
  const user = useAuthStore((state) => state.user);
  const saved = useSaved();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const opportunityQuery = useQuery({
    queryKey: ["opportunity", slug],
    queryFn: () => opportunityService.get(slug),
    enabled: Boolean(slug),
  });
  const bountyQuery = useQuery({
    queryKey: ["bounty", "opportunity", slug],
    queryFn: () => bountyService.byOpportunitySlug(slug),
    enabled: Boolean(slug),
  });

  const shareUrl =
    typeof window === "undefined" ? `/blink/${slug}` : `${window.location.origin}/blink/${slug}`;
  const isSaved = Boolean(
    opportunityQuery.data &&
    saved.data?.some((item) => item.opportunityId === opportunityQuery.data?.id),
  );

  const copy = async (value: string, success: string) => {
    setError(null);
    setMessage(null);
    try {
      await navigator.clipboard.writeText(value);
      setMessage(success);
    } catch {
      setError("Could not copy this link in your browser.");
    }
  };

  const share = async () => {
    const opportunity = opportunityQuery.data;
    if (!opportunity) return;
    setError(null);
    setMessage(null);
    try {
      if (navigator.share) {
        await navigator.share({
          title: opportunity.title,
          text: opportunity.summaryShort ?? "View this opportunity on Scout.",
          url: shareUrl,
        });
      } else {
        await copy(shareUrl, "Shareable opportunity card link copied.");
      }
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError("Could not share this opportunity.");
    }
  };

  if (opportunityQuery.isLoading || bountyQuery.isLoading) {
    return <Loader fullPage label="Loading opportunity card" />;
  }
  if (opportunityQuery.isError || !opportunityQuery.data) {
    return (
      <Container className="py-10">
        <ErrorState
          title="Opportunity not found"
          description="This share link may be out of date. Browse Scout's live index to find the opportunity."
        />
      </Container>
    );
  }

  const opportunity = opportunityQuery.data;
  const bounty = bountyQuery.data ?? null;
  const listedReward = opportunity.valueMax ?? opportunity.valueMin;
  const listedRewardText =
    listedReward == null
      ? null
      : `${opportunity.currency ? `${opportunity.currency} ` : ""}${new Intl.NumberFormat(
          undefined,
          { maximumFractionDigits: 0 },
        ).format(listedReward)}`;

  return (
    <>
      <SeoHead
        title={`${opportunity.title} · Scout Action Card`}
        description={opportunity.summaryShort ?? opportunity.description ?? ""}
      />
      <Container className="py-8">
        <PageHeader
          title="Scout Action Card"
          description="A shareable, live view of an opportunity and the actions Scout can verify."
          actions={
            <Link to={`/opportunities/${opportunity.slug}`}>
              <Button variant="outline" rightIcon={<ArrowUpRight className="h-4 w-4" />}>
                Full opportunity
              </Button>
            </Link>
          }
        />

        <div className="mx-auto mt-6 max-w-3xl">
          <Card className="overflow-hidden">
            <div className="border-b border-primary-100 bg-primary-50/60 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary-800">
                  {opportunity.opportunityType.replaceAll("_", " ")}
                </span>
                <span className="text-sm text-neutral-600">{opportunity.category}</span>
                {opportunity.verificationStatus === "VERIFIED" ? (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                    Verified by Scout
                  </span>
                ) : (
                  <span className="ml-auto rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
                    Source verification: {opportunity.verificationStatus.toLowerCase()}
                  </span>
                )}
              </div>
              <h1 className="mt-5 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
                {opportunity.title}
              </h1>
              <p className="mt-2 text-sm text-neutral-600">
                {opportunity.organizationName ?? "Organization not listed"}
                {opportunity.countryCode ? ` · ${opportunity.countryCode}` : ""}
                {opportunity.isRemote ? " · Remote" : ""}
              </p>
              <p className="mt-4 whitespace-pre-line text-sm leading-6 text-neutral-700">
                {opportunity.summaryShort ??
                  opportunity.description ??
                  "Open the full listing to review this opportunity."}
              </p>
            </div>

            <CardBody className="p-6 sm:p-8">
              <dl className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-neutral-50 p-4">
                  <dt className="text-xs text-neutral-500">
                    {bounty ? "Bounty reward" : "Listed value"}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-neutral-900">
                    {bounty
                      ? `${bounty.rewardAmount} ${bounty.rewardCurrency}`
                      : (listedRewardText ?? "Not listed")}
                  </dd>
                </div>
                <div className="rounded-lg bg-neutral-50 p-4">
                  <dt className="text-xs text-neutral-500">Deadline</dt>
                  <dd className="mt-1 text-sm font-semibold text-neutral-900">
                    {formatDeadline(opportunity.deadline)}
                  </dd>
                </div>
                <div className="rounded-lg bg-neutral-50 p-4">
                  <dt className="text-xs text-neutral-500">On-chain provenance</dt>
                  <dd className="mt-1 text-sm font-semibold text-neutral-900">
                    {opportunity.provenanceProofs?.length
                      ? `${opportunity.provenanceProofs.length} anchored record version${opportunity.provenanceProofs.length === 1 ? "" : "s"}`
                      : "No anchor recorded"}
                  </dd>
                </div>
              </dl>

              {bounty ? (
                <div className="mt-5">
                  <BountyParticipationPanel bounty={bounty} />
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-neutral-200 p-5">
                  <h2 className="font-semibold text-neutral-900">Next steps</h2>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">
                    Review the original source, confirm the eligibility requirements, then apply
                    through the official listing.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {user ? (
                      <Button
                        variant={isSaved ? "outline" : "primary"}
                        onClick={() => {
                          saved.add.mutate(opportunity.id, {
                            onSuccess: () => setMessage("Opportunity saved to your Scout account."),
                            onError: () => setError("Could not save this opportunity."),
                          });
                        }}
                        disabled={isSaved}
                      >
                        {isSaved ? "Saved to Scout" : "Save opportunity"}
                      </Button>
                    ) : (
                      <Link to="/login">
                        <Button variant="outline">Sign in to save</Button>
                      </Link>
                    )}
                    {opportunity.applicationUrl ? (
                      <a href={opportunity.applicationUrl} target="_blank" rel="noreferrer">
                        <Button rightIcon={<ExternalLink className="h-4 w-4" />}>
                          Apply at source
                        </Button>
                      </a>
                    ) : null}
                  </div>
                </div>
              )}

              {bounty ? (
                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <p className="font-semibold">
                    Reward status: {bounty.fundingStatus.toLowerCase()}
                  </p>
                  <p className="mt-1 leading-6">
                    Scout does not claim that bounty funds are escrowed. A SOL reward is paid
                    directly by the organization after its review; a listing alone is not proof of
                    funding.
                  </p>
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-2 border-t border-neutral-100 pt-5">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Share2 className="h-4 w-4" />}
                  onClick={() => void share()}
                >
                  Share card
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Copy className="h-4 w-4" />}
                  onClick={() => void copy(shareUrl, "Shareable opportunity card link copied.")}
                >
                  Copy card link
                </Button>
                {bounty ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void copy(
                        bountyService.actionUrl(bounty.id),
                        "Solana Action link copied. It chains Devnet participation into a private proof submission.",
                      )
                    }
                  >
                    Copy Solana Action link
                  </Button>
                ) : null}
              </div>
              {message ? (
                <Alert tone="success" className="mt-3">
                  {message}
                </Alert>
              ) : null}
              {error ? (
                <Alert tone="danger" className="mt-3">
                  {error}
                </Alert>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </Container>
    </>
  );
}
