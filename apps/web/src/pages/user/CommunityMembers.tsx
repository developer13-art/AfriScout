import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, UserRoundCheck, Sparkles, MapPin, Users } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import { Loader } from "../../components/ui/Loader";
import { PageHeader } from "../../components/layout/PageHeader";
import { SeoHead } from "../../components/common/SeoHead";
import { CommunitySubnav } from "../../components/community/CommunitySubnav";
import { communityService } from "../../services/community.service";
import { useAuthStore } from "../../stores/authStore";

export function CommunityMembers() {
  const client = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [params, setParams] = useSearchParams();
  const [requested, setRequested] = useState<Record<string, boolean>>({});
  const [followedTargets, setFollowedTargets] = useState<Record<string, boolean>>({});
  const search = params.get("q") ?? "";
  const members = useQuery({
    queryKey: ["community-members", search],
    queryFn: () => communityService.members(search),
    staleTime: 30_000,
  });
  const follow = useMutation({
    mutationFn: communityService.follow,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["community-members"] });
      void client.invalidateQueries({ queryKey: ["community-connections"] });
      void client.invalidateQueries({ queryKey: ["community-accepted-connections"] });
      void client.invalidateQueries({ queryKey: ["community-connection-requests"] });
    },
  });
  const connect = useMutation({
    mutationFn: communityService.requestConnection,
    onSuccess: (_result, id) => setRequested((value) => ({ ...value, [id]: true })),
  });
  const followTarget = useMutation({
    mutationFn: (target: { type: "TOPIC" | "INDUSTRY" | "COUNTRY"; key: string }) =>
      communityService.followTarget(target.type, target.key),
    onSuccess: (result, target) => setFollowedTargets((value) => ({ ...value, [`${target.type}:${target.key}`]: result.following })),
  });

  return (
    <div className="scout-social-shell scout-community-page">
      <SeoHead title="Community members" />
      <PageHeader
        title="Community members"
        description="Meet people building, learning, and finding opportunities across the Scout network."
        actions={<Badge tone="primary"><Users className="mr-1 h-3.5 w-3.5" />Member directory</Badge>}
      />
      <CommunitySubnav />

      <div className="scout-member-toolbar">
        <label className="scout-search-field">
          <Search aria-hidden className="h-4 w-4" />
          <span className="sr-only">Search members</span>
          <input
            value={search}
            onChange={(event) => setParams(event.target.value ? { q: event.target.value } : {})}
            placeholder="Search names, skills, or roles…"
            maxLength={100}
          />
        </label>
        <p className="text-xs text-neutral-500">Profiles are shown according to each member’s privacy settings.</p>
      </div>

      {members.isLoading ? <Loader label="Finding Scout members" /> : null}
      {members.isError ? (
        <Card><CardBody className="p-6 text-sm text-red-500">Members could not be loaded. Refresh to try again.</CardBody></Card>
      ) : null}
      {!members.isLoading && !members.isError && members.data?.length === 0 ? (
        <Card><CardBody className="p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-neutral-500" />
          <h2 className="mt-3 font-semibold text-neutral-900">{search ? "No members match that search" : "No discoverable members yet"}</h2>
          <p className="mt-1 text-sm text-neutral-500">Try a different name, skill, or professional role.</p>
        </CardBody></Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {members.data?.map((person) => {
          const isSelf = person.id === user?.id;
          return (
            <Card key={person.id} className="scout-member-card">
              <CardBody className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={person.fullName} src={person.avatarUrl} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-neutral-900">{person.fullName}</h2>
                    <p className="mt-0.5 truncate text-sm text-neutral-500">
                      {person.username ? `@${person.username}` : person.headline ?? "Scout member"}
                    </p>
                    {person.countryCode ? (
                      <button
                        type="button"
                        onClick={() => followTarget.mutate({ type: "COUNTRY", key: person.countryCode! })}
                        className="mt-1 flex items-center gap-1 text-xs text-neutral-500 hover:text-primary-700"
                      >
                        <MapPin className="h-3 w-3" />{person.countryCode}{followedTargets[`COUNTRY:${person.countryCode}`] ? " ✓" : ""}
                      </button>
                    ) : null}
                  </div>
                  {!isSelf && person.following ? <Badge tone="success">Following</Badge> : null}
                </div>
                {person.bio ? <p className="mt-4 line-clamp-2 text-sm leading-5 text-neutral-600">{person.bio}</p> : null}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {[...person.skills, ...person.interests].slice(0, 5).map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="scout-topic-chip"
                      aria-label={`${followedTargets[`TOPIC:${item}`] ? "Unfollow" : "Follow"} topic ${item}`}
                      onClick={() => followTarget.mutate({ type: "TOPIC", key: item })}
                    >
                      {item}{followedTargets[`TOPIC:${item}`] ? " ✓" : ""}
                    </button>
                  ))}
                  {person.skills.length + person.interests.length > 5 ? (
                    <span className="scout-topic-chip">+{person.skills.length + person.interests.length - 5}</span>
                  ) : null}
                </div>
                {!isSelf ? (
                  <div className="mt-5 flex gap-2 border-t border-neutral-200 pt-4">
                    <Button
                      className="flex-1"
                      size="sm"
                      variant={person.following ? "outline" : "primary"}
                      loading={follow.isPending}
                      onClick={() => follow.mutate(person.id)}
                      leftIcon={person.following ? <UserRoundCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    >
                      {person.following ? "Following" : "Follow"}
                    </Button>
                    <Button
                      className="flex-1"
                      size="sm"
                      variant="outline"
                      loading={connect.isPending}
                      disabled={requested[person.id]}
                      onClick={() => connect.mutate(person.id)}
                      leftIcon={<Sparkles className="h-4 w-4" />}
                    >
                      {requested[person.id] ? "Request sent" : "Connect"}
                    </Button>
                  </div>
                ) : (
                  <Link className="mt-5 inline-block text-sm font-semibold text-primary-700 hover:underline" to="/profile">View your profile</Link>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
      {follow.isError || connect.isError || followTarget.isError ? (
        <p role="alert" className="mt-3 text-sm text-red-500">That connection action could not be completed. Please try again.</p>
      ) : null}
    </div>
  );
}
