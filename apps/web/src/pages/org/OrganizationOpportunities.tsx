import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Connection, Transaction } from "@solana/web3.js";
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
import { useSolanaWallet } from "../../hooks/useSolanaWallet";
import { useAuthStore } from "../../stores/authStore";

const PENDING_PAYOUTS_KEY = "scout.pending-bounty-payouts";

function readPendingPayouts(): Record<string, string> {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(PENDING_PAYOUTS_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function OrganizationOpportunities() {
  const queryClient = useQueryClient();
  const wallet = useSolanaWallet();
  const user = useAuthStore((state) => state.user);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");
  const [skills, setSkills] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<string | null>(null);
  const [pendingPayoutSignatures, setPendingPayoutSignatures] = useState<Record<string, string>>(
    readPendingPayouts,
  );
  const [failedPayoutSignature, setFailedPayoutSignature] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rememberPayout = (submissionId: string, signature?: string) => {
    setPendingPayoutSignatures((current) => {
      const next = { ...current };
      if (signature) next[submissionId] = signature;
      else delete next[submissionId];
      try {
        window.sessionStorage.setItem(PENDING_PAYOUTS_KEY, JSON.stringify(next));
      } catch {
        // Keep the in-memory recovery path even if browser storage is unavailable.
      }
      return next;
    });
  };
  const organizationsQuery = useQuery({
    queryKey: ["organization", "active"],
    queryFn: organizationService.active,
  });
  const organization = organizationsQuery.data;
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
    if (!user?.walletAddress) {
      setError("Link and verify the organization manager wallet in your Passport before publishing a Devnet SOL bounty.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await bountyService.create({
        organizationId: organization.id,
        title: title.trim(),
        description: description.trim(),
        rewardAmount: Number(rewardAmount),
        rewardCurrency: "SOL",
        requiredSkills: skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      });
      setTitle("");
      setDescription("");
      setRewardAmount("");
      setSkills("");
      setDeadline("");
      setMessage("Bounty published. The reward is not escrowed; an organization manager pays the winner directly after approval.");
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
    setFailedPayoutSignature(null);
    setReviewingSubmissionId(submissionId);
    let rewardSignature: string | undefined;
    try {
      const bounty = bountiesQuery.data?.find((item) => item.id === bountyId);
      if (approved && bounty?.rewardCurrency === "SOL") {
        const connection = new Connection("https://api.devnet.solana.com", "confirmed");
        rewardSignature = pendingPayoutSignatures[submissionId];
        if (!rewardSignature) {
          if (!user?.walletAddress) {
            throw new Error("Link and verify your organization manager wallet before approving a payout.");
          }
          const account = wallet.address ?? await wallet.connect();
          if (!account) throw new Error(wallet.error ?? "Connect the verified organization wallet.");
          if (account !== user.walletAddress) {
            throw new Error("The connected wallet does not match your verified Scout wallet.");
          }
          const action = await bountyService.payoutTransaction(bountyId, submissionId, account);
          const transaction = Transaction.from(
            Uint8Array.from(atob(action.transaction), (character) => character.charCodeAt(0)),
          );
          rewardSignature = await wallet.sendTransaction(transaction, connection);
          rememberPayout(submissionId, rewardSignature);
        }
        const confirmation = await connection.confirmTransaction(rewardSignature, "confirmed");
        if (confirmation.value.err) {
          rememberPayout(submissionId);
          throw new Error("The Devnet payout failed; the work was not approved. You can retry the payout.");
        }
      }
      await bountyService.review(bountyId, submissionId, approved, undefined, rewardSignature);
      if (rewardSignature) rememberPayout(submissionId);
      await queryClient.invalidateQueries({ queryKey: ["organization-bounties"] });
      setMessage(
        approved
          ? rewardSignature
            ? "Devnet SOL payout confirmed, work approved, and a verified achievement issued."
            : "Work approved and the contributor’s Scout Passport now has a verified achievement."
          : "Submission declined.",
      );
    } catch (cause) {
      const reason = cause instanceof HttpError || cause instanceof Error
        ? cause.message
        : "Could not review submission.";
      const recoverySignature = rewardSignature ?? pendingPayoutSignatures[submissionId];
      if (recoverySignature) {
        setFailedPayoutSignature(recoverySignature);
        setError(`${reason} The transfer signature is saved; retry approval to finalize without paying again.`);
      } else {
        setError(reason);
      }
    } finally {
      setReviewingSubmissionId(null);
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
      {failedPayoutSignature ? (
        <a
          className="mb-4 inline-flex text-sm font-medium text-primary-700 underline"
          href={`https://explorer.solana.com/tx/${failedPayoutSignature}?cluster=devnet`}
          target="_blank"
          rel="noreferrer"
        >
          Check the saved Devnet transfer
        </a>
      ) : null}
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
                subtitle="Publish a public bounty with a direct Devnet SOL payout after the organization approves a submission."
                actions={<Plus className="h-5 w-5 text-primary-700" aria-hidden />}
              />
              <CardBody>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Input label="Bounty title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={240} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Reward amount (SOL)" type="number" min="0.000000001" step="0.000000001" value={rewardAmount} onChange={(event) => setRewardAmount(event.target.value)} />
                      <div className="flex flex-col justify-end pb-2 text-sm text-neutral-600">Solana Devnet · direct payout</div>
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
                    No escrow is created. After approval, a linked organization manager signs a direct Devnet SOL transfer to the contributor.
                  </p>
                  <Button
                    onClick={createBounty}
                    loading={saving}
                    disabled={!user?.walletAddress || title.trim().length < 5 || description.trim().length < 30 || Number(rewardAmount) <= 0}
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
                              {submission.status === "SUBMITTED" && bounty.status === "OPEN" ? (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    loading={reviewingSubmissionId === submission.id}
                                    onClick={() => reviewSubmission(bounty.id, submission.id, true)}
                                  >
                                    {bounty.rewardCurrency === "SOL"
                                      ? pendingPayoutSignatures[submission.id]
                                        ? "Finalize SOL payout & approve"
                                        : "Pay SOL & approve"
                                      : "Approve (external reward)"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={reviewingSubmissionId === submission.id}
                                    onClick={() => reviewSubmission(bounty.id, submission.id, false)}
                                  >
                                    Decline
                                  </Button>
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
                            {submission.rewardTxSignature ? (
                              <a href={`https://explorer.solana.com/tx/${submission.rewardTxSignature}?cluster=devnet`} target="_blank" rel="noreferrer" className="mt-2 block break-all text-xs text-emerald-700 underline">
                                Verified Devnet reward payment
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