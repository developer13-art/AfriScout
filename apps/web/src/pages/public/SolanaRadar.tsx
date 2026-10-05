import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Search, ShieldCheck, Wallet2 } from "lucide-react";
import type { Opportunity, OpportunityType } from "../../types/opportunity";
import { SeoHead } from "../../components/common/SeoHead";
import { Container } from "../../components/layout/Container";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Input } from "../../components/ui/Input";
import { Loader } from "../../components/ui/Loader";
import { useOpportunities } from "../../hooks/useOpportunities";
import { labelForCategory, labelForOpportunityType } from "../../config/categories";

type RadarFilter = "all" | "bounties" | "grants" | "jobs" | "hackathons";

const filterLabels: Array<{ value: RadarFilter; label: string }> = [
  { value: "all", label: "All ecosystem results" },
  { value: "bounties", label: "Bounties" },
  { value: "grants", label: "Grants & funding" },
  { value: "jobs", label: "Jobs" },
  { value: "hackathons", label: "Hackathons" },
];

function isForFilter(opportunity: Opportunity, filter: RadarFilter): boolean {
  const type = opportunity.opportunityType as OpportunityType;
  const text =
    `${opportunity.title} ${opportunity.summaryShort ?? ""} ${opportunity.description ?? ""}`.toLowerCase();
  if (filter === "all") return true;
  if (filter === "bounties") return text.includes("bount") || text.includes("reward");
  if (filter === "hackathons") return type === "HACKATHON";
  if (filter === "grants") {
    return (
      ["GRANTS", "FUNDING", "INVESTMENT"].includes(opportunity.category) ||
      ["GRANT", "FUNDING", "INVESTMENT"].includes(type)
    );
  }
  return ["EMPLOYMENT", "INTERNSHIPS"].includes(opportunity.category) || type === "JOB";
}

function formatReward(opportunity: Opportunity): string | null {
  const value = opportunity.valueMax ?? opportunity.valueMin;
  if (value == null) return null;
  const amount = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(value);
  return `${opportunity.currency ? `${opportunity.currency} ` : ""}${amount}`;
}

function formatDeadline(deadline?: string | null): string | null {
  if (!deadline) return null;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function SolanaRadar() {
  const [filter, setFilter] = useState<RadarFilter>("all");
  const [queryText, setQueryText] = useState("");
  const [search, setSearch] = useState("Solana");
  const solana = useOpportunities({ q: search }, 1, 20);
  const web3 = useOpportunities({ q: "web3" }, 1, 20);
  const blockchain = useOpportunities({ q: "blockchain" }, 1, 20);

  const opportunities = useMemo(() => {
    const unique = new Map<string, Opportunity>();
    for (const opportunity of [
      ...(solana.data?.items ?? []),
      ...(web3.data?.items ?? []),
      ...(blockchain.data?.items ?? []),
    ]) {
      unique.set(opportunity.id, opportunity);
    }
    return [...unique.values()]
      .filter((opportunity) => isForFilter(opportunity, filter))
      .sort((a, b) => {
        const aDeadline = a.deadline ? Date.parse(a.deadline) : Number.MAX_SAFE_INTEGER;
        const bDeadline = b.deadline ? Date.parse(b.deadline) : Number.MAX_SAFE_INTEGER;
        return aDeadline - bDeadline;
      });
  }, [blockchain.data?.items, filter, solana.data?.items, web3.data?.items]);

  const isLoading = solana.isLoading || web3.isLoading || blockchain.isLoading;
  const allFailed = solana.isError && web3.isError && blockchain.isError;

  return (
    <>
      <SeoHead
        title="Solana Radar"
        description="Search Scout's live opportunity index for Solana and Web3 ecosystem opportunities."
      />
      <Container className="py-8">
        <PageHeader
          title="Solana Radar"
          description="A focused view into real opportunities mentioning Solana, Web3, or blockchain in Scout's connected source index."
          actions={
            <Link to="/explore">
              <Button variant="outline" rightIcon={<ArrowUpRight className="h-4 w-4" />}>
                Global opportunity index
              </Button>
            </Link>
          }
        />

        <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(queryText.trim() || "Solana");
            }}
          >
            <Input
              aria-label="Search ecosystem opportunities"
              value={queryText}
              onChange={(event) => setQueryText(event.target.value)}
              placeholder="Search terms, e.g. Solana, protocol grant"
              leftIcon={<Search className="h-4 w-4" />}
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </form>
          <label className="sr-only" htmlFor="solana-radar-filter">
            Filter opportunity type
          </label>
          <select
            id="solana-radar-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value as RadarFilter)}
            className="h-10 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-800"
          >
            {filterLabels.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6 flex flex-wrap gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-600">
          <span className="inline-flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-primary-700" aria-hidden />
            Results come from Scout's live opportunity index.
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Wallet2 className="h-3.5 w-3.5 text-primary-700" aria-hidden />
            Wallet connection does not fund or accept a bounty.
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary-700" aria-hidden />
            On-chain reward status is not inferred from a listing.
          </span>
        </div>

        {isLoading ? (
          <Loader label="Searching the opportunity index" />
        ) : allFailed ? (
          <ErrorState
            title="Could not load ecosystem opportunities"
            description="Scout's opportunity index could not be reached. Try again in a moment."
            action={
              <Button
                onClick={() => {
                  void solana.refetch();
                  void web3.refetch();
                  void blockchain.refetch();
                }}
              >
                Retry
              </Button>
            }
          />
        ) : opportunities.length === 0 ? (
          <Card className="py-12 text-center">
            <p className="text-base font-semibold text-neutral-900">
              No matching opportunities in the connected index
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm text-neutral-600">
              This view does not add sample listings. Try another search term or
              browse all opportunities in Scout.
            </p>
            <Link to="/explore" className="mt-4 inline-flex">
              <Button variant="outline">Browse all opportunities</Button>
            </Link>
          </Card>
        ) : (
          <>
            <p className="mb-3 text-xs text-neutral-500">
              {opportunities.length} matching listing{opportunities.length === 1 ? "" : "s"}{" "}
              from connected sources
            </p>
            <div className="grid gap-4 xl:grid-cols-2">
              {opportunities.map((opportunity) => {
                const reward = formatReward(opportunity);
                const deadline = formatDeadline(opportunity.deadline);
                return (
                  <Card key={opportunity.id} className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-800">
                        {labelForOpportunityType(opportunity.opportunityType)}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {labelForCategory(opportunity.category)}
                      </span>
                      {opportunity.verificationStatus === "VERIFIED" ? (
                        <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                          Source status: verified
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-neutral-900">
                      <Link
                        to={`/opportunities/${opportunity.slug}`}
                        className="hover:text-primary-700"
                      >
                        {opportunity.title}
                      </Link>
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      {opportunity.organizationName || "Organization not listed"}
                      {opportunity.countryCode ? ` · ${opportunity.countryCode}` : ""}
                      {opportunity.isRemote ? " · Remote" : ""}
                    </p>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-700">
                      {opportunity.summaryShort ||
                        opportunity.description ||
                        "Open the listing to review source details and eligibility."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-4 border-t border-neutral-100 pt-3 text-xs text-neutral-600">
                      {reward ? <span>Listed value: {reward}</span> : null}
                      {deadline ? <span>Deadline: {deadline}</span> : null}
                      <span>
                        On-chain reward:{" "}
                        {opportunity.valueMax || opportunity.valueMin
                          ? "not independently confirmed"
                          : "not listed"}
                      </span>
                    </div>
                    <Link
                      to={`/opportunities/${opportunity.slug}`}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-900"
                    >
                      Review opportunity <ArrowUpRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </Container>
    </>
  );
}
