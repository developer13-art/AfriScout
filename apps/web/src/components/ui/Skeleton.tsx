import { cn } from "../../utils/strings";

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "pill";
  className?: string;
}

const radius = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  pill: "rounded-full",
};

export function Skeleton({
  width = "100%",
  height = 16,
  rounded = "md",
  className,
}: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cn("skeleton block", radius[rounded], className)}
      style={{ width, height }}
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} height={12} width={index === lines - 1 ? "60%" : "100%"} />
      ))}
    </div>
  );
}