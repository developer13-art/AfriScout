import { Link } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { SeoHead } from "../../components/common/SeoHead";
import { ArrowRight, Code2, KeyRound, Gauge, Webhook, BookOpen } from "lucide-react";

const entries = [
  {
    to: "/developer/docs",
    title: "API documentation",
    description:
      "Full reference for the AfriScout public API, including endpoints, schemas, and error codes.",
    icon: BookOpen,
  },
  {
    to: "/developer/keys",
    title: "API keys",
    description:
      "Issue, rotate, and revoke keys with scoped access to opportunity data.",
    icon: KeyRound,
  },
  {
    to: "/developer/playground",
    title: "API playground",
    description:
      "Send live requests against the API with your key and inspect the responses.",
    icon: Code2,
  },
  {
    to: "/developer/usage",
    title: "API usage",
    description:
      "Request volume, errors, and rate limit consumption per key.",
    icon: Gauge,
  },
  {
    to: "/developer/webhooks",
    title: "Webhooks",
    description:
      "Subscribe your systems to opportunity and match events with signed payloads.",
    icon: Webhook,
  },
];

export function ApiPortal() {
  return (
    <>
      <SeoHead title="API portal" />
      <PageHeader
        title="Developer portal"
        description="Programmatic access to AfriScout opportunity intelligence."
        actions={
          <Link to="/developer/docs">
            <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
              Read the docs
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map((entry) => {
          const Icon = entry.icon;
          return (
            <Card key={entry.to} interactive>
              <Link to={entry.to} className="block">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    <Icon aria-hidden className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {entry.title}
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {entry.description}
                    </p>
                  </div>
                </div>
              </Link>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader title="Getting started" />
        <CardBody>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-neutral-700">
            <li>Create an API key from the API keys page.</li>
            <li>
              Send requests with the header{" "}
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
                Authorization: Bearer &lt;key&gt;
              </code>
              .
            </li>
            <li>
              Base URL:{" "}
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
                {import.meta.env.VITE_API_URL}
              </code>
            </li>
            <li>
              Every response uses a{" "}
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
                {`{ data }`}
              </code>{" "}
              wrapper on success and{" "}
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
                {`{ error }`}
              </code>{" "}
              on failure.
            </li>
          </ol>
        </CardBody>
      </Card>
    </>
  );
}