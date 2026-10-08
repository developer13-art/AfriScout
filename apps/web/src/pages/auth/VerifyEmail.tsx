import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Alert } from "../../components/ui/Alert";
import { Loader } from "../../components/ui/Loader";
import { authService } from "../../services/auth.service";
import { SeoHead } from "../../components/common/SeoHead";
import { HttpError } from "../../services/http";

export function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }
      try {
        await authService.verifyEmail(token);
        if (!cancelled) {
          setStatus("success");
          setMessage("Your email has been verified.");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setMessage(
            err instanceof HttpError ? err.message : "Verification failed.",
          );
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <>
      <SeoHead title="Verify email" />
      <Card padding="lg">
        <h1 className="text-xl font-semibold text-neutral-900">Email verification</h1>
        <div className="mt-5">
          {status === "loading" ? (
            <Loader label="Verifying your email" />
          ) : status === "success" ? (
            <Alert tone="success" title="Verified">
              {message}
            </Alert>
          ) : (
            <Alert tone="danger" title="Verification failed">
              {message}
            </Alert>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-neutral-500">
          <Link to="/login" className="text-primary-700 hover:underline">
            Continue to sign in
          </Link>
        </p>
      </Card>
    </>
  );
}