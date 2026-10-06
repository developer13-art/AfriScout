import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody } from "../../components/ui/Card";
import { SourceRunTable } from "../../components/admin/SourceRunTable";
import { Loader } from "../../components/ui/Loader";
import { useActorRuns } from "../../hooks/useActorRuns";
import { SeoHead } from "../../components/common/SeoHead";

export function ActorRuns() {
  const query = useActorRuns(undefined, 1, 50);

  return (
    <>
      <SeoHead title="Actor runs" />
      <PageHeader
        title="Actor runs"
        description="Every Apify discovery run with counts and status."
      />
      <Card>
        <CardBody>
          {query.isLoading ? (
            <Loader label="Loading runs" />
          ) : (
            <SourceRunTable runs={query.data ?? []} />
          )}
        </CardBody>
      </Card>
    </>
  );
}