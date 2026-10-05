import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Loader } from "../../components/ui/Loader";
import { EmptyState } from "../../components/ui/EmptyState";
import { OpportunityGrid } from "../../components/opportunities/OpportunityGrid";
import { Layers, Plus } from "lucide-react";
import { opportunityService } from "../../services/opportunity.service";
import { organizationService } from "../../services/organization.service";
import { bountyService } from "../../services/bounty.service";
import { SeoHead } from "../../components/common/SeoHead";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { HttpError } from "../../services/http";

export function OrganizationOpportunities() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");
  const [rewardCurrency, setRewardCurrency] = useState("USDC");
  const [skills, setSkills] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const organizationsQuery = useQuery({
    queryKey: ["organizations", "mine"],
    queryFn: organizationService.mine,
  });
  const organization = organizationsQuery.data?.[0];
  const query = useQuery({
    queryKey: ["organization-opportunities", organization?.id],
    queryFn: () =>
      opportunityService.list({ organizationId: organization?.id } as never),
    enabled: Boolean(organization?.id),
  });
  const bountiesQuery = useQuery({
    queryKey: ["organization-bounties"],
    queryFn: bountyService.managed,
    enabled: Boolean(organization?.id),
  });

  const createBounty = async () => {
    if (!organization?.id) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const created = await bountyService.create({
        organizationId: organization.id,
        title: title.trim(),
        description: description.trim(),
        rewardAmount: Number(rewardAmount),
        rewardCurrency: rewardCurrency.trim().toUpperCase(),
        requiredSkills: skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      });
      setTitle("");
      setDescription("");
      setRewardAmount("");
      setSkills("");
      setDeadline("");
      setMessage("Bounty published. Its reward is listed but is not escrowed.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["organization-bounties"] }),
        queryClient.invalidateQueries({ queryKey: ["organization-opportunities"] }),
        queryClient.invalidateQueries({ queryKey: ["opportunities"] }),
      ]);
    } catch (cause) {
      setError(cause instanceof HttpError || cause instanceof Error ? cause.message : "Could not publish the bounty.");
    } finally {
      setSaving(false);
    }
  };

  const reviewSubmission = async (bountyId: string, submissionId: string, approved: boolean) => {
    setError(null);
    setMessage(null);
    try {
      await bountyService.review(bountyId, submissionId, approved);
      await queryClient.invalidateQueries({ queryKey: ["organization-bounties"] });
      setMessage(
        approved
          ? "Work approved. The contributor’s Scout Passport now has a verified achievement."
          : "Submission declined.",
      );
    } catch (cause) {
      setError(cause instanceof HttpError || cause instanceof Error ? cause.message : "Could not review submission.");
    }
  };

  return (
    <>
      <SeoHead title="Organization opportunities" />
      <PageHeader
        title="Organization opportunities"
        description="Publish opportunities and community bounties for your organization."
      />

      {error ? <Alert tone="danger" className="mb-4">{error}</Alert> : null}
      {message ? <Alert tone="success" className="mb-4">{message}</Alert> : null}
      {organizationsQuery.isLoading ? (
        <Loader fullPage label="Loading" />
      ) : (
        <div className="space-y-6">
          {!organization ? (
            <Alert tone="info">
              Create an organization workspace in <Link to="/org/profile" className="font-medium underline">Organization profile</Link> before publishing.
            </Alert>
          ) : null}

          {organization && (organization.membershipRole === "OWNER" || organization.membershipRole === "ADMIN") ? (
            <Card>
              <CardHeader
                title="Publish a community bounty"
                subtitle="Bounties create a public opportunity and a Solana Devnet participation action. Reward funding and payout are not handled by Scout."
                actions={<Plus className="h-5 w-5 text-primary-700" aria-hidden />}
              />
              <CardBody>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Input label="Bounty title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={240} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Reward amount" type="number" min="0.01" step="0.01" value={rewardAmount} onChange={(event) => setRewardAmount(event.target.value)} />
                    <Input label="Currency (3 letters)" value={rewardCurrency} onChange={(event) => setRewardCurrency(event.target.value)} maxLength={3} />
                  </div>
                  <Input
                    label="Required skills (comma separated)"
                    value={skills}
                    onChange={(event) => setSkills(event.target.value)}
                    placeholder="Research, design, software"
                  />
                  <Input label="Deadline (optional)" type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
                  <div className="lg:col-span-2">
                    <Textarea label="Description and expected deliverable" value={description} onChange={(event) => setDescription(event.target.value)} rows={5} />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="max-w-2xl text-xs text-amber-800">
                    The reward displays as an offer only. Scout does not custody tokens, verify a funded escrow, or automatically pay the winner.
                  </p>
                  <Button
                    onClick={createBounty}
                    loading={saving}
                    disabled={title.trim().length < 5 || description.trim().length < 30 || Number(rewardAmount) <= 0 || rewardCurrency.trim().length !== 3}
                  >
                    Publish bounty
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : null}

          {bountiesQuery.data?.length ? (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900">Bounty submissions</h2>
              {bountiesQuery.data.map((bounty) => (
                <Card key={bounty.id}>
                  <CardHeader
                    title={bounty.opportunity.title}
                    subtitle={`${bounty.rewardAmount} ${bounty.rewardCurrency} · reward ${bounty.fundingStatus.toLowerCase()}`}
                    actions={<Badge tone={bounty.status === "OPEN" ? "success" : "neutral"}>{bounty.status}</Badge>}
                  />
                  <CardBody>
                    {bounty.submissions?.length ? (
                      <div className="space-y-3">
                        {bounty.submissions.map((submission) => (
                          <div key={submission.id} className="rounded-lg border border-neutral-200 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-neutral-900">{submission.participant?.fullName ?? "Contributor"}</p>
                                <p className="text-xs text-neutral-500">{submission.status}</p>
                              </div>
                              {submission.status === "SUBMITTED" ? (
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => reviewSubmission(bounty.id, submission.id, true)}>Approve work</Button>
                                  <Button size="sm" variant="outline" onClick={() => reviewSubmission(bounty.id, submission.id, false)}>Decline</Button>
                                </div>
                              ) : null}
                            </div>
                            {submission.submissionUrl ? (
                              <a href={submission.submissionUrl} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm text-primary-700 underline">
                                {submission.submissionUrl}
                              </a>
                            ) : null}
                            {submission.submissionText ? <p className="mt-2 whitespace-pre-line text-sm text-neutral-700">{submission.submissionText}</p> : null}
                            {submission.participationTxSignature ? (
                              <a href={`https://explorer.solana.com/tx/${submission.participationTxSignature}?cluster=devnet`} target="_blank" rel="noreferrer" className="mt-2 block break-all text-xs text-neutral-500 underline">
                                Solana Devnet participation receipt
                              </a>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">No one has joined this bounty yet.</p>
                    )}
                  </CardBody>
                </Card>
              ))}
            </section>
          ) : null}

          {query.isLoading ? (
            <Loader label="Loading organization opportunities" />
          ) : (query.data?.items ?? []).length === 0 ? (
            <EmptyState
              icon={<Layers className="h-6 w-6" />}
              title="No opportunities yet"
              description="Published bounties will also appear in the Scout opportunity network."
            />
          ) : (
            <OpportunityGrid opportunities={query.data?.items ?? []} />
          )}
        </div>
      )}
    </>
  );
}