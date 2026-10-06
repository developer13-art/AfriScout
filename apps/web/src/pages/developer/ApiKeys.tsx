import { useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Checkbox } from "../../components/ui/Checkbox";
import { Alert } from "../../components/ui/Alert";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { Badge } from "../../components/ui/Badge";
import { Loader } from "../../components/ui/Loader";
import { EmptyState } from "../../components/ui/EmptyState";
import { CopyButton } from "../../components/common/CopyButton";
import { KeyRound } from "lucide-react";
import { useApiKeys } from "../../hooks/useApiKeys";
import { formatDateTime } from "../../utils/formatDate";
import type { ApiKey } from "../../types/apiKey";
import { SeoHead } from "../../components/common/SeoHead";

const allScopes = [
  "opportunities:read",
  "opportunities:write",
  "sources:read",
  "matches:read",
  "analytics:read",
  "webhooks:manage",
];

export function ApiKeys() {
  const keys = useApiKeys();
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["opportunities:read"]);
  const [newKey, setNewKey] = useState<string | null>(null);

  const onCreate = async () => {
    const result = await keys.create.mutateAsync({ name, scopes });
    setNewKey(result.plainTextKey);
    setName("");
    setScopes(["opportunities:read"]);
  };

  const columns: DataTableColumn<ApiKey>[] = [
    { key: "name", header: "Name", cell: (key) => key.name },
    {
      key: "prefix",
      header: "Prefix",
      cell: (key) => <code className="text-xs">{key.prefix}...</code>,
    },
    {
      key: "scopes",
      header: "Scopes",
      cell: (key) => (
        <div className="flex flex-wrap gap-1">
          {key.scopes.map((scope) => (
            <Badge key={scope} tone="neutral" size="sm">
              {scope}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "lastUsed",
      header: "Last used",
      cell: (key) => (key.lastUsedAt ? formatDateTime(key.lastUsedAt) : "Never"),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (key) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => keys.revoke.mutate(key.id)}
        >
          Revoke
        </Button>
      ),
    },
  ];

  return (
    <>
      <SeoHead title="API keys" />
      <PageHeader
        title="API keys"
        description="Manage the keys used to access the AfriScout API."
      />

      {newKey ? (
        <Alert tone="success" className="mb-4" title="Copy your new key">
          This is the only time the key will be shown.
          <div className="mt-2 flex items-center gap-2">
            <code className="truncate rounded bg-white px-2 py-1 text-xs">
              {newKey}
            </code>
            <CopyButton value={newKey} />
          </div>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader title="Your API keys" />
          <CardBody>
            {keys.isLoading ? (
              <Loader label="Loading keys" />
            ) : (keys.data ?? []).length === 0 ? (
              <EmptyState
                icon={<KeyRound className="h-5 w-5" />}
                title="No API keys yet"
                description="Create your first key to get started."
              />
            ) : (
              <DataTable columns={columns} rows={keys.data ?? []} rowKey={(k) => k.id} />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Create a key" />
          <CardBody>
            <div className="space-y-4">
              <Input
                label="Key name"
                placeholder="e.g. Production integration"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Scopes
                </p>
                <div className="space-y-2">
                  {allScopes.map((scope) => (
                    <Checkbox
                      key={scope}
                      label={scope}
                      checked={scopes.includes(scope)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setScopes((prev) => [...prev, scope]);
                        } else {
                          setScopes((prev) => prev.filter((s) => s !== scope));
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
              <Button
                fullWidth
                onClick={onCreate}
                disabled={!name || scopes.length === 0}
                loading={keys.create.isPending}
              >
                Create key
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}