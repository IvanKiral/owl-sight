import { error, success, type WithError } from "shared";
import {
  getLanguageName,
  getWebpageData,
  type WhisperLanguage,
  type WhisperLanguageName,
} from "visual-insights";
import { callGemini } from "../../lib/gemini/gemini.js";
import {
  addUrlToResponse,
  deserializeGeminiResponse,
  type OutputFormat,
} from "../../lib/gemini/responseUtils.js";
import { createRecipePrompt } from "../../lib/prompts/recipePrompt.js";
import type { RecipeResult } from "./fromVideo.js";

export type RecipeFromHtmlOptions = {
  readonly url: string;
  readonly apiKey: string;
  readonly model: string;
  readonly schema: string;
  readonly outputFormat: OutputFormat;
  readonly outputLanguage: WhisperLanguage | WhisperLanguageName;
};

const normalizeLanguage = (lang: WhisperLanguage | WhisperLanguageName): WhisperLanguageName =>
  lang.length === 2 ? getLanguageName(lang as WhisperLanguage) : (lang as WhisperLanguageName);

export const recipeFromHtml = async (
  options: RecipeFromHtmlOptions,
): Promise<WithError<RecipeResult, string>> => {
  const webpageResult = await getWebpageData(options.url);

  if (!webpageResult.success) {
    return error(`Failed to fetch webpage: ${webpageResult.error}`);
  }

  const prompt = createRecipePrompt({
    data: {
      webpageContent: webpageResult.result.textContent,
      articleTitle: webpageResult.result.metadata.title,
    },
    language: normalizeLanguage(options.outputLanguage),
    schema: options.schema,
    format: options.outputFormat,
  });

  const geminiResult = await callGemini(options.apiKey, options.model, prompt);

  if (!geminiResult.success) {
    return error(geminiResult.error);
  }

  const deserializedResult = deserializeGeminiResponse(
    geminiResult.result.text,
    options.outputFormat,
  );

  if (!deserializedResult.success) {
    return error(deserializedResult.error);
  }

  const resultWithUrl = addUrlToResponse(deserializedResult.result, options.url);

  return success({
    content: resultWithUrl,
    sourceUrl: options.url,
  });
};
