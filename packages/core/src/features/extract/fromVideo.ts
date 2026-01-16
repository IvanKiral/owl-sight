import { error, success, type WithError } from "shared";
import { type CookieConfig, getVideoData, type WhisperLanguage } from "visual-insights";

export type ExtractType = "description" | "transcription";

export type VideoExtractOptions = {
  readonly url: string;
  readonly videoLanguage?: WhisperLanguage;
  readonly cookies?: CookieConfig;
  readonly extractTypes?: ReadonlyArray<ExtractType>;
};

export type VideoExtractResult = {
  readonly transcription: string | null;
  readonly description: string | null;
  readonly sourceUrl: string;
};

export const extractFromVideo = async (
  options: VideoExtractOptions,
): Promise<WithError<VideoExtractResult, string>> => {
  const extractTypes = options.extractTypes ?? ["description", "transcription"];
  const needsTranscription = extractTypes.includes("transcription");

  const videoResult = await getVideoData(options.url, {
    ytdlpOptions: {
      cookies: options.cookies,
    },
    whisperOptions: needsTranscription
      ? {
          model: "turbo",
          ...(options.videoLanguage && { language: options.videoLanguage }),
        }
      : undefined,
  });

  if (!videoResult.success) {
    return error(`Failed to process video: ${videoResult.error}`);
  }

  return success({
    transcription: needsTranscription ? videoResult.result.transcription : null,
    description: extractTypes.includes("description")
      ? (videoResult.result.metadata.description ?? null)
      : null,
    sourceUrl: options.url,
  });
};
