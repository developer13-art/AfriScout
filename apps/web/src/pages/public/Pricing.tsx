import { Link } from "react-router-dom";
import { Check, ArrowRight, Sparkles, HelpCircle } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Section } from "../../components/layout/Section";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { SeoHead } from "../../components/common/SeoHead";

interface Plan {
  name: string;
  price: string;
  cadence?: string;
  description: string;
  features: string[];
  cta: string;
  to: string;
  highlight?: boolean;
}

const plans: Plan[] = [
  {
    name: "Free",
    price: "Free",
    description: "For anyone starting to explore opportunities on AfriScout.",
    features: [
      "Basic opportunity discovery",
      "Search and filters across categories",
      "Limited saved opportunities",
      "Basic deadline alerts",
      "Basic profile and Business DNA",
    ],
    cta: "Create free account",
    to: "/register",
  },
  {
    name: "Pro",
    price: "Coming soon",
    description: "For professionals, students, freelancers, and startup founders.",
    features: [
      "Advanced matching with reasons and concerns",
      "AI opportunity analysis and summaries",
      "Opportunity Radar",
      "Personalized alerts and digests",
      "Opportunity pipeline with stages",
      "Document intelligence",
    ],
    cta: "Join waitlist",
    to: "/register",
    highlight: true,
  },
  {
    name: "Business",
    price: "Talk to us",
    description: "For SMEs, contractors, agencies, consultancies, and NGOs.",
    features: [
      "Everything in Pro",
      "Business DNA and team workspace",
      "Shared pipeline and assignments",
      "Advanced analytics and reporting",
      "Higher alert limits",
      "API access",
    ],
    cta: "Contact sales",
    to: "/contact",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations, institutions, and intelligence teams.",
    features: [
      "Custom sources and feeds",
      "Multi-country monitoring",
      "Advanced API and webhooks",
      "Dedicated intelligence support",
      "Sector-specific analytics",
      "Enterprise SLAs",
    ],
    cta: "Contact sales",
    to: "/contact",
  },
];

const faqs = [
  {
    question: "What do I get on the free plan?",
    answer:
      "Basic discovery, search, a limited number of saved opportunities, and basic deadline alerts. It is enough to see whether AfriScout is useful for you before upgrading.",
  },
  {
    question: "What does “matching” actually mean?",
    answer:
      "AfriScout compares each opportunity against your Business or User DNA across industry, location, capability, value, eligibility, and experience. You see a score plus the reasons and concerns behind it — never a number without an explanation.",
  },
  {
    question: "How does AfriScout get its opportunity data?",
    answer:
      "From legitimate public sources across Africa. Every opportunity carries a link to the original publisher. AfriScout is an intelligence layer, not a replacement for the source.",
  },
  {
    question: "Do I apply through AfriScout?",
    answer:
      "No. AfriScout tracks your preparation and submission status, but you always apply on the official publisher's platform. AfriScout links you to it directly.",
  },
  {
    question: "Can I change plans later?",
    answer:
      "Yes. You can upgrade, downgrade, or cancel at any time. When paid plans launch, changes will be prorated.",
  },
  {
    question: "Do you offer discounts for students or NGOs?",
    answer:
      "We plan to. If you represent a student organization, university, or NGO, contact us and we will work with you.",
  },
];

export function Pricing() {
  return (
    <>
      <SeoHead
        title="Pricing"
        description="AfriScout plans for individuals, teams, businesses, and enterprises."
      />

      <section className="border-b border-neutral-200 bg-gradient-to-b from-teal-50/60 to-white">
        <Container className="py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-teal-200">
              <Sparkles aria-hidden className="h-3.5 w-3.5" />
              Simple, transparent pricing
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-neutral-900 sm:text-4xl">
              Plans for every stage
            </h1>
            <p className="mt-4 text-base text-neutral-600">
              Start free, upgrade when you need more. Whether you are an individual, a growing
              business, or a large organization, there is a plan for you.
            </p>
          </div>
        </Container>
      </section>

      <Section className="py-14">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.highlight ? "ring-2 ring-primary-600 relative" : "relative"}
              >
                {plan.highlight ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge tone="primary">Most popular</Badge>
                  </span>
                ) : null}

                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-900">{plan.name}</p>
                </div>
                <p className="mt-1 text-lg font-semibold text-neutral-900">{plan.price}</p>
                <p className="mt-2 text-xs text-neutral-600">{plan.description}</p>

                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-neutral-700">
                      <Check
                        aria-hidden
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <Link to={plan.to}>
                    <Button
                      variant={plan.highlight ? "primary" : "outline"}
                      fullWidth
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-neutral-50 py-14">
        <Container>
          <Section
            title="Frequently asked questions"
            description="Answers to what we get asked most."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {faqs.map((faq) => (
                <Card key={faq.question}>
                  <div className="flex items-start gap-3">
                    <HelpCircle
                      aria-hidden
                      className="mt-0.5 h-5 w-5 shrink-0 text-primary-600"
                    />
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{faq.question}</p>
                      <p className="mt-1 text-sm text-neutral-600">{faq.answer}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Section>
        </Container>
      </Section>

      <Section className="py-14">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-neutral-200 bg-white p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">
                Still deciding? Try it first.
              </h3>
              <p className="mt-1 text-sm text-neutral-600">
                The free plan is enough to explore. Upgrade only when you need more.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/register">
                <Button>Create free account</Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline">Contact us</Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}