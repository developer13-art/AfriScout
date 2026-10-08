import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, Clock3, ExternalLink, LockKeyhole, MapPin, MoreHorizontal, Plus, Rocket, Search, Share2, Sparkles, Users, UsersRound } from "lucide-react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { SafeImage } from "../../components/ui/SafeImage";
import { Card, CardBody } from "../../components/ui/Card";
import { Loader } from "../../components/ui/Loader";
import { SeoHead } from "../../components/common/SeoHead";
import { communityService, type CommunityKind } from "../../services/community.service";
import { CommunitySubnav } from "../../components/community/CommunitySubnav";
import { ImageUploadField } from "../../components/community/ImageUploadField";
import { PostCard } from "./Community";
import { useAuthStore } from "../../stores/authStore";

const groupTabs = ["Overview", "Discussions", "Opportunities", "Members", "Events", "Projects", "Achievements", "About"] as const;
type GroupTab = typeof groupTabs[number];

function formatTab(tab: string | null): GroupTab {
  return groupTabs.find((item) => item.toLowerCase() === tab?.toLowerCase()) ?? "Overview";
}

export function CommunityGroup() {
  const { slug = "" } = useParams();
  const viewerId = useAuthStore((state) => state.user?.id);
  const [params, setParams] = useSearchParams();
  const client = useQueryClient();
  const selectedTab = formatTab(params.get("view"));
  const [query, setQuery] = useState("");
  const [memberStatus, setMemberStatus] = useState<"ACTIVE" | "PENDING" | "MUTED" | "SUSPENDED" | "BANNED">("ACTIVE");
  const [memberType, setMemberType] = useState<"" | "DEVELOPERS" | "FOUNDERS" | "STUDENTS" | "RESEARCHERS" | "ORGANIZATIONS" | "CONTRIBUTORS">("");
  const [connectionRequested, setConnectionRequested] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [postKind, setPostKind] = useState<CommunityKind>("GENERAL");
  const [opportunitySearch, setOpportunitySearch] = useState("");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState("");
  const [joinAnswers, setJoinAnswers] = useState<string[]>([]);
  const [eventDraft, setEventDraft] = useState({ title: "", description: "", kind: "WORKSHOP", startsAt: "", endsAt: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, location: "", meetingUrl: "", capacity: "" });
  const [projectDraft, setProjectDraft] = useState({ title: "", description: "", skillsNeeded: "" });
  const [collaborationRole, setCollaborationRole] = useState("DEVELOPER");
  const [inviteExpiry, setInviteExpiry] = useState("30");
  const [inviteMaxUses, setInviteMaxUses] = useState("25");
  const [inviteApproval, setInviteApproval] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [editGroup, setEditGroup] = useState(false);
  const [groupImages, setGroupImages] = useState({ profileImageUrl: "", coverImageUrl: "" });
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
    queryKey: ["community-space-members", slug, query, memberStatus, memberType],
    queryFn: () => communityService.spaceMembers(slug, query, memberStatus, memberType || undefined),
    enabled: Boolean(slug) && selectedTab === "Members",
  });
  const viewerProfile = useQuery({
    queryKey: ["community-profile", viewerId],
    queryFn: () => communityService.profile(viewerId ?? ""),
    enabled: Boolean(viewerId) && selectedTab === "Members",
  });
  const opportunities = useQuery({
    queryKey: ["community-group-opportunity-search", opportunitySearch],
    queryFn: () => communityService.searchOpportunities(opportunitySearch),
    enabled: opportunitySearch.trim().length >= 2,
  });
  const events = useQuery({
    queryKey: ["community-space-events", slug],
    queryFn: () => communityService.spaceEvents(slug),
    enabled: Boolean(slug) && selectedTab === "Events",
  });
  const projects = useQuery({
    queryKey: ["community-space-projects", slug],
    queryFn: () => communityService.spaceProjects(slug),
    enabled: Boolean(slug) && selectedTab === "Projects",
  });
  const verifiedAchievements = useQuery({
    queryKey: ["community-space-achievements", slug],
    queryFn: () => communityService.spaceAchievements(slug),
    enabled: Boolean(slug) && selectedTab === "Achievements",
  });
  const invites = useQuery({
    queryKey: ["community-space-invites", slug],
    queryFn: () => communityService.spaceInvites(slug),
    enabled: Boolean(slug) && selectedTab === "About" && ["OWNER", "ADMIN", "MODERATOR"].includes(group.data?.role ?? ""),
  });
  const reports = useQuery({
    queryKey: ["community-space-reports", slug],
    queryFn: () => communityService.spaceReports(slug),
    enabled: Boolean(slug) && selectedTab === "About" && ["OWNER", "ADMIN", "MODERATOR"].includes(group.data?.role ?? ""),
  });
  const join = useMutation({
    mutationFn: () => communityService.joinSpace(slug, joinAnswers),
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
    mutationFn: () => communityService.createPost(draft, postKind, selectedOpportunityId || undefined, slug),
    onSuccess: async () => {
      setDraft("");
      setSelectedOpportunityId("");
      setOpportunitySearch("");
      await client.invalidateQueries({ queryKey: ["community-feed", "group", slug] });
      await client.invalidateQueries({ queryKey: ["community-space", slug] });
    },
  });
  const moderateMember = useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: "APPROVE" | "REJECT" | "MUTE" | "UNMUTE" | "SUSPEND" | "UNSUSPEND" | "BAN" | "UNBAN" | "PROMOTE_MODERATOR" | "DEMOTE_MODERATOR" | "PROMOTE_ADMIN" | "DEMOTE_ADMIN" | "PROMOTE_CONTRIBUTOR" | "DEMOTE_CONTRIBUTOR" }) =>
      communityService.moderateSpaceMember(slug, userId, action),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["community-space-members", slug] }),
        client.invalidateQueries({ queryKey: ["community-space", slug] }),
      ]);
    },
  });
  const connectMember = useMutation({
    mutationFn: (memberId: string) => communityService.requestConnection(memberId),
    onSuccess: (_, memberId) => setConnectionRequested((current) => [...new Set([...current, memberId])]),
  });
  const createEvent = useMutation({
    mutationFn: () => communityService.createSpaceEvent(slug, {
      title: eventDraft.title.trim(), description: eventDraft.description.trim(), kind: eventDraft.kind,
      startsAt: new Date(eventDraft.startsAt).toISOString(),
      endsAt: eventDraft.endsAt ? new Date(eventDraft.endsAt).toISOString() : null,
      timezone: eventDraft.timezone, location: eventDraft.location.trim() || undefined,
      meetingUrl: eventDraft.meetingUrl.trim() || undefined,
      capacity: eventDraft.capacity ? Number(eventDraft.capacity) : undefined,
    }),
    onSuccess: async () => {
      setEventDraft((current) => ({ ...current, title: "", description: "", startsAt: "", endsAt: "", location: "", meetingUrl: "", capacity: "" }));
      await client.invalidateQueries({ queryKey: ["community-space-events", slug] });
    },
  });
  const rsvp = useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: "GOING" | "INTERESTED" | null }) => communityService.rsvpSpaceEvent(slug, eventId, status),
    onSuccess: () => client.invalidateQueries({ queryKey: ["community-space-events", slug] }),
  });
  const eventStatus = useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: "SCHEDULED" | "CANCELLED" | "COMPLETED" }) =>
      communityService.updateSpaceEvent(slug, eventId, { status }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["community-space-events", slug] }),
  });
  const createProject = useMutation({
    mutationFn: () => communityService.createSpaceProject(slug, {
      title: projectDraft.title.trim(), description: projectDraft.description.trim(),
      skillsNeeded: [...new Set(projectDraft.skillsNeeded.split(",").map((skill) => skill.trim()).filter(Boolean))],
    }),
    onSuccess: async () => {
      setProjectDraft({ title: "", description: "", skillsNeeded: "" });
      await client.invalidateQueries({ queryKey: ["community-space-projects", slug] });
    },
  });
  const joinProject = useMutation({
    mutationFn: ({ projectId, role }: { projectId: string; role: string }) => communityService.joinSpaceProject(slug, projectId, role),
    onSuccess: () => client.invalidateQueries({ queryKey: ["community-space-projects", slug] }),
  });
  const leaveProject = useMutation({
    mutationFn: (projectId: string) => communityService.leaveSpaceProject(slug, projectId),
    onSuccess: () => client.invalidateQueries({ queryKey: ["community-space-projects", slug] }),
  });
  const projectStatus = useMutation({
    mutationFn: ({ projectId, status }: { projectId: string; status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED" }) =>
      communityService.updateSpaceProject(slug, projectId, { status }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["community-space-projects", slug] }),
  });
  const updateGroup = useMutation({
    mutationFn: (input: Parameters<typeof communityService.updateSpace>[1]) => communityService.updateSpace(slug, input),
    onSuccess: async () => {
      setEditGroup(false);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["community-space", slug] }),
        client.invalidateQueries({ queryKey: ["community-spaces"] }),
      ]);
    },
  });
  const createInvite = useMutation({
    mutationFn: () => communityService.createSpaceInvite(slug, {
      expiresInDays: Number(inviteExpiry) || undefined,
      maxUses: Number(inviteMaxUses) || undefined,
      approvalRequired: inviteApproval,
    }),
    onSuccess: async (invite) => {
      const url = `${window.location.origin}/community/invite/${invite.token}`;
      setInviteLink(url);
      await client.invalidateQueries({ queryKey: ["community-space-invites", slug] });
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } catch {
        window.prompt("Copy this group invitation", url);
      }
    },
  });
  const revokeInvite = useMutation({
    mutationFn: (inviteId: string) => communityService.revokeSpaceInvite(slug, inviteId),
    onSuccess: () => client.invalidateQueries({ queryKey: ["community-space-invites", slug] }),
  });
  const moderateReport = useMutation({
    mutationFn: ({ reportId, action }: { reportId: string; action: "RESOLVE" | "DISMISS" | "LOCK_POST" | "UNLOCK_POST" | "REMOVE_CONTENT" }) =>
      communityService.moderateSpaceReport(slug, reportId, action),
    onSuccess: () => client.invalidateQueries({ queryKey: ["community-space-reports", slug] }),
  });
  const transferOwnership = useMutation({
    mutationFn: (targetUserId: string) => communityService.transferSpaceOwnership(slug, targetUserId),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["community-space", slug] }),
        client.invalidateQueries({ queryKey: ["community-space-members", slug] }),
      ]);
    },
  });
  const deleteGroup = useMutation({
    mutationFn: () => communityService.deleteSpace(slug),
    onSuccess: () => window.location.assign("/community/groups"),
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
  const shareEvent = async (eventId: string) => {
    const url = `${window.location.origin}/community/groups/${encodeURIComponent(slug)}?view=events#${encodeURIComponent(eventId)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this event link", url);
    }
  };
  const submitPost = (event: FormEvent) => {
    event.preventDefault();
    if (draft.trim()) createPost.mutate();
  };
  const submitEvent = (event: FormEvent) => {
    event.preventDefault();
    if (eventDraft.title.trim() && eventDraft.description.trim() && eventDraft.startsAt) createEvent.mutate();
  };
  const submitProject = (event: FormEvent) => {
    event.preventDefault();
    if (projectDraft.title.trim() && projectDraft.description.trim()) createProject.mutate();
  };
  const submitGroupUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input: Parameters<typeof communityService.updateSpace>[1] = {
      name: String(data.get("name") ?? "").trim(),
      description: String(data.get("description") ?? "").trim(),
      category: String(data.get("category") ?? "").trim(),
      purpose: String(data.get("purpose") ?? ""),
      countryCode: String(data.get("countryCode") ?? "").trim().toUpperCase() || null,
      language: String(data.get("language") ?? "").trim(),
      profileImageUrl: groupImages.profileImageUrl || null,
      coverImageUrl: groupImages.coverImageUrl || null,
      topics: String(data.get("topics") ?? "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12),
    };
    const visibility = data.get("visibility");
    if (visibility === "PUBLIC" || visibility === "PRIVATE" || visibility === "HIDDEN") input.visibility = visibility;
    const questions = data.get("joinQuestions");
    if (questions !== null) input.joinQuestions = String(questions).split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 5);
    updateGroup.mutate(input);
  };
  const setTab = (tab: GroupTab) => setParams(tab === "Overview" ? {} : { view: tab.toLowerCase() });
  const refreshPosts = () => {
    void client.invalidateQueries({ queryKey: ["community-feed", "group", slug] });
    void client.invalidateQueries({ queryKey: ["community-space", slug] });
  };

  if (group.isLoading) return <div className="scout-social-shell scout-community-page"><Loader label="Opening group" /></div>;
  if (group.isError || !group.data) return (
    <div className="scout-social-shell scout-community-page">
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
  const isMuted = space.membershipStatus === "MUTED";
  const hasGroupContentAccess = isMember || isMuted;
  const isPending = space.membershipStatus === "PENDING";
  const canModerateMembers = ["OWNER", "ADMIN", "MODERATOR"].includes(space.role ?? "");
  const canManageRoles = space.role === "OWNER" || space.role === "ADMIN";
  const displayedPosts = posts.data ?? space.posts;
  const opportunityPosts = displayedPosts.filter((post) => post.opportunity);
  const achievementPosts = displayedPosts.filter((post) => post.kind === "ACHIEVEMENT");
  const viewerTokens = new Set([
    ...(viewerProfile.data?.skills ?? []),
    ...(viewerProfile.data?.interests ?? []),
    ...(viewerProfile.data?.industries ?? []),
  ].map((token) => token.trim().toLowerCase()).filter(Boolean));
  const memberMatches = new Map((members.data ?? []).map((member) => {
    const tokens = new Set([
      ...(member.professionalProfile?.skills ?? []),
      ...(member.profile?.interests ?? []),
      ...(member.profile?.industries ?? []),
    ].map((token) => token.trim().toLowerCase()).filter(Boolean));
    const shared = [...viewerTokens].filter((token) => tokens.has(token));
    const sameRegion = Boolean(member.countryCode && member.countryCode === viewerProfile.data?.countryCode);
    const score = viewerProfile.data
      ? Math.min(100, Math.round((shared.length / Math.max(1, viewerTokens.size)) * 80 + (sameRegion ? 20 : 0)))
      : null;
    return [member.id, { score, shared, sameRegion }] as const;
  }));

  return (
    <div className="scout-social-shell scout-community-page scout-group-page">
      <SeoHead title={space.name} description={space.description ?? undefined} />
      <CommunitySubnav />
      <section className="scout-group-header">
        <div className="scout-group-cover" style={space.coverImageUrl ? { backgroundImage: `linear-gradient(90deg, rgb(4 17 30 / 25%), rgb(4 17 30 / 5%)), url("${space.coverImageUrl}")` } : undefined} />
        <div className="scout-group-identity">
          <span className="scout-group-avatar">
            <SafeImage
              src={space.profileImageUrl}
              alt=""
              className="h-full w-full object-cover"
              fallback={<UsersRound aria-hidden />}
              fallbackClassName="grid h-full w-full place-items-center"
            />
          </span>
          <div className="scout-group-title">
            <div className="flex flex-wrap items-center gap-2">
              <h1>{space.name}</h1>
              <Badge tone="neutral">Scout Group</Badge>
            </div>
            <p>{space.memberCount.toLocaleString()} members · {space.visibility.toLowerCase()} · {space.countryCode ?? "Global"} · {space.language}</p>
            <p className="scout-group-description">{space.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{space.topics.map((topic) => <span className="scout-topic-chip" key={topic}>{topic}</span>)}</div>
          </div>
          <div className="scout-group-header-actions">
            {hasGroupContentAccess ? <Button variant="outline" onClick={() => leave.mutate()} loading={leave.isPending}>{isMuted ? "Muted · Leave" : "Joined"}</Button> : (
              <Button onClick={() => join.mutate()} loading={join.isPending} disabled={isPending}>
                {isPending ? "Request pending" : space.visibility === "PRIVATE" ? "Request to join" : "Join group"}
              </Button>
            )}
            {canModerateMembers ? <Button variant="outline" onClick={() => createInvite.mutate()} loading={createInvite.isPending} leftIcon={<Users className="h-4 w-4" />}>Create invite</Button> : null}
            <Button variant="outline" onClick={() => void share()} leftIcon={copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}>{copied ? "Copied" : "Share"}</Button>
            <button type="button" onClick={() => void share()} aria-label="More group actions" className="scout-group-more"><MoreHorizontal className="h-4 w-4" /></button>
          </div>
        </div>
      </section>

      {join.isError || leave.isError ? <p role="alert" className="mb-3 text-sm text-red-500">The group membership action could not be completed. Please try again.</p> : null}
      {createInvite.isError ? <p role="alert" className="mb-3 text-sm text-red-500">An invitation link could not be created.</p> : null}
      {inviteLink ? <p className="mb-3 break-all rounded-lg border border-primary-200 bg-primary-50 p-3 text-xs text-primary-800">Invite link {copied ? "copied" : "created"}: {inviteLink}</p> : null}
      <nav className="scout-group-tabs" aria-label="Group sections">
        {groupTabs.map((tab) => <button key={tab} type="button" onClick={() => setTab(tab)} className={selectedTab === tab ? "is-active" : ""}>{tab}</button>)}
      </nav>

      {!hasGroupContentAccess && space.visibility !== "PUBLIC" ? (
        <Card><CardBody className="p-8 text-center">
          <LockKeyhole className="mx-auto h-7 w-7 text-primary-700" />
          <h2 className="mt-3 font-semibold text-neutral-900">{isPending ? "Your request is awaiting approval" : "Join this group to see the community"}</h2>
          <p className="mt-1 text-sm text-neutral-500">{isPending ? "A group moderator will review your request." : "Members can access group discussions, opportunities, and people."}</p>
          {!isPending ? (
            <div className="mx-auto mt-4 max-w-lg space-y-3 text-left">
              {(space.joinQuestions ?? []).map((question, index) => (
                <label className="scout-group-field" key={`${index}-${question}`}>{question}
                  <textarea rows={2} maxLength={1000} value={joinAnswers[index] ?? ""} onChange={(event) => setJoinAnswers((current) => {
                    const next = [...current];
                    next[index] = event.target.value;
                    return next;
                  })} />
                </label>
              ))}
              <Button className="w-full" onClick={() => join.mutate()} loading={join.isPending} disabled={(space.joinQuestions ?? []).some((_, index) => !joinAnswers[index]?.trim())}>
                {space.visibility === "PRIVATE" ? "Request to join" : "Join group"}
              </Button>
            </div>
          ) : null}
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
                      <option value="GENERAL">General post</option>{canModerateMembers ? <option value="ANNOUNCEMENT">Official announcement</option> : null}<option value="QUESTION">Question</option>
                      <option value="OPPORTUNITY_DISCUSSION">Opportunity</option><option value="INDUSTRY_DISCUSSION">Collaboration</option>
                      <option value="ACHIEVEMENT">Achievement</option><option value="PROJECT_ANNOUNCEMENT">Project</option>
                    </select>
                    <span className="scout-group-compose-note">Official opportunity details stay separate from member discussion.</span>
                  </div>
                  <textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={5000} rows={3} placeholder="Share something with the group…" />
                  {postKind === "OPPORTUNITY_DISCUSSION" ? (
                    <div className="space-y-2">
                      <label className="scout-group-member-search"><Search aria-hidden className="h-4 w-4" /><span className="sr-only">Find an official Scout opportunity</span><input value={opportunitySearch} onChange={(event) => setOpportunitySearch(event.target.value)} placeholder="Attach an official Scout opportunity…" /></label>
                      {selectedOpportunityId ? <p className="text-xs text-primary-700">Opportunity attached. Official listing details are kept separate from this discussion.</p> : null}
                      {opportunities.isError ? <p role="alert" className="text-xs text-red-500">Opportunities could not be searched.</p> : null}
                      {opportunities.data?.length ? (
                        <div className="max-h-40 overflow-y-auto rounded-lg border border-neutral-200">
                          {opportunities.data.slice(0, 6).map((opportunity) => (
                            <button type="button" key={opportunity.id} onClick={() => { setSelectedOpportunityId(opportunity.id); setOpportunitySearch(opportunity.title); }} className="block w-full border-b border-neutral-100 px-3 py-2 text-left last:border-0 hover:bg-neutral-50">
                              <span className="block text-xs font-semibold text-neutral-900">{opportunity.title}</span><span className="text-[10px] text-neutral-500">{opportunity.category}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
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
              <label className="scout-group-member-search"><Search aria-hidden className="h-4 w-4" /><span className="sr-only">Search group members</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, skill, country, or industry…" /></label>
              <label className="scout-group-field mb-3 mt-2 max-w-xs">Filter members
                <select value={memberType} onChange={(event) => setMemberType(event.target.value as typeof memberType)}>
                  <option value="">Everyone</option><option value="DEVELOPERS">Developers</option><option value="FOUNDERS">Founders</option><option value="STUDENTS">Students</option><option value="RESEARCHERS">Researchers</option><option value="ORGANIZATIONS">Organizations</option><option value="CONTRIBUTORS">Contributors</option>
                </select>
              </label>
              {canModerateMembers ? (
                <div className="mb-3 flex gap-2" aria-label="Member status filter">
                  {(["ACTIVE", "PENDING", "MUTED", "SUSPENDED", "BANNED"] as const).map((status) => (
                    <Button key={status} size="sm" variant={memberStatus === status ? "primary" : "outline"} onClick={() => setMemberStatus(status)}>
                      {status === "ACTIVE" ? "Members" : status === "PENDING" ? "Join requests" : status.toLowerCase()}
                    </Button>
                  ))}
                </div>
              ) : null}
              {members.isLoading ? <Loader label="Finding group members" /> : null}
              {members.isError ? <Card><CardBody className="text-sm text-red-500">Group members could not be loaded.</CardBody></Card> : null}
              {viewerProfile.isError ? <p role="status" className="mb-2 text-xs text-neutral-500">Collaboration matching is unavailable until your profile loads.</p> : null}
              {moderateMember.isError ? <p role="alert" className="mb-3 text-sm text-red-500">That member action could not be completed.</p> : null}
              {connectMember.isError ? <p role="alert" className="mb-3 text-sm text-red-500">A connection request could not be sent.</p> : null}
              <div className="scout-group-members-list">
                {members.data?.map((member) => (
                  <Card key={member.id}><CardBody className="flex items-center gap-3 p-3">
                    <Avatar name={member.fullName} src={member.avatarUrl} size="md" />
                    <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-neutral-900">{member.fullName}</p><p className="truncate text-[10px] text-neutral-500">{member.profile?.headline ?? member.professionalProfile?.profession ?? member.role.toLowerCase()} · {member.countryCode ?? "Global"}</p><p className="truncate text-[10px] text-primary-700">{member.professionalProfile?.skills?.slice(0, 3).join(" · ")}</p>{memberMatches.get(member.id)?.score !== null && memberMatches.get(member.id)?.score !== undefined ? <p className="mt-1 text-[10px] font-semibold text-primary-700">{memberMatches.get(member.id)?.score}% collaboration match{memberMatches.get(member.id)?.shared.length ? ` · shared: ${memberMatches.get(member.id)?.shared.slice(0, 3).join(", ")}` : memberMatches.get(member.id)?.sameRegion ? " · same region" : ""}</p> : null}</div>
                    <div className="flex flex-col items-end gap-1"><Badge tone={member.role === "OWNER" || member.role === "ADMIN" ? "primary" : "neutral"}>{member.role.toLowerCase()}</Badge><Badge tone={member.status === "ACTIVE" ? "success" : "neutral"}>{member.status.toLowerCase()}</Badge></div>
                    {memberStatus === "PENDING" && member.joinAnswers?.length ? <div className="basis-full rounded-lg bg-neutral-100 p-2 text-[10px] text-neutral-600">{(space.joinQuestions ?? []).map((question, index) => <p key={`${question}-${index}`}><strong>{question}</strong> {member.joinAnswers?.[index] ?? "—"}</p>)}</div> : null}
                    {canModerateMembers ? (
                      <div className="flex flex-wrap justify-end gap-1">
                        {memberStatus === "PENDING" ? <>
                          <Button size="sm" onClick={() => moderateMember.mutate({ userId: member.id, action: "APPROVE" })} loading={moderateMember.isPending}>Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => moderateMember.mutate({ userId: member.id, action: "REJECT" })} disabled={moderateMember.isPending}>Reject</Button>
                        </> : null}
                        {memberStatus === "MUTED" ? <Button size="sm" variant="outline" onClick={() => moderateMember.mutate({ userId: member.id, action: "UNMUTE" })} disabled={moderateMember.isPending}>Unmute</Button> : null}
                        {memberStatus === "SUSPENDED" && canManageRoles ? <Button size="sm" variant="outline" onClick={() => moderateMember.mutate({ userId: member.id, action: "UNSUSPEND" })} disabled={moderateMember.isPending}>Restore</Button> : null}
                        {memberStatus === "BANNED" && canManageRoles ? <Button size="sm" variant="outline" onClick={() => moderateMember.mutate({ userId: member.id, action: "UNBAN" })} disabled={moderateMember.isPending}>Unban</Button> : null}
                        {memberStatus === "ACTIVE" && canManageRoles && member.role === "MEMBER" ? <Button size="sm" variant="outline" onClick={() => moderateMember.mutate({ userId: member.id, action: "PROMOTE_MODERATOR" })} disabled={moderateMember.isPending}>Make moderator</Button> : null}
                        {memberStatus === "ACTIVE" && canManageRoles && member.role === "MODERATOR" ? <Button size="sm" variant="outline" onClick={() => moderateMember.mutate({ userId: member.id, action: "DEMOTE_MODERATOR" })} disabled={moderateMember.isPending}>Remove moderator</Button> : null}
                        {memberStatus === "ACTIVE" && canManageRoles && member.role === "MEMBER" ? <Button size="sm" variant="outline" onClick={() => moderateMember.mutate({ userId: member.id, action: "PROMOTE_CONTRIBUTOR" })} disabled={moderateMember.isPending}>Make contributor</Button> : null}
                        {memberStatus === "ACTIVE" && canManageRoles && member.role === "CONTRIBUTOR" ? <Button size="sm" variant="outline" onClick={() => moderateMember.mutate({ userId: member.id, action: "DEMOTE_CONTRIBUTOR" })} disabled={moderateMember.isPending}>Remove contributor</Button> : null}
                        {memberStatus === "ACTIVE" && space.role === "OWNER" && member.role !== "OWNER" && member.role !== "ADMIN" ? <Button size="sm" variant="outline" onClick={() => moderateMember.mutate({ userId: member.id, action: "PROMOTE_ADMIN" })} disabled={moderateMember.isPending}>Make admin</Button> : null}
                        {memberStatus === "ACTIVE" && space.role === "OWNER" && member.role === "ADMIN" ? <Button size="sm" variant="outline" onClick={() => moderateMember.mutate({ userId: member.id, action: "DEMOTE_ADMIN" })} disabled={moderateMember.isPending}>Remove admin</Button> : null}
                        {memberStatus === "ACTIVE" && canModerateMembers && member.role !== "OWNER" && member.role !== "ADMIN" ? <Button size="sm" variant="outline" onClick={() => moderateMember.mutate({ userId: member.id, action: "MUTE" })} disabled={moderateMember.isPending}>Mute</Button> : null}
                        {memberStatus === "ACTIVE" && canManageRoles && member.role !== "OWNER" && member.role !== "ADMIN" ? <Button size="sm" variant="outline" onClick={() => moderateMember.mutate({ userId: member.id, action: "SUSPEND" })} disabled={moderateMember.isPending}>Suspend</Button> : null}
                        {memberStatus === "ACTIVE" && canManageRoles && member.role !== "OWNER" && member.role !== "ADMIN" ? <Button size="sm" variant="outline" onClick={() => moderateMember.mutate({ userId: member.id, action: "BAN" })} disabled={moderateMember.isPending}>Ban</Button> : null}
                        {space.role === "OWNER" && memberStatus === "ACTIVE" && member.id !== viewerId && member.role !== "OWNER" ? <Button size="sm" variant="outline" onClick={() => {
                          if (window.confirm(`Transfer group ownership to ${member.fullName}? You will become an admin.`)) transferOwnership.mutate(member.id);
                        }} loading={transferOwnership.isPending}>Transfer ownership</Button> : null}
                      </div>
                    ) : null}
                    {isMember && memberStatus === "ACTIVE" && member.id !== viewerId ? <div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => connectMember.mutate(member.id)} disabled={connectMember.isPending || connectionRequested.includes(member.id)}>{connectionRequested.includes(member.id) ? "Requested" : "Connect"}</Button><Button size="sm" variant="outline" onClick={() => setTab("Projects")}>Collaborate</Button></div> : null}
                  </CardBody></Card>
                ))}
                {!members.isLoading && !members.isError && !members.data?.length ? <Card><CardBody className="p-8 text-center text-sm text-neutral-500">No members match that search.</CardBody></Card> : null}
              </div>
            </div>
          ) : null}

          {selectedTab === "Achievements" ? (
            <div className="space-y-3">
              {verifiedAchievements.isLoading ? <Loader label="Loading verified group achievements" /> : null}
              {verifiedAchievements.isError ? <Card><CardBody className="text-sm text-red-500">Verified achievements could not be loaded.</CardBody></Card> : null}
              {verifiedAchievements.data?.map((achievement) => (
                <Card key={achievement.id}><CardBody className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div><Badge tone="success">Verified Scout achievement</Badge><h2 className="mt-2 text-sm font-semibold text-neutral-900">{achievement.title}</h2><p className="mt-1 text-xs text-neutral-500">{achievement.user.fullName} · issued by {achievement.organization.name} · {new Date(achievement.issuedAt).toLocaleDateString()}</p>{achievement.description ? <p className="mt-2 text-xs leading-5 text-neutral-600">{achievement.description}</p> : null}</div>
                  <Link to={`/opportunities/${encodeURIComponent(achievement.opportunity.slug)}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700">View opportunity <ArrowUpRight className="h-3.5 w-3.5" /></Link>
                </CardBody></Card>
              ))}
              {!verifiedAchievements.isLoading && !verifiedAchievements.isError && !verifiedAchievements.data?.length ? <Card><CardBody className="p-6 text-center text-xs text-neutral-500">No verified achievements from current group members yet. Scout does not assign achievement credit based on membership alone.</CardBody></Card> : null}
              {achievementPosts.length ? <><h2 className="pt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Member-shared milestones · not verified</h2>{achievementPosts.map((post) => <PostCard key={post.id} post={post} onRefresh={refreshPosts} />)}</> : null}
            </div>
          ) : null}

          {selectedTab === "Events" ? (
            <div className="space-y-4">
              {isMember ? (
                <form className="scout-group-compose space-y-3" onSubmit={submitEvent}>
                  <h2 className="scout-group-section-title">Create a group event</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="scout-group-field">Event name<input required minLength={3} maxLength={120} value={eventDraft.title} onChange={(event) => setEventDraft({ ...eventDraft, title: event.target.value })} placeholder="Solana Builders AMA" /></label>
                    <label className="scout-group-field">Event type<select value={eventDraft.kind} onChange={(event) => setEventDraft({ ...eventDraft, kind: event.target.value })}>{["WORKSHOP", "AMA", "HACKATHON", "STUDY_SESSION", "MEETING", "NETWORKING", "DEMO", "OTHER"].map((kind) => <option key={kind} value={kind}>{kind.replaceAll("_", " ").toLowerCase()}</option>)}</select></label>
                    <label className="scout-group-field">Starts at<input type="datetime-local" required value={eventDraft.startsAt} onChange={(event) => setEventDraft({ ...eventDraft, startsAt: event.target.value })} /></label>
                    <label className="scout-group-field">Ends at<input type="datetime-local" value={eventDraft.endsAt} onChange={(event) => setEventDraft({ ...eventDraft, endsAt: event.target.value })} /></label>
                    <label className="scout-group-field">Timezone<input required maxLength={80} value={eventDraft.timezone} onChange={(event) => setEventDraft({ ...eventDraft, timezone: event.target.value })} /></label>
                    <label className="scout-group-field">Location<input maxLength={300} value={eventDraft.location} onChange={(event) => setEventDraft({ ...eventDraft, location: event.target.value })} placeholder="Online or city" /></label>
                    <label className="scout-group-field">Meeting link<input type="url" value={eventDraft.meetingUrl} onChange={(event) => setEventDraft({ ...eventDraft, meetingUrl: event.target.value })} placeholder="https://…" /></label>
                    <label className="scout-group-field">Capacity<input type="number" min={1} max={100000} value={eventDraft.capacity} onChange={(event) => setEventDraft({ ...eventDraft, capacity: event.target.value })} placeholder="Unlimited" /></label>
                    <label className="scout-group-field sm:col-span-2">Description<textarea required rows={2} maxLength={3000} value={eventDraft.description} onChange={(event) => setEventDraft({ ...eventDraft, description: event.target.value })} /></label>
                  </div>
                  {createEvent.isError ? <p role="alert" className="text-xs text-red-500">The event could not be created. Check its dates and try again.</p> : null}
                  <div className="flex justify-end"><Button size="sm" type="submit" loading={createEvent.isPending} leftIcon={<CalendarDays className="h-4 w-4" />}>Publish event</Button></div>
                </form>
              ) : null}
              {events.isLoading ? <Loader label="Loading group events" /> : null}
              {events.isError ? <Card><CardBody className="text-sm text-red-500">Group events could not be loaded.</CardBody></Card> : null}
              {rsvp.isError || eventStatus.isError ? <p role="alert" className="text-sm text-red-500">Your RSVP or event action could not be saved.</p> : null}
              {events.data?.map((event) => (
                <div key={event.id} id={event.id}>
                <Card><CardBody className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><Badge tone={event.status === "SCHEDULED" ? "success" : "neutral"}>{event.status.toLowerCase()}</Badge><Badge tone="neutral">{event.kind.replaceAll("_", " ").toLowerCase()}</Badge></div>
                      <h2 className="mt-2 text-base font-semibold text-neutral-900">{event.title}</h2>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-neutral-600">{event.description}</p>
                    </div>
                    {isMember && event.status === "SCHEDULED" ? (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant={event.myRsvp === "GOING" ? "primary" : "outline"} onClick={() => rsvp.mutate({ eventId: event.id, status: event.myRsvp === "GOING" ? null : "GOING" })} loading={rsvp.isPending} disabled={Boolean(event.capacity && event.going >= event.capacity && event.myRsvp !== "GOING")}>Going</Button>
                        <Button size="sm" variant={event.myRsvp === "INTERESTED" ? "primary" : "outline"} onClick={() => rsvp.mutate({ eventId: event.id, status: event.myRsvp === "INTERESTED" ? null : "INTERESTED" })} loading={rsvp.isPending}>Interested</Button>
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-500">
                    <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{new Date(event.startsAt).toLocaleString()} · {event.timezone}</span>
                    {event.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.location}</span> : null}
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{event.going}{event.capacity ? ` / ${event.capacity}` : ""} going · {event.interested} interested</span>
                    {event.meetingUrl ? <a href={event.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary-700">Join online <ExternalLink className="h-3 w-3" /></a> : null}
                    <button type="button" onClick={() => void shareEvent(event.id)} className="inline-flex items-center gap-1 text-primary-700"><Share2 className="h-3 w-3" />Share</button>
                  </div>
                  {isMember && (canModerateMembers || event.creator.id === viewerId) && event.status === "SCHEDULED" ? <Button size="sm" variant="outline" className="mt-3" onClick={() => eventStatus.mutate({ eventId: event.id, status: "CANCELLED" })}>Cancel event</Button> : null}
                </CardBody></Card>
                </div>
              ))}
              {!events.isLoading && !events.isError && !events.data?.length ? <Card><CardBody className="p-8 text-center text-sm text-neutral-500">No upcoming events yet. Create a workshop, AMA, study session, or community call.</CardBody></Card> : null}
            </div>
          ) : null}

          {selectedTab === "Projects" ? (
            <div className="space-y-4">
              {isMember ? (
                <form className="scout-group-compose space-y-3" onSubmit={submitProject}>
                  <h2 className="scout-group-section-title">Start a group project</h2>
                  <label className="scout-group-field">Project name<input required minLength={3} maxLength={120} value={projectDraft.title} onChange={(event) => setProjectDraft({ ...projectDraft, title: event.target.value })} placeholder="AI-powered DePIN marketplace" /></label>
                  <label className="scout-group-field">What are you building?<textarea required rows={3} maxLength={3000} value={projectDraft.description} onChange={(event) => setProjectDraft({ ...projectDraft, description: event.target.value })} /></label>
                  <label className="scout-group-field">Skills needed<input value={projectDraft.skillsNeeded} onChange={(event) => setProjectDraft({ ...projectDraft, skillsNeeded: event.target.value })} placeholder="Rust, Solana, Product Design" /><small>Separate skills with commas.</small></label>
                  {createProject.isError ? <p role="alert" className="text-xs text-red-500">The project could not be created.</p> : null}
                  <div className="flex justify-end"><Button size="sm" type="submit" loading={createProject.isPending} leftIcon={<Rocket className="h-4 w-4" />}>Create project</Button></div>
                </form>
              ) : null}
              {projects.isLoading ? <Loader label="Loading group projects" /> : null}
              {projects.isError ? <Card><CardBody className="text-sm text-red-500">Group projects could not be loaded.</CardBody></Card> : null}
              {projects.data?.map((project) => (
                <Card key={project.id}><CardBody className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge tone={project.status === "OPEN" ? "success" : "neutral"}>{project.status.replaceAll("_", " ").toLowerCase()}</Badge><span className="text-xs text-neutral-500">Started by {project.creator.fullName}</span></div><h2 className="mt-2 text-base font-semibold text-neutral-900">{project.title}</h2><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-neutral-600">{project.description}</p>
                      {project.skillsNeeded.length ? <div className="mt-3 flex flex-wrap gap-1.5">{project.skillsNeeded.map((skill) => <span key={skill} className="scout-topic-chip">{skill}</span>)}</div> : null}
                    </div>
                    <span className="text-xs text-neutral-500">{project.memberCount} collaborators</span>
                  </div>
                  {project.members.length ? <div className="mt-3 flex flex-wrap gap-2">{project.members.map((member) => <span key={member.id} className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] text-neutral-600">{member.user?.fullName ?? member.role} · {member.role.toLowerCase()}</span>)}</div> : null}
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-3">
                    {!project.joined && project.status === "OPEN" ? <><select aria-label={`Your role in ${project.title}`} value={collaborationRole} onChange={(event) => setCollaborationRole(event.target.value)} className="rounded-lg border border-neutral-200 px-2 py-1.5 text-xs">{["FOUNDER", "DEVELOPER", "DESIGNER", "RESEARCHER", "MARKETING", "COMMUNITY", "CONTRIBUTOR"].filter((role) => role !== "FOUNDER").map((role) => <option key={role} value={role}>{role.toLowerCase()}</option>)}</select><Button size="sm" onClick={() => joinProject.mutate({ projectId: project.id, role: collaborationRole })} loading={joinProject.isPending}>Join project</Button></> : null}
                    {project.joined && project.creatorId !== viewerId ? <Button size="sm" variant="outline" onClick={() => leaveProject.mutate(project.id)} loading={leaveProject.isPending}>Leave project</Button> : null}
                    {isMember && (canModerateMembers || project.creatorId === viewerId) && project.status === "OPEN" ? <Button size="sm" variant="outline" onClick={() => projectStatus.mutate({ projectId: project.id, status: "IN_PROGRESS" })}>Mark in progress</Button> : null}
                    {isMember && (canModerateMembers || project.creatorId === viewerId) && project.status === "IN_PROGRESS" ? <Button size="sm" variant="outline" onClick={() => projectStatus.mutate({ projectId: project.id, status: "COMPLETED" })}>Mark complete</Button> : null}
                    {isMember && (canModerateMembers || project.creatorId === viewerId) && project.status !== "ARCHIVED" && project.status !== "COMPLETED" ? <Button size="sm" variant="outline" onClick={() => projectStatus.mutate({ projectId: project.id, status: "ARCHIVED" })}>Archive</Button> : null}
                  </div>
                </CardBody></Card>
              ))}
              {joinProject.isError || leaveProject.isError || projectStatus.isError ? <p role="alert" className="text-sm text-red-500">Your project membership or status update could not be saved.</p> : null}
              {!projects.isLoading && !projects.isError && !projects.data?.length ? <Card><CardBody className="p-8 text-center"><Rocket className="mx-auto h-7 w-7 text-primary-700" /><h2 className="mt-3 text-sm font-semibold text-neutral-900">Build together</h2><p className="mt-1 text-xs text-neutral-500">Start a project and find collaborators with the skills it needs.</p></CardBody></Card> : null}
            </div>
          ) : null}

          {selectedTab === "About" ? (
            <div className="space-y-4">
              <Card><CardBody className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="scout-group-section-title">About {space.name}</h2>
                  {canModerateMembers ? <Button size="sm" variant="outline" onClick={() => {
                    if (editGroup) {
                      setEditGroup(false);
                    } else {
                      setGroupImages({ profileImageUrl: space.profileImageUrl ?? "", coverImageUrl: space.coverImageUrl ?? "" });
                      setEditGroup(true);
                    }
                  }}>{editGroup ? "Cancel editing" : "Edit group"}</Button> : null}
                </div>
                {editGroup ? (
                  <form className="mt-4 space-y-3" onSubmit={submitGroupUpdate}>
                    <label className="scout-group-field">Name<input name="name" required minLength={3} maxLength={80} defaultValue={space.name} /></label>
                    <label className="scout-group-field">Description<textarea name="description" required minLength={20} maxLength={1000} rows={3} defaultValue={space.description ?? ""} /></label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="scout-group-field">Category<input name="category" required maxLength={80} defaultValue={space.category} /></label>
                      <label className="scout-group-field">Purpose<select name="purpose" defaultValue={space.purpose}>{["LEARNING", "NETWORKING", "COLLABORATION", "OPPORTUNITIES", "JOBS", "HACKATHONS", "GRANTS", "WEB3", "INDUSTRY", "LOCATION", "ORGANIZATION", "PROJECT", "RESEARCH", "GENERAL"].map((purpose) => <option key={purpose} value={purpose}>{purpose.toLowerCase().replaceAll("_", " ")}</option>)}</select></label>
                      {canManageRoles ? <label className="scout-group-field">Visibility<select name="visibility" defaultValue={space.visibility}><option value="PUBLIC">Public</option><option value="PRIVATE">Private</option><option value="HIDDEN">Hidden</option></select></label> : null}
                      <label className="scout-group-field">Country code<input name="countryCode" maxLength={2} defaultValue={space.countryCode ?? ""} /></label>
                      <label className="scout-group-field">Language<input name="language" required minLength={2} maxLength={40} defaultValue={space.language} /></label>
                      <ImageUploadField label="Group profile image" value={groupImages.profileImageUrl || null} onChange={(value) => setGroupImages((images) => ({ ...images, profileImageUrl: value ?? "" }))} />
                      <ImageUploadField label="Group cover image" value={groupImages.coverImageUrl || null} onChange={(value) => setGroupImages((images) => ({ ...images, coverImageUrl: value ?? "" }))} />
                    </div>
                    <label className="scout-group-field">Topics<input name="topics" defaultValue={space.topics.join(", ")} /><small>Comma-separated, up to 12.</small></label>
                    {canManageRoles ? <label className="scout-group-field">Private-group join questions<textarea name="joinQuestions" rows={3} defaultValue={(space.joinQuestions ?? []).join("\n")} /><small>One question per line, up to five.</small></label> : null}
                    {updateGroup.isError ? <p role="alert" className="text-xs text-red-500">Group settings could not be saved.</p> : null}
                    <div className="flex justify-end"><Button size="sm" type="submit" loading={updateGroup.isPending}>Save group settings</Button></div>
                  </form>
                ) : (
                  <>
                    <p className="mt-3 text-sm leading-6 text-neutral-600">{space.description}</p>
                    <dl className="scout-group-info mt-4"><div><dt>Group type</dt><dd>{space.visibility}</dd></div><div><dt>Category</dt><dd>{space.category}</dd></div><div><dt>Purpose</dt><dd>{space.purpose}</dd></div><div><dt>Language</dt><dd>{space.language}</dd></div><div><dt>Location</dt><dd>{space.countryCode ?? "Global"}</dd></div></dl>
                  </>
                )}
              </CardBody></Card>
              {canModerateMembers ? (
                <Card><CardBody className="p-5">
                  <h2 className="scout-group-section-title">Invite links</h2>
                  <p className="mt-1 text-xs text-neutral-500">Links are single-secret: copy them now. Each invite can expire, limit uses, and require approval.</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <label className="scout-group-field">Expires in days<input type="number" min={1} max={365} value={inviteExpiry} onChange={(event) => setInviteExpiry(event.target.value)} /></label>
                    <label className="scout-group-field">Maximum uses<input type="number" min={1} max={10000} value={inviteMaxUses} onChange={(event) => setInviteMaxUses(event.target.value)} /></label>
                    <label className="flex items-center gap-2 text-xs text-neutral-700"><input type="checkbox" checked={inviteApproval} onChange={(event) => setInviteApproval(event.target.checked)} />Require moderator approval</label>
                  </div>
                  <Button size="sm" className="mt-3" onClick={() => createInvite.mutate()} loading={createInvite.isPending}>Generate invite link</Button>
                  {inviteLink ? <p className="mt-2 break-all rounded-lg bg-neutral-100 p-2 text-xs text-neutral-700">{inviteLink}</p> : null}
                  {invites.isError || revokeInvite.isError ? <p role="alert" className="mt-2 text-xs text-red-500">Invite links could not be loaded or updated.</p> : null}
                  <div className="mt-3 space-y-2">
                    {invites.data?.map((invite) => (
                      <div key={invite.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 p-3 text-xs">
                        <span>{invite.useCount}{invite.maxUses ? ` / ${invite.maxUses}` : ""} uses · {invite.approvalRequired ? "approval required" : "direct join"} · {invite.expiresAt ? `expires ${new Date(invite.expiresAt).toLocaleDateString()}` : "no expiry"}</span>
                        <Button size="sm" variant="outline" onClick={() => revokeInvite.mutate(invite.id)} loading={revokeInvite.isPending}>Revoke</Button>
                      </div>
                    ))}
                  </div>
                </CardBody></Card>
              ) : null}
              {canModerateMembers ? (
                <Card><CardBody className="p-5">
                  <h2 className="scout-group-section-title">Open moderation reports</h2>
                  <p className="mt-1 text-xs text-neutral-500">Review reports and make the final moderation decision.</p>
                  {reports.isLoading ? <Loader label="Loading group reports" /> : null}
                  {reports.isError || moderateReport.isError ? <p role="alert" className="mt-2 text-xs text-red-500">Reports could not be loaded or updated.</p> : null}
                  <div className="mt-3 space-y-3">
                    {reports.data?.map((report) => (
                      <div key={report.id} className="rounded-lg border border-neutral-200 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-xs text-neutral-900">{report.reason}</strong><span className="text-[10px] text-neutral-500">Reported by {report.reporter.fullName} · {new Date(report.createdAt).toLocaleDateString()}</span></div>
                        {report.details ? <p className="mt-1 text-xs text-neutral-500">{report.details}</p> : null}
                        <p className="mt-2 whitespace-pre-wrap rounded bg-neutral-100 p-2 text-xs text-neutral-700">{report.post?.content ?? report.comment?.content ?? "Reported item is no longer available"}{report.post ? ` — ${report.post.author.fullName}` : report.comment ? ` — ${report.comment.author.fullName}` : ""}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {report.post ? <Button size="sm" variant="outline" onClick={() => moderateReport.mutate({ reportId: report.id, action: report.post?.lockedAt ? "UNLOCK_POST" : "LOCK_POST" })}>{report.post.lockedAt ? "Unlock discussion" : "Lock discussion"}</Button> : null}
                          <Button size="sm" variant="outline" onClick={() => moderateReport.mutate({ reportId: report.id, action: "REMOVE_CONTENT" })}>Remove content</Button>
                          <Button size="sm" variant="outline" onClick={() => moderateReport.mutate({ reportId: report.id, action: "DISMISS" })}>Dismiss report</Button>
                          <Button size="sm" onClick={() => moderateReport.mutate({ reportId: report.id, action: "RESOLVE" })}>Resolve</Button>
                        </div>
                      </div>
                    ))}
                    {!reports.isLoading && !reports.isError && !reports.data?.length ? <p className="py-5 text-center text-xs text-neutral-500">No open reports. Moderators make all final decisions.</p> : null}
                  </div>
                </CardBody></Card>
              ) : null}
              {space.role === "OWNER" ? (
                <Card><CardBody className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div><h2 className="text-sm font-semibold text-red-600">Delete this group</h2><p className="mt-1 text-xs text-neutral-500">This permanently removes the group, its discussions, events, projects, and memberships.</p></div>
                  <Button size="sm" variant="outline" loading={deleteGroup.isPending} onClick={() => {
                    if (window.confirm(`Permanently delete ${space.name} and all its content?`)) deleteGroup.mutate();
                  }}>Delete group</Button>
                </CardBody></Card>
              ) : null}
              {deleteGroup.isError ? <p role="alert" className="text-sm text-red-500">The group could not be deleted.</p> : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
