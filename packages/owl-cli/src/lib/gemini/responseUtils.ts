import { error, success, type WithError } from "shared";
import type { OutputFormat } from "../constants/output.js";

export const stripMarkdownCodeFences = (text: string, format: OutputFormat): string => {
  return text.trim().replace(`\`\`\`${format}`, "").replace("```", "");
};

export type DeserializedGeminiOutput =
  | { format: "markdown"; parsed: string }
  | { format: "json"; parsed: object };

export const deserializeGeminiResponse = (
  responseBody: string,
  format: OutputFormat,
): WithError<DeserializedGeminiOutput, string> => {
  const cleanedResponse = stripMarkdownCodeFences(responseBody, format);

  if (format === "markdown") {
    return success({ format: "markdown", parsed: cleanedResponse });
  }

  try {
    return success({ format: "json", parsed: JSON.parse(cleanedResponse) });
  } catch (err) {
    throw error(`Failed to parse JSON response: ${JSON.stringify(err)}`);
  }
};

export const addUrlToResponse = (
  output: DeserializedGeminiOutput,
  url: string,
): DeserializedGeminiOutput => {
  return output.format === "json"
    ? { format: "json", parsed: { ...output.parsed, source_url: url } }
    : { format: "markdown", parsed: `${output.parsed}\n\nSource Url: ${url}` };
};
