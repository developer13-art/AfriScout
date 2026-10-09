import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BriefcaseBusiness, Check, MapPin, MessageCircle, UserPlus, Users } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { CommunitySubnav } from "../../components/community/CommunitySubnav";
import { SeoHead } from "../../components/common/SeoHead";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { SafeImage } from "../../components/ui/SafeImage";
import { communityService } from "../../services/community.service";
import { useAuthStore } from "../../stores/authStore";

export function CommunityMemberProfile() {
  const { userId = "" } = useParams<{ userId: string }>();
  const viewerId = useAuthStore((state) => state.user?.id);
  const client = useQueryClient();
  const profile = useQuery({
    queryKey: ["community-member-profile", userId],
    queryFn: () => communityService.profile(userId),
    enabled: Boolean(userId),
  });
  const accepted = useQuery({
    queryKey: ["community-accepted-connections"],
    queryFn: communityService.acceptedConnections,
    enabled: Boolean(viewerId && viewerId !== userId),
  });
  const requests = useQuery({
    queryKey: ["community-connection-requests"],
    queryFn: communityService.connectionRequests,
    enabled: Boolean(viewerId && viewerId !== userId),
  });
  const request = useMutation({
    mutationFn: () => communityService.requestConnection(userId),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["community-connection-requests"] }),
        client.invalidateQueries({ queryKey: ["community-accepted-connections"] }),
        client.invalidateQueries({ queryKey: ["community-connections"] }),
      ]);
    },
  });
  const respond = useMutation({
    mutationFn: (status: "ACCEPTED" | "DECLINED") => {
      const incoming = requests.data?.find((item) => item.person.id === userId && item.direction === "received");
      if (!incoming) throw new Error("Connection request not found");
      return communityService.respondToConnection(incoming.id, status);
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["community-connection-requests"] }),
        client.invalidateQueries({ queryKey: ["community-accepted-connections"] }),
        client.invalidateQueries({ queryKey: ["community-message-conversations"] }),
      ]);
    },
  });

  if (viewerId && viewerId === userId) return <Navigate to="/profile" replace />;

  const person = profile.data;
  const isConnected = Boolean(accepted.data?.some((connection) => connection.person.id === userId));
  const incoming = requests.data?.find((item) => item.person.id === userId && item.direction === "received");
  const outgoing = requests.data?.some((item) => item.person.id === userId && item.direction === "sent");

  return (
    <div className="scout-social-shell scout-community-page">
      <SeoHead title={person?.fullName ? `${person.fullName} · Community` : "Community profile"} />
      <CommunitySubnav />
      {profile.isLoading ? (
        <p className="py-12 text-center text-sm text-neutral-500">Loading member profile…</p>
      ) : profile.isError || !person ? (
        <Card>
          <CardBody className="px-6 py-12 text-center">
            <h1 className="font-semibold text-neutral-900">This profile isn’t available</h1>
            <p className="mt-2 text-sm text-neutral-500">The member may have changed their privacy settings or the profile may no longer exist.</p>
            <Link to="/community/members" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:underline">
              <ArrowLeft aria-hidden className="h-4 w-4" /> Browse members
            </Link>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className={`scout-profile-cover${person.coverImageUrl ? " has-image" : ""}`}>
            {person.coverImageUrl ? <SafeImage src={person.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
            {person.coverImageUrl ? <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/20 to-transparent" /> : null}
          </div>
          <Card className="relative -mt-5 overflow-visible">
            <CardBody className="flex flex-wrap items-center gap-4 p-5 sm:px-7">
              <div className="relative -mt-12 rounded-full border-4 border-[#0b1d2c]">
                <Avatar name={person.fullName} src={person.avatarUrl} size="xl" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-neutral-900">{person.fullName}</h1>
                  <Badge tone="neutral">Scout member</Badge>
                </div>
                <p className="mt-1 text-sm text-neutral-500">{person.headline || "Building a professional profile on Scout"}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                  <MapPin aria-hidden className="h-3.5 w-3.5" />{person.countryCode || "Location not shared"}
                  {person.username ? <span>· @{person.username}</span> : null}
                </p>
              </div>
              {isConnected ? (
                <Link to={`/community/messages/${userId}`}>
                  <Button leftIcon={<MessageCircle className="h-4 w-4" />}>Message</Button>
                </Link>
              ) : incoming ? (
                <div className="flex gap-2">
                  <Button onClick={() => respond.mutate("ACCEPTED")} loading={respond.isPending} leftIcon={<Check className="h-4 w-4" />}>Accept request</Button>
                  <Button variant="outline" onClick={() => respond.mutate("DECLINED")} disabled={respond.isPending}>Decline</Button>
                </div>
              ) : outgoing ? (
                <Button variant="outline" disabled leftIcon={<Check className="h-4 w-4" />}>Request pending</Button>
              ) : (
                <Button onClick={() => request.mutate()} loading={request.isPending} leftIcon={<UserPlus className="h-4 w-4" />}>Connect</Button>
              )}
            </CardBody>
          </Card>

          {request.isError || respond.isError ? (
            <p role="alert" className="mt-3 text-sm text-red-500">The connection could not be updated. Please try again.</p>
          ) : null}

          <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-5">
              <Card>
                <CardHeader title="About" />
                <CardBody>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-neutral-600">{person.bio || "This member hasn’t added a bio yet."}</p>
                  {person.headline ? (
                    <p className="mt-4 flex items-center gap-2 border-t border-neutral-200 pt-4 text-sm text-neutral-600">
                      <BriefcaseBusiness aria-hidden className="h-4 w-4 text-primary-700" />{person.headline}
                    </p>
                  ) : null}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Skills & interests" />
                <CardBody className="space-y-4">
                  <div>
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {person.skills.map((skill) => <span key={skill} className="scout-topic-chip">{skill}</span>)}
                      {!person.skills.length ? <span className="text-sm text-neutral-500">No skills added yet.</span> : null}
                    </div>
                  </div>
                  <div>
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Interests</h2>
                    <div className="flex flex-wrap gap-2">
                      {person.interests.map((interest) => <span key={interest} className="scout-topic-chip">{interest}</span>)}
                      {!person.interests.length ? <span className="text-sm text-neutral-500">No interests added yet.</span> : null}
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Recent community activity" />
                <CardBody className="space-y-4">
                  {person.recentPosts.map((post) => (
                    <article key={post.id} className="border-b border-neutral-200 pb-4 last:border-0 last:pb-0">
                      <p className="whitespace-pre-wrap text-sm leading-6 text-neutral-700">{post.content}</p>
                      <p className="mt-2 text-xs text-neutral-500">
                        {new Date(post.createdAt).toLocaleDateString()} · {post._count.reactions} reactions · {post._count.comments} comments
                      </p>
                    </article>
                  ))}
                  {!person.recentPosts.length ? <p className="text-sm text-neutral-500">No recent public posts.</p> : null}
                </CardBody>
              </Card>
            </div>

            <aside className="space-y-5">
              <Card>
                <CardHeader title="Scout community" />
                <CardBody className="grid grid-cols-2 gap-4">
                  <div><p className="text-xl font-bold text-neutral-900">{person.stats.connections ?? "—"}</p><p className="text-xs text-neutral-500">connections</p></div>
                  <div><p className="text-xl font-bold text-neutral-900">{person.stats.followers}</p><p className="text-xs text-neutral-500">followers</p></div>
                  <div><p className="text-xl font-bold text-neutral-900">{person.stats.posts}</p><p className="text-xs text-neutral-500">posts</p></div>
                  <div><p className="text-xl font-bold text-neutral-900">{person.stats.completed}</p><p className="text-xs text-neutral-500">completed opportunities</p></div>
                </CardBody>
              </Card>
              {person.industries.length || person.languages.length ? (
                <Card>
                  <CardHeader title="Professional profile" />
                  <CardBody className="space-y-4">
                    {person.industries.length ? (
                      <div>
                        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Industries</h2>
                        <div className="flex flex-wrap gap-2">{person.industries.map((item) => <span key={item} className="scout-topic-chip">{item}</span>)}</div>
                      </div>
                    ) : null}
                    {person.languages.length ? (
                      <div>
                        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Languages</h2>
                        <div className="flex flex-wrap gap-2">{person.languages.map((item) => <span key={item} className="scout-topic-chip">{item}</span>)}</div>
                      </div>
                    ) : null}
                  </CardBody>
                </Card>
              ) : null}
              <Card>
                <CardBody className="flex items-start gap-2 p-4 text-xs leading-5 text-neutral-500">
                  <Users aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                  Email, phone numbers, private messages, and account details are not shown on this profile.
                </CardBody>
              </Card>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
