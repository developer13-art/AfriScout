import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { authService } from "../../services/auth.service";
import { SeoHead } from "../../components/common/SeoHead";
import { HttpError } from "../../services/http";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authService.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      const message =
        err instanceof HttpError ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead title="Forgot password" />
      <Card padding="lg">
        <h1 className="text-xl font-semibold text-neutral-900">Reset your password</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Enter your email and we will send reset instructions.
        </p>

        {error ? (
          <Alert tone="danger" className="mt-4">
            {error}
          </Alert>
        ) : null}

        {submitted ? (
          <Alert tone="success" className="mt-4" title="Check your inbox">
            If an account exists for {email}, we have sent instructions.
          </Alert>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={onSubmit} noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" fullWidth loading={submitting}>
              Send reset instructions
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-neutral-500">
          <Link to="/login" className="text-primary-700 hover:underline">
            Back to sign in
          </Link>
        </p>
      </Card>
    </>
  );
}