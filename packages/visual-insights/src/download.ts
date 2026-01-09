import * as path from "node:path";
import { type WithError, error, success } from "shared";
import { type VideoExtractionArgs, createYtDlpExtractVideoArgs } from "./ytdlp/cmdArgs.js";
import { runYtDlp } from "./ytdlp/runYtdlp.js";

export type YtDlpVideoOptions = Partial<
  Pick<VideoExtractionArgs, "quality" | "format" | "mergeOutputFormat" | "quiet" | "cookies">
>;

export const downloadDataFromVideo = async (
  url: string,
  dirPath: string,
  options?: YtDlpVideoOptions & { metadata?: boolean },
): Promise<WithError<{ videoFilePath: string; metadataFilePath: string }, string>> => {
  const extension = options?.mergeOutputFormat ?? "mkv";
  const outTemplate = path.join(dirPath, `video.${extension}`);

  const ytdlArgs = createYtDlpExtractVideoArgs({
    quality: options?.quality,
    format: options?.format,
    mergeOutputFormat: options?.mergeOutputFormat,
    outputPath: outTemplate,
    writeInfoJson: options?.metadata ?? true,
    quiet: options?.quiet ?? false,
    cookies: options?.cookies,
  });

  try {
    await runYtDlp(url, ytdlArgs as string[]);
    return success({
      videoFilePath: outTemplate,
      metadataFilePath: path.join(dirPath, "video.info.json"),
    });
  } catch (e) {
    return error(`Failed to download video: ${e}`);
  }
};
