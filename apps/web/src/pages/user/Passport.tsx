import { useState } from "react";
import { ArrowUpRight, BadgeCheck, Building2, Code2, Copy, Fingerprint, Wallet2 } from "lucide-react";
import { Link } from "react-router-dom";
import { SeoHead } from "../../components/common/SeoHead";
import { PageHeader } from "../../components/layout/PageHeader";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { useSolanaWallet } from "../../hooks/useSolanaWallet";
import { useAuthStore } from "../../stores/authStore";

export function Passport() {
  const user = useAuthStore((state) => state.user);
  const wallet = useSolanaWallet();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!wallet.address || !navigator.clipboard) return;
    await navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
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
                  <p className="mt-1 text-sm text-neutral-600">{user?.email}</p>
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
              subtitle="Connect a wallet as an optional profile reference. Connecting does not sign you in or create an on-chain credential."
              actions={<Wallet2 className="h-5 w-5 text-primary-700" aria-hidden />}
            />
            <CardBody>
              {wallet.address ? (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
                      Connected in this browser · {wallet.walletName}
                    </p>
                    <p className="mt-1 break-all font-mono text-sm text-neutral-900">
                      {wallet.address}
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
                    <Button variant="outline" size="sm" onClick={wallet.disconnect}>
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      No wallet connected
                    </p>
                    <p className="mt-1 text-xs text-neutral-600">
                      Scout never asks for your recovery phrase or private key.
                    </p>
                  </div>
                  <Button onClick={wallet.connect} loading={wallet.connecting}>
                    Connect Solana wallet
                  </Button>
                </div>
              )}
              {wallet.error ? (
                <Alert tone="danger" className="mt-3">
                  {wallet.error}
                </Alert>
              ) : null}
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
              subtitle="Reputation is earned from verifiable activity, not an editable score."
              actions={<BadgeCheck className="h-5 w-5 text-primary-700" aria-hidden />}
            />
            <CardBody>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Reputation", value: "Not scored" },
                  { label: "Verified credentials", value: "None linked" },
                  { label: "On-chain achievements", value: "None recorded" },
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
                Scout has not yet issued or anchored credentials for this account.
                No reputation score is shown until it can be calculated from verified
                records.
              </p>
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
                <Link
                  to="/dashboard"
                  className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50/40"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                      <Fingerprint className="h-4 w-4" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-neutral-900">
                        Personal
                      </span>
                      <span className="block text-xs text-neutral-500">
                        Discover and track opportunities
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-neutral-400" aria-hidden />
                </Link>
                <Link
                  to="/org/profile"
                  className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50/40"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                      <Building2 className="h-4 w-4" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-neutral-900">
                        Organization
                      </span>
                      <span className="block text-xs text-neutral-500">
                        Manage your organization workspace
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-neutral-400" aria-hidden />
                </Link>
                <Link
                  to="/developer"
                  className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50/40"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                      <Code2 className="h-4 w-4" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-neutral-900">
                        Developer
                      </span>
                      <span className="block text-xs text-neutral-500">
                        Build with the Scout opportunity API
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-neutral-400" aria-hidden />
                </Link>
              </div>
            </CardBody>
          </Card>
        </aside>
      </div>
    </>
  );
}
