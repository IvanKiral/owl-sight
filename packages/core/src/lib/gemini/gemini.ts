import { GoogleGenAI } from "@google/genai";
import {
  anyOf,
  createRetry,
  httpStatusRetryable,
  keywordRetryable,
  linearBackoff,
  type WithError,
} from "shared";

type GeminiResponse = {
  text: string;
};

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

const formatCause = (cause: unknown): string => {
  if (cause instanceof Error) {
    const code = (cause as { code?: string }).code;
    return `${cause.name}: ${cause.message}${code ? ` [${code}]` : ""}`;
  }
  return String(cause);
};

const describeGeminiError = (err: unknown): string => {
  if (!(err instanceof Error)) {
    return String(err);
  }

  const status = (err as { status?: number }).status;
  const cause = (err as { cause?: unknown }).cause;

  return [
    err.message,
    typeof status === "number" ? `status=${status}` : null,
    cause ? `cause=${formatCause(cause)}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
};

const geminiRetry = createRetry({
  maxRetries: MAX_RETRIES,
  delayStrategy: linearBackoff(INITIAL_DELAY_MS),
  isRetryable: anyOf(
    httpStatusRetryable([429, 500, 503]),
    keywordRetryable(["rate", "timeout", "network", "fetch failed", "ECONNRESET", "ETIMEDOUT"]),
  ),
  onRetry: (err, attempt, delayMs) =>
    console.log(
      `Gemini API call failed (${describeGeminiError(err)}), retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`,
    ),
});

export const callGemini = (
  apiKey: string,
  model: string,
  contents: string,
): Promise<WithError<GeminiResponse, string>> => {
  const operation = async (): Promise<GeminiResponse> => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({ model, contents });

    if (!response.text) {
      throw new Error("No response text received from Gemini API");
    }

    return { text: response.text };
  };

  return geminiRetry(
    operation,
    undefined,
    (err) => `Gemini API error (model: ${model}): ${describeGeminiError(err)}`,
  );
};
