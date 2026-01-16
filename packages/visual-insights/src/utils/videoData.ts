import { success, type WithError } from "shared";
import { transcribe } from "../whisper/transcribe.js";
import type { WhisperOptions } from "../whisper/whisperTypes.js";
import { extractMetadata, type VideoMetadata } from "../ytdlp/metadata.js";
import type {
  YtDlpInstagramMetadataKeys,
  YtDlpInstagramReelMetadata,
  YtDlpYoutubeMetadaKeys,
  YtDlpYoutubeMetadata,
} from "../ytdlp/ytdlpTypes.js";

export type GetVideoDataOptions<
  K extends readonly YtDlpYoutubeMetadaKeys[] | readonly YtDlpInstagramMetadataKeys[],
> = {
  readonly metadata?: VideoMetadata & { metadata: K };
  readonly whisperOptions?: Omit<WhisperOptions, "audioPath" | "outputDir">;
};

export function getVideoData<K extends readonly YtDlpYoutubeMetadaKeys[]>(
  videoPath: string,
  metadataPath: string,
  outputDir: string,
  options: {
    metadata: { type: "youtube"; metadata: K };
    whisperOptions?: Omit<WhisperOptions, "audioPath" | "outputDir">;
  },
): Promise<
  WithError<
    {
      transcription: string;
      metadata: Pick<YtDlpYoutubeMetadata, K[number]>;
    },
    string
  >
>;

export function getVideoData<K extends readonly YtDlpInstagramMetadataKeys[]>(
  videoPath: string,
  metadataPath: string,
  outputDir: string,
  options: {
    metadata: { type: "instagram"; metadata: K };
    whisperOptions?: Omit<WhisperOptions, "audioPath" | "outputDir">;
  },
): Promise<
  WithError<
    {
      transcription: string;
      metadata: Pick<YtDlpInstagramReelMetadata, K[number]>;
    },
    string
  >
>;

export function getVideoData(
  videoPath: string,
  metadataPath: string,
  outputDir: string,
  options?: {
    whisperOptions?: Omit<WhisperOptions, "audioPath" | "outputDir">;
  },
): Promise<
  WithError<
    {
      transcription: string;
      metadata: Pick<YtDlpYoutubeMetadata, "description">;
    },
    string
  >
>;

export async function getVideoData(
  videoPath: string,
  metadataPath: string,
  outputDir: string,
  options?: {
    metadata?: VideoMetadata;
    whisperOptions?: Omit<WhisperOptions, "audioPath" | "outputDir">;
  },
) {
  const transcriptionResult = await transcribe(videoPath, outputDir, {
    ...options?.whisperOptions,
    outputDir,
  });

  if (!transcriptionResult.success) {
    return transcriptionResult;
  }

  const metadataResult = await (options?.metadata
    ? options.metadata.type === "youtube"
      ? extractMetadata(metadataPath, options.metadata)
      : extractMetadata(metadataPath, options.metadata)
    : extractMetadata(metadataPath, {
        type: "youtube" as const,
        metadata: ["description"] as const,
      }));

  if (!metadataResult.success) {
    return metadataResult;
  }

  return success({ transcription: transcriptionResult.result, metadata: metadataResult.result });
}
