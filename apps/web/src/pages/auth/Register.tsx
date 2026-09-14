import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { Select } from "../../components/ui/Select";
import { authService } from "../../services/auth.service";
import { useAuthStore } from "../../stores/authStore";
import { africanCountries } from "../../config/countries";
import { SeoHead } from "../../components/common/SeoHead";
import { HttpError } from "../../services/http";

export function Register() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const setTokens = useAuthStore((s) => s.setTokens);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await authService.register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        countryCode: countryCode || undefined,
      });
      setTokens(result.accessToken, result.refreshToken);
      setUser(result.user);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      const message =
        err instanceof HttpError
          ? err.message
          : "We could not create your account. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead title="Create account" />
      <Card padding="lg">
        <h1 className="text-xl font-semibold text-neutral-900">Create your account</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Free to start. You can upgrade at any time.
        </p>

        {error ? (
          <Alert tone="danger" className="mt-4">
            {error}
          </Alert>
        ) : null}

        <form className="mt-5 space-y-4" onSubmit={onSubmit} noValidate>
          <Input
            label="Full name"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            hint="At least 8 characters."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          <Button type="submit" fullWidth loading={submitting}>
            Create account
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-neutral-500">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-700 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </>
  );
}