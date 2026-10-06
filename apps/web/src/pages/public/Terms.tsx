import { Container } from "../../components/layout/Container";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { SeoHead } from "../../components/common/SeoHead";
import { appConfig } from "../../config/app";

export function Terms() {
  return (
    <>
      <SeoHead title="Terms of service" description="AfriScout terms of service." />

      <Container className="py-8">
        <PageHeader
          title="Terms of service"
          description="The rules for using AfriScout."
        />

        <div className="space-y-6">
          <Card padding="lg">
            <div className="space-y-6 text-sm text-neutral-700">
              <section>
                <p className="font-semibold text-neutral-900">1. Acceptance</p>
                <p className="mt-1">
                  By creating an account or using AfriScout, you agree to these Terms. If you do
                  not agree, do not use the platform.
                </p>
              </section>

              <section>
                <p className="font-semibold text-neutral-900">2. What AfriScout is</p>
                <p className="mt-1">
                  AfriScout is an opportunity intelligence platform. It discovers opportunities
                  from legitimate public sources, structures and verifies them, uses AI to explain
                  them, matches them against user profiles, monitors them for changes, and provides
                  a workspace to prepare and track them.
                </p>
                <p className="mt-2">
                  AfriScout is not the publisher of any opportunity. It is not a replacement for
                  the original source. It does not accept or process applications.
                </p>
              </section>

              <section>
                <p className="font-semibold text-neutral-900">3. Account responsibility</p>
                <p className="mt-1">
                  You are responsible for keeping your account credentials secure, for the accuracy
                  of the information you provide (including your DNA profile), and for the actions
                  performed under your account. Do not share API keys. Do not use someone else's
                  account.
                </p>
              </section>

              <section>
                <p className="font-semibold text-neutral-900">4. Use of the platform</p>
                <p className="mt-1">
                  You agree to use AfriScout lawfully and in good faith. You will not attempt to
                  disrupt the platform, extract data at scale beyond permitted use, circumvent rate
                  limits, or use the platform to harass, defraud, or misrepresent.
                </p>
              </section>

              <section>
                <p className="font-semibold text-neutral-900">
                  5. Source information and AI interpretation
                </p>
                <p className="mt-1">
                  AfriScout clearly distinguishes three classes of data: source facts (what the
                  publisher published), AI interpretation (what our systems inferred), and your own
                  data (your profile, workspace, notes, and outcomes). AI output is labelled as
                  such and is decision support, not a guarantee.
                </p>
              </section>

              <section>
                <p className="font-semibold text-neutral-900">
                  6. No guarantee of outcomes
                </p>
                <p className="mt-1">
                  Match scores, AI summaries, analyst opinions, and recommendations are provided
                  as-is. They do not guarantee eligibility, acceptance, funding, or any other
                  outcome. The original source is authoritative. You are responsible for verifying
                  every opportunity before acting on it.
                </p>
              </section>

              <section>
                <p className="font-semibold text-neutral-900">7. Applications and submissions</p>
                <p className="mt-1">
                  AfriScout links you to the official publisher for every application. You are
                  responsible for completing the application on the publisher's platform, for
                  ensuring the information you submit is accurate, and for meeting the publisher's
                  requirements. AfriScout does not submit anything on your behalf.
                </p>
              </section>

              <section>
                <p className="font-semibold text-neutral-900">8. API and developer use</p>
                <p className="mt-1">
                  If you access AfriScout through our API, you agree to use it responsibly, respect
                  rate limits and scopes, keep your API keys secure, and not redistribute data in
                  a way that violates the original publisher's terms or the spirit of this
                  agreement.
                </p>
              </section>

              <section>
                <p className="font-semibold text-neutral-900">9. Paid plans</p>
                <p className="mt-1">
                  When paid plans become available, additional commercial terms apply to them.
                  Those terms will be presented before purchase. Nothing in these Terms obliges
                  AfriScout to offer any particular paid feature or price.
                </p>
              </section>

              <section>
                <p className="font-semibold text-neutral-900">10. Termination</p>
                <p className="mt-1">
                  You may stop using AfriScout at any time and request deletion of your account. We
                  may suspend or terminate accounts that violate these Terms, abuse the platform,
                  or create security or legal risk.
                </p>
              </section>

              <section>
                <p className="font-semibold text-neutral-900">11. Changes</p>
                <p className="mt-1">
                  We may update these Terms from time to time. Material changes will be announced
                  in the platform. Continued use after an update constitutes acceptance.
                </p>
              </section>

              <section>
                <p className="font-semibold text-neutral-900">12. Contact</p>
                <p className="mt-1">
                  Legal questions:{" "}
                  <a
                    href={`mailto:${appConfig.legalEmail}`}
                    className="text-primary-700 hover:underline"
                  >
                    {appConfig.legalEmail}
                  </a>
                  .
                </p>
              </section>
            </div>
          </Card>
        </div>
      </Container>
    </>
  );
}