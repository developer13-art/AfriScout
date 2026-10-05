import { Link } from "react-router-dom";
import { FileText, ShieldCheck, Scale, ArrowRight } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { PageHeader } from "../../components/layout/PageHeader";
import { Section } from "../../components/layout/Section";
import { Card } from "../../components/ui/Card";
import { SeoHead } from "../../components/common/SeoHead";
import { appConfig } from "../../config/app";

export function Legal() {
  return (
    <>
      <SeoHead
        title="Legal"
        description="AfriScout legal information, terms, and privacy."
      />

      <Container className="py-8">
        <PageHeader
          title="Legal"
          description="Policies, terms, and privacy information for AfriScout."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <span
              aria-hidden
              className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700"
            >
              <FileText className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-neutral-900">Terms of service</p>
            <p className="mt-1 text-sm text-neutral-600">
              The rules for using AfriScout, the boundaries of what we do and do not do, and your
              responsibilities as a user.
            </p>
            <Link
              to="/terms"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
            >
              Read terms <ArrowRight className="h-3 w-3" />
            </Link>
          </Card>

          <Card>
            <span
              aria-hidden
              className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700"
            >
              <ShieldCheck className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-neutral-900">Privacy policy</p>
            <p className="mt-1 text-sm text-neutral-600">
              What data we collect, why, how we protect it, and your rights over it.
            </p>
            <Link
              to="/privacy"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
            >
              Read privacy policy <ArrowRight className="h-3 w-3" />
            </Link>
          </Card>

          <Card>
            <span
              aria-hidden
              className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700"
            >
              <Scale className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-neutral-900">Responsible data</p>
            <p className="mt-1 text-sm text-neutral-600">
              How AfriScout collects public opportunity data, preserves attribution, and
              distinguishes source facts from AI interpretation.
            </p>
            <a
              href="/how-it-works"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
            >
              Read the pipeline <ArrowRight className="h-3 w-3" />
            </a>
          </Card>
        </div>

        <Section className="mt-12">
          <Card padding="lg">
            <p className="text-sm font-semibold text-neutral-900">Contact</p>
            <p className="mt-2 text-sm text-neutral-600">
              For anything legal, privacy, or compliance related, contact{" "}
              <a
                className="text-primary-700 hover:underline"
                href={`mailto:${appConfig.legalEmail}`}
              >
                {appConfig.legalEmail}
              </a>
              . For privacy-specific requests, contact{" "}
              <a
                className="text-primary-700 hover:underline"
                href={`mailto:${appConfig.privacyEmail}`}
              >
                {appConfig.privacyEmail}
              </a>
              .
            </p>
          </Card>
        </Section>
      </Container>
    </>
  );
}