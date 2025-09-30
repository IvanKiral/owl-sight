import { OutputFormat } from "../constants/output.js";

export const stripMarkdownCodeFences = (
  text: string,
  format: OutputFormat
): string => {
  return text.trim().replace(`\`\`\`${format}`, "").replace("```", "");
};
