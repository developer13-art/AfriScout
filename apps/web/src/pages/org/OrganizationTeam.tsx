import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { Loader } from "../../components/ui/Loader";
import { Users } from "lucide-react";
import { organizationService } from "../../services/organization.service";
import { SeoHead } from "../../components/common/SeoHead";

export function OrganizationTeam() {
  const orgQuery = useQuery({
    queryKey: ["organization", "me"],
    queryFn: () => organizationService.list(1, 1).then((items) => items[0] ?? null),
  });

  const membersQuery = useQuery({
    queryKey: ["organization", orgQuery.data?.id, "members"],
    queryFn: () =>
      orgQuery.data ? organizationService.members(orgQuery.data.id) : Promise.resolve([]),
    enabled: Boolean(orgQuery.data),
  });

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");

  const invite = useMutation({
    mutationFn: async () => {
      if (!orgQuery.data) return;
      await organizationService.addMember(orgQuery.data.id, email, role);
    },
    onSuccess: () => {
      setEmail("");
      membersQuery.refetch();
    },
  });

  return (
    <>
      <SeoHead title="Team" />
      <PageHeader
        title="Team"
        description="Manage who belongs to your organization."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader title="Members" />
          {membersQuery.isLoading ? (
            <Loader label="Loading members" />
          ) : (membersQuery.data ?? []).length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No members yet"
              description="Invite teammates to collaborate on opportunities."
            />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {(membersQuery.data ?? []).map((member) => (
                <li key={member.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={member.userId} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {member.userId}
                      </p>
                      <p className="text-xs text-neutral-500">{member.role}</p>
                    </div>
                  </div>
                  <Badge tone="neutral">{member.role}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Invite" />
          <CardBody>
            <div className="space-y-4">
              <Input
                label="Email or user ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Select
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                options={[
                  { value: "MEMBER", label: "Member" },
                  { value: "ADMIN", label: "Admin" },
                  { value: "OWNER", label: "Owner" },
                ]}
              />
              <Button
                fullWidth
                onClick={() => invite.mutate()}
                loading={invite.isPending}
                disabled={!email}
              >
                Invite
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}