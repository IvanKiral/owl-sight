import * as os from "node:os";
import * as path from "node:path";
import { runYtDlp } from "./ytdlp.js";
import {
  AudioFormat,
  AudioQuality,
  FormatSelection,
} from "./ytdlp/ytdlpAudioTypes.js";
import { createYtDlpExtractAudioArgs } from "./ytdlp/cmdArgs.js";

export type YtDlpAudioOptions = Partial<{
  audioFormat?: AudioFormat;
  audioQuality?: AudioQuality;
  format?: FormatSelection;
}>;

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
  });

  try {
    await runYtDlp(url, ytdlArgs as string[]);
    console.log("Download Complete!");
  } catch (e) {
    console.error("yt-dlp failed:", e);
    throw e;
  }

  return {
    audioFilePath: outTemplate,
    metadataFilePath: path.join(dirPath, "audio.info.json"),
  };
};
