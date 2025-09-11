import { execa } from "execa";
import * as fs from "node:fs/promises";
import { type WithError, success, error } from "shared";

export type DependencyCheckResult = Readonly<{
  name: string;
  installed: boolean;
  version?: string;
}>;

const checkCommand = (
  command: string,
  checkFlag: "--version" | string = "--version"
): Promise<WithError<DependencyCheckResult, string>> => {
  return execa(command, [checkFlag])
    .then((result) => {
      const version =
        checkFlag === "--version"
          ? result.stdout.trim().split("\n")[0]
          : undefined;

      return success({
        name: command,
        installed: true,
        version,
      });
    })
    .catch((err) => error(`Failed to check ${command}: ${err.message}`));
};

export const checkWhisper = async (): Promise<
  WithError<DependencyCheckResult, string>
> => {
  return checkCommand("whisper", "--help");
};

export const checkYtDlp = async (): Promise<
  WithError<DependencyCheckResult, string>
> => {
  return checkCommand("yt-dlp");
};

export const checkFileExists = (path: string): Promise<boolean> => {
  return fs
    .stat(path)
    .then(() => true)
    .catch(() => false);
};
