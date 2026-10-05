import { useState } from "react";
import type { ApiKey } from "../../types/apiKey";
import { Card, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { Badge } from "../ui/Badge";
import { KeyRound } from "lucide-react";
import { formatDateTime } from "../../utils/formatDate";

export interface ApiKeyManagerProps {
  keys: ApiKey[];
  onCreate: () => void;
  onRevoke: (id: string) => void;
}

export function ApiKeyManager({ keys, onCreate, onRevoke }: ApiKeyManagerProps) {
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    try {
      await onRevoke(id);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Card>
      <CardHeader
        title="API keys"
        actions={
          <Button size="sm" onClick={onCreate}>
            Create key
          </Button>
        }
      />
      {keys.length === 0 ? (
        <EmptyState
          icon={<KeyRound className="h-5 w-5" />}
          title="No API keys"
          description="Create a key to access the AfriScout API."
        />
      ) : (
        <ul className="divide-y divide-neutral-100">
          {keys.map((key) => (
            <li key={key.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900">
                  {key.name}{" "}
                  <span className="text-xs text-neutral-500">
                    ({key.prefix}...)
                  </span>
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
                  {key.scopes.map((scope) => (
                    <Badge key={scope} tone="neutral" size="sm">
                      {scope}
                    </Badge>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-neutral-400">
                  Created {formatDateTime(key.createdAt)}
                  {key.lastUsedAt
                    ? ` - last used ${formatDateTime(key.lastUsedAt)}`
                    : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRevoke(key.id)}
                loading={revokingId === key.id}
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}