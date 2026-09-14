import { Link } from "react-router-dom";
import { Container } from "../../components/layout/Container";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { SeoHead } from "../../components/common/SeoHead";

export function Legal() {
  return (
    <>
      <SeoHead title="Legal" description="AfriScout legal information and policies." />
      <Container className="py-8">
        <PageHeader
          title="Legal"
          description="Policies, terms, and privacy information for AfriScout."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <p className="text-sm font-semibold text-neutral-900">
              Terms of service
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              The rules for using AfriScout.
            </p>
            <Link
              to="/terms"
              className="mt-3 inline-block text-xs font-medium text-primary-700 hover:underline"
            >
              Read terms
            </Link>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-neutral-900">Privacy policy</p>
            <p className="mt-2 text-sm text-neutral-600">
              How we handle user data and source attribution.
            </p>
            <Link
              to="/privacy"
              className="mt-3 inline-block text-xs font-medium text-primary-700 hover:underline"
            >
              Read privacy
            </Link>
          </Card>
        </div>
      </Container>
    </>
  );
}