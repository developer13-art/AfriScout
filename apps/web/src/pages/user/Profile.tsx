import { useAuthStore } from "../../stores/authStore";
import { useEffect, useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { Avatar } from "../../components/ui/Avatar";
import { userService } from "../../services/user.service";
import { useUserStore } from "../../stores/userStore";
import { allCountries } from "../../config/countries";
import { SeoHead } from "../../components/common/SeoHead";
import { HttpError } from "../../services/http";

export function Profile() {
  const user = useAuthStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [profession, setProfession] = useState("");
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setHeadline(profile.headline ?? "");
      setBio(profile.bio ?? "");
    }
    if (user?.countryCode) setCountryCode(user.countryCode);
  }, [profile, user]);

  useEffect(() => {
    void Promise.all([userService.getProfessionalProfile(), userService.getStudentProfile()])
      .then(([professional, student]) => {
        setProfession(professional?.profession ?? "");
        setSkills(professional?.skills?.join(", ") ?? "");
        setInterests(student?.interests?.join(", ") ?? "");
      })
      .catch(() => setError("Some profile details could not be loaded."));
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await userService.updateProfile({ headline, bio });
      setProfile(updated);
      await userService.updateMe({ countryCode: countryCode || undefined });
      const splitTags = (value: string) => [...new Set(value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean))];
      await userService.updateProfessionalProfile({ profession, skills: splitTags(skills) });
      await userService.updateStudentProfile({ interests: splitTags(interests) });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SeoHead title="Profile" />
      <PageHeader title="Profile" description="Update your personal details." />

      {success ? (
        <Alert tone="success" className="mb-4">
          Profile updated.
        </Alert>
      ) : null}
      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader title="Avatar" />
          <div className="flex items-center gap-3">
            <Avatar
              name={user?.fullName ?? ""}
              src={user?.avatarUrl ?? undefined}
              size="xl"
            />
            <div>
              <p className="text-sm font-medium text-neutral-900">
                {user?.fullName}
              </p>
              <p className="text-xs text-neutral-500">{user?.email ?? "Add a recovery email in account settings"}</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Details" />
          <CardBody>
            <div className="space-y-4">
              <Input
                label="Headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Short summary"
              />
              <Input
                label="Bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A few words about you"
              />
              <Input
                label="Profession"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="e.g. Software engineer"
              />
              <label className="block text-sm font-medium text-neutral-700">
                Skills
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="TypeScript, product design, research"
                  rows={2}
                  maxLength={4000}
                  className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </label>
              <label className="block text-sm font-medium text-neutral-700">
                Interests
                <textarea
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="Scholarships, AI, community health"
                  rows={2}
                  maxLength={4000}
                  className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </label>
              <Select
                label="Country"
                placeholder="Select a country"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                options={allCountries.map((c) => ({
                  value: c.code,
                  label: c.name,
                }))}
              />
              <div className="flex justify-end">
                <Button onClick={save} loading={saving}>
                  Save changes
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}