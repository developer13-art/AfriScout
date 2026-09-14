import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Container } from "../../components/layout/Container";
import { BackButton } from "../../components/common/BackButton";
import { OpportunityDetailHeader } from "../../components/opportunities/OpportunityDetailHeader";
import { OpportunityRequirements } from "../../components/opportunities/OpportunityRequirements";
import { OpportunityDocuments } from "../../components/opportunities/OpportunityDocuments";
import { OpportunityEligibility } from "../../components/opportunities/OpportunityEligibility";
import { OpportunityTimeline } from "../../components/opportunities/OpportunityTimeline";
import { OpportunitySourcePanel } from "../../components/opportunities/OpportunitySourcePanel";
import { OpportunityChangeHistory } from "../../components/opportunities/OpportunityChangeHistory";
import { OpportunityActionsBar } from "../../components/opportunities/OpportunityActionsBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/Tabs";
import { Loader } from "../../components/ui/Loader";
import { ErrorState } from "../../components/ui/ErrorState";
import { AiSummaryCard } from "../../components/ai/AiSummaryCard";
import { AiAnalystPanel } from "../../components/ai/AiAnalystPanel";
import { Button } from "../../components/ui/Button";
import { SeoHead } from "../../components/common/SeoHead";
import { opportunityService } from "../../services/opportunity.service";
import { aiService } from "../../services/ai.service";
import { useMatches } from "../../hooks/useMatches";
import { useSaved } from "../../hooks/useSaved";
import { useWatchlist } from "../../hooks/useWatchlist";
import { usePipeline } from "../../hooks/usePipeline";
import { useAuthStore } from "../../stores/authStore";

export function OpportunityDetails() {
  const { slug } = useParams<{ slug: string }>();
  const user = useAuthStore((s) => s.user);
  const [aiSummary, setAiSummary] = useState<Awaited<ReturnType<typeof aiService.summary>> | null>(null);
  const [aiAnalyst, setAiAnalyst] = useState<Awaited<ReturnType<typeof aiService.analyst>> | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiAnalystLoading, setAiAnalystLoading] = useState(false);

  const query = useQuery({
    queryKey: ["opportunity", slug],
    queryFn: () => (slug ? opportunityService.get(slug) : null),
    enabled: Boolean(slug),
  });

  const requirementsQuery = useQuery({
    queryKey: ["opportunity", slug, "requirements"],
    queryFn: () => opportunityService.requirements(query.data?.id ?? ""),
    enabled: Boolean(query.data?.id),
  });

  const documentsQuery = useQuery({
    queryKey: ["opportunity", slug, "documents"],
    queryFn: () => opportunityService.documents(query.data?.id ?? ""),
    enabled: Boolean(query.data?.id),
  });

  const sourcesQuery = useQuery({
    queryKey: ["opportunity", slug, "sources"],
    queryFn: () => opportunityService.sources(query.data?.id ?? ""),
    enabled: Boolean(query.data?.id),
  });

  const changesQuery = useQuery({
    queryKey: ["opportunity", slug, "changes"],
    queryFn: () => opportunityService.changes(query.data?.id ?? ""),
    enabled: Boolean(query.data?.id),
  });

  const matches = useMatches();
  const saved = useSaved();
  const watchlist = useWatchlist();
  const pipeline = usePipeline();

  const match = matches.data?.matches.find(
    (m) => m.opportunityId === query.data?.id,
  );

  const savedSet = new Set((saved.data ?? []).map((s) => s.opportunityId));
  const watchedSet = new Set((watchlist.data ?? []).map((w) => w.opportunityId));
  const pipelineSet = new Set((pipeline.data ?? []).map((p) => p.opportunityId));

  const runSummary = async () => {
    if (!query.data?.id) return;
    setAiSummaryLoading(true);
    try {
      const result = await aiService.summary(query.data.id);
      setAiSummary(result);
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const runAnalyst = async () => {
    if (!query.data?.id) return;
    setAiAnalystLoading(true);
    try {
      const result = await aiService.analyst(query.data.id);
      setAiAnalyst(result);
    } finally {
      setAiAnalystLoading(false);
    }
  };

  if (query.isLoading) return <Loader fullPage label="Loading opportunity" />;
  if (query.isError || !query.data) {
    return (
      <Container className="py-10">
        <ErrorState
          title="Opportunity not found"
          description="This opportunity may have been removed or is no longer available."
        />
      </Container>
    );
  }

  const opportunity = query.data;

  return (
    <>
      <SeoHead
        title={opportunity.title}
        description={opportunity.summaryShort ?? opportunity.description ?? ""}
      />
      <Container className="py-8">
        <BackButton label="Back to explore" to="/explore" />
        <div className="mt-4">
          <OpportunityDetailHeader opportunity={opportunity} matchScore={match?.score} />
        </div>

        <div className="mt-4">
          <OpportunityActionsBar
            saved={savedSet.has(opportunity.id)}
            watched={watchedSet.has(opportunity.id)}
            inPipeline={pipelineSet.has(opportunity.id)}
            onSave={() => saved.add.mutate(opportunity.id)}
            onWatch={() => watchlist.add.mutate(opportunity.id)}
            onAddToPipeline={() => pipeline.add.mutate(opportunity.id)}
            onAnalyze={user ? runAnalyst : undefined}
            applyUrl={opportunity.applicationUrl ?? undefined}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="ai">AI analysis</TabsTrigger>
                <TabsTrigger value="source">Source</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="space-y-6">
                  <section>
                    <h2 className="mb-2 text-sm font-semibold text-neutral-900">
                      Summary
                    </h2>
                    <p className="whitespace-pre-line text-sm text-neutral-700">
                      {opportunity.description ??
                        opportunity.summaryShort ??
                        "No description provided."}
                    </p>
                  </section>

                  <section>
                    <h2 className="mb-2 text-sm font-semibold text-neutral-900">
                      Eligibility
                    </h2>
                    <OpportunityEligibility eligibility={opportunity.eligibility} />
                  </section>

                  <section>
                    <h2 className="mb-2 text-sm font-semibold text-neutral-900">
                      Timeline
                    </h2>
                    <OpportunityTimeline opportunity={opportunity} />
                  </section>

                  <section>
                    <h2 className="mb-2 text-sm font-semibold text-neutral-900">
                      Change history
                    </h2>
                    <OpportunityChangeHistory changes={changesQuery.data ?? []} />
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="requirements">
                <OpportunityRequirements requirements={requirementsQuery.data ?? []} />
              </TabsContent>

              <TabsContent value="documents">
                <OpportunityDocuments documents={documentsQuery.data ?? []} />
              </TabsContent>

              <TabsContent value="ai">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={runSummary}
                      loading={aiSummaryLoading}
                    >
                      {aiSummary ? "Refresh summary" : "Generate AI summary"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={runAnalyst}
                      loading={aiAnalystLoading}
                    >
                      {aiAnalyst ? "Re-run analyst" : "Run analyst"}
                    </Button>
                  </div>
                  <AiSummaryCard summary={aiSummary} loading={aiSummaryLoading} />
                  <AiAnalystPanel
                    result={aiAnalyst}
                    loading={aiAnalystLoading}
                    onRun={runAnalyst}
                  />
                </div>
              </TabsContent>

              <TabsContent value="source">
                <OpportunitySourcePanel sources={sourcesQuery.data ?? []} />
              </TabsContent>
            </Tabs>
          </div>

          <aside className="min-w-0 space-y-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Overview
              </p>
              <ul className="mt-2 space-y-2 text-sm text-neutral-700">
                <li>
                  <span className="font-medium text-neutral-900">Category:</span>{" "}
                  {opportunity.category}
                </li>
                <li>
                  <span className="font-medium text-neutral-900">Type:</span>{" "}
                  {opportunity.opportunityType}
                </li>
                {opportunity.countryCode ? (
                  <li>
                    <span className="font-medium text-neutral-900">Country:</span>{" "}
                    {opportunity.countryCode}
                  </li>
                ) : null}
                {opportunity.referenceNumber ? (
                  <li>
                    <span className="font-medium text-neutral-900">Reference:</span>{" "}
                    {opportunity.referenceNumber}
                  </li>
                ) : null}
              </ul>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}