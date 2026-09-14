import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { SeoHead } from "../../components/common/SeoHead";

export function Notifications() {
  return (
    <>
      <SeoHead title="Notifications" />
      <PageHeader
        title="Notifications"
        description="System templates and delivery preferences."
      />
      <Card>
        <CardHeader title="Templates" />
        <CardBody>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li>New match</li>
            <li>Deadline soon</li>
            <li>Deadline changed</li>
            <li>Requirement changed</li>
            <li>Opportunity updated</li>
            <li>Source failed</li>
          </ul>
        </CardBody>
      </Card>
    </>
  );
}