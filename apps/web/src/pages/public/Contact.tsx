import { useState, type FormEvent } from "react";
import { Container } from "../../components/layout/Container";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { SeoHead } from "../../components/common/SeoHead";
import { appConfig } from "../../config/app";

export function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <SeoHead title="Contact" description="Contact the AfriScout team." />
      <Container className="py-8">
        <PageHeader
          title="Contact us"
          description="Questions, partnerships, or feedback - we would love to hear from you."
        />
        <div className="grid gap-4 sm:grid-cols-[1fr_320px]">
          <Card>
            {submitted ? (
              <Alert tone="success" title="Thank you">
                Your message has been recorded locally. Email us directly at{" "}
                <a
                  className="underline"
                  href={`mailto:${appConfig.supportEmail}`}
                >
                  {appConfig.supportEmail}
                </a>{" "}
                while our messaging pipeline is being connected.
              </Alert>
            ) : (
              <form className="space-y-4" onSubmit={onSubmit}>
                <Input label="Full name" name="name" required />
                <Input label="Email" name="email" type="email" required />
                <Input label="Subject" name="subject" />
                <Textarea label="Message" name="message" rows={5} required />
                <Button type="submit">Send message</Button>
              </form>
            )}
          </Card>
          <Card>
            <p className="text-sm font-semibold text-neutral-900">Direct contact</p>
            <ul className="mt-2 space-y-2 text-sm text-neutral-700">
              <li>
                Support:{" "}
                <a className="text-primary-700 hover:underline" href={`mailto:${appConfig.supportEmail}`}>
                  {appConfig.supportEmail}
                </a>
              </li>
              <li>
                Privacy:{" "}
                <a className="text-primary-700 hover:underline" href={`mailto:${appConfig.privacyEmail}`}>
                  {appConfig.privacyEmail}
                </a>
              </li>
              <li>
                Legal:{" "}
                <a className="text-primary-700 hover:underline" href={`mailto:${appConfig.legalEmail}`}>
                  {appConfig.legalEmail}
                </a>
              </li>
            </ul>
          </Card>
        </div>
      </Container>
    </>
  );
}