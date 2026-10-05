import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { useAuth } from "../../hooks/useAuth";
import { useSolanaWallet } from "../../hooks/useSolanaWallet";
import { Wallet2 } from "lucide-react";
import { SeoHead } from "../../components/common/SeoHead";
import { HttpError } from "../../services/http";

export function Login() {
  const { signIn, signInWithWallet } = useAuth();
  const wallet = useSolanaWallet();
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
      const user = await signIn(email.trim(), password);
      const requested = (location.state as { from?: string } | null)?.from;

      const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "DATA_ADMIN";
      const destination = requested ?? (isAdmin ? "/admin" : "/dashboard");

      navigate(destination, { replace: true });
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

  const onWalletSignIn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const walletAddress = wallet.address ?? await wallet.connect();
      if (!walletAddress) {
        throw new Error(wallet.error ?? "Connect a Solana wallet to continue.");
      }
      const user = await signInWithWallet(walletAddress, wallet.signMessage);
      const requested = (location.state as { from?: string } | null)?.from;
      const isAdmin = user.role === "SUPER_ADMIN" || user.role === "DATA_ADMIN";
      navigate(requested ?? (isAdmin ? "/admin" : "/dashboard"), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet sign-in failed. Please try again.");
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
          Sign in with your Scout account or verify a Solana wallet.
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

        <div className="my-4 flex items-center gap-3 text-xs text-neutral-400" aria-hidden>
          <span className="h-px flex-1 bg-neutral-200" />
          or
          <span className="h-px flex-1 bg-neutral-200" />
        </div>
        <Button
          type="button"
          variant="outline"
          fullWidth
          loading={submitting || wallet.connecting}
          leftIcon={<Wallet2 className="h-4 w-4" />}
          onClick={onWalletSignIn}
        >
          Continue with Solana wallet
        </Button>
        <p className="mt-2 text-center text-xs text-neutral-500">
          You will sign a short message. Scout will never ask for a transfer or recovery phrase.
        </p>
        {wallet.error ? (
          <Alert tone="danger" className="mt-3">{wallet.error}</Alert>
        ) : null}

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