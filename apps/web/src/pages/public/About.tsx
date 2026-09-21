import { Link } from "react-router-dom";
import {
  Target,
  Compass,
  ShieldCheck,
  Layers,
  Globe,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Section } from "../../components/layout/Section";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { SeoHead } from "../../components/common/SeoHead";
import { appConfig } from "../../config/app";

const values = [
  {
    icon: Compass,
    title: "Discover",
    body: "Find opportunities that people and organizations would otherwise never know existed. Fragmentation should not be a barrier.",
  },
  {
    icon: Layers,
    title: "Understand",
    body: "Turn complex, jargon-heavy listings into clear, structured, actionable intelligence. Plain language over legal boilerplate.",
  },
  {
    icon: ShieldCheck,
    title: "Trust",
    body: "Preserve source attribution on every record. Separate facts from AI interpretation. Never fabricate anything.",
  },
  {
    icon: Globe,
    title: "Reach",
    body: "Serve the whole continent. Every country, every major opportunity category, every user type.",
  },
  {
    icon: Sparkles,
    title: "Explain",
    body: "Every score, every recommendation, every concern is visible. No black boxes.",
  },
  {
    icon: Target,
    title: "Act",
    body: "Stop at discovery and you are only half useful. Give users a workspace to prepare, apply, and track.",
  },
];

export function About() {
  return (
    <>
      <SeoHead
        title="About AfriScout"
        description="AfriScout is an AI-powered opportunity intelligence platform built for Africa."
      />

      <section className="border-b border-neutral-200 bg-gradient-to-b from-teal-50/60 to-white">
        <Container className="py-14 sm:py-20">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-teal-200">
              <ShieldCheck aria-hidden className="h-3.5 w-3.5" />
              {appConfig.tagline}
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-neutral-900 sm:text-4xl">
              About AfriScout
            </h1>
            <p className="mt-4 text-base text-neutral-600">
              AfriScout is an AI-powered opportunity intelligence platform built for Africa. Our
              goal is simple: make every legitimate opportunity easier to discover, easier to
              understand, easier to match, and easier to act on.
            </p>
            <p className="mt-4 text-base text-neutral-600">
              Every day, thousands of tenders, grants, jobs, scholarships, fellowships,
              competitions, and partnerships are published across Africa. Most of them go unseen by
              the very people and organizations who would benefit most. That gap â€” between
              publication and discovery â€” is what we exist to close.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/how-it-works">
                <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
                  See how it works
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline">Get in touch</Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Section className="py-14">
        <Container>
          <Section
            title="Our mission"
            description="Why we build this."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <p className="text-sm font-semibold text-neutral-900">The gap</p>
                <p className="mt-2 text-sm text-neutral-600">
                  Africa does not lack opportunity. What it lacks is visibility. A tender on a
                  state portal, a grant on a foundation page, a scholarship on a university site,
                  a funding program on an accelerator page â€” each one is published, but each one is
                  hidden behind its own website, its own terminology, its own update rhythm, and
                  its own language.
                </p>
              </Card>
              <Card>
                <p className="text-sm font-semibold text-neutral-900">What we do about it</p>
                <p className="mt-2 text-sm text-neutral-600">
                  AfriScout runs a continuous intelligence pipeline across thousands of public
                  sources. We structure and verify every opportunity. We explain what it actually
                  requires. We match it against your profile. We monitor it for changes. And we
                  give you a workspace to act on it â€” from review, to preparation, to submission,
                  to outcome.
                </p>
              </Card>
              <Card>
                <p className="text-sm font-semibold text-neutral-900">What we do not do</p>
                <p className="mt-2 text-sm text-neutral-600">
                  AfriScout never fabricates opportunities, statistics, or outcomes. We never
                  impersonate a publisher. We never claim authority over an application. The
                  original source always remains the authoritative place to act.
                </p>
              </Card>
              <Card>
                <p className="text-sm font-semibold text-neutral-900">Where we are going</p>
                <p className="mt-2 text-sm text-neutral-600">
                  Longer term, AfriScout is designed to become opportunity infrastructure â€” a
                  structured, machine-readable intelligence layer that serves individuals,
                  businesses, researchers, developers, and AI systems across the continent.
                </p>
              </Card>
            </div>
          </Section>
        </Container>
      </Section>

      <Section className="bg-neutral-50 py-14">
        <Container>
          <Section
            title="What we value"
            description="Six principles that shape every decision in the product."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((value) => {
                const Icon = value.icon;
                return (
                  <Card key={value.title}>
                    <span
                      className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700"
                      aria-hidden
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-semibold text-neutral-900">{value.title}</p>
                    <p className="mt-1 text-sm text-neutral-600">{value.body}</p>
                  </Card>
                );
              })}
            </div>
          </Section>
        </Container>
      </Section>

      <Section className="py-14">
        <Container>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-neutral-900">Contact</h3>
            <p className="mt-1 text-sm text-neutral-600">
              For partnerships, feedback, press, or anything else, reach us directly.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Support
                </p>
                <a
                  href={`mailto:${appConfig.supportEmail}`}
                  className="mt-1 block text-sm text-primary-700 hover:underline"
                >
                  {appConfig.supportEmail}
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Privacy
                </p>
                <a
                  href={`mailto:${appConfig.privacyEmail}`}
                  className="mt-1 block text-sm text-primary-700 hover:underline"
                >
                  {appConfig.privacyEmail}
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Legal
                </p>
                <a
                  href={`mailto:${appConfig.legalEmail}`}
                  className="mt-1 block text-sm text-primary-700 hover:underline"
                >
                  {appConfig.legalEmail}
                </a>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}