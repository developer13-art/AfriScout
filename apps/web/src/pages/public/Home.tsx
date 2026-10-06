import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Compass,
  FileSearch,
  Globe2,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { Container } from "../../components/layout/Container";
import { SeoHead } from "../../components/common/SeoHead";
import { GlobalOpportunityMap } from "../../components/map/AfricaOpportunityMap";
import { usePublicCountryBreakdown, usePublicTotals } from "../../hooks/usePublicAnalytics";
import { appConfig } from "../../config/app";
import { opportunityCategories } from "../../config/categories";

const stages = [
  {
    number: "01",
    title: "Discover",
    description: "Bring opportunities from public sources into one searchable field of view.",
    icon: Compass,
  },
  {
    number: "02",
    title: "Understand",
    description: "See the requirements, dates and source context before you spend time applying.",
    icon: FileSearch,
  },
  {
    number: "03",
    title: "Match",
    description: "Focus on the opportunities that fit your goals, experience and capacity.",
    icon: Target,
  },
  {
    number: "04",
    title: "Act",
    description: "Keep your next steps and deadlines moving from first look to submission.",
    icon: ArrowUpRight,
  },
];

const popularSearches = ["Climate funding", "Remote roles", "Research grants", "Public tenders"];

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
const exactCountFormat = new Intl.NumberFormat("en");

function formatCount(value: number | undefined) {
  return typeof value === "number"
    ? new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)
    : "—";
}

function getCountryName(country: { countryCode: string; countryName: string | null }) {
  if (
    country.countryName &&
    country.countryName.toUpperCase() !== country.countryCode.toUpperCase()
  ) {
    return country.countryName;
  }

  return countryNames.of(country.countryCode.toUpperCase()) ?? country.countryCode;
}

export function Home() {
  const countryQuery = usePublicCountryBreakdown();
  const totalsQuery = usePublicTotals();
  const countries = useMemo(
    () => [...(countryQuery.data ?? [])].sort((a, b) => b.count - a.count),
    [countryQuery.data],
  );
  const totals = totalsQuery.data?.totals;
  const isLoading = countryQuery.isLoading || totalsQuery.isLoading;
  const hasError = countryQuery.isError || totalsQuery.isError;

  return (
    <>
      <SeoHead
        title={`${appConfig.name} — The Global Opportunity Intelligence Network`}
        description="Discover opportunities across borders. Understand the details, find your fit, and move from signal to action with Scout."
      />

      <section className="relative isolate overflow-hidden border-b border-[#ded9cc] bg-[#f3f0e7]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-48 -top-52 -z-10 h-[44rem] w-[44rem] rounded-full border border-[#d9d2c2] sm:-right-40 sm:-top-64"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 -z-10 h-[34rem] w-[34rem] rounded-full border border-[#e2dccf]"
        />
        <Container className="py-14 sm:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.19em] text-[#a44b31]">
                <span className="h-2 w-2 rounded-full bg-[#d26c46]" />
                AfriScout is becoming Scout
              </p>
              <h1 className="mt-5 max-w-3xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#172d30] text-[clamp(3rem,7vw,6.25rem)]">
                Opportunity
                <br />
                has no
                <span className="font-serif font-normal italic text-[#bd5b3d]"> borders.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-[#4e5c57] sm:text-xl">
                A global intelligence network to help people and organizations discover what’s out
                there, understand what matters, and act on the opportunities that fit.
              </p>

              <form
                action="/explore"
                method="get"
                className="mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-[#d7d1c5] bg-[#fffdf8] p-2 shadow-[0_14px_40px_rgba(47,55,44,0.08)] sm:flex-row"
              >
                <label htmlFor="home-search" className="sr-only">
                  Search opportunities
                </label>
                <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                  <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-[#a44b31]" />
                  <input
                    id="home-search"
                    name="q"
                    type="search"
                    placeholder="Try “climate funding” or “remote roles”"
                    className="h-12 min-w-0 flex-1 bg-transparent text-sm text-[#172d30] outline-none placeholder:text-[#89908a]"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#173c3b] px-6 text-sm font-semibold text-[#fbf7eb] transition-colors hover:bg-[#245650] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bd5b3d]"
                >
                  Explore opportunities
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </button>
              </form>
              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs">
                <span className="mr-1 font-medium text-[#737c73]">Start with</span>
                {popularSearches.map((term) => (
                  <Link
                    key={term}
                    to={`/explore?q=${encodeURIComponent(term)}`}
                    className="rounded-full border border-[#d8d1c3] bg-[#f9f6ee] px-3 py-1.5 text-[#43534d] transition-colors hover:border-[#bd5b3d] hover:text-[#9b452e]"
                  >
                    {term}
                  </Link>
                ))}
              </div>
              <p className="mt-8 flex items-center gap-2 text-xs font-medium text-[#69766f]">
                <Globe2 aria-hidden="true" className="h-4 w-4 text-[#a44b31]" />
                Rooted in Africa. Built for opportunity everywhere.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-[34rem] lg:mr-0">
              <div className="absolute -left-7 top-8 z-10 hidden -rotate-6 rounded-sm bg-[#d26c46] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.17em] text-[#fff9ee] shadow-md sm:block">
                Look wider
              </div>
              <div className="relative overflow-hidden rounded-[1.65rem] bg-[#173c3b] p-6 text-[#f7f2e7] shadow-[0_28px_75px_rgba(27,54,49,0.22)] sm:p-8">
                <div aria-hidden="true" className="absolute inset-0 opacity-25">
                  <svg viewBox="0 0 600 500" className="h-full w-full" fill="none">
                    <path
                      d="M-40 360C100 230 230 460 360 300S510 150 650 220"
                      stroke="#D5A276"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M-30 400C110 270 240 500 370 340S520 190 660 260"
                      stroke="#D5A276"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M-20 320C120 190 250 420 380 260S530 110 670 180"
                      stroke="#D5A276"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M95 -20C190 120 230 245 335 520M230 -20C325 120 365 245 470 520M365 -20C460 120 500 245 605 520"
                      stroke="#D5A276"
                      strokeWidth="1"
                      strokeDasharray="4 8"
                    />
                    <circle cx="190" cy="226" r="5" fill="#E5A17C" />
                    <circle cx="335" cy="300" r="5" fill="#E5A17C" />
                    <circle cx="445" cy="180" r="5" fill="#E5A17C" />
                    <circle cx="260" cy="120" r="3" fill="#E5A17C" />
                    <circle cx="495" cy="330" r="3" fill="#E5A17C" />
                  </svg>
                </div>
                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d9a27e]">
                        The opportunity field
                      </p>
                      <h2 className="mt-2 max-w-xs text-2xl font-medium leading-tight tracking-[-0.035em] text-[#f7f2e7] sm:text-3xl">
                        One wider view of what’s possible.
                      </h2>
                    </div>
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#718d7c]/60 bg-[#28534b]">
                      <Globe2 aria-hidden="true" className="h-5 w-5 text-[#e8b08b]" />
                    </div>
                  </div>

                  <div className="mt-8 rounded-2xl border border-[#668078]/50 bg-[#0f302f]/75 p-5 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-2 border-b border-[#557168]/60 pb-4">
                      <div>
                        <p className="text-xs font-medium text-[#d4ddd1]">
                          Public opportunity signals
                        </p>
                        <p className="mt-1 text-[10px] text-[#91a79a]">Live platform totals</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#648273] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.13em] text-[#b8d1b6]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#a5c49b]" />
                        Current
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div>
                        <p className="font-mono text-3xl tracking-tight text-[#fff8e8]">
                          {isLoading ? (
                            <span className="inline-block h-8 w-16 animate-pulse rounded bg-[#40635b]" />
                          ) : (
                            formatCount(totals?.opportunitiesTotal)
                          )}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#9eb1a3]">
                          Opportunities
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-3xl tracking-tight text-[#fff8e8]">
                          {isLoading ? (
                            <span className="inline-block h-8 w-14 animate-pulse rounded bg-[#40635b]" />
                          ) : (
                            formatCount(countryQuery.data?.length)
                          )}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#9eb1a3]">
                          Countries represented
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-[#557168]/60 pt-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#d4ddd1]">
                            Published opportunities by country
                          </p>
                          <p className="mt-1 text-[10px] text-[#91a79a]">
                            Scroll or drag to explore; hover a country for its exact total.
                          </p>
                        </div>
                        <Link
                          to="/explore"
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#e8b08b] hover:text-[#f8c6a0]"
                        >
                          Browse all <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
                        </Link>
                      </div>
                      {countryQuery.isError ? (
                        <div className="flex items-center justify-between gap-3 text-xs text-[#c6d1c6]">
                          <span>Country data is temporarily unavailable.</span>
                          <button
                            type="button"
                            onClick={() => countryQuery.refetch()}
                            className="shrink-0 underline underline-offset-2 hover:text-white"
                          >
                            Retry
                          </button>
                        </div>
                      ) : isLoading ? (
                        <div
                          className="h-48 animate-pulse rounded-lg bg-[#35584f]"
                          aria-label="Loading country map"
                        />
                      ) : countries.length ? (
                        <>
                          <div
                            role="region"
                            aria-label="Scrollable world map of published opportunities by country"
                            tabIndex={0}
                            className="max-h-[230px] overflow-auto overscroll-contain rounded-lg border border-[#557168]/60 bg-[#0b2929] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b08b]"
                          >
                            <div className="min-w-[580px] px-2 py-1">
                              <GlobalOpportunityMap
                                data={countries}
                                height={210}
                                compact
                                interactive
                                showLegend={false}
                              />
                            </div>
                          </div>
                          <ul className="mt-3 max-h-28 divide-y divide-[#557168]/50 overflow-y-auto pr-1">
                            {countries.map((country) => (
                              <li key={country.countryCode}>
                                <Link
                                  to={`/explore?countryCode=${encodeURIComponent(country.countryCode)}`}
                                  className="flex items-center justify-between gap-3 py-1.5 text-xs hover:text-white"
                                >
                                  <span className="flex min-w-0 items-center gap-2 text-[#d4ddd1]">
                                    <span className="w-6 shrink-0 font-mono text-[10px] text-[#e8b08b]">
                                      {country.countryCode}
                                    </span>
                                    <span className="truncate">{getCountryName(country)}</span>
                                  </span>
                                  <span className="shrink-0 font-mono text-[#fff8e8]">
                                    {exactCountFormat.format(country.count)}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <p className="text-xs text-[#b5c4b8]">
                          Country coverage will appear here as listings are published.
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="mt-4 text-[10px] leading-5 text-[#a9beb0]">
                    A live snapshot of published platform data—not a promise of geographic coverage.
                  </p>
                </div>
              </div>
              <div
                aria-hidden="true"
                className="absolute -bottom-5 -right-4 -z-10 h-28 w-36 rounded-full bg-[#e1b38e]/50 blur-2xl"
              />
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-[#e2ddd1] bg-[#fffdf8]">
        <Container className="py-7 sm:py-9">
          <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <p className="max-w-2xl text-sm leading-6 text-[#53625b]">
              <span className="font-semibold text-[#193b39]">
                A bigger mission, a familiar name.
              </span>{" "}
              AfriScout began by making opportunities easier to find across Africa. Scout extends
              that ambition: a connected way to make opportunity visible, legible and actionable
              across borders.
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#a44b31] hover:text-[#783722]"
            >
              Why Scout <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </section>

      <section className="bg-[#fffdf8] py-16 sm:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a44b31]">
                From signal to action
              </p>
              <h2 className="mt-4 max-w-md text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-[#193b39] sm:text-5xl">
                Finding it is only the beginning.
              </h2>
              <p className="mt-5 max-w-md text-base leading-7 text-[#626e65]">
                A useful network does more than collect links. Scout brings discovery, context and
                your next move into the same journey.
              </p>
              <Link
                to="/how-it-works"
                className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#a44b31] hover:text-[#783722]"
              >
                See how it works <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-[#ddd8cc] border-y border-[#ddd8cc]">
              {stages.map((stage) => {
                const Icon = stage.icon;
                return (
                  <article
                    key={stage.number}
                    className="group grid gap-3 py-5 sm:grid-cols-[3rem_1fr_auto] sm:items-center sm:gap-5 sm:py-6"
                  >
                    <span className="font-mono text-xs text-[#b35c3d]">{stage.number}</span>
                    <div className="flex items-start gap-4">
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f3f0e7] text-[#315e53] transition-colors group-hover:bg-[#e9ddc9]">
                        <Icon aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#193b39]">
                          {stage.title}
                        </h3>
                        <p className="mt-1 max-w-lg text-sm leading-6 text-[#68736b]">
                          {stage.description}
                        </p>
                      </div>
                    </div>
                    <ArrowDownRight
                      aria-hidden="true"
                      className="hidden h-5 w-5 text-[#b9b7a9] transition-transform group-hover:translate-x-1 group-hover:translate-y-1 group-hover:text-[#a44b31] sm:block"
                    />
                  </article>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      <section className="overflow-hidden bg-[#eae6dc] py-14 sm:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a44b31]">
                A network, not a single lane
              </p>
              <h2 className="mt-4 max-w-lg text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-[#193b39] sm:text-5xl">
                Different paths.
                <br />
                One place to start.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-[#5d6961]">
                Explore opportunities across work, enterprise, education and impact. Start broad,
                then narrow in on the details that matter to you.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {opportunityCategories.slice(0, 6).map((category, index) => (
                <Link
                  key={category.value}
                  to={`/explore?category=${encodeURIComponent(category.value)}`}
                  className={`group flex min-h-28 flex-col justify-between rounded-xl border p-4 transition-all hover:-translate-y-0.5 ${
                    index === 0
                      ? "border-[#173c3b] bg-[#173c3b] text-[#f7f2e7] hover:bg-[#245650]"
                      : "border-[#d3cdbf] bg-[#f7f4ec] text-[#193b39] hover:border-[#a44b31]"
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-[0.14em] ${index === 0 ? "text-[#e8b08b]" : "text-[#9a5840]"}`}
                  >
                    {category.group}
                  </span>
                  <span className="flex items-end justify-between gap-2 text-sm font-semibold">
                    {category.label}
                    <ArrowUpRight
                      aria-hidden="true"
                      className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${index === 0 ? "text-[#e8b08b]" : "text-[#a44b31]"}`}
                    />
                  </span>
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#a44b31] hover:text-[#783722]"
            >
              Explore every category <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </section>

      <section className="bg-[#fffdf8] py-16 sm:py-24">
        <Container>
          <div className="grid overflow-hidden rounded-[1.5rem] bg-[#193b39] text-[#f6f1e5] lg:grid-cols-[1fr_0.68fr]">
            <div className="relative p-7 sm:p-10 lg:p-14">
              <div
                aria-hidden="true"
                className="absolute -right-14 -top-24 h-64 w-64 rounded-full border border-[#55776a]/50"
              />
              <div
                aria-hidden="true"
                className="absolute -right-2 -top-12 h-40 w-40 rounded-full border border-[#55776a]/50"
              />
              <p className="relative text-[11px] font-bold uppercase tracking-[0.2em] text-[#e8b08b]">
                Trust that can travel
              </p>
              <h2 className="relative mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">
                The next layer is identity and reputation—not another badge.
              </h2>
              <p className="relative mt-5 max-w-xl text-sm leading-7 text-[#d0dacf] sm:text-base">
                Scout is building toward portable identity and reputation, with Solana-backed trust
                as an emerging part of that direction. It is a future layer for the network—not a
                claim that today’s opportunity listings have been verified on-chain.
              </p>
            </div>
            <div className="flex flex-col justify-between border-t border-[#55776a]/60 bg-[#214744] p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
              <div>
                <span className="grid h-11 w-11 place-items-center rounded-full border border-[#648273] bg-[#28534b]">
                  <ShieldCheck aria-hidden="true" className="h-5 w-5 text-[#e8b08b]" />
                </span>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#e8b08b]">
                  What matters now
                </p>
                <p className="mt-2 text-lg font-medium leading-7 text-[#f7f2e7]">
                  Clear source context. Better fit. A more confident next step.
                </p>
              </div>
              <Link
                to="/how-it-works"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#f4bc97] hover:text-white"
              >
                Explore the approach <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-[#e1dccf] bg-[#f3f0e7] py-12 sm:py-16">
        <Container>
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a44b31]">
                A live view, not a static directory
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#193b39] sm:text-4xl">
                What’s moving right now
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#647067]">
                Public platform totals update as opportunities are published and deadlines approach.
              </p>
            </div>
            <Link
              to="/explore"
              className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#a44b31] hover:text-[#783722]"
            >
              Browse live opportunities <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-1 border-y border-[#d7d1c4] sm:grid-cols-3">
            {[
              { label: "Published opportunities", value: totals?.opportunitiesPublished },
              { label: "Closing soon", value: totals?.opportunitiesClosingSoon },
              { label: "Active public sources", value: totals?.sourcesActive },
            ].map((metric, index) => (
              <div
                key={metric.label}
                className={`flex items-center justify-between gap-4 py-5 sm:block sm:py-7 ${index > 0 ? "border-t border-[#d7d1c4] sm:border-l sm:border-t-0 sm:pl-7" : ""}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#69756c]">
                  {metric.label}
                </p>
                <p className="font-mono text-3xl tracking-[-0.04em] text-[#193b39] sm:mt-3 sm:text-4xl">
                  {isLoading ? (
                    <span className="inline-block h-9 w-16 animate-pulse rounded bg-[#ded8ca]" />
                  ) : (
                    formatCount(metric.value)
                  )}
                </p>
              </div>
            ))}
          </div>
          {hasError && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#765847]">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              Some live totals could not be loaded.
              <button
                type="button"
                onClick={() => {
                  void countryQuery.refetch();
                  void totalsQuery.refetch();
                }}
                className="font-semibold underline underline-offset-2 hover:text-[#a44b31]"
              >
                Retry data
              </button>
            </div>
          )}
        </Container>
      </section>

      <section className="bg-[#fffdf8] px-4 py-16 sm:px-6 sm:py-24">
        <Container>
          <div className="relative overflow-hidden rounded-[1.5rem] bg-[#d26c46] px-6 py-10 text-[#fff8ed] sm:px-10 sm:py-14">
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-28 h-80 w-80 rounded-full border border-[#f1af8d]/60"
            />
            <div
              aria-hidden="true"
              className="absolute -right-1 -top-16 h-52 w-52 rounded-full border border-[#f1af8d]/60"
            />
            <div className="relative flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ffddc4]">
                  Your next move starts here
                </p>
                <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">
                  See the field.
                  <br className="hidden sm:block" /> Find your opening.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-[#fff0df] sm:text-base">
                  Search the opportunities already in the network, then follow the details to your
                  next step.
                </p>
              </div>
              <Link
                to="/explore"
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#173c3b] px-5 text-sm font-semibold text-[#fff8ed] transition-colors hover:bg-[#245650]"
              >
                Explore opportunities <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
