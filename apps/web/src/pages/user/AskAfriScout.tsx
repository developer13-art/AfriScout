import { useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { AskAfriScout as AskComponent } from "../../components/ai/AskAfriScout";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Alert } from "../../components/ui/Alert";
import { searchService } from "../../services/search.service";
import { OpportunityGrid } from "../../components/opportunities/OpportunityGrid";
import type { Opportunity } from "../../types/opportunity";
import { SeoHead } from "../../components/common/SeoHead";

interface ParsedIntent {
  q?: string;
  category?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  deadlineBefore?: string;
  deadlineAfter?: string;
  isRemote?: boolean;
  minValue?: number;
  maxValue?: number;
  currency?: string;
  provider?: string;
  model?: string;
}

export function AskAfriScout() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Opportunity[]>([]);
  const [intent, setIntent] = useState<ParsedIntent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = async (query: string) => {
    setLoading(true);
    setError(null);
    setResults([]);
    setIntent(null);
    try {
      const parsed = (await searchService.intent(query)) as ParsedIntent;
      setIntent(parsed);

      // Use the AI-parsed structured query when available; fall back to the
      // original user input. Never send the whole AI prompt to the search API.
      const searchQuery = (parsed.q ?? query).slice(0, 200);
      const filters = {
        category: parsed.category,
        countryCode: parsed.countryCode,
        region: parsed.region,
        city: parsed.city,
        deadlineBefore: parsed.deadlineBefore,
        deadlineAfter: parsed.deadlineAfter,
        isRemote: parsed.isRemote,
        minValue: parsed.minValue,
        maxValue: parsed.maxValue,
        currency: parsed.currency,
      };

      const result = await searchService.search(searchQuery, filters as never, 1, 20);
      setResults(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
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

      {error ? (
        <Alert tone="danger" className="mt-4">
          {error}
        </Alert>
      ) : null}

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

      {results.length === 0 && intent && !error ? (
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