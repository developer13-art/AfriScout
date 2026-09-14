import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { SeoHead } from "../../components/common/SeoHead";

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/opportunities",
    description: "List canonical opportunities with filters and pagination.",
  },
  {
    method: "GET",
    path: "/api/v1/opportunities/:slug",
    description: "Retrieve a single opportunity by slug.",
  },
  {
    method: "GET",
    path: "/api/v1/opportunities/:id/requirements",
    description: "List structured requirements for a given opportunity.",
  },
  {
    method: "GET",
    path: "/api/v1/opportunities/:id/documents",
    description: "List attached documents and their extraction status.",
  },
  {
    method: "GET",
    path: "/api/v1/opportunities/:id/changes",
    description: "List detected changes for a given opportunity.",
  },
  {
    method: "GET",
    path: "/api/v1/search",
    description: "Search across opportunities with query and filters.",
  },
  {
    method: "GET",
    path: "/api/v1/categories",
    description: "List all opportunity categories.",
  },
  {
    method: "GET",
    path: "/api/v1/countries",
    description: "List supported African countries.",
  },
  {
    method: "GET",
    path: "/api/v1/organizations",
    description: "List organizations.",
  },
  {
    method: "GET",
    path: "/api/v1/sources",
    description: "List public opportunity sources.",
  },
  {
    method: "GET",
    path: "/api/v1/matches",
    description: "List matches for the authenticated user.",
  },
  {
    method: "GET",
    path: "/api/v1/analytics",
    description: "Usage and performance analytics for the authenticated user.",
  },
];

const methodTone: Record<string, "primary" | "success" | "warning" | "danger" | "neutral"> = {
  GET: "primary",
  POST: "success",
  PUT: "warning",
  PATCH: "warning",
  DELETE: "danger",
};

export function ApiDocs() {
  return (
    <>
      <SeoHead title="API documentation" />
      <PageHeader
        title="API documentation"
        description="Base URL, authentication, and endpoint reference."
      />

      <Card>
        <CardHeader title="Authentication" />
        <CardBody>
          <p className="text-sm text-neutral-700">
            Every request must include an{" "}
            <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
              Authorization: Bearer &lt;key&gt;
            </code>{" "}
            header. Keys are issued through the API keys page and are scoped to
            specific resources.
          </p>
          <p className="mt-3 text-sm text-neutral-700">
            Base URL:{" "}
            <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
              {import.meta.env.VITE_API_URL}
            </code>
          </p>
          <p className="mt-3 text-sm text-neutral-700">
            Responses use a consistent envelope. Success:{" "}
            <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
              {`{ data: T }`}
            </code>{" "}
            - failure:{" "}
            <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
              {`{ error: { code, message } }`}
            </code>
            .
          </p>
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Endpoints" />
        <CardBody>
          <ul className="divide-y divide-neutral-100">
            {endpoints.map((endpoint) => (
              <li
                key={`${endpoint.method}-${endpoint.path}`}
                className="flex flex-wrap items-center gap-3 py-3"
              >
                <Badge tone={methodTone[endpoint.method] ?? "neutral"}>
                  {endpoint.method}
                </Badge>
                <code className="text-xs text-neutral-800">{endpoint.path}</code>
                <span className="ml-auto text-xs text-neutral-500">
                  {endpoint.description}
                </span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </>
  );
}