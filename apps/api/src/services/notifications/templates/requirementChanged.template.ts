export function requirementChangedTemplate(input: { title: string }) {
  return {
    title: "Requirements updated",
    body: `${input.title} has updated requirements.`,
  };
}