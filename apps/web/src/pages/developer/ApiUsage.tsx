import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { StatCard } from "../../components/dashboard/StatCard";
import { SeoHead } from "../../components/common/SeoHead";

export function ApiUsage() {
  return (
    <>
      <SeoHead title="API usage" />
      <PageHeader
        title="API usage"
        description="Request volume, errors, and rate limit consumption per key."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Requests (24h)" value="-" />
        <StatCard label="Errors (24h)" value="-" />
        <StatCard label="Average latency" value="-" />
        <StatCard label="Rate limit hits" value="-" />
      </div>
      <Card className="mt-6">
        <CardHeader title="Per-key usage" />
        <CardBody>
          <p className="text-sm text-neutral-600">
            Per-key usage is populated from the api_key_usage_daily table once
            your keys begin serving traffic.
          </p>
        </CardBody>
      </Card>
    </>
  );
}