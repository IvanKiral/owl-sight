import { spawn } from "node:child_process";
import { WhisperOptions } from "./whisperTypes.js";
import { createWhisperArgs } from "./whisperCmdArgs.js";

export const transcribe = async (options: WhisperOptions): Promise<string> => {
  const result = spawn("whisper", createWhisperArgs(options), {
    stdio: ["ignore", "pipe", "pipe"],
  });

  return new Promise((resolve, reject) => {
    result.stdout.on("data", (data) => {
      console.log(data.toString());
    });

    result.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    result.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Whisper process exited with code ${code}`));
      }

      resolve(result.stdout.toString());
    });
  });
};
