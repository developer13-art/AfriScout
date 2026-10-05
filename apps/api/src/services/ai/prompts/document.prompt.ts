export const DOCUMENT_PROMPT_VERSION = "document.v1";

export function DOCUMENT_PROMPT(input: { fileName: string; text: string }): string {
  return `Extract structured information from the document.

File name: ${input.fileName}
Document text:
${input.text}

Return strict JSON with fields:
- eligibility (string)
- requirements (string array)
- documents (string array)
- value (string)
- deadline (string)
- notes (string)`;
}