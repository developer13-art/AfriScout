import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "../../components/layout/PageHeader";
import { BackButton } from "../../components/common/BackButton";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Loader } from "../../components/ui/Loader";
import { ErrorState } from "../../components/ui/ErrorState";
import { adminService } from "../../services/admin.service";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import { SeoHead } from "../../components/common/SeoHead";

export function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const user = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: () => (id ? adminService.user(id) : null),
    enabled: Boolean(id),
  });

  const updateRole = useMutation({
    mutationFn: (role: string) => adminService.updateUserRole(id!, role),
    onSuccess: () => user.refetch(),
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => adminService.updateUserStatus(id!, status),
    onSuccess: () => user.refetch(),
  });

  if (user.isLoading) return <Loader fullPage label="Loading user" />;
  if (user.isError || !user.data) return <ErrorState title="User not found" />;

  const u = user.data;

  return (
    <>
      <SeoHead title={u.email} />
      <BackButton label="Back to users" to="/admin/users" />
      <div className="mt-3">
        <PageHeader title={u.fullName} description={u.email} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Account" />
          <CardBody>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="font-medium text-neutral-900">Status:</span>{" "}
                {u.status}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Role:</span>{" "}
                {u.role}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Country:</span>{" "}
                {u.countryCode ?? "-"}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Created:</span>{" "}
                {formatDate(u.createdAt)}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Last login:</span>{" "}
                {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "-"}
              </li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Actions" />
          <CardBody>
            <div className="space-y-3">
              <Select
                label="Change role"
                value={u.role}
                onChange={(e) => updateRole.mutate(e.target.value)}
                options={[
                  { value: "SUPER_ADMIN", label: "Super admin" },
                  { value: "DATA_ADMIN", label: "Data admin" },
                  { value: "USER", label: "User" },
                  { value: "API_DEVELOPER", label: "API developer" },
                ]}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => updateStatus.mutate("ACTIVE")}
                >
                  Activate
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateStatus.mutate("SUSPENDED")}
                >
                  Suspend
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}