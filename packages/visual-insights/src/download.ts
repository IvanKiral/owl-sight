import * as os from "node:os";
import * as path from "node:path";
import { runYtDlp, runYtDlpMetadata } from "./ytdlp.js";
import {
  AudioFormat,
  AudioQuality,
  FormatSelection,
} from "./ytdlp/ytdlpAudioTypes.js";
import { createYtDlpExtractAudioArgs } from "./ytdlp/cmdArgs.js";

export const downloadDataFromVideo = async (
  url: string,
  options?: Partial<{
    audioFormat?: AudioFormat;
    audioQuality?: AudioQuality;
    format?: FormatSelection;
    metadata?: boolean;
  }>,
) => {
  const tempDir = os.tmpdir();
  const outTemplate = path.join(
    tempDir,
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
  }

  return {
    audioFile: outTemplate,
    metadataFile: path.join(tempDir, "audio.info.json"),
  };
};
