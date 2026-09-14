import { Container } from "../../components/layout/Container";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Section } from "../../components/layout/Section";
import { SeoHead } from "../../components/common/SeoHead";

const steps = [
  {
    title: "1. Discovery",
    body: "Apify Actors visit each registered public source, extract opportunities, and return structured data. Every run is logged with counts and health status.",
  },
  {
    title: "2. Processing",
    body: "Raw records are normalised, validated, deduplicated against existing opportunities, and preserved with version history.",
  },
  {
    title: "3. Intelligence",
    body: "AI summarises the opportunity, extracts eligibility, requirements, and documents, and flags risks or concerns.",
  },
  {
    title: "4. Matching",
    body: "Each opportunity is scored against your Business DNA with weighted components and explained reasons.",
  },
  {
    title: "5. Action",
    body: "Save, watch, and add opportunities to your pipeline. Track submissions and outcomes across your workspace.",
  },
  {
    title: "6. Monitoring",
    body: "Watched opportunities are continuously checked. Deadline changes, requirement updates, and new documents trigger notifications.",
  },
];

export function HowItWorks() {
  return (
    <>
      <SeoHead
        title="How it works"
        description="Learn how AfriScout discovers, understands, matches, and monitors opportunities across Africa."
      />
      <Container className="py-8">
        <PageHeader
          title="How AfriScout works"
          description="From real public data to real actions, here's what happens under the hood."
        />
        <Section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step) => (
              <Card key={step.title}>
                <p className="text-sm font-semibold text-neutral-900">
                  {step.title}
                </p>
                <p className="mt-2 text-sm text-neutral-600">{step.body}</p>
              </Card>
            ))}
          </div>
        </Section>
      </Container>
    </>
  );
}