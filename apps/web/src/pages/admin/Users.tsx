import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../../components/layout/PageHeader";
import { Input } from "../../components/ui/Input";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { Badge } from "../../components/ui/Badge";
import { Loader } from "../../components/ui/Loader";
import { adminService } from "../../services/admin.service";
import { formatDate } from "../../utils/formatDate";
import type { User } from "../../types/user";
import { SeoHead } from "../../components/common/SeoHead";

export function Users() {
  const [query, setQuery] = useState("");
  const users = useQuery({
    queryKey: ["admin", "users", query],
    queryFn: () => adminService.users(1, 50),
  });

  const filtered = (users.data ?? []).filter((u) =>
    query ? u.email.toLowerCase().includes(query.toLowerCase()) : true,
  );

  const columns: DataTableColumn<User>[] = [
    {
      key: "name",
      header: "Name",
      cell: (user) => (
        <Link
          to={`/admin/users/${user.id}`}
          className="font-medium text-neutral-900 hover:text-primary-700"
        >
          {user.fullName}
        </Link>
      ),
    },
    { key: "email", header: "Email", cell: (user) => user.email },
    {
      key: "role",
      header: "Role",
      cell: (user) => <Badge tone="neutral">{user.role}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      cell: (user) => (
        <Badge tone={user.status === "ACTIVE" ? "success" : "neutral"}>
          {user.status}
        </Badge>
      ),
    },
    {
      key: "created",
      header: "Created",
      cell: (user) => formatDate(user.createdAt),
    },
  ];

  return (
    <>
      <SeoHead title="Users" />
      <PageHeader title="Users" description="Platform users and their roles." />

      <div className="mb-4">
        <Input
          placeholder="Search by email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {users.isLoading ? (
        <Loader fullPage label="Loading users" />
      ) : (
        <DataTable columns={columns} rows={filtered} rowKey={(u) => u.id} />
      )}
    </>
  );
}