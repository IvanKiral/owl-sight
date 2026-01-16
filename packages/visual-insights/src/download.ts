import * as path from "node:path";
import { error, success, type WithError } from "shared";
import { createYtDlpExtractVideoArgs, type VideoExtractionArgs } from "./ytdlp/cmdArgs.js";
import { runYtDlp } from "./ytdlp/runYtdlp.js";

export type YtDlpVideoOptions = Partial<
  Pick<
    VideoExtractionArgs,
    "quality" | "format" | "mergeOutputFormat" | "quiet" | "cookies" | "downloadSection"
  >
>;

export const downloadDataFromVideo = async (
  url: string,
  dirPath: string,
  options?: YtDlpVideoOptions & { metadata?: boolean },
): Promise<WithError<{ videoFilePath: string; metadataFilePath: string }, string>> => {
  const outTemplate = path.join(dirPath, `video.%(ext)s`);

  const ytdlArgs = createYtDlpExtractVideoArgs({
    quality: options?.quality,
    format: options?.format,
    mergeOutputFormat: options?.mergeOutputFormat,
    outputPath: outTemplate,
    writeInfoJson: options?.metadata ?? true,
    quiet: options?.quiet ?? false,
    cookies: options?.cookies,
    downloadSection: options?.downloadSection,
  });

  try {
    await runYtDlp(url, ytdlArgs as string[]);
    return success({
      videoFilePath: path.join(dirPath, `video.mp4`),
      metadataFilePath: path.join(dirPath, `video.info.json`),
    });
  } catch (e) {
    return error(`Failed to download video: ${e instanceof Error ? e.message : String(e)}`);
  }
};
