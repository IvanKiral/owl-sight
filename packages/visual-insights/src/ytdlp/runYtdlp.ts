import { execa } from "execa";

export const runYtDlp = (
  url: string,
  args: ReadonlyArray<string> = [],
) => {
  const cmdArgs = [...args, url];
  
  return execa("yt-dlp", cmdArgs, {
    stdio: "inherit",
    reject: true,
  }).catch((error: unknown) => {
    if (error && typeof error === "object" && "command" in error && "message" in error) {
      throw new Error(`yt-dlp failed: ${error.message}\nCommand: ${error.command}`);
    }
    throw new Error(`Failed to run yt-dlp: ${error instanceof Error ? error.message : String(error)}`);
  });
};
