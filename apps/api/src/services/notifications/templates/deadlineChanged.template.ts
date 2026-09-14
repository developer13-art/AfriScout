export function deadlineChangedTemplate(input: {
  title: string;
  oldDeadline: string | null;
  newDeadline: string | null;
}) {
  return {
    title: "Deadline changed",
    body: `${input.title} deadline moved from ${input.oldDeadline ?? "-"} to ${input.newDeadline ?? "-"}.`,
  };
}