import { Link } from "react-router-dom";
import {
  Compass,
  Layers,
  Sparkles,
  Bell,
  ShieldCheck,
  GitCompareArrows,
  Workflow,
  BarChart3,
  Database,
  Search,
  FileCheck2,
  ArrowRight,
} from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Section } from "../../components/layout/Section";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { SeoHead } from "../../components/common/SeoHead";

const pipelineStages = [
  {
    icon: Database,
    title: "1. Source Registry",
    body: "Every monitored website, portal, or feed is registered as a source with a specific adapter. Sources are chosen, verified, and assigned a crawl cadence based on importance and update frequency.",
  },
  {
    icon: Search,
    title: "2. Discovery",
    body: "Apify Actors visit each source on its schedule, extract listings and detail pages, and write structured items into a dataset. Every extraction is logged with counts, timing, and errors.",
  },
  {
    icon: Layers,
    title: "3. Normalization",
    body: "Raw payloads from different sources are converted into one canonical opportunity schema. Fields like deadline, value, and category are mapped to consistent names and formats.",
  },
  {
    icon: ShieldCheck,
    title: "4. Validation",
    body: "Every normalized record is checked for required fields, valid dates, valid URLs, and reasonable values. Anything that fails is flagged instead of silently published.",
  },
  {
    icon: GitCompareArrows,
    title: "5. Deduplication",
    body: "The same opportunity often appears on multiple websites. We compare title similarity, organization, deadline, location, and reference numbers to collapse duplicates into a single canonical record with supporting sources.",
  },
  {
    icon: Bell,
    title: "6. Change Detection",
    body: "Watched opportunities are re-checked on every crawl. If the deadline moves, a requirement is added, or a document is updated, we record a change event and notify everyone tracking it.",
  },
  {
    icon: Sparkles,
    title: "7. AI Intelligence",
    body: "For every canonical opportunity, AI generates a plain-language summary, extracts eligibility and requirements, lists required documents, highlights risks, and suggests next steps. All AI output is clearly labelled.",
  },
  {
    icon: Workflow,
    title: "8. Matching",
    body: "The opportunity is compared against each user's Business DNA across industry, location, capability, value, eligibility, and experience. Every score is explainable with reasons and concerns.",
  },
  {
    icon: BarChart3,
    title: "9. Action and Outcome",
    body: "Users save, watch, and pipeline opportunities, prepare documents, apply through the official source, and record the outcome. Those outcomes feed back into the platform.",
  },
];

const principles = [
  {
    title: "Real public sources only",
    body: "We collect from legitimate public sources and never fabricate opportunities, statistics, or outcomes.",
  },
  {
    title: "Facts and AI are separated",
    body: "Source facts, AI interpretation, and user data are stored and shown separately. You always know which is which.",
  },
  {
    title: "Every score is explainable",
    body: "Match scores always come with reasons and concerns. There are no black boxes.",
  },
  {
    title: "The publisher remains authoritative",
    body: "AfriScout is an intelligence layer. Applications happen on the original source, always.",
  },
];

export function HowItWorks() {
  return (
    <>
      <SeoHead
        title="How AfriScout works"
        description="From public web sources to structured opportunity intelligence and real-world action."
      />

      <section className="border-b border-neutral-200 bg-gradient-to-b from-teal-50/60 to-white">
        <Container className="py-14 sm:py-20">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-teal-200">
              <Compass aria-hidden className="h-3.5 w-3.5" />
              From discovery to outcome
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-neutral-900 sm:text-4xl">
              How AfriScout works
            </h1>
            <p className="mt-4 text-base text-neutral-600">
              AfriScout continuously discovers opportunities from legitimate public sources across
              Africa, structures and verifies them, layers AI on top to explain what each one
              actually means, matches them against your profile, monitors them for important
              changes, and gives you a workspace to act.
            </p>
            <p className="mt-4 text-base text-neutral-600">
              This page describes the complete pipeline, from a source publishing an opportunity
              to a user recording the outcome.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/explore">
                <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Explore opportunities
                </Button>
              </Link>
              <Link to="/sources">
                <Button variant="outline">Browse sources</Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Section className="py-14">
        <Container>
          <Section
            title="The intelligence pipeline"
            description="Nine stages from a public web page to a fully actionable, personalized opportunity."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pipelineStages.map((stage) => {
                const Icon = stage.icon;
                return (
                  <Card key={stage.title}>
                    <span
                      className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700"
                      aria-hidden
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-semibold text-neutral-900">{stage.title}</p>
                    <p className="mt-1 text-sm text-neutral-600">{stage.body}</p>
                  </Card>
                );
              })}
            </div>
          </Section>
        </Container>
      </Section>

      <Section className="bg-neutral-50 py-14">
        <Container>
          <Section
            title="What happens when you use AfriScout"
            description="A walkthrough of the user-facing experience."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <p className="text-sm font-semibold text-neutral-900">1. Set up your DNA</p>
                <p className="mt-1 text-sm text-neutral-600">
                  Tell AfriScout what you do, where you operate, what you are capable of, and what
                  you are looking for. This becomes your Business, Professional, or Student DNA.
                </p>
              </Card>
              <Card>
                <p className="text-sm font-semibold text-neutral-900">2. Discover opportunities</p>
                <p className="mt-1 text-sm text-neutral-600">
                  Explore opportunities by category, country, deadline, value, or use the natural
                  language Ask AfriScout to describe what you need in your own words.
                </p>
              </Card>
              <Card>
                <p className="text-sm font-semibold text-neutral-900">3. Read the intelligence</p>
                <p className="mt-1 text-sm text-neutral-600">
                  Every opportunity has a summary, eligibility, requirements, documents, value,
                  deadline, source verification, and a full change history.
                </p>
              </Card>
              <Card>
                <p className="text-sm font-semibold text-neutral-900">4. See your match</p>
                <p className="mt-1 text-sm text-neutral-600">
                  See a relevance score with reasons and concerns. Nothing is hidden. You always
                  understand why an opportunity is recommended to you.
                </p>
              </Card>
              <Card>
                <p className="text-sm font-semibold text-neutral-900">5. Ask the analyst</p>
                <p className="mt-1 text-sm text-neutral-600">
                  Ask "Should I pursue this?" and get an AI-generated analyst view with strengths,
                  concerns, missing requirements, and next steps.
                </p>
              </Card>
              <Card>
                <p className="text-sm font-semibold text-neutral-900">6. Track through pipeline</p>
                <p className="mt-1 text-sm text-neutral-600">
                  Move opportunities from Reviewing through Preparing, Submitted, Under Review, and
                  Won or Lost. Prepare documents, take notes, and track outcomes in one place.
                </p>
              </Card>
            </div>
          </Section>
        </Container>
      </Section>

      <Section className="py-14">
        <Container>
          <Section
            title="Our principles"
            description="How we design AfriScout, in four commitments."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {principles.map((principle) => (
                <Card key={principle.title}>
                  <div className="flex items-start gap-3">
                    <FileCheck2 aria-hidden className="mt-0.5 h-5 w-5 text-primary-600" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{principle.title}</p>
                      <p className="mt-1 text-sm text-neutral-600">{principle.body}</p>
                    </div>
                  </div>
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
                Create your free account, set up your Business DNA, and see opportunities that
                actually fit.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/register">
                <Button>Get started</Button>
              </Link>
              <Link to="/explore">
                <Button variant="outline">Explore first</Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}