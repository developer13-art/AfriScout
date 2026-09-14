export function sourceFailedTemplate(input: { sourceName: string }) {
  return {
    title: "Source extraction failed",
    body: `${input.sourceName} is failing extraction. Investigation required.`,
  };
}