import { WhisperOptions } from "./whisperTypes.js";
import { createWhisperArgs } from "./whisperCmdArgs.js";
import { runWhisper } from "./runWhisper.js";
import * as fs from "fs/promises";
import * as path from "node:path";
import { WithError, success, error } from "shared";

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

    const transcription = await fs.readFile(
      path.join(folderPath, "audio.txt"),
      "utf8",
    );
    return success(transcription);
  } catch (e) {
    return error(`Failed to transcribe: ${e}`);
  }
};
