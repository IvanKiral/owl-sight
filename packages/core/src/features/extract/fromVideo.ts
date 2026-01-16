import { error, success, type WithError } from "shared";
import {
  type CookieConfig,
  downloadDataFromVideo,
  getVideoData,
  type WhisperLanguage,
  withTempDir,
} from "visual-insights";
import { type ArchiveEntry, createArchive } from "../../lib/archive/createArchive.js";
import type { ArchiveConfig } from "../types.js";

export type ExtractType = "description" | "transcription";

export type VideoExtractOptions = {
  readonly url: string;
  readonly videoLanguage?: WhisperLanguage;
  readonly cookies?: CookieConfig;
  readonly extractTypes?: ReadonlyArray<ExtractType>;
  readonly archive?: ArchiveConfig;
};

export type VideoExtractResult = {
  readonly transcription: string | null;
  readonly description: string | null;
  readonly sourceUrl: string;
  readonly archivePath?: string;
};

export const extractFromVideo = (
  options: VideoExtractOptions,
): Promise<WithError<VideoExtractResult, string>> => {
  const extractTypes = options.extractTypes ?? ["description", "transcription"];
  const needsTranscription = extractTypes.includes("transcription");

  return withTempDir(async (tmpDir) => {
    const downloadResult = await downloadDataFromVideo(options.url, tmpDir, {
      cookies: options.cookies,
      metadata: true,
    });

    if (!downloadResult.success) {
      return error(`Failed to download video: ${downloadResult.error}`);
    }

    const { videoFilePath, metadataFilePath } = downloadResult.result;

    const videoResult = await getVideoData(videoFilePath, metadataFilePath, tmpDir, {
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

    const transcription = needsTranscription ? videoResult.result.transcription : null;
    const description = extractTypes.includes("description")
      ? (videoResult.result.metadata.description ?? null)
      : null;

    if (!options.archive) {
      return success({
        transcription,
        description,
        sourceUrl: options.url,
      });
    }

    const { include } = options.archive;
    const entries: ReadonlyArray<ArchiveEntry> = [
      include.includes("video") && { name: "video.mkv", filePath: videoFilePath },
      include.includes("transcription") &&
        transcription && { name: "transcription.txt", content: transcription },
      include.includes("metadata") && { name: "metadata.json", filePath: metadataFilePath },
    ].filter((e): e is ArchiveEntry => Boolean(e));

    const archiveResult = await createArchive({
      outputPath: options.archive.outputPath,
      entries,
    });

    if (!archiveResult.success) {
      return error(archiveResult.error);
    }

    return success({
      transcription,
      description,
      sourceUrl: options.url,
      archivePath: options.archive.outputPath,
    });
  });
};
