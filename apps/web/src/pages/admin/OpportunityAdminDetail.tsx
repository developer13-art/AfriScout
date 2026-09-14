import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../../components/layout/PageHeader";
import { BackButton } from "../../components/common/BackButton";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Loader } from "../../components/ui/Loader";
import { ErrorState } from "../../components/ui/ErrorState";
import { opportunityService } from "../../services/opportunity.service";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import { SeoHead } from "../../components/common/SeoHead";

export function OpportunityAdminDetail() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ["admin", "opportunity", id],
    queryFn: () => (id ? opportunityService.getById(id) : null),
    enabled: Boolean(id),
  });

  if (query.isLoading) return <Loader fullPage label="Loading opportunity" />;
  if (query.isError || !query.data) return <ErrorState title="Not found" />;

  const opp = query.data;

  return (
    <>
      <SeoHead title={opp.title} />
      <BackButton label="Back to opportunities" to="/admin/opportunities" />
      <div className="mt-3">
        <PageHeader title={opp.title} description={opp.organizationName ?? undefined} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="State" />
          <CardBody>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="font-medium text-neutral-900">Status:</span>{" "}
                <Badge tone="neutral">{opp.status}</Badge>
              </li>
              <li>
                <span className="font-medium text-neutral-900">
                  System state:
                </span>{" "}
                <Badge tone="info">{opp.systemState}</Badge>
              </li>
              <li>
                <span className="font-medium text-neutral-900">
                  Verification:
                </span>{" "}
                <Badge tone="neutral">{opp.verificationStatus}</Badge>
              </li>
              <li>
                <span className="font-medium text-neutral-900">AI processed:</span>{" "}
                {opp.aiProcessed ? "Yes" : "No"}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Published:</span>{" "}
                {opp.publishedAt ? formatDate(opp.publishedAt) : "-"}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Deadline:</span>{" "}
                {opp.deadline ? formatDate(opp.deadline) : "-"}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Updated:</span>{" "}
                {formatDateTime(opp.updatedAt)}
              </li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Fields" />
          <CardBody>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="font-medium text-neutral-900">Category:</span>{" "}
                {opp.category}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Type:</span>{" "}
                {opp.opportunityType}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Country:</span>{" "}
                {opp.countryCode ?? "-"}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Reference:</span>{" "}
                {opp.referenceNumber ?? "-"}
              </li>
              <li>
                <span className="font-medium text-neutral-900">Value:</span>{" "}
                {opp.valueMin || opp.valueMax
                  ? `${opp.valueMin ?? ""} - ${opp.valueMax ?? ""} ${opp.currency ?? ""}`
                  : "-"}
              </li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </>
  );
}