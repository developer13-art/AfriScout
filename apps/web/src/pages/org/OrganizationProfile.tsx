import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { Loader } from "../../components/ui/Loader";
import { OrgAvatar } from "../../components/common/OrgAvatar";
import { organizationService } from "../../services/organization.service";
import { africanCountries } from "../../config/countries";
import { SeoHead } from "../../components/common/SeoHead";
import { HttpError } from "../../services/http";

export function OrganizationProfile() {
  const query = useQuery({
    queryKey: ["organization", "me"],
    queryFn: () => organizationService.list(1, 1).then((items) => items[0] ?? null),
  });

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.data) {
      setName(query.data.name);
      setWebsite(query.data.website ?? "");
      setDescription(query.data.description ?? "");
      setCountryCode(query.data.countryCode ?? "");
    }
  }, [query.data]);

  const save = async () => {
    if (!query.data) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await organizationService.update(query.data.id, {
        name,
        website,
        description,
        countryCode,
      });
      setSuccess(true);
      query.refetch();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  if (query.isLoading) return <Loader fullPage label="Loading organization" />;

  if (!query.data) {
    return (
      <>
        <SeoHead title="Organization" />
        <PageHeader title="Organization" />
        <Alert tone="info">
          You are not yet part of an organization. Create one in settings.
        </Alert>
      </>
    );
  }

  return (
    <>
      <SeoHead title="Organization profile" />
      <PageHeader
        title="Organization profile"
        description="Public information about your organization."
      />

      {success ? (
        <Alert tone="success" className="mb-4">
          Organization updated.
        </Alert>
      ) : null}
      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader title="Logo" />
          <div className="flex flex-col items-center gap-3">
            <OrgAvatar name={query.data.name} logoUrl={query.data.logoUrl} size="lg" />
            <p className="text-sm font-medium text-neutral-900">{query.data.name}</p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Details" />
          <CardBody>
            <div className="space-y-4">
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input
                label="Website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
              <Select
                label="Country"
                placeholder="Select a country"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                options={africanCountries.map((c) => ({
                  value: c.code,
                  label: c.name,
                }))}
              />
              <Textarea
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              <div className="flex justify-end">
                <Button onClick={save} loading={saving}>
                  Save
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}