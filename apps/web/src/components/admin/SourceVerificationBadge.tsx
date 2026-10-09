type SourceVerificationStatus = "PENDING" | "VERIFIED" | "FAILED";

interface SourceVerificationBadgeProps {
  status: SourceVerificationStatus;
}

export function SourceVerificationBadge({ status }: SourceVerificationBadgeProps) {
  const tone = status === "VERIFIED" ? "success" : status === "FAILED" ? "danger" : "warning";
  const label = status === "VERIFIED" ? "Verified" : status === "FAILED" ? "Failed" : "Pending";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
        tone === "success"
          ? "bg-emerald-100 text-emerald-700"
          : tone === "danger"
            ? "bg-red-100 text-red-700"
            : "bg-amber-100 text-amber-700"
      }`}
    >
      {label}
    </span>
  );
}
