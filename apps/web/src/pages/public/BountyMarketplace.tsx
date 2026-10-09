import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Search, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { SeoHead } from "../../components/common/SeoHead";
import { Container } from "../../components/layout/Container";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Input } from "../../components/ui/Input";
import { Loader } from "../../components/ui/Loader";
import { bountyService } from "../../services/bounty.service";
import type { Bounty } from "../../types/bounty";

export function BountyMarketplace() {
  const [queryText, setQueryText] = useState("");
  const [sort, setSort] = useState<"newest" | "reward">("newest");
  const bounties = useQuery({
    queryKey: ["bounties", "open-marketplace"],
    queryFn: bountyService.list,
  });

  const visibleBounties = useMemo(() => {
    const search = queryText.trim().toLowerCase();
    return [...(bounties.data ?? [])]
      .filter((bounty) => {
        if (!search) return true;
        return [
          bounty.opportunity.title,
          bounty.opportunity.description,
          bounty.organization.name,
          ...bounty.requiredSkills,
        ].some((field) => field?.toLowerCase().includes(search));
      })
      .sort((a, b) =>
        sort === "reward"
          ? Number(b.rewardAmount) - Number(a.rewardAmount)
          : Date.parse(b.opportunity.createdAt ?? "") - Date.parse(a.opportunity.createdAt ?? ""),
      );
  }, [bounties.data, queryText, sort]);

  return (
    <>
      <SeoHead
        title="Bounty Marketplace"
        description="Browse open Scout bounties, review organization history, and join through a Solana Action."
      />
      <Container className="py-8">
        <PageHeader
          title="Bounty Marketplace"
          description="Open bounties with organization review, verified work receipts, and direct SOL payouts where applicable."
          actions={
            <Link to="/solana-radar">
              <Button variant="outline" rightIcon={<ArrowUpRight className="h-4 w-4" />}>
                Solana Radar
              </Button>
            </Link>
          }
        />

        <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
          <Input
            aria-label="Search open bounties"
            value={queryText}
            onChange={(event) => setQueryText(event.target.value)}
            placeholder="Search bounties, organizations, or skills"
            leftIcon={<Search className="h-4 w-4" />}
          />
          <select
            aria-label="Sort bounties"
            value={sort}
            onChange={(event) => setSort(event.target.value as "newest" | "reward")}
            className="h-10 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-800"
          >
            <option value="newest">Newest first</option>
            <option value="reward">Highest listed reward</option>
          </select>
        </div>

        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Listed rewards are organization commitments, not locked funds. Scout does not currently provide bounty escrow; a SOL reward is only verified after a direct on-chain payout.
          </p>
        </div>

        {bounties.isLoading ? (
          <Loader label="Loading open bounties" />
        ) : bounties.isError ? (
          <ErrorState
            title="Could not load open bounties"
            description="The marketplace could not reach Scout. Try again in a moment."
            action={<Button onClick={() => void bounties.refetch()}>Retry</Button>}
          />
        ) : visibleBounties.length === 0 ? (
          <Card className="py-12 text-center">
            <p className="font-semibold text-neutral-900">
              {queryText ? "No bounties match this search" : "No open bounties are listed"}
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              {queryText
                ? "Try a different organization or skill."
                : "New bounties appear here when organizations publish them."}
            </p>
          </Card>
        ) : (
          <>
            <p className="mb-3 text-xs text-neutral-500">
              {visibleBounties.length} open bounty{visibleBounties.length === 1 ? "" : "ies"}
            </p>
            <div className="grid gap-4 xl:grid-cols-2">
              {visibleBounties.map((bounty) => (
                <BountyCard key={bounty.id} bounty={bounty} />
              ))}
            </div>
          </>
        )}
      </Container>
    </>
  );
}

function BountyCard({ bounty }: { bounty: Bounty }) {
  const reward = new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 })
    .format(Number(bounty.rewardAmount));
  const deadline = bounty.opportunity.deadline
    ? new Date(bounty.opportunity.deadline).toLocaleDateString()
    : null;

  return (
    <Card className="flex flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-800">
          Open
        </span>
        {bounty.organization.verified ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
            Scout verified organization
          </span>
        ) : null}
      </div>
      <h2 className="mt-3 text-lg font-semibold text-neutral-900">
        <Link to={`/opportunities/${bounty.opportunity.slug}`} className="hover:text-primary-700">
          {bounty.opportunity.title}
        </Link>
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        <Link to={`/organizations/${bounty.organization.slug}`} className="hover:text-primary-700">
          {bounty.organization.name}
        </Link>
      </p>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-700">
        {bounty.opportunity.summaryShort || bounty.opportunity.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-neutral-100 pt-3 text-sm">
        <span className="font-semibold text-neutral-900">Listed reward: {reward} {bounty.rewardCurrency}</span>
        <span className="text-neutral-600">{bounty._count?.submissions ?? 0} participants</span>
        {deadline ? <span className="text-neutral-600">Deadline: {deadline}</span> : null}
      </div>
      {bounty.requiredSkills.length ? (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Required skills">
          {bounty.requiredSkills.map((skill) => (
            <li key={skill} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700">
              {skill}
            </li>
          ))}
        </ul>
      ) : null}
      {bounty.fundingTxSignature ? (
        <p className="mt-3 text-xs text-neutral-500">
          Funding transaction reference recorded; it does not establish escrow.
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          to={`/opportunities/${bounty.opportunity.slug}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-900"
        >
          Details <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          to={`/blink/${bounty.opportunity.slug}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-900"
        >
          Open Solana Action <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </Card>
  );
}
