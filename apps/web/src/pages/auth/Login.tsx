import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { useAuth } from "../../hooks/useAuth";
import { SeoHead } from "../../components/common/SeoHead";
import { HttpError } from "../../services/http";

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      const message =
        err instanceof HttpError
          ? err.message
          : "We could not sign you in. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead title="Sign in" />
      <Card padding="lg">
        <h1 className="text-xl font-semibold text-neutral-900">Sign in</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Welcome back. Enter your credentials to continue.
        </p>

        {error ? (
          <Alert tone="danger" className="mt-4">
            {error}
          </Alert>
        ) : null}

        <form className="mt-5 space-y-4" onSubmit={onSubmit} noValidate>
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Button type="submit" fullWidth loading={submitting}>
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-primary-700 hover:underline">
            Create one
          </Link>
        </p>
      </Card>
    </>
  );
}