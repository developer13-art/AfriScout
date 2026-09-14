import { Bookmark, BookmarkCheck, Eye, Workflow, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../utils/strings";

export interface OpportunityActionsBarProps {
  saved: boolean;
  watched: boolean;
  inPipeline: boolean;
  onSave: () => void;
  onWatch: () => void;
  onAddToPipeline: () => void;
  onAnalyze?: () => void;
  applyUrl?: string;
  className?: string;
}

export function OpportunityActionsBar({
  saved,
  watched,
  inPipeline,
  onSave,
  onWatch,
  onAddToPipeline,
  onAnalyze,
  applyUrl,
  className,
}: OpportunityActionsBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {onAnalyze ? (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Sparkles className="h-4 w-4" />}
          onClick={onAnalyze}
        >
          Analyze
        </Button>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        leftIcon={
          saved ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )
        }
        onClick={onSave}
      >
        {saved ? "Saved" : "Save"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        leftIcon={<Eye className="h-4 w-4" />}
        onClick={onWatch}
      >
        {watched ? "Watching" : "Watch"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        leftIcon={<Workflow className="h-4 w-4" />}
        onClick={onAddToPipeline}
        disabled={inPipeline}
      >
        {inPipeline ? "In pipeline" : "Add to pipeline"}
      </Button>
      {applyUrl ? (
        <a
          href={applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
        >
          <Button
            size="sm"
            rightIcon={<ExternalLink className="h-4 w-4" />}
          >
            Apply through official source
          </Button>
        </a>
      ) : null}
    </div>
  );
}