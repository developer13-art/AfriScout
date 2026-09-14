import { Container } from "../../components/layout/Container";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { SeoHead } from "../../components/common/SeoHead";
import { appConfig } from "../../config/app";

export function About() {
  return (
    <>
      <SeoHead
        title="About AfriScout"
        description="AfriScout is an AI-powered opportunity intelligence platform built for Africa."
      />
      <Container className="py-8">
        <PageHeader
          title="About AfriScout"
          description={appConfig.tagline}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="text-sm font-semibold text-neutral-900">Our mission</p>
            <p className="mt-2 text-sm text-neutral-600">
              Make it easier for every African person, business, startup, student,
              and organization to discover and act on opportunities that matter
              to them.
            </p>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-neutral-900">Our approach</p>
            <p className="mt-2 text-sm text-neutral-600">
              Real public sources, Apify-powered discovery, AI intelligence,
              explainable matching, and a workspace for every step from
              discovery to outcome.
            </p>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-neutral-900">Our values</p>
            <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
              <li>- Truth over volume. No fabricated opportunities.</li>
              <li>- Source facts always separated from AI interpretation.</li>
              <li>- The publisher owns the application. AfriScout owns the intelligence.</li>
              <li>- Provenance preserved on every record.</li>
            </ul>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-neutral-900">Contact</p>
            <p className="mt-2 text-sm text-neutral-600">
              Reach out at{" "}
              <a
                href={`mailto:${appConfig.supportEmail}`}
                className="text-primary-700 hover:underline"
              >
                {appConfig.supportEmail}
              </a>
              .
            </p>
          </Card>
        </div>
      </Container>
    </>
  );
}