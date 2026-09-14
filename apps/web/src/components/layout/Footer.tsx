import { Link } from "react-router-dom";
import { Container } from "./Container";
import { AppLogo } from "../common/AppLogo";
import { appConfig } from "../../config/app";

const productLinks = [
  { label: "Explore", to: "/explore" },
  { label: "How It Works", to: "/how-it-works" },
  { label: "Sources", to: "/sources" },
  { label: "Pricing", to: "/pricing" },
];

const companyLinks = [
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Careers", to: "/careers" },
];

const legalLinks = [
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
  { label: "Legal", to: "/legal" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-neutral-50">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <AppLogo />
            <p className="mt-3 max-w-xs text-sm text-neutral-500">
              {appConfig.tagline}
            </p>
          </div>

          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Company" links={companyLinks} />
          <FooterColumn title="Legal" links={legalLinks} />
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-neutral-500">
            &copy; {year} {appConfig.name}. All rights reserved.
          </p>
          <p className="text-xs text-neutral-500">
            {appConfig.shortDescription}
          </p>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; to: string }[];
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </h4>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="text-sm text-neutral-700 hover:text-primary-700"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}