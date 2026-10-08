import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, LockKeyhole, UsersRound } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { SafeImage } from "../../components/ui/SafeImage";
import { Card, CardBody } from "../../components/ui/Card";
import { Loader } from "../../components/ui/Loader";
import { SeoHead } from "../../components/common/SeoHead";
import { communityService } from "../../services/community.service";

export function CommunityInvite() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<string[]>([]);
  const invite = useQuery({
    queryKey: ["community-invite", token],
    queryFn: () => communityService.previewSpaceInvite(token),
    enabled: Boolean(token),
  });
  const accept = useMutation({
    mutationFn: () => communityService.acceptSpaceInvite(token, answers),
    onSuccess: (membership) => navigate(`/community/groups/${encodeURIComponent(membership.slug)}`),
  });

  if (invite.isLoading) return <div className="scout-social-shell scout-community-page"><Loader label="Checking group invitation" /></div>;
  if (invite.isError || !invite.data) return (
    <div className="scout-social-shell scout-community-page">
      <SeoHead title="Invitation unavailable" />
      <Card><CardBody className="p-8 text-center">
        <LockKeyhole className="mx-auto h-7 w-7 text-primary-700" />
        <h1 className="mt-3 text-lg font-semibold text-neutral-900">This invitation is unavailable</h1>
        <p className="mt-2 text-sm text-neutral-500">The link may have expired, been revoked, or reached its use limit.</p>
        <Link to="/community/groups" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-700">Browse groups <ArrowRight className="h-4 w-4" /></Link>
      </CardBody></Card>
    </div>
  );

  return (
    <div className="scout-social-shell scout-community-page mx-auto max-w-2xl">
      <SeoHead title={`Join ${invite.data.name}`} />
      <Card><CardBody className="p-6 sm:p-9">
        <div className="flex items-center gap-3">
          <span className="scout-group-card-logo shrink-0">
            <SafeImage
              src={invite.data.profileImageUrl}
              alt=""
              className="h-full w-full object-cover"
              fallback={<UsersRound aria-hidden />}
              fallbackClassName="grid h-full w-full place-items-center"
            />
          </span>
          <div><span className="scout-community-eyebrow">SCOUT GROUP INVITATION</span><h1 className="text-xl font-bold text-neutral-900">{invite.data.name}</h1></div>
        </div>
        <p className="mt-4 text-sm leading-6 text-neutral-600">{invite.data.description}</p>
        {invite.data.approvalRequired ? <p className="mt-3 rounded-lg bg-primary-50 p-3 text-xs text-primary-800">A moderator must approve your request before you can view group content.</p> : null}
        {invite.data.joinQuestions.map((question, index) => (
          <label key={`${index}-${question}`} className="scout-group-field mt-4">
            {question}
            <textarea rows={2} maxLength={1000} required value={answers[index] ?? ""} onChange={(event) => setAnswers((current) => {
              const next = [...current];
              next[index] = event.target.value;
              return next;
            })} />
          </label>
        ))}
        <Button className="mt-5 w-full" onClick={() => accept.mutate()} loading={accept.isPending} disabled={invite.data.joinQuestions.some((_, index) => !answers[index]?.trim())}>
          {invite.data.approvalRequired ? "Request to join" : "Join group"}
        </Button>
        {accept.isError ? <p role="alert" className="mt-3 text-sm text-red-500">The invitation could not be accepted. It may have expired or reached its use limit.</p> : null}
      </CardBody></Card>
    </div>
  );
}
