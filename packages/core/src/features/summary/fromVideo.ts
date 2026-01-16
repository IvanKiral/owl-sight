import { error, success, type WithError } from "shared";
import {
  type CookieConfig,
  getLanguageName,
  getVideoData,
  type WhisperLanguage,
  type WhisperLanguageName,
} from "visual-insights";
import { callGemini } from "../../lib/gemini/gemini.js";
import { addUrlToResponse, deserializeGeminiResponse } from "../../lib/gemini/responseUtils.js";
import { createSummaryPrompt } from "../../lib/prompts/summaryPrompt.js";

export type SummaryFromVideoOptions = {
  readonly url: string;
  readonly apiKey: string;
  readonly model: string;
  readonly outputLanguage: WhisperLanguage | WhisperLanguageName;
  readonly videoLanguage?: WhisperLanguage;
  readonly cookies?: CookieConfig;
  readonly customPrompt?: string;
};

export type SummaryResult = {
  readonly content: string;
  readonly sourceUrl: string;
};

const normalizeLanguage = (lang: WhisperLanguage | WhisperLanguageName): WhisperLanguageName =>
  lang.length === 2 ? getLanguageName(lang as WhisperLanguage) : (lang as WhisperLanguageName);

export const summaryFromVideo = async (
  options: SummaryFromVideoOptions,
): Promise<WithError<SummaryResult, string>> => {
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

  const prompt = createSummaryPrompt({
    data: {
      type: "video",
      transcribedText: videoResult.result.transcription,
      description: videoResult.result.metadata.description ?? "",
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
