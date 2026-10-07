import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, LockKeyhole, MoreHorizontal, Plus, Search, Share2, Sparkles, Users, UsersRound } from "lucide-react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import { Loader } from "../../components/ui/Loader";
import { SeoHead } from "../../components/common/SeoHead";
import { communityService, type CommunityKind } from "../../services/community.service";
import { CommunitySubnav } from "../../components/community/CommunitySubnav";
import { PostCard } from "./Community";

const groupTabs = ["Overview", "Discussions", "Opportunities", "Members", "Events", "Projects", "Achievements", "About"] as const;
type GroupTab = typeof groupTabs[number];

function formatTab(tab: string | null): GroupTab {
  return groupTabs.find((item) => item.toLowerCase() === tab?.toLowerCase()) ?? "Overview";
}

export function CommunityGroup() {
  const { slug = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const client = useQueryClient();
  const selectedTab = formatTab(params.get("view"));
  const [query, setQuery] = useState("");
  const [memberStatus, setMemberStatus] = useState<"ACTIVE" | "PENDING">("ACTIVE");
  const [draft, setDraft] = useState("");
  const [postKind, setPostKind] = useState<CommunityKind>("GENERAL");
  const [copied, setCopied] = useState(false);
  const group = useQuery({
    queryKey: ["community-space", slug],
    queryFn: () => communityService.space(slug),
    enabled: Boolean(slug),
  });
  const posts = useQuery({
    queryKey: ["community-feed", "group", slug],
    queryFn: () => communityService.feed("for-you", slug),
    enabled: Boolean(slug) && (selectedTab === "Discussions" || selectedTab === "Opportunities" || selectedTab === "Achievements" || selectedTab === "Overview"),
  });
  const members = useQuery({
    queryKey: ["community-space-members", slug, query, memberStatus],
    queryFn: () => communityService.spaceMembers(slug, query, memberStatus),
    enabled: Boolean(slug) && selectedTab === "Members",
  });
  const join = useMutation({
    mutationFn: () => communityService.joinSpace(slug),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["community-space", slug] }),
        client.invalidateQueries({ queryKey: ["community-spaces"] }),
      ]);
    },
  });
  const leave = useMutation({
    mutationFn: () => communityService.leaveSpace(slug),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["community-space", slug] }),
        client.invalidateQueries({ queryKey: ["community-spaces"] }),
      ]);
    },
  });
  const createPost = useMutation({
    mutationFn: () => communityService.createPost(draft, postKind, undefined, slug),
    onSuccess: async () => {
      setDraft("");
      await client.invalidateQueries({ queryKey: ["community-feed", "group", slug] });
      await client.invalidateQueries({ queryKey: ["community-space", slug] });
    },
  });
  const moderateMember = useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: "APPROVE" | "REJECT" | "SUSPEND" | "BAN" | "PROMOTE_MODERATOR" | "DEMOTE_MODERATOR" }) =>
      communityService.moderateSpaceMember(slug, userId, action),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["community-space-members", slug] }),
        client.invalidateQueries({ queryKey: ["community-space", slug] }),
      ]);
    },
  });

  const share = async () => {
    const url = `${window.location.origin}/community/groups/${encodeURIComponent(slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this group link", url);
    }
  };
  const submitPost = (event: FormEvent) => {
    event.preventDefault();
    if (draft.trim()) createPost.mutate();
  };
  const setTab = (tab: GroupTab) => setParams(tab === "Overview" ? {} : { view: tab.toLowerCase() });
  const refreshPosts = () => {
    void client.invalidateQueries({ queryKey: ["community-feed", "group", slug] });
    void client.invalidateQueries({ queryKey: ["community-space", slug] });
  };

  if (group.isLoading) return <div className="scout-community-page"><Loader label="Opening group" /></div>;
  if (group.isError || !group.data) return (
    <div className="scout-community-page">
      <SeoHead title="Group unavailable" />
      <Card><CardBody className="p-8 text-center">
        <h1 className="text-lg font-semibold text-neutral-900">This group isn’t available</h1>
        <p className="mt-2 text-sm text-neutral-500">It may have been removed or you may need an invitation to view it.</p>
        <Link to="/community/groups" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-700"><ArrowLeft className="h-4 w-4" /> Browse groups</Link>
      </CardBody></Card>
    </div>
  );

  const space = group.data;
  const isMember = space.membershipStatus === "ACTIVE";
  const isPending = space.membershipStatus === "PENDING";
  const canModerateMembers = ["OWNER", "ADMIN", "MODERATOR"].includes(space.role ?? "");
  const canManageRoles = space.role === "OWNER" || space.role === "ADMIN";
  const displayedPosts = posts.data ?? space.posts;
  const opportunityPosts = displayedPosts.filter((post) => post.opportunity);
  const achievementPosts = displayedPosts.filter((post) => post.kind === "ACHIEVEMENT");

  return (
    <div className="scout-community-page scout-group-page">
      <SeoHead title={space.name} description={space.description ?? undefined} />
      <CommunitySubnav />
      <section className="scout-group-header">
        <div className="scout-group-cover" style={space.coverImageUrl ? { backgroundImage: `linear-gradient(90deg, rgb(4 17 30 / 25%), rgb(4 17 30 / 5%)), url("${space.coverImageUrl}")` } : undefined} />
        <div className="scout-group-identity">
          <span className="scout-group-avatar">
            {space.profileImageUrl ? <img src={space.profileImageUrl} alt="" /> : <UsersRound aria-hidden />}
          </span>
          <div className="scout-group-title">
            <div className="flex flex-wrap items-center gap-2">
              <h1>{space.name}</h1>
              <Check aria-label="Scout group" className="h-4 w-4 rounded-full bg-primary-600 p-0.5 text-white" />
            </div>
            <p>{space.memberCount.toLocaleString()} members · {space.visibility.toLowerCase()} · {space.countryCode ?? "Global"} · {space.language}</p>
            <p className="scout-group-description">{space.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{space.topics.map((topic) => <span className="scout-topic-chip" key={topic}>{topic}</span>)}</div>
          </div>
          <div className="scout-group-header-actions">
            {isMember ? <Button variant="outline" onClick={() => leave.mutate()} loading={leave.isPending}>Joined</Button> : (
              <Button onClick={() => join.mutate()} loading={join.isPending} disabled={isPending}>
                {isPending ? "Request pending" : space.visibility === "PRIVATE" ? "Request to join" : "Join group"}
              </Button>
            )}
            <Button variant="outline" onClick={() => void share()} leftIcon={copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}>{copied ? "Copied" : "Share"}</Button>
            <button type="button" onClick={() => void share()} aria-label="More group actions" className="scout-group-more"><MoreHorizontal className="h-4 w-4" /></button>
          </div>
        </div>
      </section>

      {join.isError || leave.isError ? <p role="alert" className="mb-3 text-sm text-red-500">The group membership action could not be completed. Please try again.</p> : null}
      <nav className="scout-group-tabs" aria-label="Group sections">
        {groupTabs.map((tab) => <button key={tab} type="button" onClick={() => setTab(tab)} className={selectedTab === tab ? "is-active" : ""}>{tab}</button>)}
      </nav>

      {!isMember && space.visibility !== "PUBLIC" ? (
        <Card><CardBody className="p-8 text-center">
          <LockKeyhole className="mx-auto h-7 w-7 text-primary-700" />
          <h2 className="mt-3 font-semibold text-neutral-900">{isPending ? "Your request is awaiting approval" : "Join this group to see the community"}</h2>
          <p className="mt-1 text-sm text-neutral-500">{isPending ? "A group moderator will review your request." : "Members can access group discussions, opportunities, and people."}</p>
          {!isPending ? <Button className="mt-4" onClick={() => join.mutate()} loading={join.isPending}>Request to join</Button> : null}
        </CardBody></Card>
      ) : (
        <>
          {selectedTab === "Overview" ? (
            <div className="scout-group-overview">
              <div className="space-y-4">
                <Card><CardBody className="p-4">
                  <h2 className="scout-group-section-title">About this group</h2>
                  <p className="mt-3 text-xs leading-5 text-neutral-600">{space.description}</p>
                  <dl className="scout-group-info">
                    <div><dt>Category</dt><dd>{space.category}</dd></div>
                    <div><dt>Purpose</dt><dd>{space.purpose.toLowerCase()}</dd></div>
                    <div><dt>Location</dt><dd>{space.countryCode ?? "Global"}</dd></div>
                    <div><dt>Language</dt><dd>{space.language}</dd></div>
                    <div><dt>Created</dt><dd>{new Date(space.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</dd></div>
                  </dl>
                </CardBody></Card>
                <Card><CardBody className="p-4">
                  <div className="flex items-center justify-between"><h2 className="scout-group-section-title">Group discussions</h2><button type="button" onClick={() => setTab("Discussions")} className="text-xs font-semibold text-primary-700">View all</button></div>
                  <div className="mt-3 space-y-3">
                    {displayedPosts.slice(0, 3).map((post) => <PostCard key={post.id} post={post} onRefresh={refreshPosts} />)}
                    {displayedPosts.length === 0 ? <p className="text-xs text-neutral-500">Start the first conversation in this group.</p> : null}
                  </div>
                </CardBody></Card>
              </div>
              <div className="space-y-4">
                <Card><CardBody className="p-4">
                  <div className="flex items-center justify-between"><h2 className="scout-group-section-title">Group members</h2><button type="button" onClick={() => setTab("Members")} className="text-xs font-semibold text-primary-700">View all</button></div>
                  <p className="mt-2 text-[11px] text-neutral-500">{space.memberCount.toLocaleString()} members</p>
                  <div className="mt-3 flex flex-wrap gap-2">{space.members.map((person) => <Avatar key={person.id} name={person.fullName} src={person.avatarUrl} size="sm" />)}</div>
                </CardBody></Card>
                <Card><CardBody className="p-4">
                  <div className="flex items-center justify-between"><h2 className="scout-group-section-title">Opportunities</h2><button type="button" onClick={() => setTab("Opportunities")} className="text-xs font-semibold text-primary-700">View all</button></div>
                  {opportunityPosts.length ? opportunityPosts.slice(0, 3).map((post) => (
                    <Link key={post.id} to={`/opportunities/${post.opportunity!.slug}`} className="scout-group-opportunity">
                      <span><small>{post.opportunity!.category}</small><strong>{post.opportunity!.title}</strong></span><ArrowUpRight className="h-4 w-4" />
                    </Link>
                  )) : <p className="mt-3 text-xs text-neutral-500">Shared group opportunities will appear here.</p>}
                </CardBody></Card>
                <Card><CardBody className="p-4">
                  <h2 className="scout-group-section-title">Group activity</h2>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                    <div className="scout-group-stat"><strong>{space.postCount}</strong><span>Discussions</span></div>
                    <div className="scout-group-stat"><strong>{space.memberCount}</strong><span>Members</span></div>
                  </div>
                </CardBody></Card>
              </div>
            </div>
          ) : null}

          {selectedTab === "Discussions" ? (
            <div className="scout-group-discussions">
              {isMember ? (
                <form className="scout-group-compose" onSubmit={submitPost}>
                  <div className="flex gap-2">
                    <select aria-label="Post type" value={postKind} onChange={(event) => setPostKind(event.target.value as CommunityKind)}>
                      <option value="GENERAL">General post</option><option value="QUESTION">Question</option>
                      <option value="OPPORTUNITY_DISCUSSION">Opportunity</option><option value="INDUSTRY_DISCUSSION">Collaboration</option>
                      <option value="ACHIEVEMENT">Achievement</option><option value="PROJECT_ANNOUNCEMENT">Project</option>
                    </select>
                    <span className="scout-group-compose-note">Official opportunity details stay separate from member discussion.</span>
                  </div>
                  <textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={5000} rows={3} placeholder="Share something with the group…" />
                  <div className="flex justify-end"><Button size="sm" type="submit" loading={createPost.isPending} disabled={!draft.trim()} leftIcon={<Plus className="h-4 w-4" />}>Post</Button></div>
                  {createPost.isError ? <p role="alert" className="text-xs text-red-500">Your post could not be published.</p> : null}
                </form>
              ) : null}
              {posts.isLoading ? <Loader label="Loading group discussions" /> : null}
              {posts.isError ? <Card><CardBody className="text-sm text-red-500">Group discussions could not be loaded.</CardBody></Card> : null}
              {!posts.isLoading && !posts.isError && displayedPosts.length === 0 ? <Card><CardBody className="p-8 text-center text-sm text-neutral-500">No discussions yet. Start a conversation with this group.</CardBody></Card> : null}
              {displayedPosts.map((post) => <PostCard key={post.id} post={post} onRefresh={refreshPosts} />)}
            </div>
          ) : null}

          {selectedTab === "Opportunities" ? (
            <div className="space-y-3">
              <Card><CardBody className="flex items-center gap-3 p-4"><Sparkles className="h-5 w-5 text-primary-700" /><div><h2 className="text-sm font-semibold text-neutral-900">Opportunities shared with the group</h2><p className="text-xs text-neutral-500">Scout listings are official; member comments remain community discussion.</p></div></CardBody></Card>
              {opportunityPosts.length ? opportunityPosts.map((post) => <PostCard key={post.id} post={post} onRefresh={refreshPosts} />) : <Card><CardBody className="p-8 text-center text-sm text-neutral-500">No opportunities have been shared with this group yet.</CardBody></Card>}
            </div>
          ) : null}

          {selectedTab === "Members" ? (
            <div>
              <label className="scout-group-member-search"><Search aria-hidden className="h-4 w-4" /><span className="sr-only">Search group members</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search members by name or role…" /></label>
              {canModerateMembers ? (
                <div className="mb-3 flex gap-2" aria-label="Member status filter">
                  {(["ACTIVE", "PENDING"] as const).map((status) => (
                    <Button key={status} size="sm" variant={memberStatus === status ? "primary" : "outline"} onClick={() => setMemberStatus(status)}>
                      {status === "ACTIVE" ? "Members" : "Join requests"}
                    </Button>
                  ))}
                </div>
              ) : null}
              {members.isLoading ? <Loader label="Finding group members" /> : null}
              {members.isError ? <Card><CardBody className="text-sm text-red-500">Group members could not be loaded.</CardBody></Card> : null}
              {moderateMember.isError ? <p role="alert" className="mb-3 text-sm text-red-500">That member action could not be completed.</p> : null}
              <div className="scout-group-members-list">
                {members.data?.map((member) => (
                  <Card key={member.id}><CardBody className="flex items-center gap-3 p-3">
                    <Avatar name={member.fullName} src={member.avatarUrl} size="md" />
                    <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-neutral-900">{member.fullName}</p><p className="truncate text-[10px] text-neutral-500">{member.profile?.headline ?? member.professionalProfile?.profession ?? member.role.toLowerCase()} · {member.countryCode ?? "Global"}</p><p className="truncate text-[10px] text-primary-700">{member.professionalProfile?.skills?.slice(0, 3).join(" · ")}</p></div>
                    <Badge tone={member.role === "OWNER" || member.role === "ADMIN" ? "primary" : "neutral"}>{member.role.toLowerCase()}</Badge>
                    {canModerateMembers ? (
                      <div className="flex flex-wrap justify-end gap-1">
                        {memberStatus === "PENDING" ? (
                          <>
                            <Button size="sm" onClick={() => moderateMember.mutate({ userId: member.id, action: "APPROVE" })} loading={moderateMember.isPending}>Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => moderateMember.mutate({ userId: member.id, action: "REJECT" })} disabled={moderateMember.isPending}>Reject</Button>
                          </>
                        ) : canManageRoles && member.role === "MEMBER" ? (
                          <Button size="sm" variant="outline" onClick={() => moderateMember.mutate({ userId: member.id, action: "PROMOTE_MODERATOR" })} disabled={moderateMember.isPending}>Make moderator</Button>
                        ) : canManageRoles && member.role === "MODERATOR" ? (
                          <Button size="sm" variant="outline" onClick={() => moderateMember.mutate({ userId: member.id, action: "DEMOTE_MODERATOR" })} disabled={moderateMember.isPending}>Remove moderator</Button>
                        ) : canManageRoles && member.role !== "OWNER" && member.role !== "ADMIN" ? (
                          <Button size="sm" variant="outline" onClick={() => moderateMember.mutate({ userId: member.id, action: "SUSPEND" })} disabled={moderateMember.isPending}>Suspend</Button>
                        ) : null}
                      </div>
                    ) : null}
                  </CardBody></Card>
                ))}
                {!members.isLoading && !members.isError && !members.data?.length ? <Card><CardBody className="p-8 text-center text-sm text-neutral-500">No members match that search.</CardBody></Card> : null}
              </div>
            </div>
          ) : null}

          {selectedTab === "Achievements" ? (
            <div className="space-y-3">
              {achievementPosts.length ? achievementPosts.map((post) => <PostCard key={post.id} post={post} onRefresh={refreshPosts} />) : <Card><CardBody className="p-8 text-center"><Sparkles className="mx-auto h-6 w-6 text-primary-700" /><h2 className="mt-2 text-sm font-semibold text-neutral-900">Group achievements</h2><p className="mt-1 text-xs text-neutral-500">Member milestones and verified contributions will appear here.</p></CardBody></Card>}
            </div>
          ) : null}

          {selectedTab === "Events" || selectedTab === "Projects" ? (
            <Card><CardBody className="p-8 text-center">
              {selectedTab === "Events" ? <CalendarDays className="mx-auto h-7 w-7 text-primary-700" /> : <Users className="mx-auto h-7 w-7 text-primary-700" />}
              <h2 className="mt-3 text-sm font-semibold text-neutral-900">{selectedTab === "Events" ? "Group events" : "Group projects"}</h2>
              <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-neutral-500">{selectedTab === "Events" ? "Workshops, AMAs, study sessions, and community calls will live here when group events are enabled." : "Projects and collaborator opportunities will appear here when group project management is enabled."}</p>
            </CardBody></Card>
          ) : null}

          {selectedTab === "About" ? (
            <Card><CardBody className="p-5"><h2 className="scout-group-section-title">About {space.name}</h2><p className="mt-3 text-sm leading-6 text-neutral-600">{space.description}</p><dl className="scout-group-info mt-4"><div><dt>Group type</dt><dd>{space.visibility}</dd></div><div><dt>Category</dt><dd>{space.category}</dd></div><div><dt>Purpose</dt><dd>{space.purpose}</dd></div><div><dt>Language</dt><dd>{space.language}</dd></div><div><dt>Location</dt><dd>{space.countryCode ?? "Global"}</dd></div></dl></CardBody></Card>
          ) : null}
        </>
      )}
    </div>
  );
}
