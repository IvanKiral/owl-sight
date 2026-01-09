import { type WithError, success } from "shared";
import { type YtDlpVideoOptions, downloadDataFromVideo } from "../download.js";
import { transcribe } from "../whisper/transcribe.js";
import type { WhisperOptions } from "../whisper/whisperTypes.js";
import { type VideoMetadata, extractMetadata } from "../ytdlp/metadata.js";
import type {
  YtDlpInstagramMetadataKeys,
  YtDlpInstagramReelMetadata,
  YtDlpYoutubeMetadaKeys,
  YtDlpYoutubeMetadata,
} from "../ytdlp/ytdlpTypes.js";
import { withTempDir } from "./tempFolder.js";

export function getVideoData<K extends readonly YtDlpYoutubeMetadaKeys[]>(
  videoLink: string,
  options: {
    metadata: { type: "youtube"; metadata: K };
    whisperOptions?: Omit<WhisperOptions, "audioPath">;
    ytdlpOptions?: YtDlpVideoOptions;
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
  videoLink: string,
  options: {
    metadata: { type: "instagram"; metadata: K };
    whisperOptions?: Omit<WhisperOptions, "audioPath">;
    ytdlpOptions?: YtDlpVideoOptions;
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
  videoLink: string,
  options?: {
    whisperOptions?: Omit<WhisperOptions, "audioPath">;
    ytdlpOptions?: YtDlpVideoOptions;
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

export function getVideoData(
  videoLink: string,
  options?: {
    metadata?: VideoMetadata;
    whisperOptions?: Omit<WhisperOptions, "audioPath">;
    ytdlpOptions?: YtDlpVideoOptions;
  },
) {
  return withTempDir(async (tmpDir) => {
    const downloadResult = await downloadDataFromVideo(videoLink, tmpDir, {
      ...options?.ytdlpOptions,
      metadata: true,
    });

    if (!downloadResult.success) {
      return downloadResult;
    }

    const { videoFilePath, metadataFilePath } = downloadResult.result;

    const transcriptionResult = await transcribe(videoFilePath, tmpDir, {
      ...options?.whisperOptions,
      outputDir: tmpDir,
    });

    if (!transcriptionResult.success) {
      return transcriptionResult;
    }

    const metadataResult = await (options?.metadata
      ? options.metadata.type === "youtube"
        ? extractMetadata(metadataFilePath, options.metadata)
        : extractMetadata(metadataFilePath, options.metadata)
      : extractMetadata(metadataFilePath, {
          type: "youtube" as const,
          metadata: ["description"] as const,
        }));

    if (!metadataResult.success) {
      return metadataResult;
    }

    return success({ transcription: transcriptionResult.result, metadata: metadataResult.result });
  });
}
