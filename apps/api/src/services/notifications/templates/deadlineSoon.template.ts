export function deadlineSoonTemplate(input: { title: string; daysLeft: number }) {
  return {
    title: "Deadline approaching",
    body: `${input.title} closes in ${input.daysLeft} day(s).`,
  };
}