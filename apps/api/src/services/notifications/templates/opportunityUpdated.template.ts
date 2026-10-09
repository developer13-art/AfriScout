export function opportunityUpdatedTemplate(input: { title: string }) {
  return {
    title: "Opportunity updated",
    body: `${input.title} has been updated at the source.`,
  };
}