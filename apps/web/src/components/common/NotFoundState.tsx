import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "../ui/Button";

export interface NotFoundStateProps {
  title?: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
}

export function NotFoundState({
  title = "Page not found",
  description = "The page you are looking for does not exist or has been moved.",
  backTo = "/",
  backLabel = "Back to home",
}: NotFoundStateProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
          <Search aria-hidden className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
        <div className="mt-5">
          <Link to={backTo}>
            <Button>{backLabel}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}