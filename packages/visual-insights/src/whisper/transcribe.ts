import * as fs from "node:fs/promises";
import * as path from "node:path";
import { type WithError, error, success } from "shared";
import { runWhisper } from "./runWhisper.js";
import { createWhisperArgs } from "./whisperCmdArgs.js";
import type { WhisperOptions } from "./whisperTypes.js";

export const transcribe = async (
  filePath: string,
  folderPath: string,
  options: Omit<WhisperOptions, "audioPath">,
): Promise<WithError<string, string>> => {
  try {
    const whisperArgs = createWhisperArgs({
      ...options,
      audioPath: filePath,
      outputDir: folderPath,
    });
    await runWhisper(whisperArgs);

    const transcription = await fs.readFile(path.join(folderPath, "video.txt"), "utf8");
    return success(transcription);
  } catch (e) {
    return error(`Failed to transcribe: ${e}`);
  }
};
