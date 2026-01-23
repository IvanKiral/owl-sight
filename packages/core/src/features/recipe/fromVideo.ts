import * as fs from "node:fs";
import { error, success, type WithError } from "shared";
import {
  type CookieConfig,
  downloadDataFromVideo,
  getLanguageName,
  getVideoData,
  type TimeRange,
  type WhisperLanguage,
  type WhisperLanguageName,
  withTempDir,
} from "visual-insights";
import { type ArchiveEntry, createArchive } from "../../lib/archive/createArchive.js";
import { callGemini } from "../../lib/gemini/gemini.js";
import {
  addLanguageToResponse,
  addUrlToResponse,
  type DeserializedGeminiOutput,
  deserializeGeminiResponse,
  type OutputFormat,
} from "../../lib/gemini/responseUtils.js";
import { createRecipePrompt } from "../../lib/prompts/recipePrompt.js";
import type { ArchiveConfig } from "../types.js";

export type RecipeFromVideoOptions = {
  readonly url: string;
  readonly apiKey: string;
  readonly schema: string;
  readonly model: string;
  readonly outputFormat: OutputFormat;
  readonly outputLanguage: WhisperLanguageName;
  readonly videoLanguage?: WhisperLanguage;
  readonly cookies?: CookieConfig;
  readonly archive?: ArchiveConfig;
  readonly timeRange?: TimeRange;
};

export type RecipeResult = {
  readonly content: DeserializedGeminiOutput;
  readonly sourceUrl: string;
  readonly archivePath?: string;
};

const serializeRecipeContent = (content: DeserializedGeminiOutput): string =>
  content.format === "json" ? JSON.stringify(content.parsed, null, 2) : content.parsed;

export const recipeFromVideo = (
  options: RecipeFromVideoOptions,
): Promise<WithError<RecipeResult, string>> =>
  withTempDir(async (tmpDir) => {
    const downloadResult = await downloadDataFromVideo(options.url, tmpDir, {
      quiet: true,
      cookies: options.cookies,
      metadata: true,
      downloadSection: options.timeRange,
    });

    if (!downloadResult.success) {
      return error(`Failed to download video: ${downloadResult.error}`);
    }

    const { videoFilePath, metadataFilePath } = downloadResult.result;
    console.log("Files in tmp folder:", fs.readdirSync(tmpDir));

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

    const prompt = createRecipePrompt({
      data: {
        transcribedText: videoResult.result.transcription,
        description: videoResult.result.metadata.description ?? "",
        filename: options.archive?.filename,
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
    const resultWithLanguage = options.videoLanguage
      ? addLanguageToResponse(resultWithUrl, getLanguageName(options.videoLanguage))
      : resultWithUrl;
    const recipeExtension = options.outputFormat === "json" ? "json" : "txt";

    if (!options.archive) {
      return success({
        content: resultWithLanguage,
        sourceUrl: options.url,
      });
    }

    const { include, filename } = options.archive;
    const videoName = filename ? `${filename}.mp4` : "video.mp4";
    const resultName = filename ? `${filename}.${recipeExtension}` : `recipe.${recipeExtension}`;
    const entries: ReadonlyArray<ArchiveEntry> = [
      include.includes("video") && { name: videoName, filePath: videoFilePath },
      include.includes("transcription") && {
        name: "transcription.txt",
        content: videoResult.result.transcription,
      },
      include.includes("metadata") && { name: "metadata.json", filePath: metadataFilePath },
      include.includes("result") && {
        name: resultName,
        content: serializeRecipeContent(resultWithLanguage),
      },
    ].filter((e): e is ArchiveEntry => Boolean(e));

    const archiveResult = await createArchive({
      outputPath: options.archive.outputPath,
      entries,
    });

    if (!archiveResult.success) {
      return error(archiveResult.error);
    }

    return success({
      content: resultWithLanguage,
      sourceUrl: options.url,
      archivePath: options.archive.outputPath,
    });
  });
