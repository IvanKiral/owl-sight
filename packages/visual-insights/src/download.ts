import * as path from "node:path";
import {
  AudioExtractionArgs,
  createYtDlpExtractAudioArgs,
} from "./ytdlp/cmdArgs.js";
import { runYtDlp } from "./ytdlp/runYtdlp.js";
import { WithError, success, error } from "shared";

export type YtDlpAudioOptions = Partial<
  Pick<AudioExtractionArgs, "audioFormat" | "audioQuality" | "format" | "quiet" | "cookies">
>;

export const downloadDataFromVideo = async (
  url: string,
  dirPath: string,
  options?: YtDlpAudioOptions & { metadata?: boolean },
): Promise<WithError<{ audioFilePath: string; metadataFilePath: string }, string>> => {
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
    cookies: options?.cookies,
  });

  try {
    await runYtDlp(url, ytdlArgs as string[]);
    return success({
      audioFilePath: outTemplate,
      metadataFilePath: path.join(dirPath, "audio.info.json"),
    });
  } catch (e) {
    return error(`Failed to download video: ${e}`);
  }
};
