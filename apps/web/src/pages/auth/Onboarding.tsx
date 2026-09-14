import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Stepper } from "../../components/ui/Stepper";
import { Input } from "../../components/ui/Input";
import { TagInput } from "../../components/ui/TagInput";
import { Select } from "../../components/ui/Select";
import { Alert } from "../../components/ui/Alert";
import { userService } from "../../services/user.service";
import { dnaService } from "../../services/dna.service";
import { africanCountries } from "../../config/countries";
import { opportunityCategories } from "../../config/categories";
import { SeoHead } from "../../components/common/SeoHead";
import { HttpError } from "../../services/http";

const steps = [
  { id: "type", label: "Account type" },
  { id: "dna", label: "Business DNA" },
  { id: "finish", label: "Finish" },
];

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [userType, setUserType] = useState("BUSINESS");
  const [headline, setHeadline] = useState("");
  const [countryCode, setCountryCode] = useState("");

  const [industries, setIndustries] = useState<string[]>([]);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [preferredCountries, setPreferredCountries] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const persist = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await userService.updateProfile({
        userType: userType as never,
        headline,
        preferredCurrency: "USD",
      });
      await userService.updateMe({ countryCode: countryCode || undefined });
      await dnaService.create({
        industries,
        capabilities,
        sectors: [],
        preferredCountries,
        preferredLocations: [],
        remotePreference: "ANY",
        currency: "USD",
        opportunityTypes: [],
        opportunityCategories: categories as never,
        keywords: [],
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Could not save.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead title="Welcome to AfriScout" />
      <Card padding="lg">
        <Stepper steps={steps} currentStep={step} />

        {error ? (
          <Alert tone="danger" className="mt-4">
            {error}
          </Alert>
        ) : null}

        {step === 0 ? (
          <div className="mt-5 space-y-4">
            <Select
              label="Account type"
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              options={[
                { value: "BUSINESS", label: "Business" },
                { value: "PROFESSIONAL", label: "Professional" },
                { value: "STUDENT", label: "Student" },
                { value: "RESEARCHER", label: "Researcher" },
                { value: "NGO", label: "NGO" },
                { value: "STARTUP", label: "Startup" },
              ]}
            />
            <Input
              label="Headline"
              placeholder="Short description"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
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
            <div className="flex justify-end">
              <Button onClick={() => setStep(1)}>Continue</Button>
            </div>
          </div>
        ) : step === 1 ? (
          <div className="mt-5 space-y-4">
            <TagInput
              label="Industries"
              value={industries}
              onChange={setIndustries}
              placeholder="Add an industry"
            />
            <TagInput
              label="Capabilities"
              value={capabilities}
              onChange={setCapabilities}
              placeholder="Add a capability"
            />
            <TagInput
              label="Preferred countries"
              value={preferredCountries}
              onChange={setPreferredCountries}
              placeholder="Add a country code (e.g. NG)"
            />
            <TagInput
              label="Opportunity categories"
              value={categories}
              onChange={setCategories}
              placeholder="Add a category value"
              hint={`Options: ${opportunityCategories.map((c) => c.value).join(", ")}`}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={() => setStep(2)}>Continue</Button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-neutral-700">
              We have what we need. You can refine everything from the settings
              page later.
            </p>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={persist} loading={submitting}>
                Finish and go to dashboard
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}