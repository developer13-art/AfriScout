import { useState, type FormEvent } from "react";
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
} from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Loader } from "../../components/ui/Loader";
import { SeoHead } from "../../components/common/SeoHead";
import { communityService, type CommunityKind, type CommunityPost } from "../../services/community.service";
import { useAuthStore } from "../../stores/authStore";

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
  OPPORTUNITY_DISCUSSION: "Opportunity discussion",
  QUESTION: "Question",
  ACHIEVEMENT: "Achievement",
  PROJECT_ANNOUNCEMENT: "Project update",
  EDUCATIONAL: "Learning",
  INDUSTRY_DISCUSSION: "Industry discussion",
};

function PostCard({
  post,
  onRefresh,
}: {
  post: CommunityPost;
  onRefresh: () => void;
}) {
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
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
    mutationFn: () => communityService.report({ postId: post.id, reason: "Community guidelines" }),
  });
  const actionMutation = useMutation({
    mutationFn: (kind: "BLOCK" | "MUTE") => communityService.userAction(post.author.id, kind),
    onSuccess: onRefresh,
  });

  const submitComment = (event: FormEvent) => {
    event.preventDefault();
    if (comment.trim()) commentMutation.mutate();
  };
  const showProfileActions = () => {
    const value = window.prompt("Type block, mute, or report to manage this account.");
    if (value?.toLowerCase() === "block") actionMutation.mutate("BLOCK");
    if (value?.toLowerCase() === "mute") actionMutation.mutate("MUTE");
    if (value?.toLowerCase() === "report") reportMutation.mutate();
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
                onClick={showProfileActions}
                className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Manage / report
              </button>
            </div>
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
    </Card>
  );
}

export function Community() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<string>("for-you");
  const [content, setContent] = useState("");
  const [kind, setKind] = useState<CommunityKind>("GENERAL");
  const feed = useQuery({
    queryKey: ["community-feed", tab],
    queryFn: () => communityService.feed(tab),
    staleTime: 20_000,
  });
  const connections = useQuery({
    queryKey: ["community-connections"],
    queryFn: communityService.connections,
    staleTime: 60_000,
  });
  const create = useMutation({
    mutationFn: () => communityService.createPost(content, kind),
    onSuccess: () => {
      setContent("");
      setKind("GENERAL");
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
      <PageHeader
        title="Community"
        description="Share opportunity intelligence, learn from peers, and find people to build with."
        actions={<Badge tone="primary"><Users className="mr-1 h-3.5 w-3.5" />Scout network</Badge>}
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardBody className="p-5">
              <form onSubmit={submitPost}>
                <div className="flex items-start gap-3">
                  <Avatar name={user?.fullName ?? ""} src={user?.avatarUrl ?? null} />
                  <div className="min-w-0 flex-1">
                    <textarea
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      placeholder="Share an opportunity, ask a question, or post a progress update…"
                      maxLength={5000}
                      rows={3}
                      className="w-full resize-y rounded-lg border border-neutral-200 p-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <select
                        value={kind}
                        onChange={(event) => setKind(event.target.value as CommunityKind)}
                        className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700"
                        aria-label="Post type"
                      >
                        {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <Button type="submit" size="sm" loading={create.isPending} disabled={!content.trim()} leftIcon={<Send className="h-4 w-4" />}>
                        Share with community
                      </Button>
                    </div>
                    {create.isError ? <p role="alert" className="mt-2 text-xs text-red-600">Your post could not be shared. Please try again.</p> : null}
                  </div>
                </div>
              </form>
            </CardBody>
          </Card>

          <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 pb-1">
            {tabs.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
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

        <aside className="space-y-4">
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
            <CardBody className="p-4 text-xs leading-5 text-neutral-500">
              <div className="flex gap-2"><Flag className="mt-0.5 h-4 w-4 shrink-0" />
                Community reports are saved for review. Official opportunity details remain separate from community posts.
              </div>
            </CardBody>
          </Card>
        </aside>
      </div>
    </>
  );
}
