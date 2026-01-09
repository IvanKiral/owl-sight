import { type WithError, error, success } from "shared";
import { getVideoData, type CookieConfig, type WhisperLanguage, type WhisperLanguageName } from "visual-insights";
import { callGemini } from "../../lib/gemini/gemini.js";
import {
  deserializeGeminiResponse,
  addUrlToResponse,
  type OutputFormat,
  type DeserializedGeminiOutput,
} from "../../lib/gemini/responseUtils.js";
import { createRecipePrompt } from "../../lib/prompts/recipePrompt.js";

export type RecipeFromVideoOptions = {
  url: string;
  apiKey: string;
  schema: string;
  model: string;
  outputFormat: OutputFormat;
  outputLanguage: WhisperLanguageName;
  videoLanguage?: WhisperLanguage;
  cookies?: CookieConfig;
};

export type RecipeResult = {
  content: DeserializedGeminiOutput;
  sourceUrl: string;
};

export const recipeFromVideo = async (
  options: RecipeFromVideoOptions,
): Promise<WithError<RecipeResult, string>> => {
  const videoResult = await getVideoData(options.url, {
    ytdlpOptions: {
      quiet: true,
      cookies: options.cookies,
    },
    whisperOptions: {
      verbose: "False",
      model: "turbo",
      ...(options.videoLanguage && { language: options.videoLanguage }),
    },
  });

  if (!videoResult.success) {
    return error(`Failed to process video: ${videoResult.error}`);
  }

  const prompt = createRecipePrompt({
    data: {
      transcribedText: videoResult.result.transcription,
      description: videoResult.result.metadata.description ?? "",
    },
    language: options.outputLanguage,
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
