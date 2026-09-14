import { useEffect, useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { TagInput } from "../../components/ui/TagInput";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { Alert } from "../../components/ui/Alert";
import { dnaService } from "../../services/dna.service";
import { useDna } from "../../hooks/useDna";
import { africanCountries } from "../../config/countries";
import { opportunityCategories } from "../../config/categories";
import type { DnaDraft } from "../../types/dna";
import { SeoHead } from "../../components/common/SeoHead";
import { HttpError } from "../../services/http";

const emptyDraft: DnaDraft = {
  industries: [],
  capabilities: [],
  sectors: [],
  preferredCountries: [],
  preferredLocations: [],
  remotePreference: "ANY",
  currency: "USD",
  minValue: null,
  maxValue: null,
  eligibilityNotes: "",
  experienceNotes: "",
  opportunityTypes: [],
  opportunityCategories: [],
  keywords: [],
};

export function DNA() {
  const dna = useDna();
  const [draft, setDraft] = useState<DnaDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dna.data) {
      setDraft({
        industries: dna.data.industries,
        capabilities: dna.data.capabilities,
        sectors: dna.data.sectors,
        preferredCountries: dna.data.preferredCountries,
        preferredLocations: dna.data.preferredLocations,
        remotePreference: dna.data.remotePreference ?? "ANY",
        currency: dna.data.currency ?? "USD",
        minValue: dna.data.minValue ?? null,
        maxValue: dna.data.maxValue ?? null,
        eligibilityNotes: dna.data.eligibilityNotes ?? "",
        experienceNotes: dna.data.experienceNotes ?? "",
        opportunityTypes: dna.data.opportunityTypes,
        opportunityCategories: dna.data.opportunityCategories,
        keywords: dna.data.keywords,
      });
    }
  }, [dna.data]);

  const patch = <K extends keyof DnaDraft>(key: K, value: DnaDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      if (dna.data) await dnaService.update(draft);
      else await dnaService.create(draft);
      setSuccess(true);
      dna.refetch();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Could not save DNA.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SeoHead title="Business DNA" />
      <PageHeader
        title="Business DNA"
        description="Tell us about your capabilities and goals so we can match you accurately."
      />

      {success ? (
        <Alert tone="success" className="mb-4">
          DNA saved.
        </Alert>
      ) : null}
      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Capabilities" />
          <CardBody>
            <div className="space-y-4">
              <TagInput
                label="Industries"
                value={draft.industries}
                onChange={(value) => patch("industries", value)}
                placeholder="e.g. Construction"
              />
              <TagInput
                label="Capabilities"
                value={draft.capabilities}
                onChange={(value) => patch("capabilities", value)}
                placeholder="e.g. Roads, Bridges"
              />
              <TagInput
                label="Sectors"
                value={draft.sectors}
                onChange={(value) => patch("sectors", value)}
              />
              <TagInput
                label="Keywords"
                value={draft.keywords}
                onChange={(value) => patch("keywords", value)}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Preferences" />
          <CardBody>
            <div className="space-y-4">
              <TagInput
                label="Preferred countries"
                value={draft.preferredCountries}
                onChange={(value) => patch("preferredCountries", value)}
                placeholder="Add a country code"
              />
              <TagInput
                label="Preferred locations"
                value={draft.preferredLocations}
                onChange={(value) => patch("preferredLocations", value)}
                placeholder="Add a city or region"
              />
              <Select
                label="Work preference"
                value={draft.remotePreference}
                onChange={(e) =>
                  patch("remotePreference", e.target.value as DnaDraft["remotePreference"])
                }
                options={[
                  { value: "ANY", label: "Any" },
                  { value: "ONSITE", label: "Onsite" },
                  { value: "REMOTE", label: "Remote" },
                  { value: "HYBRID", label: "Hybrid" },
                ]}
              />
              <Select
                label="Currency"
                value={draft.currency}
                onChange={(e) => patch("currency", e.target.value)}
                options={[
                  { value: "USD", label: "USD" },
                  { value: "NGN", label: "NGN" },
                  { value: "KES", label: "KES" },
                  { value: "ZAR", label: "ZAR" },
                ]}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Value capacity" />
          <CardBody>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Minimum value"
                type="number"
                value={draft.minValue ?? ""}
                onChange={(e) =>
                  patch("minValue", e.target.value ? Number(e.target.value) : null)
                }
              />
              <Input
                label="Maximum value"
                type="number"
                value={draft.maxValue ?? ""}
                onChange={(e) =>
                  patch("maxValue", e.target.value ? Number(e.target.value) : null)
                }
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Notes and categories" />
          <CardBody>
            <div className="space-y-4">
              <Textarea
                label="Eligibility notes"
                value={draft.eligibilityNotes ?? ""}
                onChange={(e) => patch("eligibilityNotes", e.target.value)}
              />
              <Textarea
                label="Experience notes"
                value={draft.experienceNotes ?? ""}
                onChange={(e) => patch("experienceNotes", e.target.value)}
              />
              <TagInput
                label="Opportunity categories"
                value={draft.opportunityCategories as unknown as string[]}
                onChange={(value) =>
                  patch("opportunityCategories", value as never)
                }
                hint={`Options: ${opportunityCategories.map((c) => c.value).join(", ")}`}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} loading={saving}>
          Save Business DNA
        </Button>
      </div>
    </>
  );
}