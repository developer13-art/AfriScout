import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Clock3, MessageCircle, UserRound, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import { Loader } from "../../components/ui/Loader";
import { PageHeader } from "../../components/layout/PageHeader";
import { SeoHead } from "../../components/common/SeoHead";
import { CommunitySubnav } from "../../components/community/CommunitySubnav";
import { communityService, type CommunityConnectionRequest } from "../../services/community.service";

type AcceptedConnection = {
  id: string;
  connectedAt: string;
  person: CommunityConnectionRequest["person"];
};

const connectionKeys = {
  accepted: ["community-accepted-connections"] as const,
  requests: ["community-connection-requests"] as const,
  conversations: ["community-message-conversations"] as const,
  threads: ["community-message-thread"] as const,
};

function formatConnectedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Connected on Scout"
    : `Connected ${new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(date)}`;
}

export function CommunityConnections() {
  const client = useQueryClient();
  const accepted = useQuery({
    queryKey: connectionKeys.accepted,
    queryFn: communityService.acceptedConnections,
    staleTime: 30_000,
  });
  const requests = useQuery({
    queryKey: connectionKeys.requests,
    queryFn: communityService.connectionRequests,
    staleTime: 30_000,
  });
  const respond = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACCEPTED" | "DECLINED" }) =>
      communityService.respondToConnection(id, status),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: connectionKeys.requests }),
        client.invalidateQueries({ queryKey: connectionKeys.accepted }),
        client.invalidateQueries({ queryKey: connectionKeys.conversations }),
        client.invalidateQueries({ queryKey: connectionKeys.threads }),
      ]);
    },
  });
  const received = requests.data?.filter((request) => request.direction === "received") ?? [];
  const sent = requests.data?.filter((request) => request.direction === "sent") ?? [];

  return (
    <div className="scout-social-shell scout-community-page">
      <SeoHead title="Connections" />
      <PageHeader
        title="Your connections"
        description="A trusted circle for sharing skills, work, and the next opportunity."
        actions={
          <Badge tone="primary">
            <Users aria-hidden className="mr-1 h-3.5 w-3.5" />
            {accepted.data?.length ?? 0} connected
          </Badge>
        }
      />
      <CommunitySubnav />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
        <section aria-labelledby="accepted-heading">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="accepted-heading" className="text-base font-semibold text-neutral-900">Accepted connections</h2>
              <p className="mt-1 text-sm text-neutral-500">People you can message directly.</p>
            </div>
            <Link to="/community/messages" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline">
              Open messages <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>

          {accepted.isLoading ? <Loader label="Loading your connections" /> : null}
          {accepted.isError ? (
            <Card>
              <CardBody className="p-6">
                <p role="alert" className="text-sm text-red-500">Your connections could not be loaded.</p>
                <Button className="mt-3" size="sm" variant="outline" onClick={() => void accepted.refetch()}>Try again</Button>
              </CardBody>
            </Card>
          ) : null}
          {!accepted.isLoading && !accepted.isError && accepted.data?.length === 0 ? (
            <Card>
              <CardBody className="px-6 py-10 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-primary-500/20 bg-primary-50 text-primary-700">
                  <Users aria-hidden className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-neutral-900">Your circle starts here</h3>
                <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-neutral-500">
                  Connect with people whose experience and goals complement your own.
                </p>
                <Link to="/community/members" className="mt-4 inline-flex text-sm font-semibold text-primary-700 hover:underline">
                  Explore Scout members
                </Link>
              </CardBody>
            </Card>
          ) : null}

          <div className="space-y-3">
            {accepted.data?.map((connection: AcceptedConnection) => {
              const person = connection.person;
              return (
                <Card key={connection.id} padding="none">
                  <CardBody className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
                    <Link to={`/community/profile/${person.id}`} aria-label={`View ${person.fullName}'s profile`}>
                      <Avatar name={person.fullName} src={person.avatarUrl} size="lg" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/community/profile/${person.id}`} className="truncate font-semibold text-neutral-900 hover:text-primary-700">
                        {person.fullName}
                      </Link>
                      <p className="mt-0.5 truncate text-sm text-neutral-500">
                        {person.profile?.headline || person.professionalProfile?.profession || "Scout member"}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                        <Clock3 aria-hidden className="h-3.5 w-3.5" />{formatConnectedDate(connection.connectedAt)}
                      </p>
                    </div>
                    {person.professionalProfile?.skills?.length ? (
                      <div className="hidden max-w-[18rem] flex-wrap gap-1.5 lg:flex">
                        {person.professionalProfile.skills.slice(0, 2).map((skill) => (
                          <span key={skill} className="scout-topic-chip">{skill}</span>
                        ))}
                        {person.professionalProfile.skills.length > 2 ? (
                          <span className="scout-topic-chip">+{person.professionalProfile.skills.length - 2}</span>
                        ) : null}
                      </div>
                    ) : null}
                    <Link
                      to={`/community/messages/${person.id}`}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 px-3 text-sm font-semibold text-neutral-800 hover:border-primary-500 hover:text-primary-700"
                    >
                      <MessageCircle aria-hidden className="h-4 w-4" />
                      <span className="hidden sm:inline">Message</span>
                    </Link>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </section>

        <aside className="space-y-5">
          <Card padding="none">
            <div className="border-b border-neutral-200 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-neutral-900">Received requests</h2>
                  <p className="mt-1 text-xs text-neutral-500">Accept to start a direct conversation.</p>
                </div>
                <Badge tone={received.length ? "warning" : "neutral"}>{received.length}</Badge>
              </div>
            </div>
            <CardBody className="space-y-3 p-4 sm:p-5">
              {requests.isLoading ? <Loader label="Loading connection requests" /> : null}
              {requests.isError ? (
                <div>
                  <p role="alert" className="text-sm text-red-500">Requests could not be loaded.</p>
                  <Button className="mt-2" size="sm" variant="outline" onClick={() => void requests.refetch()}>Try again</Button>
                </div>
              ) : null}
              {!requests.isLoading && !requests.isError && received.length === 0 ? (
                <p className="rounded-lg border border-dashed border-neutral-200 px-3 py-5 text-center text-sm text-neutral-500">
                  No incoming requests right now.
                </p>
              ) : null}
              {received.map((request) => (
                <div key={request.id} className="rounded-xl border border-neutral-200 p-3">
                  <div className="flex items-center gap-3">
                    <Link to={`/community/profile/${request.person.id}`}>
                      <Avatar name={request.person.fullName} src={request.person.avatarUrl} size="md" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/community/profile/${request.person.id}`} className="block truncate text-sm font-semibold text-neutral-900 hover:text-primary-700">
                        {request.person.fullName}
                      </Link>
                      <p className="truncate text-xs text-neutral-500">
                        {request.person.profile?.headline || request.person.professionalProfile?.profession || "Scout member"}
                      </p>
                    </div>
                    <Link
                      to={`/community/profile/${request.person.id}`}
                      aria-label={`View ${request.person.fullName}'s profile`}
                      className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-primary-700"
                    >
                      <UserRound aria-hidden className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      leftIcon={<Check className="h-4 w-4" />}
                      loading={respond.isPending && respond.variables?.id === request.id && respond.variables.status === "ACCEPTED"}
                      disabled={respond.isPending}
                      onClick={() => respond.mutate({ id: request.id, status: "ACCEPTED" })}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<X className="h-4 w-4" />}
                      loading={respond.isPending && respond.variables?.id === request.id && respond.variables.status === "DECLINED"}
                      disabled={respond.isPending}
                      onClick={() => respond.mutate({ id: request.id, status: "DECLINED" })}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
              {respond.isError ? <p role="alert" className="text-xs text-red-500">That response could not be saved. Please try again.</p> : null}
            </CardBody>
          </Card>

          <Card padding="none">
            <div className="border-b border-neutral-200 p-4 sm:p-5">
              <h2 className="font-semibold text-neutral-900">Sent requests</h2>
              <p className="mt-1 text-xs text-neutral-500">Requests awaiting a response.</p>
            </div>
            <CardBody className="space-y-3 p-4 sm:p-5">
              {requests.isLoading ? <Loader label="Loading sent requests" /> : null}
              {!requests.isLoading && !requests.isError && sent.length === 0 ? (
                <p className="text-sm text-neutral-500">You have no pending sent requests.</p>
              ) : null}
              {sent.map((request) => (
                <div key={request.id} className="flex items-center gap-3">
                  <Link to={`/community/profile/${request.person.id}`}>
                    <Avatar name={request.person.fullName} src={request.person.avatarUrl} size="sm" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/community/profile/${request.person.id}`} className="block truncate text-sm font-medium text-neutral-900 hover:text-primary-700">
                      {request.person.fullName}
                    </Link>
                    <p className="truncate text-xs text-neutral-500">{request.person.profile?.headline || "Awaiting response"}</p>
                  </div>
                  <Badge tone="neutral">Pending</Badge>
                </div>
              ))}
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
