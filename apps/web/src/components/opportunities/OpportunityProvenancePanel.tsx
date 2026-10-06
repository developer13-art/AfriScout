import { useEffect, useMemo, useState } from "react";
import { Connection, Transaction } from "@solana/web3.js";
import { Fingerprint, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type {
  Opportunity,
  OpportunityChange,
  OpportunitySourceLink,
} from "../../types/opportunity";
import { OpportunitySourcePanel } from "./OpportunitySourcePanel";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { opportunityService } from "../../services/opportunity.service";
import { HttpError } from "../../services/http";
import { useAuthStore } from "../../stores/authStore";
import { useSolanaWallet } from "../../hooks/useSolanaWallet";

interface OpportunityProvenancePanelProps {
  opportunity: Opportunity;
  sources: OpportunitySourceLink[];
  changes: OpportunityChange[];
}

const verificationLabels = {
  VERIFIED: "Verified by Scout",
  PARTIAL: "Partially checked",
  DISPUTED: "Disputed",
  UNVERIFIED: "Not verified",
} as const;

function formatDate(value?: string | null): string {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function OpportunityProvenancePanel({
  opportunity,
  sources,
  changes,
}: OpportunityProvenancePanelProps) {
  const user = useAuthStore((state) => state.user);
  const wallet = useSolanaWallet();
  const queryClient = useQueryClient();
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [fingerprintError, setFingerprintError] = useState(false);
  const [anchoring, setAnchoring] = useState(false);
  const [anchorMessage, setAnchorMessage] = useState<string | null>(null);
  const [anchorError, setAnchorError] = useState<string | null>(null);

  const recordSnapshot = useMemo(
    () =>
      JSON.stringify({
        id: opportunity.id,
        title: opportunity.title,
        organizationName: opportunity.organizationName ?? null,
        category: opportunity.category,
        opportunityType: opportunity.opportunityType,
        countryCode: opportunity.countryCode ?? null,
        deadline: opportunity.deadline ?? null,
        applicationUrl: opportunity.applicationUrl ?? null,
        updatedAt: opportunity.updatedAt,
        sourceUrls: (opportunity.sources ?? sources)
          .map((source) => source.sourceUrl)
          .sort(),
      }),
    [opportunity, sources],
  );

  useEffect(() => {
    let cancelled = false;
    setFingerprint(null);
    setFingerprintError(false);
    if (!globalThis.crypto?.subtle) {
      setFingerprintError(true);
      return;
    }

    const bytes = new TextEncoder().encode(recordSnapshot);
    void globalThis.crypto.subtle
      .digest("SHA-256", bytes)
      .then((digest) => {
        if (!cancelled) {
          setFingerprint(
            [...new Uint8Array(digest)]
              .map((byte) => byte.toString(16).padStart(2, "0"))
              .join(""),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setFingerprintError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [recordSnapshot]);

  const latestSeen = sources
    .map((source) => source.lastSeenAt)
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
  const latestChange = [...changes].sort(
    (a, b) => Date.parse(b.detectedAt) - Date.parse(a.detectedAt),
  )[0];
  const version = changes.reduce(
    (highest, change) => Math.max(highest, change.toVersion ?? 0),
    1,
  );
  const currentProof = opportunity.provenanceProofs?.find(
    (proof) => proof.contentHash === fingerprint,
  );

  const anchorCurrentVersion = async () => {
    setAnchorMessage(null);
    setAnchorError(null);
    setAnchoring(true);
    try {
      if (!user) throw new Error("Sign in to anchor this opportunity record.");
      if (!user.walletAddress) throw new Error("Link and verify a wallet in your Passport first.");
      const account = wallet.address ?? await wallet.connect();
      if (!account) throw new Error(wallet.error ?? "Connect your verified wallet.");
      if (account !== user.walletAddress) {
        throw new Error("The connected wallet does not match your verified Scout wallet.");
      }

      const action = await opportunityService.provenanceProofTransaction(
        opportunity.id,
        account,
      );
      if (fingerprint && action.contentHash !== fingerprint) {
        throw new Error("This opportunity changed. Reload the page before anchoring it.");
      }
      const transaction = Transaction.from(
        Uint8Array.from(atob(action.transaction), (character) => character.charCodeAt(0)),
      );
      const connection = new Connection("https://api.devnet.solana.com", "confirmed");
      const signature = await wallet.sendTransaction(transaction, connection);
      const confirmation = await connection.confirmTransaction(signature, "confirmed");
      if (confirmation.value.err) throw new Error("The Devnet transaction failed.");
      await opportunityService.confirmProvenanceProof(opportunity.id, signature);
      await queryClient.invalidateQueries({ queryKey: ["opportunity", opportunity.slug] });
      setAnchorMessage("The current source and record fingerprint is anchored on Solana Devnet.");
    } catch (cause) {
      setAnchorError(
        cause instanceof HttpError || cause instanceof Error
          ? cause.message
          : "Could not anchor this opportunity record.",
      );
    } finally {
      setAnchoring(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Opportunity provenance
            </h2>
            <p className="mt-1 text-xs leading-5 text-neutral-600">
              Review the source trail and Scout&apos;s current verification status.
      Check Scout&apos;s verification status, source trail, and whether this exact
      record version has a wallet-signed Devnet receipt.
            </p>
          </div>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-neutral-50 p-3">
            <dt className="text-xs text-neutral-500">Scout verification</dt>
            <dd className="mt-1 text-sm font-medium text-neutral-900">
              {verificationLabels[opportunity.verificationStatus]}
            </dd>
          </div>
          <div className="rounded-lg bg-neutral-50 p-3">
            <dt className="text-xs text-neutral-500">Linked source records</dt>
            <dd className="mt-1 text-sm font-medium text-neutral-900">
              {sources.length}
            </dd>
          </div>
          <div className="rounded-lg bg-neutral-50 p-3">
            <dt className="text-xs text-neutral-500">Record version</dt>
            <dd className="mt-1 text-sm font-medium text-neutral-900">
              {changes.length ? version : "Initial record"}
            </dd>
          </div>
          <div className="rounded-lg bg-neutral-50 p-3">
            <dt className="text-xs text-neutral-500">Last seen at source</dt>
            <dd className="mt-1 text-sm font-medium text-neutral-900">
              {formatDate(latestSeen)}
            </dd>
          </div>
          <div className="rounded-lg bg-neutral-50 p-3 sm:col-span-2">
            <dt className="text-xs text-neutral-500">Latest detected change</dt>
            <dd className="mt-1 text-sm font-medium text-neutral-900">
              {latestChange
                ? `${latestChange.field} · ${formatDate(latestChange.detectedAt)}`
                : "No changes recorded"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Fingerprint className="h-4 w-4 text-neutral-500" aria-hidden />
          <h2 className="text-sm font-semibold text-neutral-900">
            Current record fingerprint
          </h2>
        </div>
        <p className="mt-1 text-xs leading-5 text-neutral-600">
          SHA-256 of the current Scout record and linked source URLs, generated in
          this browser. It is a comparison aid, not an on-chain proof.
        </p>
        {fingerprint ? (
          <code className="mt-3 block break-all rounded-lg bg-neutral-50 p-3 text-xs text-neutral-700">
            {fingerprint}
          </code>
        ) : fingerprintError ? (
          <p className="mt-3 text-xs text-neutral-500">
            A fingerprint could not be generated in this browser.
          </p>
        ) : (
          <p className="mt-3 text-xs text-neutral-500">Generating fingerprint…</p>
        )}
        {currentProof ? (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-semibold text-emerald-900">
              This record version is anchored on Solana Devnet
            </p>
            <p className="mt-1 text-xs text-emerald-800">
              Signed by {currentProof.walletAddress} · {formatDate(currentProof.anchoredAt)}
            </p>
            <a
              className="mt-2 inline-flex text-xs font-medium text-emerald-900 underline"
              href={`https://explorer.solana.com/tx/${currentProof.txSignature}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
            >
              View provenance receipt
            </a>
          </div>
        ) : (
          <>
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              {opportunity.provenanceProofs?.length
                ? "The stored Devnet proof belongs to an earlier version; this current fingerprint is not anchored."
                : "On-chain proof: not yet recorded for this opportunity."}
            </p>
            {user ? (
              user.walletAddress ? (
                <Button
                  className="mt-3"
                  size="sm"
                  onClick={anchorCurrentVersion}
                  loading={anchoring}
                  disabled={!fingerprint || fingerprintError}
                >
                  Anchor current version on Devnet
                </Button>
              ) : (
                <Link to="/passport" className="mt-3 inline-flex text-sm font-medium text-primary-700 underline">
                  Link a verified wallet to anchor this record
                </Link>
              )
            ) : (
              <Link to="/login" className="mt-3 inline-flex text-sm font-medium text-primary-700 underline">
                Sign in to anchor this record
              </Link>
            )}
            <p className="mt-2 text-xs text-neutral-500">
              Anchoring writes only hashes and the opportunity ID to a public memo. Your wallet signs and pays the Devnet transaction fee; no tokens are transferred.
            </p>
          </>
        )}
        {anchorError ? <Alert tone="danger" className="mt-3">{anchorError}</Alert> : null}
        {anchorMessage ? <Alert tone="success" className="mt-3">{anchorMessage}</Alert> : null}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">
          Original source links
        </h2>
        <OpportunitySourcePanel sources={sources} />
      </section>
    </div>
  );
}
