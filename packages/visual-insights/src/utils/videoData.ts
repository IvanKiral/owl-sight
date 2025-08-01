import { downloadDataFromVideo, YtDlpAudioOptions } from "../download.js";
import { transcribe } from "../whisper/transcribe.js";
import { WhisperOptions } from "../whisper/whisperTypes.js";
import { extractMetadata, VideoMetadata } from "../ytdlp/metadata.js";
import {
  YtDlpYoutubeMetadaKeys,
  YtDlpYoutubeMetadata,
  YtDlpInstagramMetadataKeys,
  YtDlpInstagramReelMetadata,
} from "../ytdlp/ytdlpTypes.js";
import { withTempDir } from "./tempFolder.js";

export function getVideoData<K extends readonly YtDlpYoutubeMetadaKeys[]>(
  videoLink: string,
  options: {
    metadata: { type: "youtube"; metadata: K };
    whisperOptions?: Omit<WhisperOptions, "audioPath">;
    ytdlpOptions?: YtDlpAudioOptions;
  },
): Promise<{
  transcription: string;
  metadata: Pick<YtDlpYoutubeMetadata, K[number]>;
}>;

export function getVideoData<K extends readonly YtDlpInstagramMetadataKeys[]>(
  videoLink: string,
  options: {
    metadata: { type: "instagram"; metadata: K };
    whisperOptions?: Omit<WhisperOptions, "audioPath">;
    ytdlpOptions?: YtDlpAudioOptions;
  },
): Promise<{
  transcription: string;
  metadata: Pick<YtDlpInstagramReelMetadata, K[number]>;
}>;

export function getVideoData(
  videoLink: string,
  options?: {
    whisperOptions?: Omit<WhisperOptions, "audioPath">;
    ytdlpOptions?: YtDlpAudioOptions;
  },
): Promise<{
  transcription: string;
  metadata: Pick<YtDlpYoutubeMetadata, "description">;
}>;

export function getVideoData(
  videoLink: string,
  options?: {
    metadata?: VideoMetadata;
    whisperOptions?: Omit<WhisperOptions, "audioPath">;
    ytdlpOptions?: YtDlpAudioOptions;
  },
) {
  return withTempDir(async (tmpDir) => {
    const { audioFilePath, metadataFilePath } = await downloadDataFromVideo(
      videoLink,
      tmpDir,
      {
        ...options?.ytdlpOptions,
        metadata: true,
      },
    );
    const [resultTranscripton, resultMetadata] = await Promise.all([
      transcribe(audioFilePath, tmpDir, {
        ...options?.whisperOptions,
        outputDir: tmpDir,
      }),
      options?.metadata
        ? options.metadata.type === "youtube"
          ? extractMetadata(metadataFilePath, options.metadata)
          : extractMetadata(metadataFilePath, options.metadata)
        : extractMetadata(metadataFilePath, {
            type: "youtube" as const,
            metadata: ["description"] as const,
          }),
    ]);

    return { transcription: resultTranscripton, metadata: resultMetadata };
  });
}
