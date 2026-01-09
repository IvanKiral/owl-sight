import * as fs from "node:fs/promises";
import { execa } from "execa";
import { error, success, type WithError } from "shared";

export type DependencyCheckResult = Readonly<{
  name: string;
  installed: boolean;
  version?: string;
}>;

const checkCommand = (
  command: string,
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  checkFlag: "--version" | string = "--version",
): Promise<WithError<DependencyCheckResult, string>> => {
  return (
    execa(command, [checkFlag])
      .then((result) => {
        const version = checkFlag === "--version" ? result.stdout.trim().split("\n")[0] : undefined;

        return success({
          name: command,
          installed: true,
          version,
        });
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .catch((err) => error(`Failed to check ${command}: ${err.message}`))
  );
};

export const checkWhisper = (): Promise<WithError<DependencyCheckResult, string>> => {
  return checkCommand("whisper", "--help");
};

export const checkYtDlp = (): Promise<WithError<DependencyCheckResult, string>> => {
  return checkCommand("yt-dlp");
};

export const checkFileExists = (path: string): Promise<boolean> => {
  return fs
    .stat(path)
    .then(() => true)
    .catch(() => false);
};
