import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Connection, Transaction } from "@solana/web3.js";
import { ArrowUpRight, BadgeCheck, Building2, Code2, Copy, Fingerprint, Wallet2 } from "lucide-react";
import { Link } from "react-router-dom";
import { SeoHead } from "../../components/common/SeoHead";
import { PageHeader } from "../../components/layout/PageHeader";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { useSolanaWallet } from "../../hooks/useSolanaWallet";
import { useAuthStore } from "../../stores/authStore";
import { authService } from "../../services/auth.service";
import { HttpError } from "../../services/http";
import { userService } from "../../services/user.service";
import { workspaceService } from "../../services/workspace.service";
import type { Workspace } from "../../types/workspace";

export function Passport() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const wallet = useSolanaWallet();
  const queryClient = useQueryClient();
  const passport = useQuery({
    queryKey: ["passport"],
    queryFn: userService.passport,
  });
  const workspaces = useQuery({
    queryKey: ["workspaces"],
    queryFn: workspaceService.list,
  });
  const [copied, setCopied] = useState(false);
  const [linking, setLinking] = useState(false);
  const [walletMessage, setWalletMessage] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [anchoringAchievementId, setAnchoringAchievementId] = useState<string | null>(null);
  const [achievementProofMessage, setAchievementProofMessage] = useState<string | null>(null);
  const [achievementProofError, setAchievementProofError] = useState<string | null>(null);

  const anchorAchievement = async (achievementId: string) => {
    setAchievementProofMessage(null);
    setAchievementProofError(null);
    setAnchoringAchievementId(achievementId);
    try {
      if (!user?.walletAddress) {
        throw new Error("Link and verify a wallet above before anchoring achievements.");
      }
      const account = wallet.address ?? await wallet.connect();
      if (!account) throw new Error(wallet.error ?? "Connect your verified wallet.");
      if (account !== user.walletAddress) {
        throw new Error("The connected wallet does not match your verified Scout wallet.");
      }
      const action = await userService.achievementProofTransaction(achievementId, account);
      const transaction = Transaction.from(
        Uint8Array.from(atob(action.transaction), (character) => character.charCodeAt(0)),
      );
      const connection = new Connection("https://api.devnet.solana.com", "confirmed");
      const signature = await wallet.sendTransaction(transaction, connection);
      const confirmation = await connection.confirmTransaction(signature, "confirmed");
      if (confirmation.value.err) throw new Error("The Devnet transaction failed.");
      await userService.confirmAchievementProof(achievementId, signature);
      await queryClient.invalidateQueries({ queryKey: ["passport"] });
      setAchievementProofMessage("Achievement hash anchored on Solana Devnet.");
    } catch (cause) {
      setAchievementProofError(
        cause instanceof Error ? cause.message : "Could not anchor this achievement.",
      );
    } finally {
      setAnchoringAchievementId(null);
    }
  };

  const copyAddress = async () => {
    const address = user?.walletAddress ?? wallet.address;
    if (!address || !navigator.clipboard) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const linkWallet = async () => {
    setWalletMessage(null);
    setWalletError(null);
    setLinking(true);
    try {
      const walletAddress = wallet.address ?? await wallet.connect();
      if (!walletAddress) throw new Error(wallet.error ?? "Connect a Solana wallet first.");
      if (user?.walletAddress && user.walletAddress !== walletAddress) {
        throw new Error("This Scout account already has a different wallet linked.");
      }
      const challenge = await authService.walletChallenge(walletAddress, true);
      const signature = await wallet.signMessage(challenge.message);
      const encodedSignature = btoa(
        Array.from(signature, (byte) => String.fromCharCode(byte)).join(""),
      );
      const result = await authService.walletVerify(
        { walletAddress, nonce: challenge.nonce, signature: encodedSignature },
        true,
      );
      if (!("walletLinked" in result) || !result.walletLinked) {
        throw new Error("Scout did not confirm the wallet link.");
      }
      const currentUser = useAuthStore.getState().user;
      if (currentUser) setUser({ ...currentUser, ...result.user });
      setWalletMessage("Wallet ownership verified and linked to your Scout account.");
    } catch (cause) {
      setWalletError(
        cause instanceof HttpError || cause instanceof Error
          ? cause.message
          : "Could not verify this wallet.",
      );
    } finally {
      setLinking(false);
    }
  };

  return (
    <>
      <SeoHead
        title="Scout Passport"
        description="Review your Scout identity, connected wallet, and organization workspaces."
      />
      <PageHeader
        title="Scout Passport"
        description="Your Scout account is the identity. Workspaces and an optional wallet add context to what you do."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Personal identity"
              subtitle="Your existing Scout account remains the way you sign in."
              actions={<Fingerprint className="h-5 w-5 text-primary-700" aria-hidden />}
            />
            <CardBody>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-semibold text-neutral-900">
                    {user?.fullName || "Scout member"}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {user?.email ?? "Wallet-first Scout identity"}
                  </p>
                  {user?.countryCode ? (
                    <p className="mt-1 text-xs text-neutral-500">
                      Account country: {user.countryCode}
                    </p>
                  ) : null}
                </div>
                <Link to="/profile">
                  <Button variant="outline" size="sm">
                    Edit profile
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Solana wallet"
              subtitle="Prove ownership by signing a one-time message. This links the public address to your Scout account; it does not authorize a transfer."
              actions={<Wallet2 className="h-5 w-5 text-primary-700" aria-hidden />}
            />
            <CardBody>
              {user?.walletAddress ? (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
                      Verified Scout wallet{wallet.address === user.walletAddress && wallet.walletName ? ` · ${wallet.walletName}` : ""}
                    </p>
                    <p className="mt-1 break-all font-mono text-sm text-neutral-900">
                      {user.walletAddress}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Copy className="h-4 w-4" />}
                      onClick={copyAddress}
                    >
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    {wallet.address ? <Button variant="outline" size="sm" onClick={wallet.disconnect}>
                      Disconnect
                    </Button> : null}
                  </div>
                </div>
              ) : wallet.address ? (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-amber-900">
                      Connected · ownership not yet verified
                    </p>
                    <p className="mt-1 break-all font-mono text-sm text-neutral-900">
                      {wallet.address}
                    </p>
                  </div>
                  <Button onClick={linkWallet} loading={linking}>
                    Sign to verify and link
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      No wallet linked to this account
                    </p>
                    <p className="mt-1 text-xs text-neutral-600">
                      Connect and sign a verification message; Scout never asks for a recovery phrase or private key.
                    </p>
                  </div>
                  <Button onClick={wallet.connect} loading={wallet.connecting}>
                    Connect Solana wallet
                  </Button>
                </div>
              )}
              {wallet.error || walletError ? (
                <Alert tone="danger" className="mt-3">
                  {walletError ?? wallet.error}
                </Alert>
              ) : null}
              {walletMessage ? <Alert tone="success" className="mt-3">{walletMessage}</Alert> : null}
              {!wallet.available && !wallet.address ? (
                <p className="mt-3 text-xs text-neutral-500">
                  Install a Solana wallet extension such as{" "}
                  <a
                    className="font-medium text-primary-700 underline"
                    href="https://phantom.app/download"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Phantom
                  </a>{" "}
                  or{" "}
                  <a
                    className="font-medium text-primary-700 underline"
                    href="https://www.solflare.com/download/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Solflare
                  </a>{" "}
                  to connect.
                </p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Verified history"
              subtitle="Reputation comes only from completed work approved by an organization."
              actions={<BadgeCheck className="h-5 w-5 text-primary-700" aria-hidden />}
            />
            <CardBody>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  {
                    label: "Reputation",
                    value: passport.data?.verifiedAchievementCount
                      ? `${passport.data.reputationScore} points`
                      : passport.isError ? "Unavailable" : "Not scored",
                  },
                  {
                    label: "Organization-verified achievements",
                    value: passport.data ? String(passport.data.verifiedAchievementCount) : passport.isError ? "Unavailable" : "—",
                  },
                  {
                    label: "Completed opportunities",
                    value: passport.data ? String(passport.data.completedOpportunityCount) : passport.isError ? "Unavailable" : "—",
                  },
                  {
                    label: "Verified direct payouts",
                    value: passport.data ? String(passport.data.paidRewardCount) : passport.isError ? "Unavailable" : "—",
                  },
                  {
                    label: "On-chain participation receipts",
                    value: passport.data ? String(passport.data.onChainParticipationCount) : passport.isError ? "Unavailable" : "—",
                  },
                  {
                    label: "On-chain proof fingerprints",
                    value: passport.data ? String(passport.data.onChainSubmissionCount) : passport.isError ? "Unavailable" : "—",
                  },
                  {
                    label: "Anchored achievement hashes",
                    value: passport.data ? String(passport.data.anchoredAchievementCount) : passport.isError ? "Unavailable" : "—",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-neutral-200 p-4"
                  >
                    <p className="text-xs text-neutral-500">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-neutral-900">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-neutral-500">
                Organization approvals are stored as Scout-issued records with a
                tamper-evident content hash. You can separately anchor that hash from
                your wallet; participation and payment transactions are independently
                checked on Solana Devnet. Reputation is based on verified history, not
                wallet balance or unreviewed activity.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <SkillList title="Professional skills" values={passport.data?.skills ?? []} />
                <SkillList title="Certifications" values={passport.data?.certifications ?? []} />
              </div>
              {passport.isError ? (
                <Alert tone="danger" className="mt-3">
                  Could not load verified history. Refresh the page to try again.
                </Alert>
              ) : null}
              {passport.data?.achievements.length ? (
                <div className="mt-5 space-y-3">
                  {passport.data.achievements.map((achievement) => (
                    <div key={achievement.id} className="rounded-lg border border-neutral-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-neutral-900">{achievement.title}</p>
                          <p className="mt-1 text-xs text-neutral-600">
                            Issued by {achievement.organization.name} · {achievement.points} reputation points
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                          Organization verified
                        </span>
                      </div>
                      {achievement.description ? (
                        <p className="mt-2 text-sm text-neutral-700">{achievement.description}</p>
                      ) : null}
                      <div className="mt-3 break-all font-mono text-[11px] text-neutral-500">
                        Proof hash: {achievement.proofHash}
                      </div>
                      {achievement.submission.participationTxSignature ? (
                        <a
                          className="mt-2 inline-flex text-xs font-medium text-primary-700 underline"
                          href={`https://explorer.solana.com/tx/${achievement.submission.participationTxSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View Devnet participation receipt
                        </a>
                      ) : null}
                      {achievement.submission.submissionProofTxSignature ? (
                        <a
                          className="mt-2 inline-flex text-xs font-medium text-primary-700 underline"
                          href={`https://explorer.solana.com/tx/${achievement.submission.submissionProofTxSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View Devnet proof fingerprint
                        </a>
                      ) : null}
                      {achievement.submission.rewardTxSignature ? (
                        <a
                          className="mt-2 inline-flex text-xs font-medium text-emerald-700 underline"
                          href={`https://explorer.solana.com/tx/${achievement.submission.rewardTxSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View direct Devnet SOL reward payment
                        </a>
                      ) : null}
                      {achievement.proofTxSignature ? (
                        <a
                          className="mt-2 inline-flex text-xs font-medium text-primary-700 underline"
                          href={`https://explorer.solana.com/tx/${achievement.proofTxSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View wallet-anchored achievement proof
                        </a>
                      ) : (
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void anchorAchievement(achievement.id)}
                            loading={anchoringAchievementId === achievement.id}
                            disabled={!user?.walletAddress}
                          >
                            Anchor achievement hash on Devnet
                          </Button>
                          <p className="mt-2 text-xs text-neutral-500">
                            The organization approval remains a Scout-issued record. This transaction anchors its hash from your wallet; it does not publish the description or personal details.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
              {achievementProofError ? (
                <Alert tone="danger" className="mt-3">{achievementProofError}</Alert>
              ) : null}
              {achievementProofMessage ? (
                <Alert tone="success" className="mt-3">{achievementProofMessage}</Alert>
              ) : null}
            </CardBody>
          </Card>
        </div>

        <aside>
          <Card>
            <CardHeader
              title="Your workspaces"
              subtitle="Use one Scout account across personal, organization, and developer work."
            />
            <CardBody>
              <div className="space-y-3">
                {workspaces.isLoading ? (
                  <p className="text-sm text-neutral-500">Loading your workspaces…</p>
                ) : workspaces.isError ? (
                  <Alert tone="danger">
                    Could not load your workspaces. Refresh the page to try again.
                  </Alert>
                ) : (workspaces.data ?? []).length === 0 ? (
                  <p className="text-sm text-neutral-500">
                    No workspaces yet. Choose a starting workspace from onboarding.
                  </p>
                ) : (
                  workspaces.data?.map((workspace) => (
                    <WorkspaceLink key={workspace.id} workspace={workspace} />
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </aside>
      </div>
    </>
  );
}

function WorkspaceLink({ workspace }: { workspace: Workspace }) {
  const Icon =
    workspace.type === "ORGANIZATION"
      ? Building2
      : workspace.type === "DEVELOPER"
        ? Code2
        : Fingerprint;
  const destination =
    workspace.type === "ORGANIZATION"
      ? "/org/profile"
      : workspace.type === "DEVELOPER"
        ? "/developer"
        : "/dashboard";
  const label =
    workspace.type === "ORGANIZATION"
      ? "Organization workspace"
      : workspace.type === "DEVELOPER"
        ? "Developer workspace"
        : "Personal workspace";

  return (
    <Link
      to={destination}
      className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50/40"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-neutral-900">
            {workspace.name}
          </span>
          <span className="block text-xs text-neutral-500">{label}</span>
        </span>
      </span>
      <ArrowUpRight className="ml-3 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
    </Link>
  );
}

function SkillList({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</p>
      {values.length ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <li key={value} className="rounded-full bg-primary-50 px-2.5 py-1 text-xs text-primary-800">
              {value}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-neutral-500">No {title.toLowerCase()} added yet.</p>
      )}
    </div>
  );
}
