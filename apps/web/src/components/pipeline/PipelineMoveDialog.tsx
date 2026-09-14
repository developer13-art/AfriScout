import { useState } from "react";
import { Dialog } from "../ui/Dialog";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { PIPELINE_STAGE_ORDER } from "../../utils/constants";
import { pipelineStageLabel } from "./PipelineStatusBadge";
import type { PipelineStage } from "../../types/pipeline";

export interface PipelineMoveResult {
  stage: PipelineStage;
  submissionReference?: string;
  notes?: string;
}

export interface PipelineMoveDialogProps {
  open: boolean;
  onClose: () => void;
  currentStage: PipelineStage;
  onSubmit: (result: PipelineMoveResult) => void | Promise<void>;
}

export function PipelineMoveDialog({
  open,
  onClose,
  currentStage,
  onSubmit,
}: PipelineMoveDialogProps) {
  const [stage, setStage] = useState<PipelineStage>(currentStage);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        stage,
        submissionReference: reference || undefined,
        notes: notes || undefined,
      });
      setReference("");
      setNotes("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Update pipeline stage"
      description="Record the current status of this opportunity."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} loading={submitting}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Stage"
          value={stage}
          onChange={(e) => setStage(e.target.value as PipelineStage)}
          options={PIPELINE_STAGE_ORDER.map((value) => ({
            value,
            label: pipelineStageLabel(value),
          }))}
        />
        {stage === "SUBMITTED" ? (
          <Input
            label="Submission reference"
            placeholder="Reference number from the official source"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        ) : null}
        <Textarea
          label="Notes"
          placeholder="Anything to remember about this stage"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
    </Dialog>
  );
}