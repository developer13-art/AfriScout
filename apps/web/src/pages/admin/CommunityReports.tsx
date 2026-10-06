import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flag, ShieldCheck } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardBody } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { Loader } from "../../components/ui/Loader";
import { SeoHead } from "../../components/common/SeoHead";
import { http } from "../../services/http";

type Report = {
  id: string;
  reason: string;
  details: string | null;
  status: "OPEN" | "REVIEWED" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  reporter: { fullName: string; email: string | null };
  reportedUser: { fullName: string; email: string | null } | null;
  post: { content: string; kind: string } | null;
  comment: { content: string } | null;
};

export function CommunityReports() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "community-reports"],
    queryFn: () => http<Report[]>("/admin/community/reports"),
  });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "REVIEWED" | "RESOLVED" | "DISMISSED" }) =>
      http(`/admin/community/reports/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "community-reports"] }),
  });

  return (
    <>
      <SeoHead title="Community moderation" />
      <PageHeader title="Community moderation" description="Review community reports. AI does not automatically hide posts or decide serious cases." />
      {query.isLoading ? <Loader fullPage label="Loading reports" /> : null}
      {query.isError ? <Card><CardBody className="p-5 text-sm text-red-700">Reports could not be loaded.</CardBody></Card> : null}
      {!query.isLoading && !query.isError && !query.data?.length ? (
        <EmptyState icon={<ShieldCheck className="h-6 w-6" />} title="No reports to review" description="New user reports will appear here." />
      ) : null}
      <div className="space-y-3">
        {query.data?.map((report) => (
          <Card key={report.id}>
            <CardBody className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-amber-600" />
                  <span className="font-semibold text-neutral-900">{report.reason}</span>
                  <Badge tone={report.status === "OPEN" ? "warning" : "neutral"}>{report.status}</Badge>
                </div>
                <span className="text-xs text-neutral-500">{new Date(report.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-xs text-neutral-500">Reported by {report.reporter.fullName}{report.reportedUser ? ` · about ${report.reportedUser.fullName}` : ""}</p>
              {report.post ? <blockquote className="mt-3 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">{report.post.content}</blockquote> : null}
              {report.comment ? <blockquote className="mt-3 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">{report.comment.content}</blockquote> : null}
              {report.details ? <p className="mt-2 text-sm text-neutral-600">{report.details}</p> : null}
              <div className="mt-4 flex justify-end gap-2">
                {report.status === "OPEN" ? <Button size="sm" variant="outline" loading={update.isPending} onClick={() => update.mutate({ id: report.id, status: "REVIEWED" })}>Mark reviewed</Button> : null}
                <Button size="sm" variant="outline" loading={update.isPending} onClick={() => update.mutate({ id: report.id, status: "DISMISSED" })}>Dismiss</Button>
                <Button size="sm" variant="secondary" loading={update.isPending} onClick={() => update.mutate({ id: report.id, status: "RESOLVED" })}>Resolve</Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
