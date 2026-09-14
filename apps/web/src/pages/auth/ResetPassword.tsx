import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { authService } from "../../services/auth.service";
import { SeoHead } from "../../components/common/SeoHead";
import { HttpError } from "../../services/http";

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Reset token is missing.");
      return;
    }
    setSubmitting(true);
    try {
      await authService.resetPassword(token, password);
      navigate("/login", { replace: true });
    } catch (err) {
      const message =
        err instanceof HttpError ? err.message : "Could not reset password.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead title="Reset password" />
      <Card padding="lg">
        <h1 className="text-xl font-semibold text-neutral-900">Choose a new password</h1>

        {error ? (
          <Alert tone="danger" className="mt-4">
            {error}
          </Alert>
        ) : null}

        <form className="mt-5 space-y-4" onSubmit={onSubmit} noValidate>
          <Input
            label="New password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Confirm password"
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <Button type="submit" fullWidth loading={submitting}>
            Save new password
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-neutral-500">
          <Link to="/login" className="text-primary-700 hover:underline">
            Back to sign in
          </Link>
        </p>
      </Card>
    </>
  );
}