import { useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { AskAfriScout as AskComponent } from "../../components/ai/AskAfriScout";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Alert } from "../../components/ui/Alert";
import { searchService } from "../../services/search.service";
import { OpportunityGrid } from "../../components/opportunities/OpportunityGrid";
import type { Opportunity } from "../../types/opportunity";
import { SeoHead } from "../../components/common/SeoHead";

export function AskAfriScout() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Opportunity[]>([]);
  const [intent, setIntent] = useState<Record<string, unknown> | null>(null);

  const ask = async (query: string) => {
    setLoading(true);
    try {
      const parsed = await searchService.intent(query);
      setIntent(parsed as unknown as Record<string, unknown>);
      const result = await searchService.search(query, parsed as never, 1, 20);
      setResults(result.items);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SeoHead title="Ask AfriScout" />
      <PageHeader
        title="Ask AfriScout"
        description="Use natural language to search across Africa's opportunities."
      />

      <AskComponent onSubmit={ask} loading={loading} />

      {intent ? (
        <Card className="mt-4">
          <CardHeader title="Interpreted as" />
          <CardBody>
            <pre className="overflow-x-auto text-xs text-neutral-700">
              {JSON.stringify(intent, null, 2)}
            </pre>
          </CardBody>
        </Card>
      ) : null}

      {results.length === 0 && intent ? (
        <Alert tone="info" className="mt-4">
          No opportunities matched your query.
        </Alert>
      ) : null}

      {results.length > 0 ? (
        <div className="mt-6">
          <OpportunityGrid opportunities={results} />
        </div>
      ) : null}
    </>
  );
}