import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Eye, LockKeyhole, ShieldCheck, UserRoundX, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Loader } from "../../components/ui/Loader";
import { SeoHead } from "../../components/common/SeoHead";
import { communityService, type CommunitySettings } from "../../services/community.service";

export function CommunitySettingsPage() {
  const client = useQueryClient();
  const settings = useQuery({
    queryKey: ["community-settings"],
    queryFn: communityService.settings,
  });
  const requests = useQuery({
    queryKey: ["community-connection-requests"],
    queryFn: communityService.connectionRequests,
  });
  const update = useMutation({
    mutationFn: communityService.updateSettings,
    onSuccess: (next) => client.setQueryData(["community-settings"], next),
  });
  const respond = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACCEPTED" | "DECLINED" }) =>
      communityService.respondToConnection(id, status),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["community-connection-requests"] });
      void client.invalidateQueries({ queryKey: ["community-connections"] });
    },
  });
  const userAction = useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: "BLOCK" | "MUTE" }) => communityService.userAction(id, kind),
    onSuccess: () => client.invalidateQueries({ queryKey: ["community-settings"] }),
  });

  const current = settings.data;
  const save = (patch: Partial<Pick<CommunitySettings, "visibility" | "analyzable" | "connectionPolicy">>) =>
    update.mutate(patch);

  return (
    <>
      <SeoHead title="Community settings" />
      <PageHeader
        title="Community settings"
        description="Control who can connect with you and how your Scout profile is used."
        actions={<Link className="text-sm font-medium text-primary-700 hover:underline" to="/community">Back to community</Link>}
      />
      {settings.isLoading ? <Loader label="Loading settings" /> : null}
      {settings.isError ? (
        <Card><CardBody className="text-sm text-red-500">Community settings could not be loaded.</CardBody></Card>
      ) : null}

      {current ? (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <Card>
              <CardHeader title="Connection requests" description="Choose who can ask to connect with you." />
              <CardBody className="space-y-3">
                {[
                  ["ANYONE", "Anyone"],
                  ["FOLLOWERS", "People you follow"],
                  ["NOBODY", "Nobody"],
                ].map(([value, label]) => (
                  <label key={value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 p-3">
                    <input
                      type="radio"
                      name="connection-policy"
                      value={value}
                      checked={current.connectionPolicy === value}
                      onChange={() => save({ connectionPolicy: value as CommunitySettings["connectionPolicy"] })}
                    />
                    <span className="flex-1 text-sm text-neutral-800">{label}</span>
                    {current.connectionPolicy === value ? <Badge tone="success">Selected</Badge> : null}
                  </label>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Profile visibility" description="Private profiles stay out of member discovery." />
              <CardBody className="space-y-3">
                {[
                  ["PUBLIC", "Public", "Visible to Scout community members."],
                  ["FOLLOWERS", "Followers", "Visible to people you follow and accepted connections."],
                  ["PRIVATE", "Private", "Only you can view your full profile."],
                ].map(([value, label, description]) => (
                  <label key={value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-3">
                    <input
                      type="radio"
                      name="profile-visibility"
                      value={value}
                      checked={current.visibility === value}
                      onChange={() => save({ visibility: value as CommunitySettings["visibility"] })}
                    />
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-neutral-900">{label}</span>
                      <span className="mt-0.5 block text-xs text-neutral-500">{description}</span>
                    </span>
                    {value === "PUBLIC" ? <Eye className="h-4 w-4 text-neutral-500" /> : <LockKeyhole className="h-4 w-4 text-neutral-500" />}
                  </label>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Profile intelligence" description="Scout only analyzes profile information when you enable it." />
              <CardBody>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={current.analyzable}
                    onChange={(event) => save({ analyzable: event.target.checked })}
                  />
                  <span>
                    <span className="block text-sm font-medium text-neutral-900">Allow profile analysis</span>
                    <span className="mt-1 block text-xs leading-5 text-neutral-500">
                      Your skills, interests, experience, and achievements can be used to suggest opportunity areas and relevant connections.
                    </span>
                  </span>
                </label>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Connection requests" description="Respond to people who want to connect." />
              <CardBody className="space-y-3">
                {requests.isLoading ? <Loader label="Loading requests" /> : null}
                {requests.isError ? <p className="text-sm text-red-500">Requests could not be loaded.</p> : null}
                {requests.data?.filter((request) => request.direction === "received").map((request) => (
                  <div key={request.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 p-3">
                    <Avatar name={request.person.fullName} src={request.person.avatarUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">{request.person.fullName}</p>
                      <p className="text-xs text-neutral-500">{request.person.profile?.headline ?? "Scout member"}</p>
                    </div>
                    <Button size="sm" onClick={() => respond.mutate({ id: request.id, status: "ACCEPTED" })} loading={respond.isPending}>Accept</Button>
                    <Button size="sm" variant="outline" onClick={() => respond.mutate({ id: request.id, status: "DECLINED" })} loading={respond.isPending}>Decline</Button>
                  </div>
                ))}
                {!requests.isLoading && !requests.isError && !requests.data?.some((item) => item.direction === "received") ? (
                  <p className="text-sm text-neutral-500">No incoming requests.</p>
                ) : null}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader title="Blocked accounts" />
              <CardBody className="space-y-3">
                {current.blocked.length ? current.blocked.map((person) => (
                  <div key={person.id} className="flex items-center gap-3">
                    <Avatar name={person.fullName} src={person.avatarUrl} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm text-neutral-800">{person.fullName}</span>
                    <Button size="sm" variant="outline" onClick={() => userAction.mutate({ id: person.id, kind: "BLOCK" })}>Unblock</Button>
                  </div>
                )) : <p className="text-sm text-neutral-500">No blocked accounts.</p>}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Muted accounts" />
              <CardBody className="space-y-3">
                {current.muted.length ? current.muted.map((person) => (
                  <div key={person.id} className="flex items-center gap-3">
                    <Avatar name={person.fullName} src={person.avatarUrl} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm text-neutral-800">{person.fullName}</span>
                    <Button size="sm" variant="outline" onClick={() => userAction.mutate({ id: person.id, kind: "MUTE" })}>Unmute</Button>
                  </div>
                )) : <p className="text-sm text-neutral-500">No muted accounts.</p>}
              </CardBody>
            </Card>
            <Card>
              <CardBody className="flex gap-3 p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" />
                <p className="text-xs leading-5 text-neutral-500">Community discussion is separate from official opportunity records. Reports are reviewed by Scout administrators.</p>
              </CardBody>
            </Card>
            {update.isError || respond.isError || userAction.isError ? (
              <p role="alert" className="text-sm text-red-500">That setting could not be saved. Please try again.</p>
            ) : null}
            <div className="sr-only" aria-hidden="true"><Users /><BellRing /><UserRoundX /></div>
          </div>
        </div>
      ) : null}
    </>
  );
}
