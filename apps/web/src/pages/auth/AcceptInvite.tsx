import { useState, type FormEvent } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { SeoHead } from "../../components/common/SeoHead";
import { useAuth } from "../../hooks/useAuth";
import { HttpError } from "../../services/http";

export function AcceptInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const { signIn } = useAuth();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!token) {
      setError("Invitation token is missing.");
      return;
    }
    setSubmitting(true);
    try {
      // Invitations are accepted through the same registration flow.
      // The token is passed to the API so the correct organization
      // membership is created for the invited user.
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/accept-invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, fullName, password }),
        },
      );
      if (!response.ok) {
        throw new HttpError("Invitation could not be accepted", response.status);
      }
      await signIn(
        (params.get("email") ?? "").trim(),
        password,
      );
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof HttpError ? err.message : "Could not accept invite.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead title="Accept invitation" />
      <Card padding="lg">
        <h1 className="text-xl font-semibold text-neutral-900">Accept invitation</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Set your name and password to join the workspace.
        </p>

        {error ? (
          <Alert tone="danger" className="mt-4">
            {error}
          </Alert>
        ) : null}

        <form className="mt-5 space-y-4" onSubmit={onSubmit} noValidate>
          <Input
            label="Full name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" fullWidth loading={submitting}>
            Accept and continue
          </Button>
        </form>
      </Card>
    </>
  );
}