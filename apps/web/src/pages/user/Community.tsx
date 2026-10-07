import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Heart,
  MessageCircle,
  Send,
  Users,
  Sparkles,
  Flag,
  UserRoundPlus,
  UserRoundCheck,
  ShieldAlert,
  Share2,
  MoreHorizontal,
  UsersRound,
  Plus,
  CircleHelp,
  Megaphone,
  ArrowRight,
  Users2,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardBody } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Loader } from "../../components/ui/Loader";
import { SeoHead } from "../../components/common/SeoHead";
import { communityService, type CommunityKind, type CommunityPost } from "../../services/community.service";
import { useAuthStore } from "../../stores/authStore";
import { Dialog } from "../../components/ui/Dialog";
import { CommunitySubnav } from "../../components/community/CommunitySubnav";
import { useDebounce } from "../../hooks/useDebounce";

const tabs = [
  ["for-you", "For you"],
  ["following", "Following"],
  ["trending", "Trending"],
  ["opportunities", "Opportunities"],
  ["achievements", "Achievements"],
  ["discussions", "Discussions"],
] as const;

const kindLabels: Record<CommunityKind, string> = {
  GENERAL: "Community post",
  ANNOUNCEMENT: "Official announcement",
  OPPORTUNITY_DISCUSSION: "Opportunity discussion",
  QUESTION: "Question",
  ACHIEVEMENT: "Achievement",
  PROJECT_ANNOUNCEMENT: "Project update",
  EDUCATIONAL: "Learning",
  INDUSTRY_DISCUSSION: "Industry discussion",
};

export function PostCard({
  post,
  onRefresh,
}: {
  post: CommunityPost;
  onRefresh: () => void;
}) {
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Misleading information");
  const [reportDetails, setReportDetails] = useState("");
  const commentsQuery = useQuery({
    queryKey: ["community-comments", post.id],
    queryFn: () => communityService.comments(post.id),
    enabled: showComments,
  });
  const commentMutation = useMutation({
    mutationFn: () => communityService.comment(post.id, comment),
    onSuccess: () => {
      setComment("");
      onRefresh();
    },
  });
  const reactionMutation = useMutation({
    mutationFn: () => communityService.react(post.id),
    onSuccess: onRefresh,
  });
  const followMutation = useMutation({
    mutationFn: () => communityService.follow(post.author.id),
    onSuccess: onRefresh,
  });
  const reportMutation = useMutation({
    mutationFn: () => communityService.report({ postId: post.id, reason: reportReason, details: reportDetails }),
    onSuccess: () => {
      setReportOpen(false);
      setManageOpen(false);
      setReportDetails("");
    },
  });
  const actionMutation = useMutation({
    mutationFn: (kind: "BLOCK" | "MUTE") => communityService.userAction(post.author.id, kind),
    onSuccess: onRefresh,
  });

  const submitComment = (event: FormEvent) => {
    event.preventDefault();
    if (comment.trim()) commentMutation.mutate();
  };
  const sharePost = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/community?post=${post.id}`);
    } catch {
      window.prompt("Copy this post link", `${window.location.origin}/community?post=${post.id}`);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardBody className="p-5">
        <div className="flex items-start gap-3">
          <Avatar name={post.author.fullName} src={post.author.avatarUrl} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold text-neutral-900">{post.author.fullName}</span>
              {post.author.profile?.username ? (
                <span className="text-xs text-neutral-500">@{post.author.profile.username}</span>
              ) : null}
              <span className="text-xs text-neutral-500">
                {post.author.profile?.headline ?? post.author.professionalProfile?.profession ?? "Scout community"}
                {post.author.countryCode ? ` · ${post.author.countryCode}` : ""}
              </span>
              <span className="ml-auto text-xs text-neutral-400">
                {new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="neutral">{kindLabels[post.kind] ?? "Community post"}</Badge>
              {post.opportunity ? <Badge tone="primary">{post.opportunity.category}</Badge> : null}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-800">{post.content}</p>
            {post.opportunity ? (
              <a
                href={`/opportunities/${post.opportunity.slug}`}
                className="mt-3 flex items-center justify-between rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm hover:bg-primary-100"
              >
                <span className="font-medium text-primary-900">{post.opportunity.title}</span>
                <span className="text-primary-700">View opportunity →</span>
              </a>
            ) : null}
            {post.opportunity ? <OpportunityActivityActions opportunityId={post.opportunity.id} /> : null}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
              <Button
                variant={post.likedByMe ? "secondary" : "ghost"}
                size="sm"
                leftIcon={<Heart className="h-4 w-4" />}
                onClick={() => reactionMutation.mutate()}
                loading={reactionMutation.isPending}
                aria-label={post.likedByMe ? "Unlike post" : "Like post"}
              >
                {post._count.reactions}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<MessageCircle className="h-4 w-4" />}
                onClick={() => setShowComments((value) => !value)}
              >
                {post._count.comments} comments
              </Button>
              <Button variant="ghost" size="sm" onClick={() => followMutation.mutate()} loading={followMutation.isPending}>
                {post.followingByMe ? <UserRoundCheck className="mr-1.5 h-4 w-4" /> : <UserRoundPlus className="mr-1.5 h-4 w-4" />}
                {post.followingByMe ? "Following" : "Follow"}
              </Button>
              <button
                type="button"
                onClick={() => setManageOpen((value) => !value)}
                className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Manage post and author</span>
              </button>
              <Button variant="ghost" size="sm" onClick={() => void sharePost()} aria-label="Copy post link">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            {manageOpen ? (
              <div className="scout-post-menu mt-2 flex flex-wrap items-center gap-2">
                <span className="mr-auto text-xs text-neutral-500"><ShieldAlert className="mr-1 inline h-3.5 w-3.5" />Manage this post</span>
                <button type="button" onClick={() => setReportOpen(true)}>Report post</button>
                <button type="button" onClick={() => actionMutation.mutate("MUTE")}>Mute author</button>
                <button type="button" onClick={() => actionMutation.mutate("BLOCK")}>Block author</button>
              </div>
            ) : null}
            {reportMutation.isError || actionMutation.isError ? <p role="alert" className="mt-2 text-xs text-red-400">That action could not be completed.</p> : null}
            {showComments ? (
              <div className="mt-3 space-y-3">
                {(commentsQuery.data ?? post.comments).map((item) => (
                  <div key={item.id} className="flex gap-2.5 rounded-lg bg-neutral-50 p-3">
                    <Avatar name={item.author.fullName} src={item.author.avatarUrl} size="xs" />
                    <p className="text-sm text-neutral-700">
                      <span className="mr-1 font-medium text-neutral-900">{item.author.fullName}</span>
                      {item.content}
                    </p>
                  </div>
                ))}
                {commentsQuery.isError ? <p role="alert" className="text-xs text-red-600">Comments could not be loaded.</p> : null}
                {commentsQuery.data?.length === 100 ? <p className="text-xs text-neutral-400">Showing the first 100 replies.</p> : null}
                <form onSubmit={submitComment} className="flex gap-2">
                  <input
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Add to the discussion…"
                    maxLength={2000}
                    className="h-10 min-w-0 flex-1 rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                  <Button type="submit" size="sm" loading={commentMutation.isPending} disabled={!comment.trim()} aria-label="Post comment">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                {commentMutation.isError ? <p role="alert" className="text-xs text-red-600">Comment could not be posted. Please try again.</p> : null}
              </div>
            ) : null}
          </div>
        </div>
      </CardBody>
      <Dialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report this post"
        description="Reports go to Scout moderators. Official opportunity details are kept separate from community posts."
        panelClassName="scout-social-dialog"
      >
        <form onSubmit={(event) => { event.preventDefault(); reportMutation.mutate(); }} className="space-y-4">
          <label className="block text-sm font-medium">
            Reason
            <select value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="mt-1 block w-full rounded-lg border p-2.5">
              {["Spam", "Scam", "Abuse", "Misleading information", "Other"].map((reason) => <option key={reason}>{reason}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Details <span className="font-normal text-neutral-500">(optional)</span>
            <textarea value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} maxLength={1000} rows={3} className="mt-1 block w-full rounded-lg border p-2.5" placeholder="Add context to help the moderators review this report." />
          </label>
          {reportMutation.isError ? <p role="alert" className="text-sm text-red-500">The report could not be submitted.</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button type="submit" loading={reportMutation.isPending}>Submit report</Button>
          </div>
        </form>
      </Dialog>
    </Card>
  );
}

function OpportunityActivityActions({ opportunityId }: { opportunityId: string }) {
  const client = useQueryClient();
  const activity = useQuery({
    queryKey: ["community-opportunity-interactions", opportunityId],
    queryFn: () => communityService.opportunityInteractionSummary(opportunityId),
  });
  const interact = useMutation({
    mutationFn: (kind: "INTERESTED" | "APPLYING" | "COMPLETED") =>
      communityService.interactWithOpportunity(opportunityId, kind),
    onSuccess: () => client.invalidateQueries({ queryKey: ["community-opportunity-interactions", opportunityId] }),
  });
  const actions = [
    ["INTERESTED", "Interested"],
    ["APPLYING", "Applying"],
    ["COMPLETED", "Completed"],
  ] as const;

  return (
    <div className="scout-opportunity-actions">
      {actions.map(([kind, label]) => {
        const active = activity.data?.mine.includes(kind) ?? false;
        return (
          <button
            key={kind}
            type="button"
            aria-pressed={active}
            disabled={interact.isPending}
            onClick={() => interact.mutate(kind)}
            className={active ? "is-selected" : ""}
          >
            {label}<span>{activity.data?.counts[kind] ?? 0}</span>
          </button>
        );
      })}
      {activity.isError || interact.isError ? <span role="alert" className="text-xs text-red-400">Activity unavailable.</span> : null}
    </div>
  );
}

export function Community() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<string>(params.get("tab") ?? "for-you");
  const [composeOpen, setComposeOpen] = useState(false);
  const [content, setContent] = useState("");
  const [kind, setKind] = useState<CommunityKind>("GENERAL");
  const [opportunityRef, setOpportunityRef] = useState("");
  const [spaceSlug, setSpaceSlug] = useState(params.get("group") ?? "");
  const debouncedOpportunityRef = useDebounce(opportunityRef, 250);
  const opportunityMatches = useQuery({
    queryKey: ["community-opportunity-lookup", debouncedOpportunityRef],
    queryFn: () => communityService.searchOpportunities(debouncedOpportunityRef),
    enabled: debouncedOpportunityRef.trim().length >= 2,
  });
  const [selectedOpportunity, setSelectedOpportunity] = useState<{ id: string; title: string; slug: string } | null>(null);
  const feed = useQuery({
    queryKey: ["community-feed", tab, spaceSlug],
    queryFn: () => communityService.feed(tab, spaceSlug),
    staleTime: 20_000,
  });
  useEffect(() => {
    setTab(params.get("tab") ?? "for-you");
    setSpaceSlug(params.get("group") ?? "");
  }, [params]);
  const connections = useQuery({
    queryKey: ["community-connections"],
    queryFn: communityService.connections,
    staleTime: 60_000,
  });
  const groups = useQuery({
    queryKey: ["community-spaces"],
    queryFn: communityService.spaces,
    staleTime: 60_000,
  });
  const create = useMutation({
    mutationFn: () => communityService.createPost(content, kind, selectedOpportunity?.id),
    onSuccess: () => {
      setContent("");
      setKind("GENERAL");
      setOpportunityRef("");
      setSelectedOpportunity(null);
      setComposeOpen(false);
      queryClient.invalidateQueries({ queryKey: ["community-feed"] });
    },
  });
  const follow = useMutation({
    mutationFn: communityService.follow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-connections"] });
      queryClient.invalidateQueries({ queryKey: ["community-feed"] });
    },
  });
  const followGroup = useMutation({
    mutationFn: (slug: string) => communityService.joinSpace(slug),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community-spaces"] }),
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["community-feed"] });
    void queryClient.invalidateQueries({ queryKey: ["community-connections"] });
  };
  const submitPost = (event: FormEvent) => {
    event.preventDefault();
    if (content.trim()) create.mutate();
  };

  return (
    <>
      <SeoHead title="Community" />
      <div className="scout-community-page">
        <section className="scout-community-hero">
          <div className="scout-community-hero-copy">
            <span className="scout-community-eyebrow">SCOUT NETWORK</span>
            <h1>Community</h1>
            <p>Connect with like-minded people, share ideas, find collaborators, and grow together.</p>
          </div>
          <div className="scout-community-hero-art" aria-hidden="true">
            <span /><span /><span /><span /><span />
          </div>
          <Button onClick={() => setComposeOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>Create post</Button>
        </section>
        <CommunitySubnav />
        <div className="scout-community-actions">
          <button type="button" onClick={() => { setKind("GENERAL"); setComposeOpen(true); }}>
            <Plus aria-hidden className="h-4 w-4" /> Post
          </button>
          <button type="button" onClick={() => { setKind("OPPORTUNITY_DISCUSSION"); setComposeOpen(true); }}>
            <Sparkles aria-hidden className="h-4 w-4" /> Share opportunity
          </button>
          <button type="button" onClick={() => { setKind("QUESTION"); setComposeOpen(true); }}>
            <CircleHelp aria-hidden className="h-4 w-4" /> Ask question
          </button>
          <button type="button" onClick={() => { setKind("INDUSTRY_DISCUSSION"); setComposeOpen(true); }}>
            <Megaphone aria-hidden className="h-4 w-4" /> Start discussion
          </button>
        </div>
        <div className="scout-community-layout">
        <div className="scout-community-main min-w-0 space-y-4">
          <button type="button" className="scout-community-composer" onClick={() => setComposeOpen(true)}>
            <Avatar name={user?.fullName ?? ""} src={user?.avatarUrl ?? null} size="sm" />
            <span>What’s on your mind?</span>
            <span className="scout-community-composer-submit">Post</span>
          </button>
          <div className="scout-community-feed-tabs">
            {tabs.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setTab(value);
                  setParams((previous) => {
                    const next = new URLSearchParams(previous);
                    if (value === "for-you") next.delete("tab");
                    else next.set("tab", value);
                    return next;
                  });
                }}
                className={`shrink-0 rounded-t-lg px-3 py-2 text-sm font-medium ${tab === value ? "border-b-2 border-primary-600 text-primary-700" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"}`}
                aria-pressed={tab === value}
              >
                {label}
              </button>
            ))}
          </div>

          {feed.isLoading ? <Loader label="Loading community" /> : null}
          {feed.isError ? (
            <Card><CardBody className="p-6 text-sm text-red-700">Community posts are unavailable right now. Refresh to try again.</CardBody></Card>
          ) : null}
          {feed.data?.length === 0 ? (
            <Card><CardBody className="p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-neutral-300" />
              <h2 className="mt-3 font-semibold text-neutral-900">Your community starts here</h2>
              <p className="mt-1 text-sm text-neutral-500">Be the first to share a useful opportunity or question.</p>
            </CardBody></Card>
          ) : null}
          {feed.data?.map((post) => <PostCard key={post.id} post={post} onRefresh={refresh} />)}
        </div>

        <aside className="scout-community-rail space-y-4">
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-900">Community stats</h2>
                <Users className="h-4 w-4 text-primary-700" />
              </div>
              <div className="scout-community-stat-grid">
                <div><Users2 aria-hidden /><strong>{connections.data?.length ?? "—"}</strong><span>To connect</span></div>
                <div><MessageCircle aria-hidden /><strong>{feed.data?.length ?? "—"}</strong><span>Feed posts</span></div>
                <div><UsersRound aria-hidden /><strong>{groups.data?.length ?? "—"}</strong><span>Groups</span></div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-5">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-primary-50 p-2 text-primary-700"><Sparkles className="h-5 w-5" /></span>
                <div>
                  <h2 className="font-semibold text-neutral-900">People to connect with</h2>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Suggestions compare profile skills, interests, and country. They are not AI-verified.
                  </p>
                </div>
              </div>
              {connections.isLoading ? <div className="mt-4"><Loader label="Finding people" /></div> : null}
              {connections.isError ? <p className="mt-4 text-xs text-red-600">Connection suggestions are unavailable.</p> : null}
              <div className="mt-4 space-y-4">
                {connections.data?.map((person) => (
                  <div key={person.id} className="flex items-start gap-3">
                    <Avatar name={person.fullName} src={person.avatarUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-neutral-900">{person.fullName}</p>
                        <Badge tone="neutral">{person.score}%</Badge>
                      </div>
                      <p className="truncate text-xs text-neutral-500">{person.headline ?? person.category}</p>
                      <p className="mt-1 text-xs text-neutral-600">{person.explanation}</p>
                      {person.shared.length > 0 ? <p className="mt-1 text-[11px] text-primary-700">Shared: {person.shared.join(" · ")}</p> : null}
                      <button
                        type="button"
                        onClick={() => follow.mutate(person.id)}
                        disabled={follow.isPending}
                        className="mt-1 text-xs font-semibold text-primary-700 hover:underline disabled:opacity-50"
                      >
                        Follow
                      </button>
                    </div>
                  </div>
                ))}
                {connections.data?.length === 0 ? <p className="text-sm text-neutral-500">Add skills and interests to your profile to improve recommendations.</p> : null}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-900">Suggested groups</h2>
                <Link to="/community/groups" aria-label="View all groups" className="text-primary-700 hover:text-primary-500"><ArrowRight className="h-4 w-4" /></Link>
              </div>
              <div className="mt-4 space-y-3">
                {(groups.data ?? []).slice(0, 3).map((group) => (
                  <div key={group.id} className="scout-community-group-row">
                    <span className="scout-community-group-icon"><UsersRound aria-hidden className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <Link to={`/community/groups/${encodeURIComponent(group.slug)}`} className="block truncate text-xs font-semibold text-neutral-900">{group.name}</Link>
                      <p className="text-[11px] text-neutral-500">{group.memberCount} members</p>
                    </div>
                    {group.membershipStatus === "ACTIVE" || group.membershipStatus === "MUTED" ? <span className="text-xs text-primary-700">{group.membershipStatus === "MUTED" ? "Muted" : "Joined"}</span> : group.membershipStatus === "PENDING" ? <span className="text-xs text-neutral-500">Request pending</span> : group.visibility === "PRIVATE" && group.joinQuestions?.length ? (
                      <Link to={`/community/groups/${encodeURIComponent(group.slug)}`} className="text-xs font-semibold text-primary-700">Request</Link>
                    ) : (
                      <button type="button" disabled={followGroup.isPending} onClick={() => followGroup.mutate(group.slug)}>{group.visibility === "PRIVATE" ? "Request" : "Join"}</button>
                    )}
                  </div>
                ))}
                {!groups.isLoading && !groups.isError && groups.data?.length === 0 ? <p className="text-xs text-neutral-500">New groups will appear here.</p> : null}
                {groups.isError ? <p className="text-xs text-red-500">Groups could not be loaded.</p> : null}
                {followGroup.isError ? <p role="alert" className="text-xs text-red-500">Could not update group membership.</p> : null}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4 text-xs leading-5 text-neutral-500">
              <div className="flex gap-2"><Flag className="mt-0.5 h-4 w-4 shrink-0" />
                Community reports are saved for review. Official opportunity details remain separate from community posts.
              </div>
            </CardBody>
          </Card>
        </aside>
      </div>
      </div>
      <Dialog
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="Create post"
        description="Share a useful update with the Scout community."
        size="lg"
        panelClassName="scout-social-dialog"
      >
        <form onSubmit={submitPost} className="space-y-4">
          <div className="flex items-start gap-3">
            <Avatar name={user?.fullName ?? ""} src={user?.avatarUrl ?? null} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{user?.fullName ?? "Your Scout profile"}</p>
              <select value={kind} onChange={(event) => setKind(event.target.value as CommunityKind)} className="mt-2 rounded-lg border px-3 py-2 text-sm" aria-label="Post type">
                {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>
          <label className="block text-sm font-medium">
            What’s on your mind?
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Share an opportunity, ask a question, or post a progress update…"
              maxLength={5000}
              rows={5}
              className="mt-1 block w-full resize-y rounded-xl border p-3 text-sm"
              autoFocus
            />
            <span className="mt-1 block text-right text-xs text-neutral-500">{content.length}/5000</span>
          </label>
          <div className="relative">
            <label className="block text-sm font-medium" htmlFor="community-opportunity-search">Add an opportunity</label>
            <input
              id="community-opportunity-search"
              value={selectedOpportunity?.title ?? opportunityRef}
              onChange={(event) => { setSelectedOpportunity(null); setOpportunityRef(event.target.value); }}
              placeholder="Search by opportunity title…"
              className="mt-1 block w-full rounded-lg border p-2.5 text-sm"
            />
            {opportunityMatches.data?.length ? (
              <div className="scout-opportunity-results absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border p-1 shadow-lg">
                {opportunityMatches.data.map((opportunity) => (
                  <button key={opportunity.id} type="button" onClick={() => { setSelectedOpportunity(opportunity); setOpportunityRef(""); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-100">
                    <span className="block font-medium">{opportunity.title}</span>
                    <span className="text-xs text-neutral-500">{opportunity.category}</span>
                  </button>
                ))}
              </div>
            ) : null}
            {selectedOpportunity ? <p className="mt-1 text-xs text-primary-700">Linked: {selectedOpportunity.title} <button type="button" onClick={() => setSelectedOpportunity(null)} className="ml-1 underline">Remove</button></p> : null}
            {opportunityMatches.isError ? <p className="mt-1 text-xs text-red-500">Opportunity search is unavailable.</p> : null}
          </div>
          {create.isError ? <p role="alert" className="text-sm text-red-500">Your post could not be shared. Please try again.</p> : null}
          <div className="flex justify-end gap-2 border-t border-neutral-200 pt-4">
            <Button variant="outline" type="button" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button type="submit" loading={create.isPending} disabled={!content.trim()}>Post</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
