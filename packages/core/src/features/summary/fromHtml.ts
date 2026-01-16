import { error, success, type WithError } from "shared";
import {
  getLanguageName,
  getWebpageData,
  type WhisperLanguage,
  type WhisperLanguageName,
} from "visual-insights";
import { callGemini } from "../../lib/gemini/gemini.js";
import { addUrlToResponse, deserializeGeminiResponse } from "../../lib/gemini/responseUtils.js";
import { createSummaryPrompt } from "../../lib/prompts/summaryPrompt.js";
import type { SummaryResult } from "./fromVideo.js";

export type SummaryFromHtmlOptions = {
  readonly url: string;
  readonly apiKey: string;
  readonly model: string;
  readonly outputLanguage: WhisperLanguage | WhisperLanguageName;
  readonly customPrompt?: string;
};

const normalizeLanguage = (lang: WhisperLanguage | WhisperLanguageName): WhisperLanguageName =>
  lang.length === 2 ? getLanguageName(lang as WhisperLanguage) : (lang as WhisperLanguageName);

export const summaryFromHtml = async (
  options: SummaryFromHtmlOptions,
): Promise<WithError<SummaryResult, string>> => {
  const webpageResult = await getWebpageData(options.url);

  if (!webpageResult.success) {
    return error(`Failed to fetch webpage: ${webpageResult.error}`);
  }

  const prompt = createSummaryPrompt({
    data: {
      type: "html",
      webpageContent: webpageResult.result.textContent,
      articleTitle: webpageResult.result.metadata.title,
    },
    language: normalizeLanguage(options.outputLanguage),
    customPrompt: options.customPrompt,
  });

  const geminiResult = await callGemini(options.apiKey, options.model, prompt);

  if (!geminiResult.success) {
    return error(geminiResult.error);
  }

  const deserializedResult = deserializeGeminiResponse(geminiResult.result.text, "markdown");

  if (!deserializedResult.success) {
    return error(deserializedResult.error);
  }

  const resultWithUrl = addUrlToResponse(deserializedResult.result, options.url);

  return success({
    content: resultWithUrl.parsed as string,
    sourceUrl: options.url,
  });
};
