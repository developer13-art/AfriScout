import { useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { SeoHead } from "../../components/common/SeoHead";

export function OrganizationSettings() {
  const [success, setSuccess] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  return (
    <>
      <SeoHead title="Organization settings" />
      <PageHeader
        title="Organization settings"
        description="Administrative controls for your organization."
      />

      {success ? (
        <Alert tone="success" className="mb-4">
          Changes saved.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Visibility" />
          <CardBody>
            <p className="text-sm text-neutral-600">
              When public, your organization profile and published opportunities
              appear in the public directory.
            </p>
            <div className="mt-3 flex justify-end">
              <Button variant="outline" onClick={() => setSuccess(true)}>
                Save visibility
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Danger zone" />
          <CardBody>
            <p className="text-sm text-neutral-600">
              Deleting an organization removes all associated data. This action
              cannot be undone.
            </p>
            <div className="mt-3 space-y-2">
              <label className="block text-xs font-medium text-neutral-700">
                Type DELETE to confirm
              </label>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/30"
              />
              <div className="flex justify-end">
                <Button
                  variant="danger"
                  disabled={confirmText !== "DELETE"}
                  onClick={() => setConfirmText("")}
                >
                  Delete organization
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}