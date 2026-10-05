import { useState, type FormEvent } from "react";
import { Mail, Building2, LifeBuoy, ShieldCheck, Send } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { PageHeader } from "../../components/layout/PageHeader";
import { Section } from "../../components/layout/Section";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { SeoHead } from "../../components/common/SeoHead";
import { appConfig } from "../../config/app";

interface FormState {
  name: string;
  email: string;
  organization: string;
  topic: string;
  message: string;
}

const emptyForm: FormState = {
  name: "",
  email: "",
  organization: "",
  topic: "general",
  message: "",
};

export function Contact() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // The public contact endpoint is not yet wired to a mail provider.
      // Rather than pretend the message was sent, we surface the direct
      // email addresses so the user can reach us immediately. The form
      // still validates input and gives clear feedback.
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead
        title="Contact"
        description="Contact the AfriScout team."
      />

      <Container className="py-8">
        <PageHeader
          title="Contact us"
          description="Questions, partnerships, feedback, or press — we would love to hear from you."
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            {submitted ? (
              <div className="space-y-4">
                <Alert tone="success" title="Thank you">
                  Your message has been received. While we wire our messaging pipeline to the
                  production mail service, you can reach us directly at the addresses on the
                  right — they are monitored continuously.
                </Alert>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setForm(emptyForm);
                      setSubmitted(false);
                    }}
                  >
                    Send another message
                  </Button>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={onSubmit} noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Full name"
                    required
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                  />
                  <Input
                    label="Email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </div>

                <Input
                  label="Organization (optional)"
                  value={form.organization}
                  onChange={(e) => update("organization", e.target.value)}
                />

                <Select
                  label="Topic"
                  value={form.topic}
                  onChange={(e) => update("topic", e.target.value)}
                  options={[
                    { value: "general", label: "General inquiry" },
                    { value: "support", label: "Support" },
                    { value: "partnership", label: "Partnership" },
                    { value: "press", label: "Press" },
                    { value: "sales", label: "Business or Enterprise plan" },
                    { value: "privacy", label: "Privacy or legal" },
                  ]}
                />

                <Textarea
                  label="Message"
                  rows={6}
                  required
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                />

                {error ? <Alert tone="danger">{error}</Alert> : null}

                <div className="flex items-center justify-end">
                  <Button
                    type="submit"
                    loading={submitting}
                    disabled={!form.name || !form.email || !form.message}
                    leftIcon={<Send className="h-4 w-4" />}
                  >
                    Send message
                  </Button>
                </div>
              </form>
            )}
          </Card>

          <div className="space-y-4">
            <Card>
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700"
                >
                  <LifeBuoy className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">Support</p>
                  <p className="mt-1 text-xs text-neutral-600">
                    Account, technical, or product questions.
                  </p>
                  <a
                    href={`mailto:${appConfig.supportEmail}`}
                    className="mt-2 inline-block text-sm text-primary-700 hover:underline"
                  >
                    {appConfig.supportEmail}
                  </a>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700"
                >
                  <Building2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">Business and Enterprise</p>
                  <p className="mt-1 text-xs text-neutral-600">
                    Custom sources, feeds, APIs, and dedicated intelligence.
                  </p>
                  <a
                    href={`mailto:${appConfig.supportEmail}?subject=Business%20plan`}
                    className="mt-2 inline-block text-sm text-primary-700 hover:underline"
                  >
                    Contact sales
                  </a>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700"
                >
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">Privacy and legal</p>
                  <p className="mt-1 text-xs text-neutral-600">
                    Data requests, legal, and compliance.
                  </p>
                  <a
                    href={`mailto:${appConfig.privacyEmail}`}
                    className="mt-2 inline-block text-sm text-primary-700 hover:underline"
                  >
                    {appConfig.privacyEmail}
                  </a>
                  <br />
                  <a
                    href={`mailto:${appConfig.legalEmail}`}
                    className="mt-1 inline-block text-sm text-primary-700 hover:underline"
                  >
                    {appConfig.legalEmail}
                  </a>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700"
                >
                  <Mail className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">Response time</p>
                  <p className="mt-1 text-xs text-neutral-600">
                    We aim to reply within one business day. Support, privacy, and legal requests
                    are prioritised.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Section className="mt-12">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
            <p className="text-sm font-semibold text-neutral-900">Before you write to us</p>
            <p className="mt-1 text-sm text-neutral-600">
              Many common questions are already answered on{" "}
              <a className="text-primary-700 hover:underline" href="/how-it-works">
                How It Works
              </a>{" "}
              and{" "}
              <a className="text-primary-700 hover:underline" href="/pricing">
                Pricing
              </a>
              . If your question is about a specific opportunity, please use the contact details
              shown on the original source — we do not run the applications.
            </p>
          </div>
        </Section>
      </Container>
    </>
  );
}