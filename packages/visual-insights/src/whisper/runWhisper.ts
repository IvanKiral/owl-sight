import { execa } from "execa";

export const runWhisper = (args: ReadonlyArray<string>) => {
  return execa("whisper", args, {
    stdio: "inherit",
    reject: true,
  }).catch((error: unknown) => {
    if (error && typeof error === "object" && "command" in error && "message" in error) {
      throw new Error(
        `whisper failed: ${String(error.message)}\nCommand: ${String(error.command)}`,
      );
    }
    throw new Error(
      `Failed to run whisper: ${error instanceof Error ? error.message : String(error)}`,
    );
  });
};
