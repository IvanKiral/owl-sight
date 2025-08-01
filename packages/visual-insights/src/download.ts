import * as path from "node:path";
import {
  AudioExtractionArgs,
  createYtDlpExtractAudioArgs,
} from "./ytdlp/cmdArgs.js";
import { runYtDlp } from "./ytdlp/runYtdlp.js";

export type YtDlpAudioOptions = Partial<
  Pick<AudioExtractionArgs, "audioFormat" | "audioQuality" | "format" | "quiet">
>;

export const downloadDataFromVideo = async (
  url: string,
  dirPath: string,
  options?: YtDlpAudioOptions & { metadata?: boolean },
) => {
  const outTemplate = path.join(
    dirPath,
    `audio.${options?.audioFormat ?? "m4a"}`,
  );

  const ytdlArgs = createYtDlpExtractAudioArgs({
    audioFormat: options?.audioFormat ?? "m4a",
    audioQuality: options?.audioQuality ?? 0,
    format: options?.format ?? "bestaudio/best",
    outputPath: outTemplate,
    writeInfoJson: options?.metadata ?? true,
    quiet: options?.quiet ?? false,
  });

  try {
    await runYtDlp(url, ytdlArgs as string[]);
  } catch (e) {
    console.error("yt-dlp failed:", e);
    throw e;
  }

  return {
    audioFilePath: outTemplate,
    metadataFilePath: path.join(dirPath, "audio.info.json"),
  };
};
