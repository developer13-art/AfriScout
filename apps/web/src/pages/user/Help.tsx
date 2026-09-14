import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { appConfig } from "../../config/app";
import { SeoHead } from "../../components/common/SeoHead";

export function Help() {
  return (
    <>
      <SeoHead title="Help" />
      <PageHeader title="Help" description="Quick answers to common questions." />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader title="How is matching calculated?" />
          <CardBody>
            We compare your Business DNA to each opportunity across industry,
            location, capability, value, eligibility, and experience. Every
            score is explained with reasons and concerns.
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Where do opportunities come from?" />
          <CardBody>
            From legitimate public sources across Africa. We record the source
            and link back to the official listing so you can verify anything.
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Does AfriScout apply on my behalf?" />
          <CardBody>
            No. AfriScout provides intelligence and workflow. Applications are
            submitted on the official source, and you record the outcome here.
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Contact support" />
          <CardBody>
            Email{" "}
            <a
              className="text-primary-700 hover:underline"
              href={`mailto:${appConfig.supportEmail}`}
            >
              {appConfig.supportEmail}
            </a>
          </CardBody>
        </Card>
      </div>
    </>
  );
}