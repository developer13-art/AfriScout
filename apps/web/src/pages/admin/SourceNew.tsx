import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { useSources } from "../../hooks/useSources";
import { useSourceAdapters } from "../../hooks/useSources";
import { africanCountries } from "../../config/countries";
import { opportunityCategories } from "../../config/categories";
import type { Source } from "../../types/source";
import { SeoHead } from "../../components/common/SeoHead";

export function SourceNew() {
  const navigate = useNavigate();
  const adapters = useSourceAdapters();
  const { create } = useSources();

  const [draft, setDraft] = useState<Partial<Source>>({
    active: false,
    crawlFrequency: "DAILY",
    attributionRequired: true,
    sourceType: "OTHER",
  });
  const [error, setError] = useState<string | null>(null);

  const patch = <K extends keyof Source>(key: K, value: Source[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setError(null);
    if (!draft.name || !draft.url || !draft.adapter) {
      setError("Name, URL, and adapter are required.");
      return;
    }
    await create.mutateAsync(draft);
    navigate("/admin/sources");
  };

  return (
    <>
      <SeoHead title="Add source" />
      <PageHeader title="Add source" description="Register a new opportunity source." />

      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Identity" />
          <CardBody>
            <div className="space-y-4">
              <Input
                label="Name"
                value={draft.name ?? ""}
                onChange={(e) => patch("name", e.target.value)}
              />
              <Input
                label="URL"
                value={draft.url ?? ""}
                onChange={(e) => patch("url", e.target.value)}
              />
              <Select
                label="Country"
                placeholder="Select a country"
                value={draft.countryCode ?? ""}
                onChange={(e) => patch("countryCode", e.target.value)}
                options={africanCountries.map((c) => ({
                  value: c.code,
                  label: c.name,
                }))}
              />
              <Select
                label="Category"
                placeholder="Select a category"
                value={draft.category ?? ""}
                onChange={(e) => patch("category", e.target.value as Source["category"])}
                options={opportunityCategories.map((c) => ({
                  value: c.value,
                  label: c.label,
                }))}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Configuration" />
          <CardBody>
            <div className="space-y-4">
              <Select
                label="Adapter"
                placeholder="Select an adapter"
                value={draft.adapter ?? ""}
                onChange={(e) => patch("adapter", e.target.value)}
                options={(adapters.data ?? []).map((a) => ({
                  value: a.key,
                  label: `${a.label} (v${a.version})`,
                }))}
              />
              <Select
                label="Source type"
                value={draft.sourceType}
                onChange={(e) => patch("sourceType", e.target.value as Source["sourceType"])}
                options={[
                  { value: "GOVERNMENT", label: "Government" },
                  { value: "PROCUREMENT_PORTAL", label: "Procurement portal" },
                  { value: "UNIVERSITY", label: "University" },
                  { value: "NGO", label: "NGO" },
                  { value: "FOUNDATION", label: "Foundation" },
                  { value: "ACCELERATOR", label: "Accelerator" },
                  { value: "GRANT_PORTAL", label: "Grant portal" },
                  { value: "JOB_BOARD", label: "Job board" },
                  { value: "SCHOLARSHIP_PORTAL", label: "Scholarship portal" },
                  { value: "DEVELOPMENT_ORG", label: "Development org" },
                  { value: "PRIVATE_COMPANY", label: "Private company" },
                  { value: "OTHER", label: "Other" },
                ]}
              />
              <Select
                label="Crawl frequency"
                value={draft.crawlFrequency}
                onChange={(e) =>
                  patch("crawlFrequency", e.target.value as Source["crawlFrequency"])
                }
                options={[
                  { value: "EVERY_6_HOURS", label: "Every 6 hours" },
                  { value: "EVERY_12_HOURS", label: "Every 12 hours" },
                  { value: "DAILY", label: "Daily" },
                  { value: "WEEKLY", label: "Weekly" },
                  { value: "MANUAL", label: "Manual" },
                ]}
              />
              <div className="flex justify-end">
                <Button onClick={save} loading={create.isPending}>
                  Save source
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}