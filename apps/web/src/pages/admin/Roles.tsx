import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { SeoHead } from "../../components/common/SeoHead";

const roles = [
  {
    role: "SUPER_ADMIN",
    description:
      "Full platform control, including user management, sources, settings, and security.",
  },
  {
    role: "DATA_ADMIN",
    description:
      "Owns the source registry, adapters, actor runs, data quality, and verification.",
  },
  {
    role: "USER",
    description:
      "Discovers, saves, watches, and tracks opportunities through to outcome.",
  },
  {
    role: "API_DEVELOPER",
    description:
      "Consumes structured opportunity data through the AfriScout public API.",
  },
];

export function Roles() {
  return (
    <>
      <SeoHead title="Roles" />
      <PageHeader
        title="Roles"
        description="Role definitions and their responsibilities."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {roles.map((entry) => (
          <Card key={entry.role}>
            <CardHeader title={entry.role} />
            <CardBody>
              <p className="text-sm text-neutral-600">{entry.description}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}