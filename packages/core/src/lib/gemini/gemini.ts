import { GoogleGenAI } from "@google/genai";
import {
  anyOf,
  createRetry,
  linearBackoff,
  httpStatusRetryable,
  keywordRetryable,
  type WithError,
} from "shared";

type GeminiResponse = {
  text: string;
};

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

const geminiRetry = createRetry({
  maxRetries: MAX_RETRIES,
  delayStrategy: linearBackoff(INITIAL_DELAY_MS),
  isRetryable: anyOf(
    httpStatusRetryable([429, 500, 503]),
    keywordRetryable(["rate", "timeout", "network"]),
  ),
  onRetry: (_, attempt, delayMs) =>
    console.log(
      `Gemini API call failed, retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`,
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
    (err) =>
      `Gemini API error: ${err instanceof Error ? err.message : String(err)}`,
  );
};
