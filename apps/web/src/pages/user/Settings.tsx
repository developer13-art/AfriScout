import { useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Switch } from "../../components/ui/Switch";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { useAuth } from "../../hooks/useAuth";
import { SeoHead } from "../../components/common/SeoHead";
import { useNavigate } from "react-router-dom";

export function Settings() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <>
      <SeoHead title="Settings" />
      <PageHeader title="Settings" description="Manage your account and preferences." />

      {saved ? (
        <Alert tone="success" className="mb-4">
          Preferences saved.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Notifications" />
          <CardBody>
            <div className="space-y-3">
              <Switch
                label="Email notifications"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
              />
              <Switch
                label="Push notifications"
                checked={pushEnabled}
                onChange={(e) => setPushEnabled(e.target.checked)}
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setSaved(true)}>
                  Save preferences
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Account" />
          <CardBody>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  await signOut();
                  navigate("/");
                }}
              >
                Sign out
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}