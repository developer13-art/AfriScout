import { Link } from "react-router-dom";
import { Bookmark, MessageCircle, Sparkles, UsersRound, Workflow } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../../components/layout/PageHeader";
import { StatCard } from "../../components/dashboard/StatCard";
import { RecentMatches, type RecentMatch } from "../../components/dashboard/RecentMatches";
import { DeadlineWidget } from "../../components/dashboard/DeadlineWidget";
import { PipelineSummary } from "../../components/dashboard/PipelineSummary";
import { CategoryBreakdown } from "../../components/dashboard/CategoryBreakdown";
import { OnboardingChecklist } from "../../components/dashboard/OnboardingChecklist";
import { Button } from "../../components/ui/Button";
import { Loader } from "../../components/ui/Loader";
import { useUser } from "../../hooks/useUser";
import { useRadar } from "../../hooks/useRadar";
import { useMatches } from "../../hooks/useMatches";
import { usePipeline } from "../../hooks/usePipeline";
import { useSaved } from "../../hooks/useSaved";
import { useDna } from "../../hooks/useDna";
import { labelForCategory } from "../../config/categories";
import { SeoHead } from "../../components/common/SeoHead";
import { pipelineStageLabel } from "../../components/pipeline/PipelineStatusBadge";
import { communityService } from "../../services/community.service";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";

export function Dashboard() {
  const { user } = useUser();
  const radar = useRadar();
  const matches = useMatches(6);
  const pipeline = usePipeline();
  const saved = useSaved();
  const dna = useDna();
  const socialFeed = useQuery({
    queryKey: ["dashboard-community-feed"],
    queryFn: () => communityService.feed("for-you"),
    staleTime: 60_000,
  });
  const network = useQuery({
    queryKey: ["dashboard-connections"],
    queryFn: communityService.acceptedConnections,
    staleTime: 60_000,
  });
  const conversations = useQuery({
    queryKey: ["dashboard-message-conversations"],
    queryFn: communityService.messageConversations,
    staleTime: 30_000,
  });
  const unreadMessages = (conversations.data ?? []).reduce(
    (total, conversation) => total + conversation.unreadCount,
    0,
  );

  const savedIds = new Set((saved.data ?? []).map((entry) => entry.opportunityId));

  const recentMatches: RecentMatch[] = (matches.data?.matches ?? [])
    .slice(0, 4)
    .flatMap((m) => {
      const opportunity = matches.data?.opportunities[m.opportunityId];
      if (!opportunity) return [];
      const reasons = (m.reasons ?? []).map((reason) =>
        reason.detail ? `${reason.label} - ${reason.detail}` : reason.label,
      );
      return [{
        opportunity,
        score: m.score,
        reasons,
        aiMatchReason: m.aiMatchReason,
        aiMatchProvider: m.aiMatchProvider,
        aiMatchError: m.aiMatchError,
      }];
    });

  const pipelineStages = Object.entries(
    (pipeline.data ?? []).reduce<Record<string, number>>((acc, item) => {
      acc[item.stage] = (acc[item.stage] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([stage, count]) => ({
    stage,
    label: pipelineStageLabel(stage as never),
    count,
  }));

  const categorySlices = (radar.data?.newOpportunities ?? []).reduce<
    Record<string, number>
  >((acc, opp) => {
    acc[opp.category] = (acc[opp.category] ?? 0) + 1;
    return acc;
  }, {});
  const categorySlicesArray = Object.entries(categorySlices).map(
    ([key, count]) => ({
      key,
      label: labelForCategory(key),
      count,
    }),
  );

  const onboarded = Boolean(dna.data);

  return (
    <>
      <SeoHead title="Dashboard" />
      <PageHeader
        title={`Good day, ${(user?.fullName ?? "").split(" ")[0] || "there"}`}
        description="Here is what is happening with your opportunities."
        actions={
          <Link to="/explore">
            <Button>Explore opportunities</Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="New opportunities"
          value={radar.data?.newOpportunities.length ?? 0}
          icon={<Sparkles className="h-4 w-4" />}
          tone="primary"
        />
        <StatCard
          label="Matches"
          value={matches.data?.matches.length ?? 0}
          icon={<Sparkles className="h-4 w-4" />}
          tone="success"
        />
        <StatCard
          label="Saved"
          value={saved.data?.length ?? 0}
          icon={<Bookmark className="h-4 w-4" />}
        />
        <StatCard
          label="Pipeline"
          value={pipeline.data?.length ?? 0}
          icon={<Workflow className="h-4 w-4" />}
          tone="warning"
        />
        <StatCard
          label="Connections"
          value={network.data?.length ?? 0}
          icon={<UsersRound className="h-4 w-4" />}
        />
        <StatCard
          label="Unread messages"
          value={unreadMessages}
          icon={<MessageCircle className="h-4 w-4" />}
          tone={unreadMessages > 0 ? "primary" : undefined}
        />
      </div>

      {!onboarded ? (
        <div className="mt-6">
          <OnboardingChecklist
            steps={[
              {
                id: "dna",
                label: "Complete your Business DNA",
                description: "Tell us what you do so we can match you accurately.",
                completed: false,
                to: "/dna",
              },
              {
                id: "explore",
                label: "Explore opportunities",
                description: "Browse opportunities from connected sources around the world.",
                completed: true,
                to: "/explore",
              },
              {
                id: "pipeline",
                label: "Add your first opportunity to the pipeline",
                description: "Track opportunities through to outcome.",
                completed: false,
                to: "/pipeline",
              },
            ]}
          />
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {matches.isLoading ? (
            <Loader label="Loading matches" />
          ) : (
            <RecentMatches
              matches={recentMatches}
              savedIds={savedIds}
              onSave={(opportunityId) => saved.add.mutate(opportunityId)}
              emptyDescription={
                onboarded
                  ? "We checked published opportunities against your DNA, but none are available as matches right now. Check back when new opportunities are published."
                  : "Complete your Business DNA so we can find opportunities that fit."
              }
              analyzing={matches.data?.aiAnalysisPending}
              analysisErrorCount={matches.data?.aiAnalysisErrorCount}
            />
          )}
          {radar.isLoading ? (
            <Loader label="Loading radar" />
          ) : (
            <DeadlineWidget opportunities={radar.data?.closingSoon ?? []} />
          )}
        </div>
        <div className="space-y-6">
          <PipelineSummary stages={pipelineStages} />
          <CategoryBreakdown slices={categorySlicesArray} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Community activity"
            subtitle="Recent posts from people and groups in your Scout network."
            actions={<Link to="/community" className="text-xs font-semibold text-primary-700 hover:underline">Open community</Link>}
          />
          <CardBody className="space-y-4">
            {socialFeed.isLoading ? <Loader label="Loading community activity" /> : null}
            {socialFeed.isError ? <p className="text-sm text-neutral-500">Community activity is unavailable right now.</p> : null}
            {(socialFeed.data ?? []).slice(0, 3).map((post) => (
              <article key={post.id} className="flex gap-3 border-b border-neutral-100 pb-4 last:border-0 last:pb-0">
                <Avatar name={post.author.fullName} src={post.author.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-neutral-900">{post.author.fullName}</span>
                    <span className="text-xs text-neutral-500">
                      {new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-neutral-700">
                    {post.content || (post.attachments?.length ? "Shared an attachment" : "")}
                  </p>
                  {post.attachments?.length ? <span className="mt-1 inline-block text-xs text-primary-700">{post.attachments.length} attachment{post.attachments.length === 1 ? "" : "s"}</span> : null}
                  {post.opportunity ? <Link to={`/opportunities/${post.opportunity.slug}`} className="mt-1 block truncate text-xs font-medium text-primary-700 hover:underline">{post.opportunity.title}</Link> : null}
                </div>
                <span className="shrink-0 text-xs text-neutral-500">{post._count.reactions} likes</span>
              </article>
            ))}
            {!socialFeed.isLoading && !socialFeed.isError && !socialFeed.data?.length ? (
              <p className="text-sm text-neutral-500">No community posts yet. Share an update or follow people to build your feed.</p>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Your network"
            subtitle="Connections and private conversations."
            actions={<Link to="/community/connections" className="text-xs font-semibold text-primary-700 hover:underline">Manage</Link>}
          />
          <CardBody className="space-y-3">
            <Link to="/community/messages" className="flex items-center justify-between rounded-xl bg-primary-50 px-3 py-3 text-sm hover:bg-primary-100">
              <span className="flex items-center gap-2 font-medium text-primary-900"><MessageCircle className="h-4 w-4" />Messages</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-primary-700">{unreadMessages} unread</span>
            </Link>
            {(network.data ?? []).slice(0, 4).map((connection) => (
              <Link key={connection.id} to={`/community/profile/${connection.person.id}`} className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-neutral-50">
                <Avatar name={connection.person.fullName} src={connection.person.avatarUrl} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-neutral-900">{connection.person.fullName}</span>
                  <span className="block truncate text-xs text-neutral-500">{connection.person.profile?.headline ?? connection.person.professionalProfile?.profession ?? "Scout connection"}</span>
                </span>
              </Link>
            ))}
            {!network.isLoading && !network.isError && !network.data?.length ? (
              <p className="text-sm text-neutral-500">Connect with other members to start building your network.</p>
            ) : null}
            {network.isError ? <p className="text-sm text-neutral-500">Your connections could not be loaded.</p> : null}
            <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
              <Link to="/community" className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Community feed</Link>
              <Link to="/community/groups" className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Groups</Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}