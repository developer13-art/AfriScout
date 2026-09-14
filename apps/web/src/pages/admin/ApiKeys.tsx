import { PageHeader } from "../../components/layout/PageHeader";
import { ApiKeyManager } from "../../components/admin/ApiKeyManager";
import { Loader } from "../../components/ui/Loader";
import { useApiKeys } from "../../hooks/useApiKeys";
import { SeoHead } from "../../components/common/SeoHead";

export function ApiKeys() {
  const keys = useApiKeys();

  return (
    <>
      <SeoHead title="API keys" />
      <PageHeader
        title="API keys"
        description="Issue and revoke API keys for developers."
      />
      {keys.isLoading ? (
        <Loader fullPage label="Loading API keys" />
      ) : (
        <ApiKeyManager
          keys={keys.data ?? []}
          onCreate={() => keys.create.mutate({ name: "New key", scopes: ["opportunities:read"] })}
          onRevoke={(id) => keys.revoke.mutate(id)}
        />
      )}
    </>
  );
}