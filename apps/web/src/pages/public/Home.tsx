import { Link } from "react-router-dom";
import { Search, ArrowRight, ShieldCheck, Sparkles, Bell, Layers } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Section } from "../../components/layout/Section";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { SeoHead } from "../../components/common/SeoHead";
import { AfricaOpportunityMap } from "../../components/map/AfricaOpportunityMap";
import { usePublicCountryBreakdown } from "../../hooks/usePublicAnalytics";
import { appConfig } from "../../config/app";
import { opportunityCategories } from "../../config/categories";

const features = [
  {
    icon: Search,
    title: "Unified discovery",
    body: "Tenders, grants, jobs, scholarships, funding, and startup programs from trusted public sources across Africa.",
  },
  {
    icon: Sparkles,
    title: "AI intelligence",
    body: "Every opportunity is summarised, classified, and explained so you know what it actually requires.",
  },
  {
    icon: Layers,
    title: "Explainable matching",
    body: "Match scores with reasons and concerns, computed from your Business DNA, never a black box.",
  },
  {
    icon: Bell,
    title: "Change monitoring",
    body: "Deadline shifts, requirement updates, and new documents trigger alerts for the opportunities you watch.",
  },
];

const howItWorks = [
  {
    title: "Discover",
    body: "AfriScout runs Apify-powered discovery across registered public sources to collect opportunities in real time.",
  },
  {
    title: "Understand",
    body: "The pipeline normalises, validates, deduplicates, and analyses each opportunity before it reaches your feed.",
  },
  {
    title: "Match",
    body: "Your Business DNA is compared against every opportunity to produce a fully explainable match score.",
  },
  {
    title: "Act",
    body: "Track applications, prepare documents, monitor deadlines, and record outcomes in one workspace.",
  },
];

export function Home() {
  const countryQuery = usePublicCountryBreakdown();
  const countryData = countryQuery.data ?? [];

  return (
    <>
      <SeoHead
        title={`${appConfig.name} - ${appConfig.tagline}`}
        description={appConfig.shortDescription}
      />

      <section className="border-b border-neutral-200 bg-gradient-to-b from-teal-50/70 to-white">
        <Container className="py-14 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-teal-200">
                <ShieldCheck aria-hidden className="h-3.5 w-3.5" />
                Built for Africa. Sourced from real public data.
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-neutral-900 sm:text-5xl">
                Discover Opportunities.
                <br />
                Understand Them.
                <br />
                Act With Confidence.
              </h1>
              <p className="mt-4 max-w-xl text-base text-neutral-600">
                AfriScout is Africa&apos;s opportunity intelligence platform.
                We bring together tenders, grants, jobs, scholarships,
                funding, and more from trusted sources across the continent,
                and help you decide what to pursue.
              </p>

              <form
                action="/explore"
                className="mt-6 flex flex-col gap-2 sm:flex-row"
              >
                <Input
                  className="flex-1"
                  name="q"
                  placeholder="Search opportunities, grants, jobs, tenders..."
                  leftIcon={<Search className="h-4 w-4" />}
                />
                <Button type="submit" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Search
                </Button>
              </form>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-neutral-500">
                  Popular searches:
                </span>
                {[
                  "Construction tenders",
                  "Grants for startups",
                  "Scholarships 2025",
                  "Remote jobs",
                ].map((term) => (
                  <Link
                    key={term}
                    to={`/explore?q=${encodeURIComponent(term)}`}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 hover:border-primary-300 hover:text-primary-700"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <AfricaOpportunityMap
                  data={countryData}
                  height={420}
                  compact
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Section className="py-14">
        <Container>
          <Section
            title="Explore opportunities across categories"
            description="From business and funding to education and development, find the right opportunities for you."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {opportunityCategories.slice(0, 8).map((category) => (
                <Link
                  key={category.value}
                  to={`/explore?category=${category.value}`}
                  className="group rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <p className="text-sm font-semibold text-neutral-900 group-hover:text-primary-700">
                    {category.label}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {category.group}
                  </p>
                </Link>
              ))}
            </div>
          </Section>
        </Container>
      </Section>

      <Section className="bg-neutral-50 py-14">
        <Container>
          <Section
            title="More than a search engine"
            description="AfriScout doesn't just find opportunities. It understands them."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title}>
                    <span
                      className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700"
                      aria-hidden
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-semibold text-neutral-900">
                      {feature.title}
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {feature.body}
                    </p>
                  </Card>
                );
              })}
            </div>
          </Section>
        </Container>
      </Section>

      <Section className="py-14">
        <Container>
          <Section
            title="How it works"
            description="Four steps from discovery to outcome."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks.map((step, index) => (
                <Card key={step.title}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                    Step {index + 1}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">{step.body}</p>
                </Card>
              ))}
            </div>
          </Section>
        </Container>
      </Section>

      <Section className="border-t border-neutral-200 bg-neutral-50 py-14">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-neutral-200 bg-white p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">
                Start discovering opportunities today
              </h3>
              <p className="mt-1 text-sm text-neutral-600">
                Create your free account and set up your Business DNA.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/register">
                <Button>Get started</Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="outline">Learn more</Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}