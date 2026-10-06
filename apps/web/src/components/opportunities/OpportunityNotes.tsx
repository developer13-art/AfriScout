import { useState } from "react";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { formatDateTime } from "../../utils/formatDate";

export interface NoteView {
  id: string;
  body: string;
  authorName?: string;
  createdAt: string;
}

export interface OpportunityNotesProps {
  notes: NoteView[];
  onAdd?: (body: string) => void | Promise<void>;
  disabled?: boolean;
}

export function OpportunityNotes({ notes, onAdd, disabled }: OpportunityNotesProps) {
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!draft.trim() || !onAdd) return;
    setSubmitting(true);
    try {
      await onAdd(draft.trim());
      setDraft("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {onAdd ? (
        <div className="space-y-2">
          <Textarea
            placeholder="Add a private note"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={disabled || submitting}
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={submit}
              loading={submitting}
              disabled={!draft.trim() || disabled}
            >
              Add note
            </Button>
          </div>
        </div>
      ) : null}

      {notes.length === 0 ? (
        <p className="text-sm text-neutral-500">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-lg border border-neutral-200 bg-white p-3"
            >
              <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
                <span className="font-medium text-neutral-700">
                  {note.authorName ?? "You"}
                </span>
                <span>{formatDateTime(note.createdAt)}</span>
              </div>
              <p className="mt-1.5 whitespace-pre-line text-sm text-neutral-700">
                {note.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}