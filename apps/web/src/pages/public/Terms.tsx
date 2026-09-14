import { Container } from "../../components/layout/Container";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { SeoHead } from "../../components/common/SeoHead";

export function Terms() {
  return (
    <>
      <SeoHead title="Terms of service" description="AfriScout terms of service." />
      <Container className="py-8">
        <PageHeader title="Terms of service" description="Last updated on deployment." />
        <Card>
          <div className="space-y-4 text-sm text-neutral-700">
            <section>
              <p className="font-semibold text-neutral-900">Use of AfriScout</p>
              <p className="mt-1">
                AfriScout provides opportunity intelligence and workflow tools.
                You are responsible for the accuracy of information you enter and
                for verifying any opportunity against its official source before
                acting.
              </p>
            </section>
            <section>
              <p className="font-semibold text-neutral-900">Account responsibility</p>
              <p className="mt-1">
                Keep your account credentials secure. Do not share API keys. You
                are responsible for the actions performed under your account.
              </p>
            </section>
            <section>
              <p className="font-semibold text-neutral-900">No guarantee of outcomes</p>
              <p className="mt-1">
                Match scores, AI summaries, and analyst outputs are decision
                support only. They do not guarantee eligibility, acceptance, or
                success. The official source remains authoritative.
              </p>
            </section>
          </div>
        </Card>
      </Container>
    </>
  );
}