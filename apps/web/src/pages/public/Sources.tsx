import { Link } from "react-router-dom";
import { Container } from "../../components/layout/Container";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Loader } from "../../components/ui/Loader";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { useSources } from "../../hooks/useSources";
import { countryName } from "../../config/countries";
import { Database } from "lucide-react";
import { SeoHead } from "../../components/common/SeoHead";

export function Sources() {
  const query = useSources(undefined, 1, 50);

  return (
    <>
      <SeoHead
        title="Sources"
        description="The public sources AfriScout monitors for opportunities across Africa."
      />
      <Container className="py-8">
        <PageHeader
          title="Monitored sources"
          description="Every source is a legitimate public opportunity source, reviewed and registered by our team."
        />

        {query.isLoading ? (
          <Loader fullPage label="Loading sources" />
        ) : query.isError ? (
          <ErrorState title="Could not load sources" />
        ) : (query.data ?? []).length === 0 ? (
          <EmptyState
            icon={<Database className="h-6 w-6" />}
            title="No active sources yet"
            description="As new sources are verified, they will appear here."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(query.data ?? []).map((source) => (
              <Card key={source.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 line-clamp-2">
                      {source.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-neutral-500">
                      {source.url}
                    </p>
                  </div>
                  <Badge
                    tone={
                      source.health === "HEALTHY"
                        ? "success"
                        : source.health === "FAILED"
                          ? "danger"
                          : source.health === "WARNING"
                            ? "warning"
                            : "neutral"
                    }
                  >
                    {source.health}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <Badge tone="neutral">{source.sourceType}</Badge>
                  {source.countryCode ? (
                    <span>{countryName(source.countryCode)}</span>
                  ) : null}
                  <span>Frequency: {source.crawlFrequency}</span>
                </div>
                <Link
                  to={`/explore?sourceId=${source.id}`}
                  className="mt-3 inline-block text-xs font-medium text-primary-700 hover:underline"
                >
                  View opportunities
                </Link>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}