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
import { africanCountries } from "../../config/countries";
import { SeoHead } from "../../components/common/SeoHead";
import { HttpError } from "../../services/http";

export function Profile() {
  const { user, profile } = useUserStore();
  const setProfile = useUserStore((s) => s.setProfile);
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [countryCode, setCountryCode] = useState("");
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

  const save = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await userService.updateProfile({ headline, bio });
      setProfile(updated);
      await userService.updateMe({ countryCode: countryCode || undefined });
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
              <p className="text-xs text-neutral-500">{user?.email}</p>
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