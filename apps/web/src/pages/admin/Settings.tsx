import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Switch } from "../../components/ui/Switch";
import { useState } from "react";
import { SeoHead } from "../../components/common/SeoHead";

export function Settings() {
  const [schedulerEnabled, setSchedulerEnabled] = useState(true);
  const [maintenance, setMaintenance] = useState(false);

  return (
    <>
      <SeoHead title="System settings" />
      <PageHeader
        title="System settings"
        description="Global configuration values used by the platform."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Scheduling" />
          <CardBody>
            <Switch
              label="Enable source scheduling"
              description="When off, discovery only runs on manual trigger."
              checked={schedulerEnabled}
              onChange={(e) => setSchedulerEnabled(e.target.checked)}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Maintenance" />
          <CardBody>
            <Switch
              label="Maintenance mode"
              description="Blocks non-admin traffic while enabled."
              checked={maintenance}
              onChange={(e) => setMaintenance(e.target.checked)}
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}