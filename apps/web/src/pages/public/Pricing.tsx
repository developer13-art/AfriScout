import { Link } from "react-router-dom";
import { Container } from "../../components/layout/Container";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { SeoHead } from "../../components/common/SeoHead";

const plans = [
  {
    name: "Free",
    price: "Free",
    description: "Discover opportunities with a limited profile and basic alerts.",
    features: [
      "Basic opportunity discovery",
      "Basic search and filters",
      "Limited saved opportunities",
      "Basic deadline alerts",
    ],
    cta: "Create account",
    to: "/register",
  },
  {
    name: "Pro",
    price: "Coming soon",
    description: "For professionals, students, freelancers, and startup founders.",
    features: [
      "Advanced matching",
      "AI opportunity analysis",
      "Opportunity Radar",
      "Personalized alerts",
      "Opportunity pipeline",
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
      "Business DNA",
      "Team workspace",
      "Advanced analytics",
      "API access",
    ],
    cta: "Contact us",
    to: "/contact",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations and intelligence teams.",
    features: [
      "Custom sources and feeds",
      "Multi-country monitoring",
      "Advanced API",
      "Dedicated intelligence",
    ],
    cta: "Contact sales",
    to: "/contact",
  },
];

export function Pricing() {
  return (
    <>
      <SeoHead
        title="Pricing"
        description="Simple pricing for individuals, businesses, and enterprises."
      />
      <Container className="py-8">
        <PageHeader
          title="Pricing"
          description="Start free, upgrade when you need more."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.highlight ? "ring-2 ring-primary-600" : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-neutral-900">
                  {plan.name}
                </p>
                {plan.highlight ? <Badge tone="primary">Popular</Badge> : null}
              </div>
              <p className="mt-1 text-lg font-semibold text-neutral-900">
                {plan.price}
              </p>
              <p className="mt-2 text-xs text-neutral-600">{plan.description}</p>
              <ul className="mt-4 space-y-1.5 text-sm text-neutral-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1.5 inline-block h-1 w-1 rounded-full bg-primary-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                <Link to={plan.to}>
                  <Button
                    variant={plan.highlight ? "primary" : "outline"}
                    fullWidth
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
}