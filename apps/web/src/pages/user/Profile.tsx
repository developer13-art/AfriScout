import { useAuthStore } from "../../stores/authStore";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { Avatar } from "../../components/ui/Avatar";
import { SafeImage } from "../../components/ui/SafeImage";
import { userService } from "../../services/user.service";
import { useUserStore } from "../../stores/userStore";
import { allCountries } from "../../config/countries";
import { SeoHead } from "../../components/common/SeoHead";
import { HttpError } from "../../services/http";
import { communityService } from "../../services/community.service";
import { ImageUploadField } from "../../components/community/ImageUploadField";

function analysisList(result: Record<string, unknown> | undefined, key: string): string[] {
  const value = result?.[key];
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") {
      const row = item as Record<string, unknown>;
      return [row.title, row.name, row.description].find((part) => typeof part === "string") as string | undefined ?? "";
    }
    return "";
  }).filter(Boolean);
}

export function Profile() {
  const user = useAuthStore((s) => s.user);
  const setProfile = useUserStore((s) => s.setProfile);
  const setUser = useAuthStore((s) => s.setUser);
  const completeProfile = useQuery({
    queryKey: ["my-complete-profile"],
    queryFn: userService.getCompleteProfile,
  });
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [userType, setUserType] = useState<"BUSINESS" | "PROFESSIONAL" | "STUDENT" | "RESEARCHER" | "NGO" | "STARTUP" | "OTHER">("OTHER");
  const [workspaceIntent, setWorkspaceIntent] = useState<"PERSONAL" | "ORGANIZATION" | "DEVELOPER">("PERSONAL");
  const [professionalIdentities, setProfessionalIdentities] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [profession, setProfession] = useState("");
  const [seniority, setSeniority] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [certifications, setCertifications] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [interests, setInterests] = useState("");
  const [industries, setIndustries] = useState("");
  const [languages, setLanguages] = useState("");
  const [timezone, setTimezone] = useState("");
  const [preferredCurrency, setPreferredCurrency] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [institution, setInstitution] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const communityProfile = useQuery({
    queryKey: ["community-profile", user?.id],
    queryFn: () => communityService.profile(user!.id),
    enabled: Boolean(user?.id),
  });
  const passport = useQuery({
    queryKey: ["my-scout-passport"],
    queryFn: userService.passport,
  });
  const communitySettings = useQuery({
    queryKey: ["community-settings"],
    queryFn: communityService.settings,
  });
  const analyze = useMutation({ mutationFn: communityService.analyzeProfile });
  const profileCompletion = [
    fullName.trim(),
    headline.trim(),
    bio.trim(),
    countryCode,
    profession.trim(),
    skills.trim(),
    interests.trim(),
    industries.trim(),
    languages.trim(),
  ].filter(Boolean).length;
  const completionPercent = Math.round((profileCompletion / 9) * 100);

  useEffect(() => {
    const snapshot = completeProfile.data;
    if (!snapshot) return;
    setFullName(snapshot.user.fullName);
    setUsername(snapshot.profile?.username ?? "");
    setUserType(snapshot.profile?.userType ?? "OTHER");
    setWorkspaceIntent(snapshot.profile?.workspaceIntent ?? "PERSONAL");
    setProfessionalIdentities(snapshot.profile?.professionalIdentities?.join(", ") ?? "");
    setHeadline(snapshot.profile?.headline ?? "");
    setBio(snapshot.profile?.bio ?? "");
    setCountryCode(snapshot.user.countryCode ?? "");
    setCity(snapshot.user.city ?? "");
    setPhone(snapshot.user.phone ?? "");
    setProfession(snapshot.professionalProfile?.profession ?? "");
    setSeniority(snapshot.professionalProfile?.seniority ?? "");
    setYearsExperience(snapshot.professionalProfile?.yearsExperience?.toString() ?? "");
    setSkills(snapshot.professionalProfile?.skills?.join(", ") ?? "");
    setCertifications(snapshot.professionalProfile?.certifications?.join(", ") ?? "");
    setPortfolioUrl(snapshot.professionalProfile?.portfolioUrl ?? "");
    setLinkedinUrl(snapshot.professionalProfile?.linkedinUrl ?? "");
    setInterests(snapshot.profile?.interests?.length
      ? snapshot.profile.interests.join(", ")
      : snapshot.studentProfile?.interests?.join(", ") ?? "");
    setIndustries(snapshot.profile?.industries?.join(", ") ?? "");
    setLanguages(snapshot.profile?.languages?.join(", ") ?? "");
    setTimezone(snapshot.profile?.timezone ?? "");
    setPreferredCurrency(snapshot.profile?.preferredCurrency ?? "");
    setEducationLevel(snapshot.studentProfile?.educationLevel ?? "");
    setFieldOfStudy(snapshot.studentProfile?.fieldOfStudy ?? "");
    setInstitution(snapshot.studentProfile?.institution ?? "");
    setGraduationYear(snapshot.studentProfile?.graduationYear?.toString() ?? "");
    setAvatarUrl(snapshot.user.avatarUrl ?? null);
    setCoverImageUrl(snapshot.profile?.coverImageUrl ?? null);
    setProfile(snapshot.profile);
    const currentUser = useAuthStore.getState().user;
    if (currentUser) setUser({ ...currentUser, ...snapshot.user });
  }, [completeProfile.data, setProfile, setUser]);

  const save = async () => {
    if (!completeProfile.data) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const splitTags = (value: string) => [...new Set(value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean))];
      const optionalText = (value: string) => value.trim() || null;
      const updated = await userService.saveCompleteProfile({
        fullName: fullName.trim(),
        phone: optionalText(phone),
        city: optionalText(city),
        countryCode: optionalText(countryCode),
        avatarUrl,
        username: optionalText(username)?.toLowerCase() ?? null,
        userType,
        workspaceIntent,
        professionalIdentities: splitTags(professionalIdentities),
        headline: optionalText(headline),
        bio: optionalText(bio),
        languages: splitTags(languages),
        industries: splitTags(industries),
        interests: splitTags(interests),
        timezone: optionalText(timezone),
        preferredCurrency: optionalText(preferredCurrency)?.toUpperCase() ?? null,
        coverImageUrl,
        profession: optionalText(profession),
        seniority: optionalText(seniority),
        yearsExperience: yearsExperience.trim() ? Number(yearsExperience) : null,
        skills: splitTags(skills),
        certifications: splitTags(certifications),
        portfolioUrl: optionalText(portfolioUrl),
        linkedinUrl: optionalText(linkedinUrl),
        educationLevel: optionalText(educationLevel),
        fieldOfStudy: optionalText(fieldOfStudy),
        institution: optionalText(institution),
        graduationYear: graduationYear.trim() ? Number(graduationYear) : null,
      });
      setProfile(updated.profile);
      const currentUser = useAuthStore.getState().user;
      if (currentUser) setUser({ ...currentUser, ...updated.user });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="scout-profile-page">
      <SeoHead title="Scout profile" />
      <PageHeader
        title="Scout Profile"
        description="Your professional identity, community activity, and verified opportunity history."
        actions={<Link to="/community/settings" className="text-sm font-semibold text-primary-700 hover:underline">Profile settings</Link>}
      />

      {success ? <Alert tone="success" className="mb-4">Profile updated.</Alert> : null}
      {error ? <Alert tone="danger" className="mb-4">{error}</Alert> : null}
      {completeProfile.isLoading ? <p className="mb-4 text-sm text-neutral-500">Loading your saved profile…</p> : null}
      {completeProfile.isError ? (
        <Alert tone="danger" className="mb-4">
          Saved profile details could not be loaded, so editing is disabled to prevent overwriting them.
          <button type="button" className="ml-2 font-semibold underline" onClick={() => void completeProfile.refetch()}>Try again</button>
        </Alert>
      ) : null}

      <div className={`scout-profile-cover${coverImageUrl ? " has-image" : ""}`}>
        <SafeImage
          src={coverImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          fallback={<ImageIcon aria-hidden className="h-8 w-8 text-white/70" />}
          fallbackClassName="grid h-full w-full place-items-center"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/20 to-transparent" />
        <div className="relative z-10 flex h-full items-start justify-end p-5 sm:p-7">
          {!coverImageUrl ? (
            <p className="max-w-xs text-right text-lg font-semibold leading-tight text-white sm:text-xl">
              Better opportunities.<br /><span className="text-teal-300">Bigger dreams.</span>
            </p>
          ) : null}
        </div>
      </div>
      <Card className="relative -mt-5 overflow-visible">
        <CardBody className="flex flex-wrap items-center gap-4 p-5 sm:px-7">
          <div className="relative -mt-12 rounded-full border-4 border-[#0b1d2c]">
            <Avatar name={fullName} src={avatarUrl} size="xl" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-neutral-900">{fullName || user?.fullName}</h2>
              <Badge tone="success">Scout member</Badge>
            </div>
            <p className="mt-1 text-sm text-neutral-500">{headline || profession || "Add a headline to introduce yourself"}</p>
            <p className="mt-1 text-xs text-neutral-500">{[city, allCountries.find((country) => country.code === countryCode)?.name].filter(Boolean).join(", ") || "Location not set"} · Scout community profile</p>
          </div>
          <a href="#edit-profile" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 hover:border-primary-500 hover:text-primary-700">Edit profile</a>
        </CardBody>
      </Card>

      <nav className="scout-profile-tabs" aria-label="Profile sections">
        <a className="is-active" href="#overview">Overview</a>
        <Link to="/matches">Opportunities</Link>
        <a href="#recent-activity">Activity</a>
        <Link to="/community">Community</Link>
        <Link to="/passport">Achievements</Link>
        <Link to="/passport">Credentials</Link>
        <Link to="/passport">Passport</Link>
      </nav>

      <div id="overview" className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="About" />
              <CardBody>
                <p className="text-sm leading-6 text-neutral-600">{bio || "Add a short bio to tell the Scout community what you do and what you are looking for."}</p>
                <div className="mt-4 grid gap-3 border-t border-neutral-200 pt-4 sm:grid-cols-2">
                  <div><p className="text-xs text-neutral-500">Profession</p><p className="mt-1 text-sm font-medium text-neutral-900">{profession || "Not added yet"}</p></div>
                  <div><p className="text-xs text-neutral-500">Country</p><p className="mt-1 text-sm font-medium text-neutral-900">{countryCode || "Not added yet"}</p></div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Skills & interests" />
              <CardBody>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {skills.split(/[,\n]/).map((item) => item.trim()).filter(Boolean).map((item) => <span key={`skill-${item}`} className="scout-topic-chip">{item}</span>)}
                  {!skills.trim() ? <span className="text-sm text-neutral-500">Add your skills in Edit profile.</span> : null}
                </div>
                <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {interests.split(/[,\n]/).map((item) => item.trim()).filter(Boolean).map((item) => <span key={`interest-${item}`} className="scout-topic-chip">{item}</span>)}
                  {!interests.trim() ? <span className="text-sm text-neutral-500">Add your interests in Edit profile.</span> : null}
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Profile intelligence"
              subtitle={communitySettings.data?.analyzable
                ? "AI guidance based on the details you chose to make analyzable."
                : "Enable profile analysis in Community settings before requesting recommendations."}
              actions={
                communitySettings.data?.analyzable ? (
                <Button size="sm" onClick={() => analyze.mutate()} loading={analyze.isPending}>Analyze profile</Button>
                ) : <Link to="/community/settings" className="text-xs font-semibold text-primary-700 hover:underline">Manage consent</Link>
              }
            />
            <CardBody>
              {analyze.isError ? <p role="alert" className="text-sm text-red-500">Profile analysis could not be completed. Check AI configuration and try again.</p> : null}
              {analyze.data ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["Strengths", analysisList(analyze.data.result, "strengths")],
                    ["Opportunity areas", analysisList(analyze.data.result, "recommendedOpportunityAreas").length
                      ? analysisList(analyze.data.result, "recommendedOpportunityAreas")
                      : analysisList(analyze.data.result, "opportunityAreas")],
                    ["Profile gaps", analysisList(analyze.data.result, "concerns")],
                    ["Next steps", analysisList(analyze.data.result, "nextSteps")],
                  ].map(([label, items]) => (
                    <div key={label as string}>
                      <h3 className="text-sm font-semibold text-neutral-900">{label as string}</h3>
                      <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
                        {(items as string[]).length ? (items as string[]).map((item) => <li key={item}>• {item}</li>) : <li className="text-neutral-500">No items returned.</li>}
                      </ul>
                    </div>
                  ))}
                  <p className="sm:col-span-2 text-xs leading-5 text-neutral-500">
                    {typeof analyze.data.result.disclaimer === "string" ? analyze.data.result.disclaimer : "AI guidance may be incomplete. Check official opportunity requirements."}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">Analyze your profile to see strengths, opportunity areas, gaps, and suggested next steps.</p>
              )}
            </CardBody>
          </Card>

          <Card id="recent-activity">
            <CardHeader title="Recent activity" actions={<Link to="/community" className="text-xs font-semibold text-primary-700 hover:underline">Open community</Link>} />
            <CardBody className="space-y-3">
              {communityProfile.isLoading ? <p className="text-sm text-neutral-500">Loading activity…</p> : null}
              {communityProfile.isError ? <p className="text-sm text-red-500">Activity could not be loaded.</p> : null}
              {communityProfile.data?.recentPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-3 border-b border-neutral-200 pb-3 last:border-0 last:pb-0">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-400" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm text-neutral-700">{post.content}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {new Date(post.createdAt).toLocaleDateString()} · {post._count.reactions} reactions · {post._count.comments} comments
                    </p>
                  </div>
                </div>
              ))}
              {!communityProfile.isLoading && !communityProfile.data?.recentPosts.length ? <p className="text-sm text-neutral-500">Your community posts will appear here.</p> : null}
            </CardBody>
          </Card>

          <Card id="edit-profile">
            <CardHeader title="Edit profile" subtitle="Your details, professional background, and profile images save together." />
            <CardBody>
              <fieldset disabled={!completeProfile.data || saving} className="grid gap-4 md:grid-cols-2">
                <Input label="Display name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" />
                <Input label="Username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="your_scout_name" />
                <Select
                  label="Profile type"
                  value={userType}
                  onChange={(event) => setUserType(event.target.value as typeof userType)}
                  options={[
                    { value: "BUSINESS", label: "Business" },
                    { value: "PROFESSIONAL", label: "Professional" },
                    { value: "STUDENT", label: "Student" },
                    { value: "RESEARCHER", label: "Researcher" },
                    { value: "NGO", label: "NGO" },
                    { value: "STARTUP", label: "Startup" },
                    { value: "OTHER", label: "Other" },
                  ]}
                />
                <Select
                  label="Workspace"
                  value={workspaceIntent}
                  onChange={(event) => setWorkspaceIntent(event.target.value as typeof workspaceIntent)}
                  options={[
                    { value: "PERSONAL", label: "Personal" },
                    { value: "ORGANIZATION", label: "Organization" },
                    { value: "DEVELOPER", label: "Developer" },
                  ]}
                />
                <Input label="Headline" value={headline} onChange={(event) => setHeadline(event.target.value)} placeholder="Short professional summary" />
                <Input label="Profession" value={profession} onChange={(event) => setProfession(event.target.value)} placeholder="e.g. Software engineer" />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Bio
                    <textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="A few words about your work and goals" rows={4} maxLength={4000} className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" />
                  </label>
                </div>
                <Input label="City" value={city} onChange={(event) => setCity(event.target.value)} placeholder="City or region" />
                <Input label="Phone (private)" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Not shown on your public profile" />
                <Input label="Seniority" value={seniority} onChange={(event) => setSeniority(event.target.value)} placeholder="e.g. Mid-level" />
                <Input label="Years of experience" value={yearsExperience} onChange={(event) => setYearsExperience(event.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="e.g. 5" />
                <label className="block text-sm font-medium text-neutral-700 md:col-span-2">
                  Skills
                  <textarea value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="TypeScript, product design, research" rows={2} maxLength={4000} className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" />
                </label>
                <label className="block text-sm font-medium text-neutral-700 md:col-span-2">
                  Professional identities
                  <textarea value={professionalIdentities} onChange={(event) => setProfessionalIdentities(event.target.value)} placeholder="Founder, researcher, designer" rows={2} maxLength={1000} className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" />
                </label>
                <label className="block text-sm font-medium text-neutral-700 md:col-span-2">
                  Interests
                  <textarea value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="Scholarships, AI, community health" rows={2} maxLength={4000} className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" />
                </label>
                <label className="block text-sm font-medium text-neutral-700 md:col-span-2">
                  Industries
                  <textarea value={industries} onChange={(event) => setIndustries(event.target.value)} placeholder="Technology, education, agriculture" rows={2} maxLength={2000} className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" />
                </label>
                <label className="block text-sm font-medium text-neutral-700 md:col-span-2">
                  Languages
                  <textarea value={languages} onChange={(event) => setLanguages(event.target.value)} placeholder="English, Hausa" rows={2} maxLength={1000} className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" />
                </label>
                <label className="block text-sm font-medium text-neutral-700 md:col-span-2">
                  Certifications
                  <textarea value={certifications} onChange={(event) => setCertifications(event.target.value)} placeholder="Relevant professional certifications" rows={2} maxLength={2000} className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" />
                </label>
                <Input label="Portfolio URL" value={portfolioUrl} onChange={(event) => setPortfolioUrl(event.target.value)} placeholder="https://example.com" />
                <Input label="LinkedIn URL" value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} placeholder="https://linkedin.com/in/your-name" />
                <Input label="Education level" value={educationLevel} onChange={(event) => setEducationLevel(event.target.value)} placeholder="e.g. Bachelor's degree" />
                <Input label="Field of study" value={fieldOfStudy} onChange={(event) => setFieldOfStudy(event.target.value)} placeholder="e.g. Public health" />
                <Input label="Institution" value={institution} onChange={(event) => setInstitution(event.target.value)} placeholder="School or institution" />
                <Input label="Graduation year" value={graduationYear} onChange={(event) => setGraduationYear(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="e.g. 2027" />
                <Input label="Timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="e.g. Africa/Lagos" />
                <Input label="Preferred currency" value={preferredCurrency} onChange={(event) => setPreferredCurrency(event.target.value.toUpperCase().slice(0, 3))} placeholder="e.g. NGN" />
                <Select label="Country" placeholder="Select a country" value={countryCode} onChange={(event) => setCountryCode(event.target.value)} options={allCountries.map((country) => ({ value: country.code, label: country.name }))} />
                <div className="md:col-span-2">
                  <ImageUploadField
                    label="Profile photo"
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                  />
                </div>
                <div className="md:col-span-2">
                  <ImageUploadField
                    label="Profile cover"
                    value={coverImageUrl}
                    onChange={setCoverImageUrl}
                  />
                </div>
              </fieldset>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4">
                <p className="text-xs text-neutral-500">Profile completeness: {completionPercent}%</p>
                <Button onClick={save} loading={saving} disabled={!completeProfile.data || completeProfile.isLoading}>Save changes</Button>
              </div>
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader title="Scout Passport" actions={<Link to="/passport" className="text-xs font-semibold text-primary-700 hover:underline">View passport</Link>} />
            <CardBody>
              <p className="text-2xl font-bold text-neutral-900">{passport.data?.reputationScore.toLocaleString() ?? "—"}</p>
              <p className="text-xs text-neutral-500">reputation score</p>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-200 pt-4">
                <div><p className="text-lg font-bold text-neutral-900">{passport.data?.verifiedAchievementCount ?? "—"}</p><p className="text-xs text-neutral-500">verified achievements</p></div>
                <div><p className="text-lg font-bold text-neutral-900">{passport.data?.completedOpportunityCount ?? "—"}</p><p className="text-xs text-neutral-500">completed opportunities</p></div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader
              title="Community connections"
              actions={<Link to="/community/connections" className="text-xs font-semibold text-primary-700 hover:underline">Manage</Link>}
            />
            <CardBody>
              <p className="text-2xl font-bold text-neutral-900">{communityProfile.data?.stats.connections ?? "—"}</p>
              <p className="text-xs text-neutral-500">accepted connections</p>
              <Link to="/community/messages" className="mt-3 inline-flex items-center text-xs font-semibold text-primary-700 hover:underline">
                Open messages
              </Link>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Opportunity profile" />
            <CardBody>
              <p className="text-sm text-neutral-600">Your skills and interests help Scout match you with relevant work.</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-800">
                <div className="h-full rounded-full bg-teal-400 transition-all" style={{ width: `${completionPercent}%` }} />
              </div>
              <p className="mt-2 text-xs text-neutral-500">{completionPercent}% profile details added</p>
              <Link to="/matches" className="mt-4 inline-block text-xs font-semibold text-primary-700 hover:underline">Explore matched opportunities →</Link>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}