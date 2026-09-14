import { Container } from "../../components/layout/Container";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { SeoHead } from "../../components/common/SeoHead";
import { appConfig } from "../../config/app";

export function Privacy() {
  return (
    <>
      <SeoHead title="Privacy policy" description="AfriScout privacy policy." />
      <Container className="py-8">
        <PageHeader title="Privacy policy" description="Last updated on deployment." />
        <Card>
          <div className="space-y-4 text-sm text-neutral-700">
            <section>
              <p className="font-semibold text-neutral-900">Data we collect</p>
              <p className="mt-1">
                We collect the minimum data required to operate AfriScout: your
                account details, your DNA profile, and your activity in the
                workspace. We never collect credentials from external
                application systems.
              </p>
            </section>
            <section>
              <p className="font-semibold text-neutral-900">Source data</p>
              <p className="mt-1">
                Opportunity data is collected from legitimate public sources. We
                preserve source attribution on every opportunity and provide a
                link to the original source.
              </p>
            </section>
            <section>
              <p className="font-semibold text-neutral-900">Your rights</p>
              <p className="mt-1">
                You can request export or deletion of your account data at any
                time by contacting{" "}
                <a
                  href={`mailto:${appConfig.privacyEmail}`}
                  className="text-primary-700 hover:underline"
                >
                  {appConfig.privacyEmail}
                </a>
                .
              </p>
            </section>
          </div>
        </Card>
      </Container>
    </>
  );
}