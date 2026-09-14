import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { SeoHead } from "../../components/common/SeoHead";

export function AiMonitoring() {
  return (
    <>
      <SeoHead title="AI monitoring" />
      <PageHeader
        title="AI monitoring"
        description="Provider usage, latency, and fallback events."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Provider configuration" />
          <CardBody>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="font-medium text-neutral-900">Primary:</span>{" "}
                OpenAI
              </li>
              <li>
                <span className="font-medium text-neutral-900">Fallback 1:</span>{" "}
                Anthropic
              </li>
              <li>
                <span className="font-medium text-neutral-900">Fallback 2:</span>{" "}
                Gemini
              </li>
              <li>
                <span className="font-medium text-neutral-900">Fallback 3:</span>{" "}
                Mock
              </li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Today" />
          <CardBody>
            <p className="text-sm text-neutral-600">
              Daily token and cost metrics are aggregated from the
              ai_usage_daily table. They appear once real AI providers are
              configured.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}