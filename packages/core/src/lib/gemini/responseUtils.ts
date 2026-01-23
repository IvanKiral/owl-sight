import { error, success, type WithError } from "shared";

export type OutputFormat = "json" | "markdown";

export const stripMarkdownCodeFences = (text: string, format: OutputFormat): string =>
  text.trim().replace(`\`\`\`${format}`, "").replace("```", "");

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
    return success({
      format: "json",
      parsed: JSON.parse(cleanedResponse) as DeserializedGeminiOutput,
    });
  } catch (err) {
    return error(`Failed to parse JSON response: ${JSON.stringify(err)}`);
  }
};

export const addUrlToResponse = (
  output: DeserializedGeminiOutput,
  url: string,
): DeserializedGeminiOutput =>
  output.format === "json"
    ? { format: "json", parsed: { ...output.parsed, source_url: url } }
    : { format: "markdown", parsed: `${output.parsed}\n\nSource Url: ${url}` };

export const addLanguageToResponse = (
  output: DeserializedGeminiOutput,
  language: string,
): DeserializedGeminiOutput =>
  output.format === "json"
    ? { format: "json", parsed: { ...output.parsed, original_language: language } }
    : output;
