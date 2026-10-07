import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import { Loader } from "../../components/ui/Loader";
import { PageHeader } from "../../components/layout/PageHeader";
import { SeoHead } from "../../components/common/SeoHead";
import { CommunitySubnav } from "../../components/community/CommunitySubnav";
import { communityService } from "../../services/community.service";

export function CommunityGroups() {
  const client = useQueryClient();
  const groups = useQuery({ queryKey: ["community-spaces"], queryFn: communityService.spaces });
  const follow = useMutation({
    mutationFn: communityService.followSpace,
    onSuccess: () => client.invalidateQueries({ queryKey: ["community-spaces"] }),
  });

  return (
    <div className="scout-community-page">
      <SeoHead title="Community groups" />
      <PageHeader title="Groups" description="Find people around the countries, industries, and ideas you care about." />
      <CommunitySubnav />
      {groups.isLoading ? <Loader label="Loading groups" /> : null}
      {groups.isError ? <Card><CardBody className="text-sm text-red-500">Groups could not be loaded.</CardBody></Card> : null}
      {!groups.isLoading && !groups.isError && groups.data?.length === 0 ? (
        <Card><CardBody className="p-8 text-center">
          <Users className="mx-auto h-8 w-8 text-neutral-500" />
          <h2 className="mt-3 font-semibold text-neutral-900">No groups yet</h2>
          <p className="mt-1 text-sm text-neutral-500">Scout communities will appear here as they are created.</p>
        </CardBody></Card>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groups.data?.map((group) => (
          <Card key={group.id}>
            <CardBody className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold text-neutral-900">{group.name}</h2>
                  {group.countryCode ? <p className="mt-1 text-xs text-neutral-500">{group.countryCode}</p> : null}
                </div>
                <Badge tone="neutral">{group.postCount} posts</Badge>
              </div>
              <p className="mt-3 min-h-10 text-sm leading-5 text-neutral-600">{group.description ?? "A space to connect with members around shared opportunity interests."}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {group.topics.slice(0, 4).map((topic) => <span key={topic} className="scout-topic-chip">{topic}</span>)}
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-neutral-200 pt-4">
                <span className="text-xs text-neutral-500">{group.memberCount} members</span>
                <div className="flex items-center gap-3">
                  <Link to={`/community?group=${encodeURIComponent(group.slug)}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700">
                    Open <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <Button
                    size="sm"
                    variant={group.following ? "outline" : "primary"}
                    loading={follow.isPending}
                    onClick={() => follow.mutate(group.slug)}
                  >
                    {group.following ? "Joined" : "Join"}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      {follow.isError ? <p role="alert" className="mt-3 text-sm text-red-500">Could not update your group membership.</p> : null}
    </div>
  );
}
