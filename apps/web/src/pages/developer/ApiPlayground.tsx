import { useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { Alert } from "../../components/ui/Alert";
import { env } from "../../config/env";
import { SeoHead } from "../../components/common/SeoHead";

const methods = ["GET", "POST", "PATCH", "DELETE"] as const;

export function ApiPlayground() {
  const [method, setMethod] = useState<(typeof methods)[number]>("GET");
  const [path, setPath] = useState("/opportunities");
  const [apiKey, setApiKey] = useState("");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setStatus(null);
    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
      if (body && method !== "GET" && method !== "DELETE") {
        headers["Content-Type"] = "application/json";
      }
      const res = await fetch(`${env.apiUrl}${path}`, {
        method,
        headers,
        body:
          body && method !== "GET" && method !== "DELETE" ? body : undefined,
      });
      setStatus(res.status);
      const text = await res.text();
      try {
        setResponse(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResponse(text);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SeoHead title="API playground" />
      <PageHeader
        title="API playground"
        description="Send live requests against the AfriScout API."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Request" />
          <CardBody>
            <div className="space-y-4">
              <Input
                label="API key"
                placeholder="Paste your key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <div className="grid grid-cols-[110px_1fr] gap-2">
                <Select
                  label="Method"
                  value={method}
                  onChange={(e) =>
                    setMethod(e.target.value as (typeof methods)[number])
                  }
                  options={methods.map((m) => ({ value: m, label: m }))}
                />
                <Input
                  label="Path"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                />
              </div>
              {method !== "GET" && method !== "DELETE" ? (
                <Textarea
                  label="JSON body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                />
              ) : null}
              <Button onClick={send} loading={loading} fullWidth>
                Send request
              </Button>
              {error ? <Alert tone="danger">{error}</Alert> : null}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Response"
            actions={
              status !== null ? (
                <span className="text-xs font-medium text-neutral-500">
                  HTTP {status}
                </span>
              ) : null
            }
          />
          <CardBody>
            {response ? (
              <pre className="max-h-[460px] overflow-auto rounded-md bg-neutral-50 p-3 text-xs">
                {response}
              </pre>
            ) : (
              <p className="text-sm text-neutral-500">
                Send a request to see the response here.
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}