import { useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  ExternalLink,
  FileSearch,
  Globe2,
  Layers3,
  ListFilter,
  LoaderCircle,
  Radar,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { SeoHead } from "../../components/common/SeoHead";
import { PageHeader } from "../../components/layout/PageHeader";
import { Alert } from "../../components/ui/Alert";
import { Badge, type BadgeTone } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { sourceDiscoveryService } from "../../services/sourceDiscovery.service";
import type {
  CandidateEvidence,
  CandidateReviewAction,
  CandidateReviewInput,
  DiscoveryInput,
  DiscoveryOverviewStats,
  DiscoveryRun,
  DiscoveryScope,
  Overview,
  SourceCandidate,
} from "../../types/sourceDiscovery";

const scopes: { value: DiscoveryScope; label: string }[] = [
  { value: "GLOBAL", label: "Global" },
  { value: "AFRICA", label: "Africa" },
  { value: "NORTH_AMERICA", label: "North America" },
  { value: "EUROPE", label: "Europe" },
  { value: "ASIA", label: "Asia" },
  { value: "SOUTH_AMERICA", label: "South America" },
  { value: "OCEANIA", label: "Oceania" },
];

const scoreLabels: {
  key: keyof NonNullable<NonNullable<SourceCandidate["metadata"]>["scores"]>;
  label: string;
}[] = [
  { key: "officialIdentity", label: "Official identity" },
  { key: "domainAuthenticity", label: "Domain authenticity" },
  { key: "relevance", label: "Opportunity relevance" },
  { key: "accessibility", label: "Accessibility" },
  { key: "updateFrequency", label: "Update frequency" },
  { key: "duplicateRisk", label: "Duplicate risk" },
  { key: "overallConfidence", label: "Overall confidence" },
];

type CandidateFilter = "ALL" | "PENDING" | "REVIEWED";
interface ReviewDialogState {
  candidate: SourceCandidate;
  action: CandidateReviewAction;
}

const terminalRunStates = new Set([
  "COMPLETED",
  "SUCCEEDED",
  "FAILED",
  "ERROR",
  "CANCELLED",
  "CANCELED",
  "ABORTED",
  "TIMED_OUT",
  "FINISHED",
  "DONE",
]);

function isRunActive(run: DiscoveryRun): boolean {
  return !terminalRunStates.has(run.status.toUpperCase());
}

function normalizedStatus(status: string): string {
  return status.toUpperCase().replace(/[\s-]+/g, "_");
}

function isPendingCandidate(candidate: SourceCandidate): boolean {
  return ![
    "APPROVED",
    "REJECTED",
    "IGNORED",
    "MERGED",
    "ACTIVATED",
    "REVIEWED",
    "KEEP_SEPARATE",
    "KEPT_SEPARATE",
    "SEPARATE",
  ].includes(normalizedStatus(candidate.status));
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatScore(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "Not assessed";
  const percent = value >= 0 && value <= 1 ? value * 100 : value;
  return `${Math.round(percent)}%`;
}

function statusTone(status: string): BadgeTone {
  const value = normalizedStatus(status);
  if (["APPROVED", "ACTIVE", "COMPLETED", "SUCCEEDED", "FINISHED", "DONE"].includes(value)) {
    return "success";
  }
  if (["FAILED", "ERROR", "REJECTED"].includes(value)) return "danger";
  if (["RUNNING", "PROCESSING", "PENDING", "QUEUED", "IN_PROGRESS"].includes(value)) {
    return "info";
  }
  if (["IGNORED", "MERGED", "CANCELLED", "CANCELED"].includes(value)) return "neutral";
  return "warning";
}

function titleCase(value: string): string {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function listMetric(value?: string[] | null): string {
  return value?.length ? value.join(", ") : "Not provided";
}

function statValue(stats: DiscoveryOverviewStats | undefined, key: keyof DiscoveryOverviewStats): number {
  return stats?.[key] ?? 0;
}

export function SourceDiscovery() {
  const queryClient = useQueryClient();
  const activeJobsRef = useRef(false);
  const selectedRunActiveRef = useRef(false);
  const [scope, setScope] = useState<DiscoveryScope>("AFRICA");
  const [minimumScore, setMinimumScore] = useState(45);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [candidateFilter, setCandidateFilter] = useState<CandidateFilter>("PENDING");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [reviewDialog, setReviewDialog] = useState<ReviewDialogState | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [mergeSourceId, setMergeSourceId] = useState("");
  const [notice, setNotice] = useState<{ tone: "success" | "info"; text: string } | null>(null);

  const overviewQuery = useQuery({
    queryKey: ["source-discovery", "overview"],
    queryFn: sourceDiscoveryService.overview,
    refetchInterval: () => (activeJobsRef.current ? 4000 : false),
  });
  const overview = overviewQuery.data as Overview | undefined;
  activeJobsRef.current = Boolean(overview?.runs.some(isRunActive));
  selectedRunActiveRef.current = Boolean(
    selectedRunId && overview?.runs.some((run) => run.id === selectedRunId && isRunActive(run)),
  );

  const runDetailQuery = useQuery({
    queryKey: ["source-discovery", "run", selectedRunId],
    queryFn: () => sourceDiscoveryService.getRun(selectedRunId as string),
    enabled: Boolean(selectedRunId),
    refetchInterval: () => (selectedRunActiveRef.current ? 4000 : false),
  });

  const createRun = useMutation({
    mutationFn: (input: DiscoveryInput) => sourceDiscoveryService.createRun(input),
    onSuccess: async (run) => {
      setNotice({
        tone: "success",
        text: "Native AI web search queued. Its saved status will update as the search and assessment progress.",
      });
      setSelectedRunId(run.id);
      await queryClient.invalidateQueries({ queryKey: ["source-discovery", "overview"] });
      await queryClient.invalidateQueries({ queryKey: ["source-discovery", "runs"] });
    },
  });

  const reviewCandidate = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CandidateReviewInput }) =>
      sourceDiscoveryService.reviewCandidate(id, input),
    onSuccess: async (_result, variables) => {
      const action = variables.input.action;
      if (action === "APPROVE") {
        setNotice({
          tone: "success",
          text: "Approved. The registry source is inactive and still requires source testing and activation.",
        });
      } else {
        setNotice({ tone: "success", text: `Candidate marked ${titleCase(action)}.` });
      }
      setReviewDialog(null);
      setReviewNotes("");
      setMergeSourceId("");
      await queryClient.invalidateQueries({ queryKey: ["source-discovery", "overview"] });
      await queryClient.invalidateQueries({ queryKey: ["source-discovery", "candidates"] });
      await queryClient.invalidateQueries({ queryKey: ["source-discovery", "run"] });
    },
  });

  const candidates = overview?.candidates ?? [];
  const filteredCandidates = useMemo(() => {
    const query = candidateSearch.trim().toLowerCase();
    return candidates.filter((candidate) => {
      const pending = isPendingCandidate(candidate);
      const statusMatch =
        candidateFilter === "ALL" ||
        (candidateFilter === "PENDING" && pending) ||
        (candidateFilter === "REVIEWED" && !pending);
      const searchMatch =
        !query ||
        [candidate.name, candidate.url, candidate.countryCode, candidate.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      return statusMatch && searchMatch;
    });
  }, [candidates, candidateFilter, candidateSearch]);

  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedCandidateId) ?? filteredCandidates[0] ?? null;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    createRun.mutate({
      scope,
      minimumScore: Number(minimumScore),
    });
  }

  function beginReview(candidate: SourceCandidate, action: CandidateReviewAction) {
    setReviewNotes("");
    setMergeSourceId(candidate.metadata?.duplicateSourceId ?? "");
    setReviewDialog({ candidate, action });
  }

  function confirmReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewDialog) return;
    const input: CandidateReviewInput = {
      action: reviewDialog.action,
      ...(reviewNotes.trim() ? { notes: reviewNotes.trim() } : {}),
      ...(reviewDialog.action === "MERGE" ? { mergeSourceId: mergeSourceId.trim() } : {}),
    };
    reviewCandidate.mutate({ id: reviewDialog.candidate.id, input });
  }

  const statCards: { key: keyof DiscoveryOverviewStats; label: string; icon: typeof Radar; detail: string }[] = [
    { key: "sourcesDiscovered", label: "Discovered", icon: Radar, detail: "All-time candidates" },
    { key: "pendingReview", label: "Awaiting review", icon: Clock3, detail: "Human decision needed" },
    { key: "approved", label: "Approved", icon: ShieldCheck, detail: "Not yet verified" },
    { key: "active", label: "Active sources", icon: Activity, detail: "In the registry" },
    { key: "needsAttention", label: "Needs attention", icon: AlertTriangle, detail: "Review or test required" },
  ];

  return (
    <>
      <SeoHead title="Source discovery" />
      <PageHeader
        title="Source discovery"
        description="Find public opportunity publishers, inspect the evidence, then decide what belongs in the registry."
      />

      <main className="space-y-6 pb-10">
        <section className="relative overflow-hidden rounded-2xl bg-[#173d3a] px-5 py-6 text-[#f3f1e8] shadow-sm sm:px-7">
          <div className="absolute -right-12 -top-24 h-64 w-64 rounded-full border border-[#82b2a1]/20" />
          <div className="absolute -right-1 top-[-5.5rem] h-56 w-56 rounded-full border border-[#82b2a1]/15" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.17em] text-[#a9d1bf]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#a9d1bf]" />
                Intelligence / discovery desk
              </div>
              <h2 className="max-w-xl text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-3xl">
                Find the signal.
                <span className="font-normal text-[#b6d1c7]"> Keep the decision human.</span>
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#d0ddd6]">
                Search results are leads, not verified sources. Scout uses AI when a real provider is configured and rules otherwise; neither replaces source testing.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-[#e0e9e4]">
              <ShieldCheck className="h-4 w-4 text-[#a9d1bf]" />
              Human review stays in control
            </div>
          </div>
        </section>

        {notice ? (
          <div className="flex items-start justify-between gap-4 rounded-xl border border-[#bbd8c9] bg-[#eff7f1] px-4 py-3 text-sm text-[#245344]">
            <div className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{notice.text}</p>
            </div>
            <button type="button" className="rounded p-1 hover:bg-[#dceee2]" aria-label="Dismiss notice" onClick={() => setNotice(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {overviewQuery.isError ? (
          <Alert
            tone="danger"
            title="Discovery workspace could not load"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>Check your connection and retry. Existing job and candidate records have not been changed.</span>
              <button type="button" onClick={() => overviewQuery.refetch()} className="font-semibold underline underline-offset-2">
                Retry overview
              </button>
            </div>
          </Alert>
        ) : null}

        {overviewQuery.isLoading ? (
          <div className="rounded-xl border border-[#d9e3dc] bg-[#fbfcf8] p-6">
            <div aria-label="Loading source discovery" role="status" className="animate-pulse space-y-5">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="h-24 rounded-xl bg-[#e9efe8]" />
                ))}
              </div>
              <div className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
                <div className="h-[420px] rounded-2xl bg-[#e9efe8]" />
                <div className="h-[420px] rounded-2xl bg-[#e9efe8]" />
              </div>
              <div className="h-44 rounded-2xl bg-[#e9efe8]" />
            </div>
          </div>
        ) : (
          <>
            <section aria-label="Discovery overview" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.key} className="rounded-xl border border-[#dce4dd] bg-[#fbfcf8] p-4 transition-transform duration-200 hover:-translate-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[#65786e]">{stat.label}</span>
                      <Icon className="h-4 w-4 text-[#62877a]" />
                    </div>
                    <div className="mt-3 font-mono text-2xl font-semibold tracking-tight text-[#203e35]">
                      {statValue(overview?.stats, stat.key).toLocaleString()}
                    </div>
                    <p className="mt-1 text-[11px] text-[#85938b]">{stat.detail}</p>
                  </div>
                );
              })}
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(330px,0.82fr)_minmax(0,1.18fr)]">
              <div className="rounded-2xl border border-[#dce4dd] bg-[#fbfcf8] shadow-sm">
                <div className="border-b border-[#e4eae4] px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e7f0e9] text-[#3e6c5c]">
                      <Search className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-[#263f36]">Configure a search</h2>
                      <p className="mt-0.5 text-xs text-[#7b8980]">Scope the public web crawl</p>
                    </div>
                  </div>
                </div>
                <form onSubmit={submitSearch} className="space-y-4 p-5">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-[#45594f]">Search scope</span>
                    <select
                      value={scope}
                      onChange={(event) => setScope(event.target.value as DiscoveryScope)}
                      className="h-10 w-full rounded-lg border border-[#cdd9d0] bg-white px-3 text-sm text-[#294238] outline-none transition focus:border-[#658b79] focus:ring-2 focus:ring-[#8db19f]/20"
                    >
                      {scopes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </label>
                  <div className="rounded-xl border border-[#dce8df] bg-[#f3f8f4] p-3.5">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#39785f]" />
                      <div>
                        <p className="text-xs font-semibold text-[#304a3c]">AI selects what to look for</p>
                        <p className="mt-1 text-xs leading-5 text-[#65786b]">
                          Scout identifies countries, opportunity categories, and publisher types from each result. You only choose a search region.
                        </p>
                      </div>
                    </div>
                  </div>
                  <label className="block">
                    <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-[#45594f]">
                      Minimum assessment score
                      <span className="font-mono text-[#4f7666]">{minimumScore}</span>
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={minimumScore}
                      onChange={(event) => setMinimumScore(Number(event.target.value))}
                      className="h-2 w-full cursor-pointer accent-[#477663]"
                    />
                    <span className="mt-1 flex justify-between text-[10px] text-[#87958d]">
                      <span>Broader discovery</span>
                      <span>Higher confidence filter</span>
                    </span>
                  </label>
                  {createRun.isError ? (
                    <p role="alert" className="rounded-lg border border-[#eed0c9] bg-[#fff4f1] px-3 py-2 text-xs text-[#9d4433]">
                      {createRun.error instanceof Error ? createRun.error.message : "Search could not be started. Review the inputs and try again."}
                    </p>
                  ) : null}
                  <Button
                    type="submit"
                    loading={createRun.isPending}
                    leftIcon={<Radar className="h-4 w-4" />}
                    fullWidth
                    className="!bg-[#285747] hover:!bg-[#1d483a]"
                  >
                    Start discovery search
                  </Button>
                  <p className="text-[11px] leading-4 text-[#8a968e]">
                    This filters automated assessments only; it does not confirm publisher identity or source health.
                  </p>
                </form>
              </div>

              <div className="min-w-0 rounded-2xl border border-[#dce4dd] bg-[#fbfcf8] shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4eae4] px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4eedf] text-[#967946]">
                      <FileSearch className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-[#263f36]">Source candidates</h2>
                      <p className="mt-0.5 text-xs text-[#7b8980]">{filteredCandidates.length} records in this view</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => overviewQuery.refetch()}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#537161] hover:bg-[#edf3ed]"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </button>
                </div>

                <div className="flex flex-col gap-3 border-b border-[#e8ede8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-1 rounded-lg bg-[#edf2ec] p-1">
                    {([
                      ["PENDING", "To review"],
                      ["ALL", "All candidates"],
                      ["REVIEWED", "Reviewed"],
                    ] as [CandidateFilter, string][]).map(([key, label]) => (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setCandidateFilter(key)}
                        className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          candidateFilter === key ? "bg-white text-[#294b3b] shadow-sm" : "text-[#74847a] hover:text-[#345443]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <label className="relative block sm:w-52">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8c9990]" />
                    <input
                      value={candidateSearch}
                      onChange={(event) => setCandidateSearch(event.target.value)}
                      placeholder="Find a candidate"
                      className="h-8 w-full rounded-md border border-[#d8e1da] bg-white pl-8 pr-2 text-xs text-[#294238] outline-none focus:border-[#719580]"
                    />
                  </label>
                </div>

                {overviewQuery.isError ? (
                  <div className="p-7">
                    <EmptyState
                      icon={<CircleHelp className="h-6 w-6" />}
                      title="Candidate records unavailable"
                      description="Retry the overview request to load persisted discovery results."
                    />
                  </div>
                ) : filteredCandidates.length === 0 ? (
                  <div className="p-7">
                    <EmptyState
                      icon={<FileSearch className="h-6 w-6" />}
                      title={candidates.length === 0 ? "No candidates discovered yet" : "No candidates match this view"}
                      description={
                        candidates.length === 0
                          ? "Start a discovery search. Results will appear here after the job finds public sources."
                          : "Change the review filter or search term to see other candidates."
                      }
                    />
                  </div>
                ) : (
                  <div className="grid min-h-[380px] md:grid-cols-[minmax(0,0.92fr)_minmax(310px,1.08fr)]">
                    <div className="max-h-[650px] divide-y divide-[#edf0eb] overflow-y-auto">
                      {filteredCandidates.map((candidate) => (
                        <button
                          type="button"
                          key={candidate.id}
                          onClick={() => setSelectedCandidateId(candidate.id)}
                          className={`block w-full px-4 py-4 text-left transition-colors hover:bg-[#f2f6f0] ${
                            selectedCandidate?.id === candidate.id ? "bg-[#eef5ef] shadow-[inset_3px_0_0_#477663]" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 truncate text-sm font-semibold text-[#2c4439]">{candidate.name}</p>
                            <Badge tone={statusTone(candidate.status)}>{titleCase(candidate.status)}</Badge>
                          </div>
                          <p className="mt-1 truncate text-xs text-[#75857a]">{candidate.url}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#75857a]">
                            <span>{candidate.countryCode || "Country unknown"}</span>
                            <span className="h-1 w-1 rounded-full bg-[#bcc7be]" />
                            <span>{candidate.category || "Category not set"}</span>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-[10px] text-[#98a39c]">Added {formatDate(candidate.createdAt)}</span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#618171]">
                              Assessment {formatScore(candidate.metadata?.scores?.overallConfidence ?? candidate.metadata?.confidence)}
                              <ChevronRight className="h-3 w-3" />
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedCandidate ? (
                      <CandidateDetail
                        candidate={selectedCandidate}
                        reviewPending={reviewCandidate.isPending}
                        onReview={beginReview}
                      />
                    ) : null}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-[#dce4dd] bg-[#fbfcf8] shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b border-[#e4eae4] px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers3 className="h-4 w-4 text-[#658575]" />
                    <h2 className="text-sm font-semibold text-[#263f36]">Persisted search history</h2>
                  </div>
                  <p className="mt-1 text-xs text-[#7b8980]">Saved discovery jobs and their current run state.</p>
                </div>
                {activeJobsRef.current ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#537864]">
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    Monitoring active jobs
                  </span>
                ) : null}
              </div>
              {(overview?.runs ?? []).length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={<Clock3 className="h-6 w-6" />}
                    title="No saved searches"
                    description="When you start a search, its persisted job and progress will be listed here."
                  />
                </div>
              ) : (
                <div className="divide-y divide-[#edf0eb]">
                  {(overview?.runs ?? []).map((run) => {
                    const selected = selectedRunId === run.id;
                    return (
                      <div key={run.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedRunId(selected ? null : run.id)}
                          className="flex w-full flex-wrap items-center gap-3 px-5 py-3.5 text-left hover:bg-[#f4f7f2]"
                        >
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isRunActive(run) ? "bg-[#e5f0e8] text-[#4e7c65]" : "bg-[#edf0eb] text-[#819087]"}`}>
                            {isRunActive(run) ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Globe2 className="h-4 w-4" />}
                          </span>
                          <span className="min-w-[150px] flex-1">
                            <span className="block text-xs font-semibold text-[#31483d]">{scopes.find((item) => item.value === run.scope)?.label ?? titleCase(run.scope)} search</span>
                            <span className="mt-0.5 block text-[11px] text-[#89958d]">{formatDate(run.createdAt)}</span>
                          </span>
                          <span className="hidden max-w-[260px] truncate text-xs text-[#76847b] sm:block">
                            {run.categories?.length ? run.categories.join(", ") : "All opportunity categories"}
                          </span>
                          <span className="font-mono text-xs text-[#597566]">{run.resultCount ?? 0} results</span>
                          <Badge tone={statusTone(run.status)}>{titleCase(run.status)}</Badge>
                          {selected ? <ChevronDown className="h-4 w-4 text-[#7c8c80]" /> : <ChevronRight className="h-4 w-4 text-[#7c8c80]" />}
                        </button>
                        {selected ? (
                          <div className="border-t border-[#edf0eb] bg-[#f5f8f3] px-5 py-4">
                            {run.errorMessage ? (
                              <p className="mb-3 rounded-md bg-[#fff1ed] px-3 py-2 text-xs text-[#994b3d]">{run.errorMessage}</p>
                            ) : null}
                            <div className="grid gap-3 text-xs sm:grid-cols-3">
                              <RunDetail label="Last updated" value={formatDate(run.updatedAt)} />
                              <RunDetail label="Queries" value={run.queries?.length ? run.queries.join(" · ") : "No query details returned"} />
                            </div>
                            {runDetailQuery.isFetching && runDetailQuery.data?.id === run.id ? (
                              <p className="mt-3 text-[11px] text-[#819087]">Refreshing persisted run details…</p>
                            ) : null}
                            {runDetailQuery.isError && selectedRunId === run.id ? (
                              <button type="button" onClick={() => runDetailQuery.refetch()} className="mt-3 text-xs font-medium text-[#49735d] hover:underline">
                                Could not load run details. Retry.
                              </button>
                            ) : null}
                            {runDetailQuery.data?.id === run.id && runDetailQuery.data.candidates?.length ? (
                              <p className="mt-3 text-xs text-[#60766a]">
                                This run returned {runDetailQuery.data.candidates.length} candidate{runDetailQuery.data.candidates.length === 1 ? "" : "s"}.
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
              {overviewQuery.isError ? (
                <div className="flex justify-end border-t border-[#edf0eb] px-5 py-3">
                  <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => overviewQuery.refetch()}>
                    Retry loading history
                  </Button>
                </div>
              ) : null}
            </section>
          </>
        )}
      </main>

      {reviewDialog ? (
        <ReviewDialog
          state={reviewDialog}
          notes={reviewNotes}
          mergeSourceId={mergeSourceId}
          pending={reviewCandidate.isPending}
          error={reviewCandidate.isError}
          onNotesChange={setReviewNotes}
          onMergeSourceIdChange={setMergeSourceId}
          onClose={() => {
            setReviewDialog(null);
            reviewCandidate.reset();
          }}
          onSubmit={confirmReview}
        />
      ) : null}
    </>
  );
}

function RunDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#8b988f]">{label}</span>
      <span className="mt-1 block break-words leading-5 text-[#50695b]">{value}</span>
    </div>
  );
}

function CandidateDetail({
  candidate,
  reviewPending,
  onReview,
}: {
  candidate: SourceCandidate;
  reviewPending: boolean;
  onReview: (candidate: SourceCandidate, action: CandidateReviewAction) => void;
}) {
  const metadata = candidate.metadata;
  const score = metadata?.scores?.overallConfidence ?? metadata?.confidence;
  const isPending = isPendingCandidate(candidate);
  const duplicateName = metadata?.duplicateSourceName;
  const duplicateId = metadata?.duplicateSourceId;
  const duplicateSimilarity = metadata?.duplicateSimilarity;
  const evidence = metadata?.evidence ?? [];
  const concerns = metadata?.concerns ?? [];
  const isAiAssessment = metadata?.analysisMode === "AI_ASSESSMENT";

  return (
    <aside className="border-t border-[#e8ede8] bg-[#f7f9f5] p-4 md:max-h-[650px] md:overflow-y-auto md:border-l md:border-t-0 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-[#273f35]">{candidate.name}</h3>
            <Badge tone={statusTone(candidate.status)}>{titleCase(candidate.status)}</Badge>
          </div>
          <a
            href={candidate.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-[#517863] hover:underline"
          >
            <span className="truncate">{candidate.url}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        </div>
        <span className="shrink-0 rounded-md bg-[#e9f0e8] px-2 py-1 font-mono text-[10px] text-[#577a65]">
          {isAiAssessment ? "AI" : "Screen"} {formatScore(score)}
        </span>
      </div>

      <div className="mt-4 rounded-lg border border-[#d9e4da] bg-[#eff5ef] p-3">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#76894a]" />
          <div>
            <p className="text-[11px] font-semibold text-[#4e644a]">AI assessment is not Scout verification</p>
            <p className="mt-1 text-[10px] leading-4 text-[#74816d]">
              Confidence summarizes available evidence. Publisher identity and operational health still need human review and source testing.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        <DetailField label="Country" value={candidate.countryCode || "Not identified"} />
        <DetailField label="Category" value={candidate.category || "Not classified"} />
        <DetailField label="Organization" value={metadata?.organization || "Not identified"} />
        <DetailField label="Region" value={metadata?.region || "Not identified"} />
        <DetailField label="Source type" value={metadata?.sourceType || listMetric(metadata?.sourceTypes)} />
        <DetailField label="Analysis mode" value={metadata?.analysisMode || "Not provided"} />
      </div>

      {metadata?.recommendation || metadata?.rationale || candidate.notes ? (
        <div className="mt-4 rounded-lg border border-[#e1e7df] bg-white p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[#849187]">Analysis</div>
          {metadata?.recommendation ? <p className="mt-2 text-xs font-semibold text-[#395849]">{metadata.recommendation}</p> : null}
          <p className="mt-1 text-xs leading-5 text-[#66766b]">{metadata?.rationale || candidate.notes}</p>
          {metadata?.searchQuery ? (
            <p className="mt-2 text-[10px] text-[#8a968e]">Search query: <span className="text-[#5e7467]">{metadata.searchQuery}</span></p>
          ) : null}
        </div>
      ) : null}
      {metadata?.searchSnippet ? (
        <div className="mt-3 rounded-lg border-l-2 border-[#9eb89d] bg-[#f0f4ed] px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#83917f]">Search result snippet</p>
          <p className="mt-1 text-xs leading-5 text-[#647566]">{metadata.searchSnippet}</p>
        </div>
      ) : null}

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#66776b]">Quality metrics</h4>
          <span className="text-[10px] text-[#929d94]">{isAiAssessment ? "AI-derived estimates" : "Rule-based estimates"}</span>
        </div>
        <div className="space-y-2 rounded-lg border border-[#e1e7df] bg-white p-3">
          {scoreLabels.map((metric) => {
            const value = metadata?.scores?.[metric.key];
            const percent = value === undefined || value === null ? null : Math.max(0, Math.min(100, value <= 1 ? value * 100 : value));
            return (
              <div key={metric.key}>
                <div className="flex items-center justify-between gap-3 text-[10px]">
                  <span className="text-[#758278]">{metric.label}</span>
                  <span className={`font-mono ${percent === null ? "text-[#a0aaa1]" : "text-[#486d59]"}`}>{formatScore(value)}</span>
                </div>
                {percent !== null ? (
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#e9eee8]">
                    <div className="h-full rounded-full bg-[#83a88e] transition-[width] duration-300" style={{ width: `${percent}%` }} />
                  </div>
                ) : null}
              </div>
            );
          })}
          <p className="border-t border-[#edf0eb] pt-2 text-[10px] text-[#929c93]">A missing score means evidence was unavailable, not a zero score.</p>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#66776b]">Evidence</h4>
        {evidence.length ? (
          <ul className="space-y-2">
            {evidence.map((item, index) => {
              const entry: CandidateEvidence = typeof item === "string" ? { detail: item } : item;
              const link = typeof entry.url === "string" ? entry.url : undefined;
              return (
                <li key={`${entry.label ?? entry.type ?? "evidence"}-${index}`} className="rounded-lg border border-[#e1e7df] bg-white px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-medium text-[#52695b]">{entry.label || entry.type || `Evidence ${index + 1}`}</p>
                    {link ? (
                      <a href={link} target="_blank" rel="noreferrer" className="shrink-0 text-[#648472] hover:text-[#335944]" aria-label="Open evidence link">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                  {entry.detail || entry.snippet ? <p className="mt-1 text-[10px] leading-4 text-[#78867b]">{entry.detail || entry.snippet}</p> : null}
                  {link ? <p className="mt-1 truncate text-[10px] text-[#8d9a8f]">{link}</p> : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-[#d5dfd5] px-3 py-3 text-[11px] text-[#8a968e]">No evidence records were returned for this candidate.</p>
        )}
      </div>

      {concerns.length ? (
        <div className="mt-4 rounded-lg border border-[#ebdfc7] bg-[#fcf8ef] p-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-wide text-[#8b744b]">Concerns to review</h4>
          <ul className="mt-2 space-y-1.5">
            {concerns.map((concern, index) => {
              const text = typeof concern === "string" ? concern : concern.detail || concern.label || concern.type || "Unspecified concern";
              return <li key={`${text}-${index}`} className="flex gap-2 text-[10px] leading-4 text-[#7d704f]"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#b99a5c]" />{text}</li>;
            })}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 rounded-lg border border-[#e1e7df] bg-white p-3">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#77877c]">
          <ListFilter className="h-3 w-3" />
          Duplicate assessment
        </div>
        {duplicateName || duplicateId ? (
          <div className="mt-2">
            <p className="text-xs font-medium text-[#52695b]">{duplicateName || "Possible matching source"}</p>
            {duplicateId ? <p className="mt-0.5 break-all font-mono text-[10px] text-[#8b978e]">Source ID · {duplicateId}</p> : null}
            <p className="mt-1 text-[10px] text-[#7c887e]">
              Similarity {formatScore(duplicateSimilarity)}{metadata?.duplicateDecision ? ` · ${titleCase(metadata.duplicateDecision)}` : ""}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-[10px] text-[#929c93]">No duplicate match was returned. This is not proof that no duplicate exists.</p>
        )}
      </div>

      {metadata?.verificationStatus || candidate.reviewNotes ? (
        <div className="mt-3 space-y-2 rounded-lg bg-[#eef2ed] px-3 py-2.5">
          {metadata?.verificationStatus ? <p className="text-[10px] text-[#718078]">Verification state: <span className="font-medium text-[#52685c]">{titleCase(metadata.verificationStatus)}</span></p> : null}
          {candidate.reviewNotes ? <p className="text-[10px] leading-4 text-[#718078]">Review note: {candidate.reviewNotes}</p> : null}
        </div>
      ) : null}

      <div className="mt-4 border-t border-[#e2e9e1] pt-4">
        {isPending ? (
          <>
            <p className="mb-2 text-[10px] text-[#88958c]">Human review actions. Approval creates a registry source that remains inactive until source testing succeeds.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" disabled={reviewPending} onClick={() => onReview(candidate, "APPROVE")} leftIcon={<ShieldCheck className="h-3.5 w-3.5" />} className="!bg-[#35654e] hover:!bg-[#284f3d]">
                Approve
              </Button>
              <Button size="sm" variant="danger" disabled={reviewPending} onClick={() => onReview(candidate, "REJECT")}>
                Reject
              </Button>
              <Button size="sm" variant="outline" disabled={reviewPending} onClick={() => onReview(candidate, "KEEP_SEPARATE")}>
                Keep separate
              </Button>
              <Button size="sm" variant="outline" disabled={reviewPending} onClick={() => onReview(candidate, "MERGE")}>
                Merge
              </Button>
              <Button size="sm" variant="ghost" disabled={reviewPending} onClick={() => onReview(candidate, "IGNORE")} className="col-span-2">
                Ignore candidate
              </Button>
            </div>
          </>
        ) : (
          <p className="flex items-center gap-2 text-xs text-[#6f8175]">
            <Check className="h-4 w-4 text-[#679073]" />
            Human review recorded as {titleCase(candidate.status)}.
          </p>
        )}
      </div>
    </aside>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-[#929d94]">{label}</p>
      <p className="mt-0.5 truncate text-[11px] text-[#596f61]" title={value}>{value}</p>
    </div>
  );
}

function ReviewDialog({
  state,
  notes,
  mergeSourceId,
  pending,
  error,
  onNotesChange,
  onMergeSourceIdChange,
  onClose,
  onSubmit,
}: {
  state: ReviewDialogState;
  notes: string;
  mergeSourceId: string;
  pending: boolean;
  error: boolean;
  onNotesChange: (value: string) => void;
  onMergeSourceIdChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const action = state.action;
  const destructive = action === "APPROVE" || action === "REJECT" || action === "MERGE";
  const requiresMergeId = action === "MERGE";
  const actionCopy: Record<CandidateReviewAction, { title: string; description: string; button: string }> = {
    APPROVE: {
      title: "Approve this candidate?",
      description: "This creates a registry source in an inactive state. Source testing must succeed before the source can be activated and Apify can collect opportunities.",
      button: "Confirm approval",
    },
    REJECT: {
      title: "Reject this candidate?",
      description: "The candidate will be marked rejected in the discovery review record.",
      button: "Confirm rejection",
    },
    IGNORE: {
      title: "Ignore this candidate?",
      description: "The candidate will be marked ignored and removed from the pending review queue.",
      button: "Confirm ignore",
    },
    KEEP_SEPARATE: {
      title: "Keep this candidate separate?",
      description: "Record that this candidate should remain separate from the possible matching source.",
      button: "Keep separate",
    },
    MERGE: {
      title: "Merge with an existing source?",
      description: "Confirm the registry source ID that should receive this candidate match.",
      button: "Confirm merge",
    },
  };
  const copy = actionCopy[action];
  const confirmDisabled = pending || (requiresMergeId && !mergeSourceId.trim());

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[#1c3229]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-dialog-title"
        onSubmit={onSubmit}
        className="w-full max-w-lg rounded-t-2xl border border-[#dce4dd] bg-[#fbfcf8] p-5 shadow-2xl sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${destructive ? "bg-[#f8e8df] text-[#a65c43]" : "bg-[#e8f0e8] text-[#527461]"}`}>
              {action === "APPROVE" ? <ShieldCheck className="h-4 w-4" /> : action === "MERGE" ? <Layers3 className="h-4 w-4" /> : <FileSearch className="h-4 w-4" />}
            </div>
            <h2 id="review-dialog-title" className="text-base font-semibold text-[#293f35]">{copy.title}</h2>
            <p className="mt-1 text-xs leading-5 text-[#75837a]">{copy.description}</p>
          </div>
          <button type="button" onClick={onClose} disabled={pending} aria-label="Close review dialog" className="rounded-md p-1.5 text-[#7d8a80] hover:bg-[#edf1eb]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-[#e2e8e1] bg-white px-3 py-2.5">
          <p className="truncate text-xs font-semibold text-[#3d5547]">{state.candidate.name}</p>
          <p className="mt-1 truncate text-[10px] text-[#89958c]">{state.candidate.url}</p>
        </div>

        {requiresMergeId ? (
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-medium text-[#4d6255]">Existing source ID <span className="text-[#ae6046]">Required</span></span>
            <input
              value={mergeSourceId}
              onChange={(event) => onMergeSourceIdChange(event.target.value)}
              required
              placeholder="Paste the registry source ID"
              className="h-10 w-full rounded-lg border border-[#cdd9d0] bg-white px-3 text-sm text-[#294238] outline-none focus:border-[#658b79] focus:ring-2 focus:ring-[#8db19f]/20"
            />
          </label>
        ) : null}

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-medium text-[#4d6255]">Review note <span className="font-normal text-[#99a39b]">Optional</span></span>
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={3}
            placeholder="Add context for the review record"
            className="w-full resize-y rounded-lg border border-[#cdd9d0] bg-white px-3 py-2 text-sm text-[#294238] outline-none placeholder:text-[#a5afa8] focus:border-[#658b79] focus:ring-2 focus:ring-[#8db19f]/20"
          />
        </label>
        {action === "APPROVE" ? (
          <p className="mt-3 rounded-lg border border-[#dce8dc] bg-[#f0f6ef] px-3 py-2 text-[11px] leading-4 text-[#617568]">
            Approval is not activation. Scout will not use this source until it is tested and activated separately.
          </p>
        ) : null}
        {error ? <p role="alert" className="mt-3 text-xs text-[#a44e3b]">Review update failed. No decision was recorded. Please retry.</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={pending} onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            size="sm"
            variant={action === "REJECT" ? "danger" : "primary"}
            loading={pending}
            disabled={confirmDisabled}
            className={action === "APPROVE" ? "!bg-[#35654e] hover:!bg-[#284f3d]" : ""}
          >
            {copy.button}
          </Button>
        </div>
      </form>
    </div>
  );
}
