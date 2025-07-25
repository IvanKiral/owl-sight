import { spawn } from "node:child_process";

export const runYtDlp = (url: string, args: ReadonlyArray<string> = []): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Append the URL as the last argument
    const cmdArgs = [...args, url];
    const yt = spawn("yt-dlp", cmdArgs, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    yt.stdout.on("data", (chunk) => process.stdout.write(chunk));
    yt.stderr.on("data", (chunk) => process.stderr.write(chunk));

    yt.on("error", (err) => reject(new Error(`Spawn error: ${err.message}`)));
    yt.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`yt-dlp exited with code ${code}`)),
    );
  });
};

