export function newMatchTemplate(input: { title: string; score: number }) {
  return {
    title: "New high match",
    body: `${input.title} matches your Business DNA at ${input.score}%.`,
  };
}