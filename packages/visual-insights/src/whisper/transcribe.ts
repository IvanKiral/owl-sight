import { WhisperOptions } from "./whisperTypes.js";
import { createWhisperArgs } from "./whisperCmdArgs.js";
import { runWhisper } from "./runWhisper.js";
import * as fs from "fs/promises";
import * as path from "node:path";

export const transcribe = async (
  filePath: string,
  folderPath: string,
  options: Omit<WhisperOptions, "audioPath">,
): Promise<string> => {
  try {
    const whisperArgs = createWhisperArgs({
      ...options,
      audioPath: filePath,
      outputDir: folderPath,
    });
    await runWhisper(whisperArgs);

    return fs.readFile(path.join(folderPath, "audio.txt"), "utf8");
  } catch (e) {
    console.error("whisper failed to transcribe:", e);
    throw new Error(`Failed to transcribe: ${e}`);
  }
};
