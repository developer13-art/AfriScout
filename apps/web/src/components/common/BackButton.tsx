import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "../../utils/strings";

export interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export function BackButton({ to, label = "Back", className }: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-primary-700",
        className,
      )}
    >
      <ArrowLeft aria-hidden className="h-4 w-4" />
      {label}
    </button>
  );
}