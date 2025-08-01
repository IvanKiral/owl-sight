import { spawn } from "node:child_process";

export const runWhisper = (args: ReadonlyArray<string>): Promise<void> => {
  return new Promise((resolve, reject) => {
    const whisper = spawn("whisper", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    whisper.stdout.on("data", (chunk) => process.stdout.write(chunk));
    whisper.stderr.on("data", (chunk) => process.stderr.write(chunk));

    whisper.on("error", (err) =>
      reject(new Error(`Spawn error: ${err.message}`)),
    );
    whisper.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`whisper exited with code ${code}`)),
    );
  });
};
