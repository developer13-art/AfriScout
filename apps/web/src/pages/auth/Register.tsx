import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Fingerprint, ShieldCheck, Wallet2 } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { SeoHead } from "../../components/common/SeoHead";
import { authService } from "../../services/auth.service";
import { HttpError } from "../../services/http";
import { useSolanaWallet } from "../../hooks/useSolanaWallet";
import { useAuthStore } from "../../stores/authStore";

export function Register() {
  const navigate = useNavigate();
  const wallet = useSolanaWallet();
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!fullName.trim()) {
      setError("Add your name before connecting your wallet.");
      return;
    }

    setSubmitting(true);
    try {
      const walletAddress = wallet.address ?? await wallet.connect();
      if (!walletAddress) {
        throw new Error(wallet.error ?? "Connect a Solana wallet to continue.");
      }

      const challenge = await authService.walletChallenge(walletAddress, false);
      const signature = await wallet.signMessage(challenge.message);
      const encodedSignature = btoa(
        Array.from(signature, (byte) => String.fromCharCode(byte)).join(""),
      );
      const result = await authService.walletVerify(
        {
          walletAddress,
          nonce: challenge.nonce,
          signature: encodedSignature,
          fullName: fullName.trim(),
        },
        false,
      );
      if (!("accessToken" in result)) {
        throw new Error("Scout could not create a session for this wallet. Try again.");
      }

      setTokens(result.accessToken, result.refreshToken);
      setUser(result.user);
      navigate("/onboarding", { replace: true });
    } catch (cause) {
      setError(
        cause instanceof HttpError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : "We could not create your Scout identity. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead title="Create your Scout identity" />
      <div className="mb-5">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-teal-800">
          <Fingerprint className="h-3.5 w-3.5" aria-hidden />
          One identity. Many ways forward.
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-[2.1rem]">
          Your next opportunity starts here.
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-neutral-600">
          Create a Scout identity with your Solana wallet, then choose the workspace
          that fits how you work.
        </p>
      </div>

      <Card padding="lg">
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-teal-50/80 p-4 ring-1 ring-teal-100">
          <div className="mt-0.5 rounded-lg bg-white p-2 text-teal-800 shadow-sm">
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">A wallet signature, not a transaction</p>
            <p className="mt-1 text-xs leading-5 text-neutral-600">
              You will sign a short verification message. Scout never asks for a
              seed phrase, recovery phrase, or wallet secrets.
            </p>
          </div>
        </div>

        {error ? (
          <Alert tone="danger" className="mb-4">
            {error}
          </Alert>
        ) : null}

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <Input
            label="Your name"
            autoComplete="name"
            placeholder="How should we address you?"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />

          {wallet.address ? (
            <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">
                {wallet.walletName ?? "Wallet"} connected
              </p>
              <p className="mt-1 break-all font-mono text-xs text-neutral-700">{wallet.address}</p>
            </div>
          ) : (
            <p className="text-xs leading-5 text-neutral-500">
              {wallet.available
                ? "A compatible Solana wallet is ready to connect."
                : "No wallet detected yet. Install a Solana wallet, then try again."}
            </p>
          )}

          <Button
            type="submit"
            fullWidth
            loading={submitting || wallet.connecting}
            leftIcon={<Wallet2 className="h-4 w-4" />}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            {wallet.address ? "Verify wallet and create identity" : "Connect wallet and continue"}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-neutral-500">
          Already have a Scout identity?{" "}
          <Link to="/login" className="font-semibold text-primary-700 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </>
  );
}
