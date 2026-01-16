import { error, success, type WithError } from "shared";
import {
  type CookieConfig,
  downloadDataFromVideo,
  getLanguageName,
  getVideoData,
  type WhisperLanguage,
  type WhisperLanguageName,
  withTempDir,
} from "visual-insights";
import { type ArchiveEntry, createArchive } from "../../lib/archive/createArchive.js";
import { callGemini } from "../../lib/gemini/gemini.js";
import { addUrlToResponse, deserializeGeminiResponse } from "../../lib/gemini/responseUtils.js";
import { createSummaryPrompt } from "../../lib/prompts/summaryPrompt.js";
import type { ArchiveConfig } from "../types.js";

export type SummaryFromVideoOptions = {
  readonly url: string;
  readonly apiKey: string;
  readonly model: string;
  readonly outputLanguage: WhisperLanguage | WhisperLanguageName;
  readonly videoLanguage?: WhisperLanguage;
  readonly cookies?: CookieConfig;
  readonly customPrompt?: string;
  readonly archive?: ArchiveConfig;
};

export type SummaryResult = {
  readonly content: string;
  readonly sourceUrl: string;
  readonly archivePath?: string;
};

const normalizeLanguage = (lang: WhisperLanguage | WhisperLanguageName): WhisperLanguageName =>
  lang.length === 2 ? getLanguageName(lang as WhisperLanguage) : (lang as WhisperLanguageName);

export const summaryFromVideo = (
  options: SummaryFromVideoOptions,
): Promise<WithError<SummaryResult, string>> =>
  withTempDir(async (tmpDir) => {
    const downloadResult = await downloadDataFromVideo(options.url, tmpDir, {
      quiet: true,
      cookies: options.cookies,
      metadata: true,
    });

    if (!downloadResult.success) {
      return error(`Failed to download video: ${downloadResult.error}`);
    }

    const { videoFilePath, metadataFilePath } = downloadResult.result;

    const videoResult = await getVideoData(videoFilePath, metadataFilePath, tmpDir, {
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
    const summaryContent = resultWithUrl.parsed as string;

    if (!options.archive) {
      return success({
        content: summaryContent,
        sourceUrl: options.url,
      });
    }

    const { include } = options.archive;
    const entries: ReadonlyArray<ArchiveEntry> = [
      include.includes("video") && { name: "video.mkv", filePath: videoFilePath },
      include.includes("transcription") && {
        name: "transcription.txt",
        content: videoResult.result.transcription,
      },
      include.includes("metadata") && { name: "metadata.json", filePath: metadataFilePath },
      include.includes("result") && { name: "summary.txt", content: summaryContent },
    ].filter((e): e is ArchiveEntry => Boolean(e));

    const archiveResult = await createArchive({
      outputPath: options.archive.outputPath,
      entries,
    });

    if (!archiveResult.success) {
      return error(archiveResult.error);
    }

    return success({
      content: summaryContent,
      sourceUrl: options.url,
      archivePath: options.archive.outputPath,
    });
  });
