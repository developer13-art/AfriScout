import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Connection, Transaction } from "@solana/web3.js";
import { Link } from "react-router-dom";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { useSolanaWallet } from "../../hooks/useSolanaWallet";
import { useAuthStore } from "../../stores/authStore";
import { bountyService } from "../../services/bounty.service";
import { HttpError } from "../../services/http";
import type { Bounty } from "../../types/bounty";

const devnet = new Connection("https://api.devnet.solana.com", "confirmed");

export function BountyParticipationPanel({ bounty }: { bounty: Bounty }) {
  const user = useAuthStore((state) => state.user);
  const wallet = useSolanaWallet();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissionText, setSubmissionText] = useState("");
  const submissionQuery = useQuery({
    queryKey: ["bounty", bounty.id, "my-submission"],
    queryFn: () => bountyService.mySubmission(bounty.id),
    enabled: Boolean(user?.id),
  });
  const submission = submissionQuery.data;
  const hasSubmittedWork = submission?.status === "SUBMITTED" || submission?.status === "APPROVED";
  const hasReviewedWork = submission?.status === "APPROVED" || submission?.status === "REJECTED";
  const bountySteps = [
    {
      label: "Verify wallet",
      detail: user?.walletAddress ? "Scout wallet verified" : "Link a wallet in your Passport",
      complete: Boolean(user?.walletAddress),
      current: !user?.walletAddress,
      needsAttention: false,
    },
    {
      label: "Join opportunity",
      detail: submission
        ? "Devnet participation receipt recorded"
        : "Sign the participation receipt",
      complete: Boolean(submission),
      current: Boolean(user?.walletAddress && !submission),
      needsAttention: false,
    },
    {
      label: "Submit proof of work",
      detail: hasSubmittedWork ? "Submission received" : "Share a link or describe your work",
      complete: hasSubmittedWork,
      current: Boolean(submission?.status === "PARTICIPATING" || submission?.status === "REJECTED"),
      needsAttention: submission?.status === "REJECTED",
    },
    {
      label: "Organization review",
      detail:
        submission?.status === "APPROVED"
          ? "Approved"
          : submission?.status === "REJECTED"
            ? "Changes requested"
            : "Reviewed by the opportunity owner",
      complete: hasReviewedWork,
      current: submission?.status === "SUBMITTED",
      needsAttention: submission?.status === "REJECTED",
    },
    {
      label: "Achievement and reward",
      detail:
        submission?.status === "APPROVED"
          ? submission.rewardTxSignature
            ? "Achievement issued; direct Devnet payout verified"
            : "Achievement issued; no on-chain payout recorded"
          : "Achievement is issued only after approval",
      complete: submission?.status === "APPROVED",
      current: false,
      needsAttention: false,
    },
  ];

  const recordParticipation = async () => {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      if (!user) throw new Error("Sign in to your Scout account first.");
      if (!user.walletAddress) throw new Error("Link and verify a wallet in your Passport first.");
      const address = wallet.address ?? (await wallet.connect());
      if (!address) throw new Error(wallet.error ?? "Connect your linked wallet first.");
      if (address !== user.walletAddress) {
        throw new Error(
          "The connected wallet does not match the wallet linked to this Scout account.",
        );
      }

      const action = await bountyService.actionTransaction(bounty.id, address);
      const bytes = Uint8Array.from(atob(action.transaction), (character) =>
        character.charCodeAt(0),
      );
      const transaction = Transaction.from(bytes);
      const signature = await wallet.sendTransaction(transaction, devnet);
      const confirmation = await devnet.confirmTransaction(signature, "confirmed");
      if (confirmation.value.err) {
        throw new Error("The Devnet transaction failed. No participation was recorded.");
      }
      await bountyService.recordParticipation(bounty.id, signature);
      await queryClient.invalidateQueries({ queryKey: ["bounty", bounty.id, "my-submission"] });
      await queryClient.invalidateQueries({ queryKey: ["passport"] });
      setMessage("Devnet participation receipt confirmed and saved to your Scout account.");
    } catch (cause) {
      setError(
        cause instanceof HttpError || cause instanceof Error
          ? cause.message
          : "Could not record participation.",
      );
    } finally {
      setBusy(false);
    }
  };

  const submitWork = async () => {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await bountyService.submitWork(bounty.id, {
        submissionUrl: submissionUrl.trim() || undefined,
        submissionText: submissionText.trim() || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["bounty", bounty.id, "my-submission"] });
      setMessage("Your work was submitted to the organization for review.");
    } catch (cause) {
      setError(
        cause instanceof HttpError || cause instanceof Error
          ? cause.message
          : "Could not submit your work.",
      );
    } finally {
      setBusy(false);
    }
  };

  const copyBlink = async () => {
    setError(null);
    try {
      await navigator.clipboard.writeText(bountyService.actionUrl(bounty.id));
      setMessage("Solana Action link copied. It records participation on Devnet.");
    } catch {
      setError("Could not copy the Solana Action link in this browser.");
    }
  };

  return (
    <Card>
      <CardHeader
        title="Solana bounty"
        subtitle="Join with a signed Devnet receipt, submit work, and earn an organization-issued achievement if approved."
      />
      <CardBody>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-2xl font-semibold text-neutral-900">
            {bounty.rewardAmount} {bounty.rewardCurrency}
          </p>
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {bounty._count?.submissions ?? 0} participants
          </span>
        </div>
        {bounty.fundingStatus === "UNFUNDED" ? (
          <Alert tone="warning" className="mt-3">
            This reward is not held in escrow. For SOL bounties, an organization manager pays the
            selected contributor directly after approving work.
          </Alert>
        ) : null}
        <ol
          className="mt-4 space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3"
          aria-label="Bounty participation progress"
        >
          {bountySteps.map((step, index) => (
            <li
              key={step.label}
              className="flex items-start gap-3"
              aria-current={step.current ? "step" : undefined}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  step.complete
                    ? "bg-emerald-100 text-emerald-800"
                    : step.needsAttention
                      ? "bg-amber-100 text-amber-900"
                      : step.current
                        ? "bg-primary-100 text-primary-800"
                        : "bg-neutral-200 text-neutral-600"
                }`}
                aria-hidden="true"
              >
                {step.complete ? "✓" : index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-neutral-800">
                  {step.label}
                  {step.current ? (
                    <span className="font-normal text-primary-700"> · Next</span>
                  ) : null}
                  {step.needsAttention ? (
                    <span className="font-normal text-amber-800"> · Action needed</span>
                  ) : null}
                </span>
                <span className="block text-xs leading-5 text-neutral-600">{step.detail}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs leading-5 text-neutral-500">
          Signing records a public memo on Solana Devnet. It does not transfer funds. Organization
          approval is stored by Scout with a verifiable content hash; it is not represented as an
          on-chain credential.
        </p>

        {submissionQuery.isLoading ? (
          <p className="mt-4 text-sm text-neutral-500">Checking your participation…</p>
        ) : null}
        {!user ? (
          <div className="mt-4">
            <Link to="/login" className="text-sm font-medium text-primary-700 underline">
              Sign in to join this bounty
            </Link>
          </div>
        ) : !user.walletAddress ? (
          <div className="mt-4">
            <Link to="/passport" className="text-sm font-medium text-primary-700 underline">
              Verify a wallet in your Passport before joining
            </Link>
          </div>
        ) : bounty.status !== "OPEN" && !submission ? (
          <Alert tone="info" className="mt-4">
            This bounty is closed and is no longer accepting participants.
          </Alert>
        ) : !submission ? (
          <Button className="mt-4" onClick={recordParticipation} loading={busy}>
            Sign participation on Solana Devnet
          </Button>
        ) : submission.status === "APPROVED" ? (
          <div className="mt-4 space-y-2">
            <Alert tone="success">
              Your work was approved and an organization-verified achievement was added to your
              Passport.
            </Alert>
            {submission.rewardTxSignature ? (
              <a
                className="inline-flex text-xs font-medium text-primary-700 underline"
                href={`https://explorer.solana.com/tx/${submission.rewardTxSignature}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
              >
                View direct Devnet SOL payout
              </a>
            ) : null}
          </div>
        ) : submission.status === "SUBMITTED" ? (
          <Alert tone="info" className="mt-4">
            Your work is with the organization for review.
          </Alert>
        ) : (
          <div className="mt-4 space-y-3">
            {submission.status === "REJECTED" ? (
              <Alert tone="warning">
                {submission.reviewNote || "The organization requested another submission."}
              </Alert>
            ) : null}
            <Input
              label="Work or demo link (optional)"
              type="url"
              value={submissionUrl}
              onChange={(event) => setSubmissionUrl(event.target.value)}
              placeholder="https://"
            />
            <Textarea
              label="Describe the work submitted"
              value={submissionText}
              onChange={(event) => setSubmissionText(event.target.value)}
              rows={4}
              placeholder="Summarize your contribution for the organization reviewer."
            />
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={submitWork}
                loading={busy}
                disabled={!submissionUrl.trim() && submissionText.trim().length < 20}
              >
                Submit work for review
              </Button>
              <Button variant="outline" onClick={recordParticipation} loading={busy}>
                Record another Devnet receipt
              </Button>
            </div>
          </div>
        )}

        {submission?.participationTxSignature ? (
          <a
            className="mt-3 inline-flex text-xs font-medium text-primary-700 underline"
            href={`https://explorer.solana.com/tx/${submission.participationTxSignature}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
          >
            View confirmed Devnet participation receipt
          </a>
        ) : null}
        {error ? (
          <Alert tone="danger" className="mt-3">
            {error}
          </Alert>
        ) : null}
        {wallet.error ? (
          <Alert tone="danger" className="mt-3">
            {wallet.error}
          </Alert>
        ) : null}
        {message ? (
          <Alert tone="success" className="mt-3">
            {message}
          </Alert>
        ) : null}
        <Button className="mt-3" variant="outline" size="sm" onClick={copyBlink}>
          Copy Solana Action link
        </Button>
      </CardBody>
    </Card>
  );
}
