import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  Code2,
  Globe2,
  Radio,
  Sparkles,
} from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { TagInput } from "../../components/ui/TagInput";
import { ImageUploadField } from "../../components/community/ImageUploadField";
import { SeoHead } from "../../components/common/SeoHead";
import { allCountries } from "../../config/countries";
import { opportunityCategories } from "../../config/categories";
import { dnaService } from "../../services/dna.service";
import { HttpError } from "../../services/http";
import { organizationService } from "../../services/organization.service";
import { userService } from "../../services/user.service";
import { workspaceService } from "../../services/workspace.service";
import { useAuthStore } from "../../stores/authStore";
import type { UserType } from "../../types/user";
import type { OrganizationType } from "../../types/organization";
import type { RemotePreference } from "../../types/dna";
import type { OpportunityCategory } from "../../types/opportunity";

type WorkspaceChoice = "PERSONAL" | "ORGANIZATION" | "DEVELOPER";

const categoryColors = [
  "bg-teal-50 text-teal-800 ring-teal-200",
  "bg-amber-50 text-amber-900 ring-amber-200",
  "bg-sky-50 text-sky-800 ring-sky-200",
  "bg-rose-50 text-rose-800 ring-rose-200",
];

const workspaceOptions: {
  type: WorkspaceChoice;
  title: string;
  description: string;
  icon: typeof BriefcaseBusiness;
  detail: string;
}[] = [
  {
    type: "PERSONAL",
    title: "Personal",
    description: "Find work, funding, learning, and partnerships matched to you.",
    icon: BriefcaseBusiness,
    detail: "Your profile and opportunity signals",
  },
  {
    type: "ORGANIZATION",
    title: "Organization",
    description: "Bring your team together around the opportunities you pursue.",
    icon: Building2,
    detail: "An organization profile and team space",
  },
  {
    type: "DEVELOPER",
    title: "Developer",
    description: "Build with Scout’s opportunity data and developer tools.",
    icon: Code2,
    detail: "A project workspace for your integration",
  },
];

export function Onboarding() {
  const navigate = useNavigate();
  const account = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [step, setStep] = useState<"workspace" | "details">("workspace");
  const [choice, setChoice] = useState<WorkspaceChoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState(account?.fullName ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(account?.avatarUrl ?? null);
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [city, setCity] = useState(account?.city ?? "");
  const [countryCode, setCountryCode] = useState(account?.countryCode ?? "");
  const [identities, setIdentities] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [preferredCountries, setPreferredCountries] = useState<string[]>([]);
  const [remotePreference, setRemotePreference] = useState<RemotePreference>("ANY");
  const [currency, setCurrency] = useState("USD");
  const [headline, setHeadline] = useState("");

  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState<OrganizationType>("PRIVATE");
  const [organizationCountry, setOrganizationCountry] = useState("");
  const [organizationWebsite, setOrganizationWebsite] = useState("");
  const [organizationDescription, setOrganizationDescription] = useState("");

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectUseCase, setProjectUseCase] = useState("");

  const completeLocalIdentity = (workspaceIntent: WorkspaceChoice) => {
    if (!account) return;
    setUser({
      ...account,
      fullName: name.trim() || account.fullName,
      avatarUrl,
      phone: phone.trim() || account.phone,
      city: city.trim() || account.city,
      countryCode: workspaceIntent === "PERSONAL"
        ? countryCode
        : account.countryCode,
      workspaceIntent,
      onboardingCompleted: true,
    });
  };

  const toggleInterest = (value: string) => {
    setInterests((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  const startDetails = () => {
    setError(null);
    if (!choice) {
      setError("Choose a starting workspace to continue.");
      return;
    }
    setStep("details");
  };

  const savePersonal = async () => {
    if (!name.trim()) throw new Error("Add your name to complete your profile.");
    if (!countryCode) throw new Error("Choose your country to continue.");

    const userType: UserType = identities.some((item) => item.toLowerCase().includes("student"))
      ? "STUDENT"
      : identities.some((item) => item.toLowerCase().includes("research"))
        ? "RESEARCHER"
        : "PROFESSIONAL";

    await userService.updateMe({
      fullName: name.trim(),
      avatarUrl,
      phone: phone.trim() || undefined,
      city: city.trim() || undefined,
      countryCode,
    });
    await userService.updateProfile({
      username: username.trim().replace(/^@/, "") || undefined,
      userType,
      workspaceIntent: "PERSONAL",
      professionalIdentities: identities,
      headline: headline.trim() || undefined,
      preferredCurrency: currency,
      onboardingCompleted: false,
    });
    await dnaService.create({
      industries: [],
      capabilities: skills,
      sectors: [],
      preferredCountries,
      preferredLocations: [],
      remotePreference,
      currency,
      opportunityTypes: [],
      opportunityCategories: interests as OpportunityCategory[],
      keywords: [],
    });
    if (userType === "STUDENT") {
      await userService.updateStudentProfile({ interests });
    }
    await userService.updateProfile({ onboardingCompleted: true });
    completeLocalIdentity("PERSONAL");
    navigate("/dashboard", { replace: true });
  };

  const saveOrganization = async () => {
    if (!organizationName.trim()) throw new Error("Enter your organization name.");
    if (!organizationCountry) throw new Error("Choose the organization’s country.");

    await userService.updateMe({ avatarUrl });
    await userService.updateProfile({
      workspaceIntent: "ORGANIZATION",
      onboardingCompleted: false,
    });
    await organizationService.create({
      name: organizationName.trim(),
      type: organizationType,
      countryCode: organizationCountry,
      website: organizationWebsite.trim() || undefined,
      description: organizationDescription.trim() || undefined,
    });
    await userService.updateProfile({ onboardingCompleted: true });
    completeLocalIdentity("ORGANIZATION");
    navigate("/org/profile", { replace: true });
  };

  const saveDeveloper = async () => {
    if (!projectName.trim()) throw new Error("Give your project a name.");
    if (!projectUseCase.trim()) throw new Error("Tell us what you plan to build.");

    await userService.updateMe({ avatarUrl });
    await userService.updateProfile({
      workspaceIntent: "DEVELOPER",
      onboardingCompleted: false,
    });
    await workspaceService.create({
      type: "DEVELOPER",
      name: projectName.trim(),
      description: projectDescription.trim() || undefined,
      useCase: projectUseCase.trim(),
    });
    await userService.updateProfile({ onboardingCompleted: true });
    completeLocalIdentity("DEVELOPER");
    navigate("/developer", { replace: true });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!choice) return;
    setError(null);
    setSubmitting(true);
    try {
      if (choice === "PERSONAL") await savePersonal();
      if (choice === "ORGANIZATION") await saveOrganization();
      if (choice === "DEVELOPER") await saveDeveloper();
    } catch (cause) {
      setError(
        cause instanceof HttpError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : "We could not save your workspace. Your progress is still here; please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selected = workspaceOptions.find((option) => option.type === choice);

  return (
    <>
      <SeoHead title="Set up your Scout workspace" />
      <div className="mx-auto mb-5 max-w-3xl text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-900 ring-1 ring-amber-200">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Your Scout identity
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
          {step === "workspace" ? "Where would you like to begin?" : `Set up ${selected?.title.toLowerCase()}`}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-600">
          One identity can move between personal, organization, and developer workspaces.
          Start with the one you need today.
        </p>
        <div className="mx-auto mt-5 flex max-w-sm items-center justify-center gap-2" aria-label="Setup progress">
          <span className={`h-1.5 flex-1 rounded-full ${step === "workspace" ? "bg-teal-700" : "bg-teal-200"}`} />
          <span className={`h-1.5 flex-1 rounded-full ${step === "details" ? "bg-teal-700" : "bg-neutral-200"}`} />
        </div>
      </div>

      <Card padding="lg">
        {error ? (
          <Alert tone="danger" className="mb-5">
            {error}
          </Alert>
        ) : null}

        {step === "workspace" ? (
          <div>
            <div className="grid gap-3 md:grid-cols-3">
              {workspaceOptions.map((option, index) => {
                const Icon = option.icon;
                const isSelected = choice === option.type;
                return (
                  <button
                    key={option.type}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setChoice(option.type);
                      setError(null);
                    }}
                    className={`group flex min-h-[204px] flex-col rounded-xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 ${
                      isSelected
                        ? "border-teal-700 bg-teal-50/80 ring-2 ring-teal-700/15"
                        : "border-neutral-200 bg-white hover:border-teal-300 hover:bg-teal-50/30"
                    }`}
                  >
                    <div className="flex w-full items-start justify-between">
                      <span className={`rounded-lg p-2.5 ${index === 1 ? "bg-amber-100 text-amber-900" : index === 2 ? "bg-sky-100 text-sky-900" : "bg-teal-100 text-teal-900"}`}>
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      {isSelected ? <Check className="h-5 w-5 text-teal-800" aria-hidden /> : null}
                    </div>
                    <span className="mt-5 text-base font-semibold text-neutral-950">{option.title}</span>
                    <span className="mt-1.5 text-xs leading-5 text-neutral-600">{option.description}</span>
                    <span className="mt-auto pt-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      {option.detail}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={startDetails} rightIcon={<ArrowRight className="h-4 w-4" />}>
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-6">
            <ImageUploadField
              label="Profile photo"
              value={avatarUrl}
              onChange={setAvatarUrl}
              hint="Add a photo so people can recognize you across Scout."
            />
            {choice === "PERSONAL" ? (
              <>
                <div className="flex items-start gap-3 border-b border-neutral-100 pb-4">
                  <span className="rounded-lg bg-teal-100 p-2 text-teal-900">
                    <BriefcaseBusiness className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <h2 className="font-semibold text-neutral-950">Your profile</h2>
                    <p className="mt-1 text-xs text-neutral-600">Help Scout recognize your experience and location.</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Full name" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} />
                  <Input label="Username" placeholder="yourname" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} />
                  <Input label="Phone" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
                  <Input label="City or region" autoComplete="address-level2" placeholder="City, region" value={city} onChange={(event) => setCity(event.target.value)} />
                  <Select
                    label="Country"
                    required
                    placeholder="Choose your country"
                    value={countryCode}
                    onChange={(event) => setCountryCode(event.target.value)}
                    options={allCountries.map((country) => ({ value: country.code, label: country.name }))}
                  />
                  <Select
                    label="Preferred currency"
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value)}
                    options={[
                      { value: "USD", label: "USD — US dollar" },
                      { value: "EUR", label: "EUR — Euro" },
                      { value: "GBP", label: "GBP — Pound sterling" },
                      { value: "CAD", label: "CAD — Canadian dollar" },
                      { value: "AUD", label: "AUD — Australian dollar" },
                      { value: "NGN", label: "NGN — Nigerian naira" },
                      { value: "KES", label: "KES — Kenyan shilling" },
                      { value: "ZAR", label: "ZAR — South African rand" },
                    ]}
                  />
                </div>
                <Input
                  label="A line about your work"
                  placeholder="For example, climate researcher focused on coastal resilience"
                  value={headline}
                  onChange={(event) => setHeadline(event.target.value)}
                />
                <TagInput
                  label="Professional identities"
                  hint="Add the roles you use to describe yourself, then press Enter."
                  placeholder="Founder, researcher, student..."
                  value={identities}
                  onChange={setIdentities}
                />
                <TagInput
                  label="Skills and capabilities"
                  hint="These help Scout match you to relevant opportunities."
                  placeholder="Add a skill and press Enter"
                  value={skills}
                  onChange={setSkills}
                />
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Radio className="h-4 w-4 text-teal-800" aria-hidden />
                    <p className="text-sm font-medium text-neutral-800">Opportunity interests</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {opportunityCategories.map((category, index) => {
                      const active = interests.includes(category.value);
                      return (
                        <button
                          type="button"
                          key={category.value}
                          aria-pressed={active}
                          onClick={() => toggleInterest(category.value)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
                            active
                              ? categoryColors[index % categoryColors.length]
                              : "bg-white text-neutral-600 ring-neutral-200 hover:bg-neutral-50"
                          }`}
                        >
                          {category.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">Choose the kinds of opportunities you want Scout to surface.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Work preference"
                    value={remotePreference}
                    onChange={(event) => setRemotePreference(event.target.value as RemotePreference)}
                    options={[
                      { value: "ANY", label: "Any arrangement" },
                      { value: "REMOTE", label: "Remote" },
                      { value: "HYBRID", label: "Hybrid" },
                      { value: "ONSITE", label: "On-site" },
                    ]}
                  />
                  <TagInput
                    label="Preferred countries"
                    hint="Use country codes such as NG or KE."
                    placeholder="Add a country code"
                    value={preferredCountries}
                    onChange={(values) => setPreferredCountries(values.map((value) => value.toUpperCase()))}
                  />
                </div>
              </>
            ) : null}

            {choice === "ORGANIZATION" ? (
              <>
                <div className="flex items-start gap-3 border-b border-neutral-100 pb-4">
                  <span className="rounded-lg bg-amber-100 p-2 text-amber-900">
                    <Building2 className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <h2 className="font-semibold text-neutral-950">Organization details</h2>
                    <p className="mt-1 text-xs text-neutral-600">Create the profile your team will build on.</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Organization name" required autoComplete="organization" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} />
                  <Select
                    label="Organization type"
                    value={organizationType}
                    onChange={(event) => setOrganizationType(event.target.value as OrganizationType)}
                    options={[
                      { value: "PRIVATE", label: "Private company" },
                      { value: "GOVERNMENT", label: "Government" },
                      { value: "NGO", label: "Nonprofit / NGO" },
                      { value: "FOUNDATION", label: "Foundation" },
                      { value: "UNIVERSITY", label: "University" },
                      { value: "DEVELOPMENT", label: "Development organization" },
                      { value: "ACCELERATOR", label: "Accelerator" },
                      { value: "INCUBATOR", label: "Incubator" },
                      { value: "OTHER", label: "Other" },
                    ]}
                  />
                  <Select
                    label="Country"
                    required
                    placeholder="Choose a country"
                    value={organizationCountry}
                    onChange={(event) => setOrganizationCountry(event.target.value)}
                    options={allCountries.map((country) => ({ value: country.code, label: country.name }))}
                  />
                  <Input label="Website" type="url" placeholder="https://" autoComplete="url" value={organizationWebsite} onChange={(event) => setOrganizationWebsite(event.target.value)} />
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">What does your organization do?</span>
                  <textarea
                    rows={4}
                    value={organizationDescription}
                    onChange={(event) => setOrganizationDescription(event.target.value)}
                    placeholder="A brief description of your work and the opportunities you pursue"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/30"
                  />
                </label>
              </>
            ) : null}

            {choice === "DEVELOPER" ? (
              <>
                <div className="flex items-start gap-3 border-b border-neutral-100 pb-4">
                  <span className="rounded-lg bg-sky-100 p-2 text-sky-900">
                    <Code2 className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <h2 className="font-semibold text-neutral-950">Your developer project</h2>
                    <p className="mt-1 text-xs text-neutral-600">Set up a real workspace for your integration.</p>
                  </div>
                </div>
                <Input label="Project name" required placeholder="A name your team will recognize" value={projectName} onChange={(event) => setProjectName(event.target.value)} />
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">Project description</span>
                  <textarea
                    rows={3}
                    value={projectDescription}
                    onChange={(event) => setProjectDescription(event.target.value)}
                    placeholder="What are you building?"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/30"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">What will you use Scout for?</span>
                  <textarea
                    rows={3}
                    required
                    value={projectUseCase}
                    onChange={(event) => setProjectUseCase(event.target.value)}
                    placeholder="Describe the opportunity data or workflow you want to power"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/30"
                  />
                </label>
              </>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("workspace");
                  setError(null);
                }}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Change workspace
              </Button>
              <Button
                type="submit"
                loading={submitting}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                {choice === "ORGANIZATION"
                  ? "Create organization space"
                  : choice === "DEVELOPER"
                    ? "Create developer workspace"
                    : "Finish personal setup"}
              </Button>
            </div>
          </form>
        )}

        {step === "details" && choice === "ORGANIZATION" ? (
          <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-neutral-500">
            <Globe2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-800" aria-hidden />
            Your organization details will be saved to its Scout profile. You can refine them later.
          </p>
        ) : null}
      </Card>
    </>
  );
}
